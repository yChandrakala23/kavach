export type RiskLevel = 'Normal' | 'Warning' | 'Critical';

export interface Note {
  id: string;
  timestamp: string;
  author: string;
  content: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bedNumber: string;
  ward: string;
  diagnosis: string;
  doctorAssigned: string;
  admissionDate: string;
  status: RiskLevel;
  pdi: number; // Patient Deterioration Index (0-100)
  kews: number; // Kavach Early Warning Score (0-10+)
  vitals: Vitals;
  history: VitalsHistory[];
  notes: Note[];
}

export interface Vitals {
  heartRate: number;
  spO2: number;
  respiratoryRate: number;
  temperature: number;
  batteryPct: number;
  rssi: number;
  lastUpdated: string;
}

export interface VitalsHistory {
  timestamp: string;
  heartRate: number;
  spO2: number;
  pdi: number;
}

export interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  bedNumber: string;
  type: 'HR' | 'SpO2' | 'RR' | 'Temp' | 'PDI';
  value: number;
  severity: RiskLevel;
  timestamp: string;
  isRead: boolean;
}
