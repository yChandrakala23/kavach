import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import twilio from "twilio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock Patient Data and Logic (Simplified for server-side)
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
}

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

function updateVitals() {
  patients = patients.map(p => {
    const hrChange = Math.random() * 4 - 2;
    const spo2Change = Math.random() * 2 - 1;
    const batteryDrain = Math.random() * 0.05; // Very slow drain
    const rssiFluctuation = Math.random() * 4 - 2;
    
    const newVitals = {
      ...p.vitals,
      heartRate: Math.round(p.vitals.heartRate + hrChange),
      spO2: Math.min(100, Math.max(70, Math.round(p.vitals.spO2 + spo2Change))),
      batteryPct: Math.max(20, Math.min(95, Math.round(p.vitals.batteryPct - batteryDrain))),
      rssi: Math.max(-105, Math.min(-55, Math.round(p.vitals.rssi + rssiFluctuation))),
      lastUpdated: new Date().toISOString(),
    };

    let pdi = 0;
    if (newVitals.heartRate > 100 || newVitals.heartRate < 50) pdi += 20;
    if (newVitals.spO2 < 92) pdi += 30;
    pdi = Math.min(100, Math.max(0, pdi + Math.floor(Math.random() * 10)));

    let status: 'Normal' | 'Warning' | 'Critical' = 'Normal';
    if (pdi > 70) status = 'Critical';
    else if (pdi > 40) status = 'Warning';

    // Update history
    const newHistory = [...p.history, {
      timestamp: newVitals.lastUpdated,
      heartRate: newVitals.heartRate,
      spO2: newVitals.spO2,
      pdi: pdi
    }].slice(-50); // Keep last 50 entries

    return { ...p, vitals: newVitals, pdi, status, history: newHistory };
  });
}

// SMS Alert Configuration
let alertPhoneNumber = ""; // To be set via API or env
const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes

async function sendFast2SMS(message: string, phoneNumber: string) {
  const apiKey = process.env.VITE_FAST2SMS_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_FAST2SMS_API_KEY is not defined");
  }

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      'authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'q',
      message: message,
      language: 'english',
      flash: 0,
      numbers: phoneNumber,
    }),
  });

  const data = await response.json();
  if (!data.return) {
    throw new Error(data.message || "Fast2SMS error");
  }
  return data;
}

