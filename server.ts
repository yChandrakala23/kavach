import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import twilio from "twilio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// TYPES
// ============================================================
interface Vitals {
  heartRate: number;
  spO2: number;
  respiratoryRate: number;
  temperature: number;
  batteryPct: number;
  rssi: number;
  lastUpdated: string;
}

interface VitalsHistory {
  timestamp: string;
  heartRate: number;
  spO2: number;
  pdi: number;
}

interface Note {
  id: string;
  timestamp: string;
  author: string;
  content: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bedNumber: string;
  ward: string;
  diagnosis: string;
  doctorAssigned: string;
  admissionDate: string;
  status: 'Normal' | 'Warning' | 'Critical';
  pdi: number;
  vitals: Vitals;
  history: VitalsHistory[];
  notes: Note[];
  lastAlertSent?: number;
  isLoRaLive?: boolean; // NEW: flag for LoRa-connected patients
}

// ============================================================
// PATIENT DATA
// ============================================================
let patients: Patient[] = [
  {
    id: '1',
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    bedNumber: 'ICU-101',
    ward: 'Ward A',
    diagnosis: 'Post-op Recovery',
    doctorAssigned: 'Dr. Sarah Chen',
    admissionDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    vitals: { heartRate: 72, spO2: 98, respiratoryRate: 16, temperature: 36.8, batteryPct: 85, rssi: -62, lastUpdated: new Date().toISOString() },
    pdi: 12,
    status: 'Normal',
    history: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 300000).toISOString(),
      heartRate: 70 + Math.random() * 10,
      spO2: 95 + Math.random() * 5,
      pdi: 10 + Math.random() * 10
    })),
    notes: [
      { id: 'n1', timestamp: new Date(Date.now() - 3600000).toISOString(), author: 'Dr. Sarah Chen', content: 'Patient stable. Continuing current medication protocol.' }
    ]
  },
  {
    id: '2',
    name: 'Elena Rodriguez',
    age: 32,
    gender: 'Female',
    bedNumber: 'ICU-102',
    ward: 'Ward A',
    diagnosis: 'Acute Respiratory Distress',
    doctorAssigned: 'Dr. Sarah Chen',
    admissionDate: new Date(Date.now() - 86400000).toISOString(),
    vitals: { heartRate: 115, spO2: 89, respiratoryRate: 28, temperature: 38.5, batteryPct: 42, rssi: -88, lastUpdated: new Date().toISOString() },
    pdi: 84,
    status: 'Critical',
    history: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 300000).toISOString(),
      heartRate: 100 + Math.random() * 20,
      spO2: 85 + Math.random() * 10,
      pdi: 70 + Math.random() * 20
    })),
    notes: [
      { id: 'n2', timestamp: new Date(Date.now() - 7200000).toISOString(), author: 'Nurse Joy', content: 'Respiratory rate increasing. Monitor closely.' }
    ]
  },
  {
    id: '3',
    name: 'Robert Wilson',
    age: 68,
    gender: 'Male',
    bedNumber: 'W-304',
    ward: 'Ward A',
    diagnosis: 'Cardiac Observation',
    doctorAssigned: 'Dr. Michael Vance',
    admissionDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    vitals: { heartRate: 92, spO2: 94, respiratoryRate: 22, temperature: 37.9, batteryPct: 25, rssi: -102, lastUpdated: new Date().toISOString() },
    pdi: 56,
    status: 'Warning',
    history: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 300000).toISOString(),
      heartRate: 85 + Math.random() * 15,
      spO2: 92 + Math.random() * 4,
      pdi: 40 + Math.random() * 20
    })),
    notes: []
  },
  {
    id: '4',
    name: 'Amina Khan',
    age: 27,
    gender: 'Female',
    bedNumber: 'W-305',
    ward: 'Ward A',
    diagnosis: 'Routine Monitoring',
    doctorAssigned: 'Dr. Sarah Chen',
    admissionDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    vitals: { heartRate: 68, spO2: 99, respiratoryRate: 14, temperature: 36.6, batteryPct: 92, rssi: -58, lastUpdated: new Date().toISOString() },
    pdi: 8,
    status: 'Normal',
    history: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 300000).toISOString(),
      heartRate: 65 + Math.random() * 10,
      spO2: 98 + Math.random() * 2,
      pdi: 5 + Math.random() * 5
    })),
    notes: []
  },
];

// ============================================================
// VITALS SIMULATION — DISABLED
// Simulation is turned off. Only LoRa hardware updates vitals.
// Non-LoRa patients display their initial static values.
// ============================================================
function updateVitals() {
  // No-op: simulation disabled. Vitals only update via ingestLoRaPacket().
}

