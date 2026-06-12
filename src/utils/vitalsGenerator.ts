import { Patient, Vitals, RiskLevel } from '../types';

export const generateInitialPatients = (): Patient[] => {
  const patients: Patient[] = [
    {
      id: '1',
      name: 'John Doe',
      age: 65,
      gender: 'Male',
      bedNumber: 'ICU-101',
      ward: 'Intensive Care',
      diagnosis: 'Post-Op Cardiac Surgery',
      doctorAssigned: 'Dr. Sarah Chen',
      admissionDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'Normal',
      pdi: 12,
      kews: 1,
      vitals: {
        heartRate: 72,
        spO2: 98,
        respiratoryRate: 16,
        temperature: 36.8,
        batteryPct: 85,
        rssi: -62,
        lastUpdated: new Date().toISOString(),
      },
      history: [],
      notes: [],
    },
    {
      id: '2',
      name: 'Elena Rodriguez',
      age: 42,
      gender: 'Female',
      bedNumber: 'ICU-102',
      ward: 'Intensive Care',
      diagnosis: 'Acute Respiratory Distress',
      doctorAssigned: 'Dr. Michael Vance',
      admissionDate: new Date(Date.now() - 86400000).toISOString(),
      status: 'Critical',
      pdi: 84,
      kews: 8,
      vitals: {
        heartRate: 115,
        spO2: 89,
        respiratoryRate: 28,
        temperature: 38.5,
        batteryPct: 42,
        rssi: -88,
        lastUpdated: new Date().toISOString(),
      },
      history: [],
      notes: [],
    },
    {
      id: '3',
      name: 'Robert Wilson',
      age: 78,
      gender: 'Male',
      bedNumber: 'W-304',
      ward: 'General Ward',
      diagnosis: 'Pneumonia',
      doctorAssigned: 'Dr. Sarah Chen',
      admissionDate: new Date(Date.now() - 86400000 * 5).toISOString(),
      status: 'Warning',
      pdi: 56,
      kews: 4,
      vitals: {
        heartRate: 92,
        spO2: 94,
        respiratoryRate: 22,
        temperature: 37.9,
        batteryPct: 25,
        rssi: -102,
        lastUpdated: new Date().toISOString(),
      },
      history: [],
      notes: [],
    },
    {
      id: '4',
      name: 'Amina Khan',
      age: 29,
      gender: 'Female',
      bedNumber: 'W-305',
      ward: 'General Ward',
      diagnosis: 'Post-Trauma Observation',
      doctorAssigned: 'Dr. Michael Vance',
      admissionDate: new Date(Date.now() - 3600000 * 12).toISOString(),
      status: 'Normal',
      pdi: 8,
      kews: 0,
      vitals: {
        heartRate: 68,
        spO2: 99,
        respiratoryRate: 14,
        temperature: 36.6,
        batteryPct: 92,
        rssi: -58,
        lastUpdated: new Date().toISOString(),
      },
      history: [],
      notes: [],
    },
  ];

  // Generate some history for each patient
  return patients.map(p => ({
    ...p,
    history: Array.from({ length: 20 }).map((_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 300000).toISOString(),
      heartRate: p.vitals.heartRate + (Math.random() * 10 - 5),
      spO2: Math.min(100, p.vitals.spO2 + (Math.random() * 4 - 2)),
      pdi: Math.max(0, p.pdi + (Math.random() * 10 - 5)),
    })),
  }));
};

export const updatePatientVitals = (patient: Patient): Patient => {
  const hrChange = Math.random() * 4 - 2;
  const spo2Change = Math.random() * 2 - 1;
  const rrChange = Math.random() * 2 - 1;
  const tempChange = Math.random() * 0.2 - 0.1;

  const newVitals: Vitals = {
    heartRate: Math.round(patient.vitals.heartRate + hrChange),
    spO2: Math.min(100, Math.max(70, Math.round(patient.vitals.spO2 + spo2Change))),
    respiratoryRate: Math.round(patient.vitals.respiratoryRate + rrChange),
    temperature: Number((patient.vitals.temperature + tempChange).toFixed(1)),
    batteryPct: Math.max(20, Math.min(95, Math.round(patient.vitals.batteryPct - (Math.random() * 0.05)))),
    rssi: Math.max(-105, Math.min(-55, Math.round(patient.vitals.rssi + (Math.random() * 4 - 2)))),
    lastUpdated: new Date().toISOString(),
  };

  // Calculate new PDI based on vitals
  let pdi = 0;
  let kews = 0;

  // HR
  if (newVitals.heartRate > 110 || newVitals.heartRate < 40) { pdi += 20; kews += 3; }
  else if (newVitals.heartRate > 100 || newVitals.heartRate < 50) { pdi += 10; kews += 1; }

  // SpO2
  if (newVitals.spO2 < 88) { pdi += 40; kews += 3; }
  else if (newVitals.spO2 < 92) { pdi += 20; kews += 2; }
  else if (newVitals.spO2 < 95) { pdi += 10; kews += 1; }

  // RR
  if (newVitals.respiratoryRate > 24 || newVitals.respiratoryRate < 10) { pdi += 20; kews += 3; }
  else if (newVitals.respiratoryRate > 20 || newVitals.respiratoryRate < 12) { pdi += 10; kews += 1; }

  // Temp
  if (newVitals.temperature > 39 || newVitals.temperature < 35) { pdi += 20; kews += 3; }
  else if (newVitals.temperature > 38 || newVitals.temperature < 36) { pdi += 10; kews += 1; }
  
  // Add some randomness to PDI
  pdi = Math.min(100, Math.max(0, pdi + Math.floor(Math.random() * 10)));
  kews = Math.min(15, kews);

  let status: RiskLevel = 'Normal';
  if (pdi > 70 || kews >= 7) status = 'Critical';
  else if (pdi > 40 || kews >= 4) status = 'Warning';

  const newHistory = [
    ...patient.history.slice(-29),
    {
      timestamp: newVitals.lastUpdated,
      heartRate: newVitals.heartRate,
      spO2: newVitals.spO2,
      pdi: pdi,
    },
  ];

  return {
    ...patient,
    vitals: newVitals,
    pdi,
    kews,
    status,
    history: newHistory,
  };
};
