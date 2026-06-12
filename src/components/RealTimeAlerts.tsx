import React, { useEffect, useState } from 'react';
import { useVitals } from '../hooks/useVitals';
import { EmergencyOverlay } from './EmergencyOverlay';

export const RealTimeAlerts = () => {
  const { latestAlert } = useVitals();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [alertData, setAlertData] = useState<{ patientName: string; bedNumber: string } | null>(null);

  useEffect(() => {
    if (latestAlert) {
      // Extract bed number from message if possible, or just use a placeholder
      // The message format is: "CRITICAL: Patient Name (Bed) has critical vitals..."
      const bedMatch = latestAlert.message.match(/\(([^)]+)\)/);
      const bedNumber = bedMatch ? bedMatch[1] : 'Unknown Bed';
      
      setAlertData({
        patientName: latestAlert.patientName,
        bedNumber: bedNumber
      });
      setIsOverlayOpen(true);
    }
  }, [latestAlert]);

  if (!alertData) return null;

  return (
    <EmergencyOverlay 
      isOpen={isOverlayOpen}
      onClose={() => setIsOverlayOpen(false)}
      patientName={alertData.patientName}
      bedNumber={alertData.bedNumber}
    />
  );
};