// ============================================================
// SMS ALERT LOGIC
// ============================================================
let alertPhoneNumber = "";
const ALERT_COOLDOWN = 5 * 60 * 1000;

async function sendFast2SMS(message: string, phoneNumber: string) {
  const apiKey = process.env.VITE_FAST2SMS_API_KEY;
  if (!apiKey) throw new Error("VITE_FAST2SMS_API_KEY is not defined");

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { 'authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ route: 'q', message, language: 'english', flash: 0, numbers: phoneNumber }),
  });
  const data = await response.json();
  if (!data.return) throw new Error(data.message || "Fast2SMS error");
  return data;
}

async function sendSMSAlert(message: string, phoneNumber?: string) {
  const targetNumber = phoneNumber || alertPhoneNumber;
  let fast2smsError = null;

  if (process.env.VITE_FAST2SMS_API_KEY && targetNumber) {
    try {
      return await sendFast2SMS(`[KAVACH ALERT] ${message}`, targetNumber);
    } catch (err: any) {
      fast2smsError = err.message;
      console.error("Fast2SMS failed:", fast2smsError);
    }
  }

  const accountSid  = process.env.TWILIO_ACCOUNT_SID;
  const authToken   = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber  = process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && fromNumber && targetNumber) {
    try {
      if (fromNumber === targetNumber) throw new Error("Twilio 'From' number cannot equal 'To' number.");
      const client = twilio(accountSid, authToken);
      const result = await client.messages.create({ body: `[KAVACH ALERT] ${message}`, from: fromNumber, to: targetNumber });
      return result;
    } catch (error: any) {
      throw new Error(`SMS failed. Fast2SMS: ${fast2smsError || 'Not configured'}. Twilio: ${error.message}`);
    }
  }

  throw new Error("No SMS provider configured. Set VITE_FAST2SMS_API_KEY or Twilio env vars.");
}

function checkAndTriggerAlerts(wss: WebSocketServer) {
  patients.forEach(p => {
    if (p.status === 'Critical') {
      const now = Date.now();
      if (!p.lastAlertSent || (now - p.lastAlertSent > ALERT_COOLDOWN)) {
        const message = `CRITICAL: Patient ${p.name} (${p.bedNumber}) has critical vitals. HR: ${p.vitals.heartRate}, SpO2: ${p.vitals.spO2}%`;
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'CRITICAL_ALERT', patientId: p.id, patientName: p.name, message }));
          }
        });
        sendSMSAlert(message).catch(err => console.error("Auto SMS Alert failed:", err.message));
        p.lastAlertSent = now;
      }
    }
  });
}

// ============================================================
// LORA BRIDGE
// Connects to the ESP32 WebSocket server and maps incoming
// LoRa vitals onto an existing patient by deviceId.
// deviceId 1 → patient id '1' by default; override via
// POST /api/lora-bridge  { espIp, deviceMap: { "1": "2" } }
// ============================================================

interface LoRaBridgeConfig {
  espIp: string;
  deviceMap: Record<string, string>; // LoRa deviceId → patient id
}

// Default: deviceId 1 maps to the first patient (id '1')
let loraBridgeConfig: LoRaBridgeConfig = {
  espIp: process.env.ESP32_IP || "",
  deviceMap: { "1": "1" },
};

let loraSocket: WebSocket | null = null;
let loraReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let wssRef: WebSocketServer | null = null; // set in startServer

/**
 * Computes PDI and status from real vitals.
 * Mirrors the logic already used for simulated patients.
 */
function deriveStatus(hr: number, spo2: number): { pdi: number; status: 'Normal' | 'Warning' | 'Critical' } {
  let pdi = 0;
  if (hr > 100 || hr < 50) pdi += 20;
  if (spo2 < 92) pdi += 30;
  if (spo2 < 88) pdi += 20;
  if (hr > 130) pdi += 20;
  pdi = Math.min(100, pdi);

  let status: 'Normal' | 'Warning' | 'Critical' = 'Normal';
  if (pdi > 70) status = 'Critical';
  else if (pdi > 40) status = 'Warning';

  return { pdi, status };
}

/**
 * Ingest a decoded LoRa JSON packet and update the matching patient.
 * Expected ESP32 JSON fields (from your receiver .ino):
 *   deviceId, hr, bodyTemp, spo2, ambientTemp, rssi, snr, seqNum,
 *   packetLossPct, fingerPresent, bmpOk, spo2Simulated
 */