async function sendSMSAlert(message: string, phoneNumber?: string) {
  const targetNumber = phoneNumber || alertPhoneNumber;
  let fast2smsError = null;

  // Try Fast2SMS first if key is available
  if (process.env.VITE_FAST2SMS_API_KEY && targetNumber) {
    try {
      console.log("Attempting Fast2SMS...");
      return await sendFast2SMS(`[KAVACH ALERT] ${message}`, targetNumber);
    } catch (err: any) {
      fast2smsError = err.message;
      console.error("Fast2SMS failed:", fast2smsError);
    }
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  // Try Twilio fallback if configured
  if (accountSid && authToken && fromNumber && targetNumber) {
    try {
      if (fromNumber === targetNumber) {
        throw new Error("Twilio 'From' number cannot be the same as the 'To' number. Please use your Twilio-purchased number as the 'From' number.");
      }

      console.log("Attempting Twilio fallback...");
      const client = twilio(accountSid, authToken);
      const result = await client.messages.create({
        body: `[KAVACH ALERT] ${message}`,
        from: fromNumber,
        to: targetNumber
      });
      console.log(`Twilio SMS sent successfully. SID: ${result.sid}`);
      return result;
    } catch (error: any) {
      console.error("Twilio Error:", error.message);
      let twilioError = error.message;
      if (twilioError.includes("cannot be the same")) {
        twilioError = "Twilio 'From' number cannot be the same as the 'To' number. You must use a Twilio-provided number in the 'From' field, not your personal number.";
      }
      throw new Error(`SMS failed. Fast2SMS: ${fast2smsError || 'Not configured'}. Twilio: ${twilioError}`);
    }
  }

  // If we reach here, both failed or weren't fully configured
  const twilioMissing = [];
  if (!accountSid) twilioMissing.push("TWILIO_ACCOUNT_SID");
  if (!authToken) twilioMissing.push("TWILIO_AUTH_TOKEN");
  if (!fromNumber) twilioMissing.push("TWILIO_PHONE_NUMBER");

  let finalError = "SMS Alert failed.";
  if (fast2smsError) {
    finalError += ` Fast2SMS: ${fast2smsError}.`;
    if (fast2smsError.includes("transaction")) {
      finalError += " (Note: Fast2SMS requires a minimum transaction of 100 INR to enable API access)";
    }
  } else if (!process.env.VITE_FAST2SMS_API_KEY) {
    finalError += " Fast2SMS: Not configured.";
  }

  if (twilioMissing.length > 0 && twilioMissing.length < 3) {
    finalError += ` Twilio: Missing ${twilioMissing.join(", ")}.`;
  } else if (twilioMissing.length === 3) {
    finalError += " Twilio: Not configured.";
  }
  
  if (!targetNumber) {
    finalError += " Error: Recipient phone number is missing.";
  }

  console.log(finalError);
  throw new Error(finalError);
}

function checkAndTriggerAlerts(wss: WebSocketServer) {
  patients.forEach(p => {
    if (p.status === 'Critical') {
      const now = Date.now();
      if (!p.lastAlertSent || (now - p.lastAlertSent > ALERT_COOLDOWN)) {
        const message = `CRITICAL: Patient ${p.name} (${p.bedNumber}) has critical vitals. HR: ${p.vitals.heartRate}, SpO2: ${p.vitals.spO2}%`;
        
        // Broadcast to all WS clients
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: 'CRITICAL_ALERT', 
              patientId: p.id,
              patientName: p.name,
              message 
            }));
          }
        });

        // Send SMS
        sendSMSAlert(message).catch(err => console.error("Auto SMS Alert failed:", err.message));
        p.lastAlertSent = now;
      }
    }
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('Client connected to vitals stream');
    
    // Send initial state
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
      console.log('Client disconnected');
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", system: "KAVACH", version: "1.0.0-alpha" });
  });

  app.get("/api/settings/alerts", (req, res) => {
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
      await sendSMSAlert("This is a test alert from KAVACH Clinical Command Center. Your SMS configuration is working correctly.", phoneNumber);
      res.json({ success: true, message: "Test SMS sent" });
    } catch (error: any) {
      console.error("Test SMS failed:", error.message);
      res.status(500).json({ 
        error: error.message || "Failed to send test SMS",
        details: "Check your SMS provider settings (Fast2SMS or Twilio) in the Secrets panel."
      });
    }
  });

  app.post("/api/patients", (req, res) => {
    const { name, age, gender, bedNumber, ward, diagnosis, doctorAssigned } = req.body;
    
    if (!name || !age || !gender || !bedNumber || !ward || !diagnosis || !doctorAssigned) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newPatient: Patient = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      age: parseInt(age),
      gender,
      bedNumber,
      ward,
      diagnosis,
      doctorAssigned,
      admissionDate: new Date().toISOString(),
      status: 'Normal',
      pdi: 10, // Initial PDI
      vitals: {
        heartRate: 75,
        spO2: 98,
        respiratoryRate: 16,
        temperature: 36.6,
        batteryPct: 90,
        rssi: -65,
        lastUpdated: new Date().toISOString()
      },
      history: [],
      notes: []
    };

    patients.push(newPatient);

    // Broadcast update immediately
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
    if (patientIndex === -1) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    const newNote = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      author: author || "Dr. Sarah Chen",
      content
    };
    
    patients[patientIndex].notes.unshift(newNote);
    
    // Broadcast update immediately
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'VITALS_UPDATE', patients }));
      }
    });

    res.json(newNote);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`KAVACH Server running on http://localhost:${PORT}`);
  });
}

startServer();
