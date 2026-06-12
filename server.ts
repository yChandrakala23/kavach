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
  isLoRaLive?: boolean;
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
// BROADCAST HELPER
// Single function used everywhere — avoids duplicate logic.
// ============================================================
let wssGlobal: WebSocketServer | null = null;

function broadcastAll(payload: object) {
  if (!wssGlobal) return;
  const msg = JSON.stringify(payload);
  wssGlobal.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// ============================================================
// SIMULATION — DISABLED
// All vitals are static unless updated by LoRa hardware.
// ============================================================
// (no updateVitals call anywhere — intentionally removed)

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

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

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

  throw new Error("No SMS provider configured.");
}

function checkAndTriggerAlerts() {
  patients.forEach(p => {
    if (p.status === 'Critical') {
      const now = Date.now();
      if (!p.lastAlertSent || (now - p.lastAlertSent > ALERT_COOLDOWN)) {
        const message = `CRITICAL: Patient ${p.name} (${p.bedNumber}) — HR: ${p.vitals.heartRate}, SpO2: ${p.vitals.spO2}%`;
        broadcastAll({ type: 'CRITICAL_ALERT', patientId: p.id, patientName: p.name, message });
        sendSMSAlert(message).catch(err => console.error("Auto SMS failed:", err.message));
        p.lastAlertSent = now;
      }
    }
  });
}

// ============================================================
// LORA BRIDGE
// ============================================================
interface LoRaBridgeConfig {
  espIp: string;
  deviceMap: Record<string, string>; // LoRa deviceId → patient id
}

let loraBridgeConfig: LoRaBridgeConfig = {
  espIp: process.env.ESP32_IP || "",
  deviceMap: { "1": "1" },
};

let loraSocket: WebSocket | null = null;
let loraReconnectTimer: ReturnType<typeof setTimeout> | null = null;

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

function ingestLoRaPacket(raw: Record<string, unknown>) {
  const deviceId  = String(raw.deviceId ?? "1");
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

  patients[idx] = {
    ...patients[idx],
    isLoRaLive: true,
    pdi,
    status,
    vitals: {
      ...patients[idx].vitals,
      heartRate:   hr,
      spO2:        spo2,
      temperature: btemp,
      rssi:        rssi,
      lastUpdated: now,
    },
    history: [
      ...patients[idx].history,
      { timestamp: now, heartRate: hr, spO2: spo2, pdi }
    ].slice(-50),
  };

  console.log(`[LoRa] ✅ Patient "${patients[idx].name}" — HR:${hr} SpO2:${spo2}% Temp:${btemp}°C RSSI:${rssi}dBm`);

  // Push update immediately to all dashboard clients
  broadcastAll({ type: 'VITALS_UPDATE', patients });
  checkAndTriggerAlerts();
}

function connectLoRaBridge() {
  if (!loraBridgeConfig.espIp) {
    console.log("[LoRa Bridge] No ESP32 IP set. Use ESP32_IP env var or POST /api/lora-bridge.");
    return;
  }

  const url = `ws://${loraBridgeConfig.espIp}/ws`;
  console.log(`[LoRa Bridge] Connecting to ${url} …`);

  if (loraSocket) {
    loraSocket.removeAllListeners();
    loraSocket.terminate();
    loraSocket = null;
  }

  loraSocket = new WebSocket(url);

  loraSocket.on('open', () => {
    console.log(`[LoRa Bridge] ✅ Connected to ESP32 (${url})`);
    if (loraReconnectTimer) { clearTimeout(loraReconnectTimer); loraReconnectTimer = null; }
  });

  loraSocket.on('message', (data) => {
    try {
      const packet = JSON.parse(data.toString()) as Record<string, unknown>;
      console.log("[LoRa Bridge] Raw packet received:", JSON.stringify(packet));
      ingestLoRaPacket(packet);
    } catch (err) {
      console.error("[LoRa Bridge] JSON parse error:", err, "| Raw:", data.toString());
    }
  });

  loraSocket.on('error', (err) => {
    console.error("[LoRa Bridge] Error:", (err as Error).message);
  });

  loraSocket.on('close', () => {
    console.warn("[LoRa Bridge] ⚠️  Disconnected. Retrying in 5s …");
    loraReconnectTimer = setTimeout(() => connectLoRaBridge(), 5000);
  });
}

// ============================================================
// MAIN SERVER
// ============================================================
async function startServer() {
  const app    = express();
  const server = createServer(app);
  const wss    = new WebSocketServer({ server });
  wssGlobal    = wss;               // ← store globally so broadcastAll() works everywhere
  const PORT   = 3000;

  app.use(express.json());

  // ── WebSocket: dashboard clients ─────────────────────────────
  wss.on('connection', (ws) => {
    console.log('[WS] Dashboard client connected');

    // Send full current state immediately on connect
    ws.send(JSON.stringify({ type: 'INITIAL_STATE', patients }));

    // Heartbeat every 5s — keeps connection alive, no data mutation
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'VITALS_UPDATE', patients }));
      }
    }, 5000);

    ws.on('close', () => {
      clearInterval(heartbeat);
      console.log('[WS] Dashboard client disconnected');
    });
  });

  // ── Start LoRa bridge ─────────────────────────────────────────
  connectLoRaBridge();

  // ── REST API ──────────────────────────────────────────────────

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      system: "KAVACH",
      version: "2.0.0",
      simulation: "disabled",
      loraBridge: {
        configured: !!loraBridgeConfig.espIp,
        espIp:      loraBridgeConfig.espIp || null,
        connected:  loraSocket?.readyState === WebSocket.OPEN,
        deviceMap:  loraBridgeConfig.deviceMap,
      }
    });
  });

  app.get("/api/lora-bridge", (_req, res) => {
    res.json({
      espIp:     loraBridgeConfig.espIp,
      deviceMap: loraBridgeConfig.deviceMap,
      connected: loraSocket?.readyState === WebSocket.OPEN,
    });
  });

  app.post("/api/lora-bridge", (req, res) => {
    const { espIp, deviceMap } = req.body;
    if (!espIp) return res.status(400).json({ error: "espIp is required" });

    loraBridgeConfig = {
      espIp,
      deviceMap: deviceMap ?? loraBridgeConfig.deviceMap,
    };

    console.log("[LoRa Bridge] Config updated:", loraBridgeConfig);
    connectLoRaBridge();

    res.json({ success: true, config: loraBridgeConfig });
  });

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
      await sendSMSAlert("Test alert from KAVACH Clinical Command Center.", phoneNumber);
      res.json({ success: true, message: "Test SMS sent" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
    broadcastAll({ type: 'VITALS_UPDATE', patients });
    res.status(201).json(newPatient);
  });

  app.post("/api/patients/:id/notes", (req, res) => {
    const { id } = req.params;
    const { content, author } = req.body;
    const patientIndex = patients.findIndex(p => p.id === id);
    if (patientIndex === -1) return res.status(404).json({ error: "Patient not found" });

    const newNote = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      author: author || "Dr. Sarah Chen",
      content
    };
    patients[patientIndex].notes.unshift(newNote);
    broadcastAll({ type: 'VITALS_UPDATE', patients });
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
    console.log(`\n✅ KAVACH Server running on http://localhost:${PORT}`);
    console.log(`   Simulation : DISABLED`);
    console.log(`   ESP32 IP   : ${loraBridgeConfig.espIp || "(not set — POST /api/lora-bridge to configure)"}\n`);
  });
}

startServer();
