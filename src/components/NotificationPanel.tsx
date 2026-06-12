import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bell, X, CheckCircle2 } from 'lucide-react';
import { Alert } from '../types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, alerts }) => {
  const navigate = useNavigate();

  const handleAlertClick = (patientId: string) => {
    navigate(`/patient/${patientId}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-96 bg-surface border-l border-white/10 z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-white">Alert Center</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                  <CheckCircle2 className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium">No active alerts</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    onClick={() => handleAlertClick(alert.patientId)}
                    className={cn(
                      "p-4 rounded-xl border transition-all cursor-pointer hover:brightness-110",
                      alert.severity === 'Critical' 
                        ? "bg-critical/10 border-critical/20" 
                        : "bg-warning/10 border-warning/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        alert.severity === 'Critical' ? "bg-critical/20" : "bg-warning/20"
                      )}>
                        <AlertTriangle className={cn(
                          "w-4 h-4",
                          alert.severity === 'Critical' ? "text-critical" : "text-warning"
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-bold text-white">{alert.patientName}</h4>
                          <span className="text-[10px] text-slate-500">{format(new Date(alert.timestamp), 'HH:mm')}</span>
                        </div>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">{alert.bedNumber}</p>
                        <p className="text-xs text-slate-300">
                          <span className="font-bold">{alert.type}</span> threshold exceeded: <span className="font-bold">{alert.value}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-white/10">
              <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition-colors">
                Mark All as Read
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
