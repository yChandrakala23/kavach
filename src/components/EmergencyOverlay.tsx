import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ShieldAlert, X } from 'lucide-react';

interface EmergencyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  bedNumber: string;
}

export const EmergencyOverlay: React.FC<EmergencyOverlayProps> = ({ isOpen, onClose, patientName, bedNumber }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-critical/20 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="w-full max-w-lg bg-surface border-2 border-critical rounded-3xl p-8 shadow-[0_0_50px_rgba(255,62,62,0.4)] relative overflow-hidden"
          >
            {/* Animated Background Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border border-critical/20 rounded-full animate-ping"></div>
              <div className="absolute w-96 h-96 border border-critical/10 rounded-full animate-ping [animation-delay:0.5s]"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-critical/20 rounded-full flex items-center justify-center mb-6 border-2 border-critical animate-pulse">
                <ShieldAlert className="text-critical w-10 h-10" />
              </div>
              
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Code Red Alert</h2>
              <p className="text-critical font-bold text-sm tracking-widest uppercase mb-8">Immediate Intervention Required</p>

              <div className="w-full bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Critical Patient</p>
                <h3 className="text-2xl font-bold text-white mb-1">{patientName}</h3>
                <p className="text-primary font-mono font-bold text-lg">{bedNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button 
                  onClick={onClose}
                  className="py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                >
                  Acknowledge
                </button>
                <button 
                  className="py-4 bg-critical text-white font-bold rounded-xl hover:bg-critical/80 transition-all shadow-[0_0_20px_rgba(255,62,62,0.3)]"
                >
                  Dispatch Team
                </button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
