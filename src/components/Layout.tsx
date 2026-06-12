import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { RealTimeAlerts } from './RealTimeAlerts';
import { Alert } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [alerts] = useState<Alert[]>([
    {
      id: '1',
      patientId: '2',
      patientName: 'Elena Rodriguez',
      bedNumber: 'ICU-102',
      type: 'SpO2',
      value: 89,
      severity: 'Critical',
      timestamp: new Date().toISOString(),
      isRead: false
    },
    {
      id: '2',
      patientId: '3',
      patientName: 'Robert Wilson',
      bedNumber: 'W-304',
      type: 'PDI',
      value: 56,
      severity: 'Warning',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      isRead: false
    }
  ]);

  return (
    <div className="flex min-h-screen bg-background text-slate-200">
      <Sidebar onLogout={onLogout} />
      <main className="flex-1 ml-64 p-8 relative">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-text-main tracking-tight">Clinical Command Center</h2>
            <p className="text-slate-400 text-sm">St. Jude Futuristic Medical Complex • Ward A</p>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 bg-surface border border-white/5 rounded-full hover:bg-surface-light transition-colors group"
            >
              <Bell className="w-5 h-5 text-slate-400 group-hover:text-text-main" />
              {alerts.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-critical rounded-full border-2 border-surface"></span>
              )}
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-white/5">
              <div className="text-right">
                <p className="text-sm font-semibold text-text-main">Dr. Sarah Chen</p>
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Senior Consultant</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent p-[1px]">
                <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>

        <NotificationPanel 
          isOpen={isNotificationsOpen} 
          onClose={() => setIsNotificationsOpen(false)} 
          alerts={alerts}
        />
        <RealTimeAlerts />
      </main>
    </div>
  );
};