function ingestLoRaPacket(raw: Record<string, unknown>, wss: WebSocketServer) {
  const deviceId = String(raw.deviceId ?? "1");
  const patientId = loraBridgeConfig.deviceMap[deviceId];

  if (!patientId) {
    console.warn(`[LoRa Bridge] No patient mapped for deviceId ${deviceId}`);
    return;
  }

  const idx = patients.findIndex(p => p.id === patientId);
  if (idx === -1) {
    console.warn(`[LoRa Bridge] Patient id=${patientId} not found`);
    return;
  }

  const hr    = Number(raw.hr)       || patients[idx].vitals.heartRate;
  const spo2  = Number(raw.spo2)     || patients[idx].vitals.spO2;
  const btemp = Number(raw.bodyTemp) || patients[idx].vitals.temperature;
  const rssi  = Number(raw.rssi)     || patients[idx].vitals.rssi;
  const now   = new Date().toISOString();

  const { pdi, status } = deriveStatus(hr, spo2);

  const newVitals: Vitals = {
    ...patients[idx].vitals,
    heartRate:   hr,
    spO2:        spo2,
    temperature: btemp,
    rssi:        rssi,
    lastUpdated: now,
  };

  const newHistory: VitalsHistory = { timestamp: now, heartRate: hr, spO2: spo2, pdi };

  patients[idx] = {
    ...patients[idx],
    vitals:     newVitals,
    pdi,
    status,
    isLoRaLive: true,
    history:    [...patients[idx].history, newHistory].slice(-50),
  };

  console.log(`[LoRa Bridge] Patient "${patients[idx].name}" updated — HR:${hr} SpO2:${spo2} Temp:${btemp} RSSI:${rssi}`);

  // Broadcast immediately to all dashboard clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'VITALS_UPDATE', patients }));
    }
  });

  // Trigger critical alert check right away for real data
  checkAndTriggerAlerts(wss);
}

/**
 * Opens a WebSocket connection to the ESP32 and starts listening.
 * Auto-reconnects with 5-second backoff if the connection drops.
 */
function connectLoRaBridge(wss: WebSocketServer) {
  if (!loraBridgeConfig.espIp) {
    console.log("[LoRa Bridge] No ESP32 IP configured. Set ESP32_IP env var or POST /api/lora-bridge.");
    return;
  }

  const url = `ws://${loraBridgeConfig.espIp}/ws`;
  console.log(`[LoRa Bridge] Connecting to ESP32 at ${url} …`);

  if (loraSocket) {
    loraSocket.removeAllListeners();
    loraSocket.terminate();
    loraSocket = null;
  }

  loraSocket = new WebSocket(url);

  loraSocket.on('open', () => {
    console.log(`[LoRa Bridge] ✅ Connected to ESP32 WebSocket (${url})`);
    if (loraReconnectTimer) { clearTimeout(loraReconnectTimer); loraReconnectTimer = null; }
  });

  loraSocket.on('message', (data) => {
    try {
      const packet = JSON.parse(data.toString()) as Record<string, unknown>;
      ingestLoRaPacket(packet, wss);
    } catch (err) {
      console.error("[LoRa Bridge] JSON parse error:", err);
    }
  });

  loraSocket.on('error', (err) => {
    console.error("[LoRa Bridge] Connection error:", (err as Error).message);
  });

  loraSocket.on('close', () => {
    console.warn("[LoRa Bridge] ⚠️  Disconnected. Retrying in 5s …");
    loraReconnectTimer = setTimeout(() => connectLoRaBridge(wss), 5000);
  });
}

