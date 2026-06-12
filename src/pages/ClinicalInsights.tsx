import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, 
  TrendingUp, 
  ChevronRight,
  Activity,
  Users,
  BedDouble,
  PieChart
} from 'lucide-react';
import { Patient } from '../types';
import { generateInitialPatients, updatePatientVitals } from '../utils/vitalsGenerator';
import { Link } from 'react-router-dom';

export const ClinicalInsights = () => {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    setPatients(generateInitialPatients());
    const interval = setInterval(() => {
      setPatients(prev => prev.map(p => updatePatientVitals(p)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const criticalPatients = patients.filter(p => p.status === 'Critical');
  const sortedPatients = [...patients].sort((a, b) => b.pdi - a.pdi);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Clinical Insights</h2>
        <p className="text-slate-400">AI-driven prioritization and ward-level metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Suggested Rounds - Main Focus */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center border border-accent/30">
                  <BrainCircuit className="text-accent w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">AI Suggested Rounds</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Priority Queue</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-slate-400">
                Updated: Just Now
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {sortedPatients.map((patient, index) => (
                <motion.div 
                  key={patient.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-accent/30 transition-all group cursor-pointer flex items-center gap-6"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center text-lg font-black border border-accent/20">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-lg font-bold text-white group-hover:text-accent transition-colors">{patient.name}</h4>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/10 rounded">
                        {patient.bedNumber}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {patient.pdi > 70 
                        ? "High physiological stress detected. Immediate review recommended." 
                        : patient.pdi > 40 
                          ? "Trending upward. Early intervention may prevent deterioration."
                          : "Stable but requires routine post-op check."}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      <span className="text-xl font-black font-mono text-accent">{patient.pdi}</span>
                    </div>
                    <Link to={`/patient/${patient.id}`} className="p-2 bg-white/5 rounded-lg group-hover:bg-accent/20 transition-colors">
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-accent" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Ward Overview - Sidebar */}
        <div className="space-y-8">
          <section className="glass-card p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                <PieChart className="text-primary w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Ward Overview</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-400 font-medium">Total Patients</span>
                </div>
                <span className="text-2xl font-black text-white">24</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-critical" />
                  <span className="text-sm text-slate-400 font-medium">Critical Status</span>
                </div>
                <span className="text-2xl font-black text-critical">{criticalPatients.length}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <BedDouble className="w-5 h-5 text-success" />
                  <span className="text-sm text-slate-400 font-medium">Available Beds</span>
                </div>
                <span className="text-2xl font-black text-success">4</span>
              </div>

              <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Ward Risk Distribution</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span className="text-critical">High Risk (15%)</span>
                    <span className="text-warning">Moderate (25%)</span>
                    <span className="text-success">Stable (60%)</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-critical w-[15%] shadow-[0_0_10px_rgba(255,62,62,0.3)]"></div>
                    <div className="bg-warning w-[25%] shadow-[0_0_10px_rgba(255,180,62,0.3)]"></div>
                    <div className="bg-success w-[60%] shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Additional Insight Card */}
          <section className="glass-card p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <h4 className="text-white font-bold mb-2">Clinical Efficiency Tip</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Based on current trends, Bed ICU-102 requires a review within the next 15 minutes to maintain stability.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
