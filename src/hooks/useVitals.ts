import { useState, useEffect } from 'react';
import { Patient } from '../types';

export const useVitals = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [latestAlert, setLatestAlert] = useState<{ patientId: string; patientName: string; message: string } | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'INITIAL_STATE' || data.type === 'VITALS_UPDATE') {
          setPatients(data.patients);
        } else if (data.type === 'CRITICAL_ALERT') {
          setLatestAlert({
            patientId: data.patientId,
            patientName: data.patientName,
            message: data.message
          });
          // Auto-clear alert after 10 seconds
          setTimeout(() => setLatestAlert(null), 10000);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socket.onopen = () => {
      console.log('Connected to vitals stream');
      setIsConnected(true);
    };

    socket.onclose = () => {
      console.log('Disconnected from vitals stream');
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, []);

  return { patients, isConnected, latestAlert };
};