// ============================================================
// MAIN SERVER
// ============================================================
async function startServer() {
  const app    = express();
  const server = createServer(app);
  const wss    = new WebSocketServer({ server });
  wssRef       = wss;
  const PORT   = 3000;

  app.use(express.json());

  // ── WebSocket: dashboard clients ─────────────────────────────
  wss.on('connection', (ws) => {
    console.log('Dashboard client connected');
    ws.send(JSON.stringify({ type: 'INITIAL_STATE', patients }));

    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        updateVitals();
        checkAndTriggerAlerts(wss);
        ws.send(JSON.stringify({ type: 'VITALS_UPDATE', patients }));
      }
    }, 2000);

    ws.on('close', () => {
      clearInterval(interval);
      console.log('Dashboard client disconnected');
    });
  });

  // ── LoRa Bridge: start on boot if IP is set ───────────────────
  connectLoRaBridge(wss);

  // ── REST API ──────────────────────────────────────────────────

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      system: "KAVACH",
      version: "1.0.0-alpha",
      loraBridge: {
        configured: !!loraBridgeConfig.espIp,
        espIp: loraBridgeConfig.espIp || null,
        connected: loraSocket?.readyState === WebSocket.OPEN,
        deviceMap: loraBridgeConfig.deviceMap,
      }
    });
  });

  /**
   * GET /api/lora-bridge
   * Returns current bridge config and connection status.
   */
  app.get("/api/lora-bridge", (_req, res) => {
    res.json({
      espIp: loraBridgeConfig.espIp,
      deviceMap: loraBridgeConfig.deviceMap,
      connected: loraSocket?.readyState === WebSocket.OPEN,
    });
  });

  /**
   * POST /api/lora-bridge
   * Body: { espIp: "192.168.x.x", deviceMap: { "1": "2" } }
   * Reconnects immediately with new settings.
   *
   * deviceMap maps LoRa deviceId (string) → patient id (string).
   * e.g. { "1": "3" } means LoRa band #1 → patient id "3"
   */
  app.post("/api/lora-bridge", (req, res) => {
    const { espIp, deviceMap } = req.body;
    if (!espIp) return res.status(400).json({ error: "espIp is required" });

    loraBridgeConfig = {
      espIp,
      deviceMap: deviceMap ?? loraBridgeConfig.deviceMap,
    };

    console.log("[LoRa Bridge] Config updated:", loraBridgeConfig);
    connectLoRaBridge(wss); // reconnect with new IP

    res.json({ success: true, config: loraBridgeConfig });
  });

  /**
   * DELETE /api/lora-bridge
   * Disconnects the bridge and clears the ESP32 IP.
   * Patients that were LoRa-live will continue showing their last reading.
   */
  app.delete("/api/lora-bridge", (_req, res) => {
    if (loraSocket) {
      loraSocket.removeAllListeners();
      loraSocket.terminate();
      loraSocket = null;
    }
    loraBridgeConfig.espIp = "";
    res.json({ success: true, message: "LoRa bridge disconnected." });
  });

  app.get("/api/settings/alerts", (_req, res) => {
    res.json({ phoneNumber: alertPhoneNumber });
  });

  app.post("/api/settings/alerts", (req, res) => {
    const { phoneNumber } = req.body;
    if (phoneNumber !== undefined) {
      alertPhoneNumber = phoneNumber;
      return res.json({ success: true, phoneNumber });
    }
    res.status(400).json({ error: "Phone number required" });
  });

  app.post("/api/send-alert", async (req, res) => {
    const { message, phoneNumber } = req.body;
    try {
      await sendSMSAlert(message, phoneNumber);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/test-sms", async (req, res) => {
    const { phoneNumber } = req.body;
    try {
      await sendSMSAlert("This is a test alert from KAVACH Clinical Command Center.", phoneNumber);
      res.json({ success: true, message: "Test SMS sent" });
    } catch (error: any) {
      res.status(500).json({ error: error.message, details: "Check SMS provider settings." });
    }
  });

  app.post("/api/patients", (req, res) => {
    const { name, age, gender, bedNumber, ward, diagnosis, doctorAssigned } = req.body;
    if (!name || !age || !gender || !bedNumber || !ward || !diagnosis || !doctorAssigned) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const newPatient: Patient = {
      id: Math.random().toString(36).substr(2, 9),
      name, age: parseInt(age), gender, bedNumber, ward, diagnosis, doctorAssigned,
      admissionDate: new Date().toISOString(),
      status: 'Normal', pdi: 10,
      vitals: { heartRate: 75, spO2: 98, respiratoryRate: 16, temperature: 36.6, batteryPct: 90, rssi: -65, lastUpdated: new Date().toISOString() },
      history: [], notes: [],
    };
    patients.push(newPatient);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'VITALS_UPDATE', patients }));
      }
    });
    res.status(201).json(newPatient);
  });

  app.post("/api/patients/:id/notes", (req, res) => {
    const { id } = req.params;
    const { content, author } = req.body;
    const patientIndex = patients.findIndex(p => p.id === id);
    if (patientIndex === -1) return res.status(404).json({ error: "Patient not found" });

    const newNote = { id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(), author: author || "Dr. Sarah Chen", content };
    patients[patientIndex].notes.unshift(newNote);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'VITALS_UPDATE', patients }));
      }
    });
    res.json(newNote);
  });

  // ── Vite / Static ─────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`KAVACH Server running on http://localhost:${PORT}`);
    console.log(`LoRa Bridge config: ESP32_IP=${loraBridgeConfig.espIp || "(not set)"}`);
  });
}

startServer();
