import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Heart, 
  Droplets, 
  Wind, 
  Thermometer, 
  Plus, 
  History,
  BrainCircuit,
  FileText,
  Calendar,
  User,
  Stethoscope,
  Activity,
  TrendingUp,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Patient } from '../types';
import { useVitals } from '../hooks/useVitals';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients } = useVitals();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (patients.length > 0) {
      const found = patients.find(p => p.id === id);
      if (found) {
        setPatient(found);
      }
    }
  }, [id, patients]);

  if (!patient) return null;

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/patients/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNote,
          author: 'Dr. Sarah Chen' // In a real app, this would come from auth
        }),
      });

      if (response.ok) {
        setNewNote('');
        setIsNoteModalOpen(false);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const chartData = patient.history.map(h => ({
    time: format(new Date(h.timestamp), 'HH:mm'),
    hr: Math.round(h.heartRate),
    spo2: Math.round(h.spO2),
    pdi: Math.round(h.pdi)
  }));

  return (
    <div className="space-y-8">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-surface border border-white/5 rounded-xl hover:bg-surface-light transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">{patient.name}</h2>
              <span className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded uppercase tracking-widest">
                {patient.bedNumber}
              </span>
            </div>
            <p className="text-slate-400 text-sm">{patient.diagnosis} • Admitted {format(new Date(patient.admissionDate), 'MMM dd, yyyy')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/5 rounded-xl text-sm font-bold text-slate-300 hover:text-white transition-colors">
            <History className="w-4 h-4" />
            Full History
          </button>
          <button 
            onClick={() => setIsNoteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Clinical Note
          </button>
        </div>
      </div>

      {/* Vitals Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Heart Rate', value: patient.vitals.heartRate, unit: 'BPM', icon: Heart, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'SpO2', value: patient.vitals.spO2, unit: '%', icon: Droplets, color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Resp. Rate', value: patient.vitals.respiratoryRate, unit: '/min', icon: Wind, color: 'text-slate-400', bg: 'bg-slate-400/10' },
          { label: 'Temperature', value: patient.vitals.temperature, unit: '°C', icon: Thermometer, color: 'text-warning', bg: 'bg-warning/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex items-center gap-4"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-mono font-bold text-white">
                {stat.value}
                <span className="text-xs ml-1 text-slate-500 font-sans">{stat.unit}</span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="text-primary w-5 h-5" />
                Vitals Trend Analysis
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Heart Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">SpO2</span>
                </div>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121624', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hr" 
                    stroke="#00f2ff" 
                    strokeWidth={3} 
                    dot={false} 
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="spo2" 
                    stroke="#00d1ff" 
                    strokeWidth={3} 
                    dot={false} 
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
              <TrendingUp className="text-accent w-5 h-5" />
              Patient Deterioration Index (PDI)
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPdi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7000ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7000ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121624', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pdi" 
                    stroke="#7000ff" 
                    fillOpacity={1} 
                    fill="url(#colorPdi)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New Detailed PDI Trend Chart */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
              <Activity className="text-accent w-5 h-5" />
              Detailed PDI History
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPdiDetailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7000ff" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#7000ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-10}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121624', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#7000ff', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pdi" 
                    stroke="#7000ff" 
                    fillOpacity={1} 
                    fill="url(#colorPdiDetailed)" 
                    strokeWidth={4}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          {/* AI Insights */}
          <section className="glass-card p-6 border-accent/20">
            <div className="flex items-center gap-2 mb-6">
              <BrainCircuit className="text-accent w-5 h-5" />
              <h3 className="text-lg font-bold text-white">AI Health Insights</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                <p className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-accent font-bold">Predictive Alert:</span> Based on current trends, there is a 15% probability of respiratory distress within the next 4 hours. Recommend increasing SpO2 monitoring frequency.
                </p>
              </div>
              <div className="p-4 bg-success/5 rounded-xl border border-success/10">
                <p className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-success font-bold">Recovery Trend:</span> Heart rate variability is stabilizing compared to previous 24h cycle.
                </p>
              </div>
            </div>
          </section>

          {/* Patient Info */}
          <section className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-6">Patient Profile</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Assigned Doctor</p>
                  <p className="text-sm font-bold text-white">{patient.doctorAssigned}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Primary Diagnosis</p>
                  <p className="text-sm font-bold text-white">{patient.diagnosis}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Admission Date</p>
                  <p className="text-sm font-bold text-white">{format(new Date(patient.admissionDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Clinical Notes */}
          <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Clinical Notes</h3>
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <div className="space-y-4">
              {patient.notes.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No clinical notes recorded yet.</p>
              ) : (
                patient.notes.map((note) => (
                  <div key={note.id} className="border-l-2 border-primary pl-4 py-1">
                    <p className="text-[10px] text-slate-500 font-bold mb-1">
                      {format(new Date(note.timestamp), 'MMM dd, HH:mm')} • {note.author}
                    </p>
                    <p className="text-xs text-slate-300">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Add Note Modal */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNoteModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Add Clinical Note</h3>
                <button 
                  onClick={() => setIsNoteModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Note Content
                  </label>
                  <textarea 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter clinical observations, medication updates, or patient status..."
                    className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsNoteModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddNote}
                    disabled={isSubmitting || !newNote.trim()}
                    className="flex-1 py-3 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
