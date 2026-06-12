import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database, 
  User, 
  Monitor,
  ChevronRight,
  Hospital,
  Phone,
  Save,
  CheckCircle2
} from 'lucide-react';

export const Settings = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/settings/alerts')
      .then(res => res.json())
      .then(data => setPhoneNumber(data.phoneNumber || ''))
      .catch(err => console.error('Failed to fetch alert settings:', err));
  }, []);

  const handleSaveSMS = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save alert settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSMS = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-sms', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ success: true, message: 'Test SMS sent successfully!' });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send test SMS' });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Network error occurred' });
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const sections = [
    {
      title: 'Hospital Profile',
      icon: Hospital,
      items: [
        { label: 'Facility Information', description: 'Manage hospital name, address, and contact details' },
        { label: 'Ward Configuration', description: 'Configure wards, beds, and departments' },
      ]
    },
    {
      title: 'System Preferences',
      icon: Monitor,
      items: [
        { label: 'Display & Theme', description: 'Customize dashboard layout and dark mode settings' },
        { label: 'Language & Region', description: 'Set system language and time zone' },
      ]
    },
    {
      title: 'Notifications & Alerts',
      icon: Bell,
      items: [
        { label: 'Alert Thresholds', description: 'Configure PDI and vitals alert triggers' },
        { label: 'Notification Channels', description: 'Manage SMS, Email, and Push notifications' },
      ]
    },
    {
      title: 'Security & Privacy',
      icon: Shield,
      items: [
        { label: 'Access Control', description: 'Manage user roles and permissions' },
        { label: 'Data Encryption', description: 'Configure HIPAA compliance and encryption settings' },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-surface border border-white/10 rounded-2xl flex items-center justify-center">
          <SettingsIcon className="text-slate-400 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">System Settings</h2>
          <p className="text-slate-400 text-sm">Configure KAVACH Clinical Command Center preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* SMS Alert Configuration */}
        <div className="glass-card overflow-hidden">
          <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-3">
            <Phone className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">SMS Alert Configuration</h3>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-xs text-slate-500">
              Critical vital alerts will be sent to this number. Ensure the number is in E.164 format (e.g., +1234567890).
            </p>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
              </div>
              <button 
                onClick={handleSaveSMS}
                disabled={isSaving}
                className="px-6 py-3 bg-primary text-background rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saveSuccess ? 'Saved' : 'Save Config'}
              </button>
            </div>
            {phoneNumber && (
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Test Configuration</p>
                  <p className="text-xs text-slate-400 mt-1">Send a test message to verify Twilio settings</p>
                </div>
                <button 
                  onClick={handleTestSMS}
                  disabled={isTesting}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  {isTesting ? 'Sending...' : 'Send Test SMS'}
                </button>
              </div>
            )}
            {testResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg text-xs font-bold ${testResult.success ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-critical/10 text-critical border border-critical/20'}`}
              >
                {testResult.message}
              </motion.div>
            )}
          </div>
        </div>

        {sections.map((section, i) => (
          <div key={i} className="glass-card overflow-hidden">
            <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-3">
              <section.icon className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{section.title}</h3>
            </div>
            <div className="divide-y divide-white/5">
              {section.items.map((item, j) => (
                <button key={j} className="w-full px-8 py-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors group text-left">
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-8 flex items-center justify-between border-critical/20">
        <div>
          <h3 className="text-lg font-bold text-white">Danger Zone</h3>
          <p className="text-xs text-slate-500 mt-1">Irreversible actions for the hospital system data</p>
        </div>
        <button className="px-6 py-2 bg-critical/10 border border-critical/30 text-critical text-sm font-bold rounded-xl hover:bg-critical/20 transition-colors">
          Reset System Data
        </button>
      </div>
    </div>
  );
};
