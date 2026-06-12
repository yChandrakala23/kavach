import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle,
  Send,
} from 'lucide-react';
import { useVitals } from '../hooks/useVitals';
import { PatientCard } from '../components/PatientCard';
import { sendKavachAlert } from '../utils/smsAlert';

export const Dashboard = () => {
  const { patients } = useVitals();
  const [alertPhone, setAlertPhone] = useState<string>('');
  const lastAlertTimes = useRef<Record<string, number>>({});
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    fetch('/api/settings/alerts')
      .then(res => res.json())
      .then(data => setAlertPhone(data.phoneNumber || ''))
      .catch(err => console.error('Failed to fetch alert settings:', err));
  }, []);

  const handleManualTest = async () => {
    setIsSendingTest(true);
    const target = alertPhone || "8088449672";
    await sendKavachAlert(
      "Test Patient",
      "1",
      7,
      { hr: 118, spo2: 92, temp: 38.9, rr: 24 },
      target
    );
    setIsSendingTest(false);
  };

  useEffect(() => {
    if (!alertPhone) return;

    patients.forEach(patient => {
      // Trigger alert if KEWS score is 5 or above
      if (patient.kews >= 5) {
        const now = Date.now();
        const lastAlertTime = lastAlertTimes.current[patient.id] || 0;
        const fiveMinutes = 5 * 60 * 1000;

        if (now - lastAlertTime > fiveMinutes) {
          lastAlertTimes.current[patient.id] = now;
          
          sendKavachAlert(
            patient.name,
            patient.bedNumber,
            patient.kews,
            {
              hr: patient.vitals.heartRate,
              spo2: patient.vitals.spO2,
              temp: patient.vitals.temperature,
              rr: patient.vitals.respiratoryRate
            },
            alertPhone
          );
        }
      }
    });
  }, [patients, alertPhone]);

  const criticalPatients = patients.filter(p => p.status === 'Critical');
  const sortedPatients = [...patients].sort((a, b) => b.pdi - a.pdi);

  return (
    <div className="space-y-8">
      {/* Critical Alert Banner */}

      {criticalPatients.length > 0 && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-critical/10 border border-critical/30 rounded-2xl p-4 flex items-center gap-4 overflow-hidden"
        >
          <div className="w-10 h-10 bg-critical/20 rounded-full flex items-center justify-center animate-pulse">
            <AlertTriangle className="text-critical w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-critical font-bold text-sm uppercase tracking-wider">Critical Alert</h4>
            <p className="text-text-main text-sm">
              <span className="font-bold">{criticalPatients.length} patients</span> require immediate attention. PDI threshold exceeded.
            </p>
          </div>
          <button className="px-4 py-2 bg-critical text-white text-xs font-bold rounded-lg hover:bg-critical/80 transition-colors">
            View All Critical
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-12">
        {/* Main Monitoring Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
              <Activity className="text-primary w-5 h-5" />
              Real-time Monitoring
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={handleManualTest}
                disabled={isSendingTest}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                {isSendingTest ? 'Sending Test...' : 'Trigger Test SMS'}
              </button>
              <div className="flex items-center gap-2 pl-4 border-l border-white/5">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Feed</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {sortedPatients.map(patient => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
