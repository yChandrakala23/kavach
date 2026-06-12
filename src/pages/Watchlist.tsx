import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreVertical,
  Heart,
  Droplets,
  Wind,
  Thermometer,
  AlertCircle
} from 'lucide-react';
import { Patient, RiskLevel } from '../types';
import { useVitals } from '../hooks/useVitals';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate, Link } from 'react-router-dom';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Watchlist = () => {
  const { patients } = useVitals();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.bedNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: RiskLevel) => {
    switch (status) {
      case 'Critical': return 'text-critical bg-critical/10 border-critical/20';
      case 'Warning': return 'text-warning bg-warning/10 border-warning/20';
      default: return 'text-success bg-success/10 border-success/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Patient Watchlist</h2>
          <p className="text-sm text-slate-400">Comprehensive view of all active patients in Ward A</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by name or bed..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
            />
          </div>
          <button className="p-2 bg-surface border border-white/5 rounded-xl hover:bg-surface-light transition-colors">
            <Filter className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bed No</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patient Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">HR</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">SpO2</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">RR</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Temp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                  <div className="flex items-center justify-center gap-1">
                    PDI Score <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <motion.tr 
                  layout
                  key={patient.id} 
                  onClick={() => navigate(`/patient/${patient.id}`)}
                  className="border-t border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-primary">{patient.bedNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <Link to={`/patient/${patient.id}`} onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm font-bold text-white hover:text-primary transition-colors">{patient.name}</p>
                      </Link>
                      <p className="text-[10px] text-slate-500">{patient.age}y • {patient.gender}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className={cn("text-sm font-mono font-bold", patient.vitals.heartRate > 100 ? "text-critical" : "text-white")}>
                        {patient.vitals.heartRate}
                      </span>
                      <Heart className={cn("w-3 h-3 mt-1", patient.vitals.heartRate > 100 ? "text-critical animate-pulse" : "text-slate-600")} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className={cn("text-sm font-mono font-bold", patient.vitals.spO2 < 92 ? "text-critical" : "text-white")}>
                        {patient.vitals.spO2}%
                      </span>
                      <Droplets className={cn("w-3 h-3 mt-1", patient.vitals.spO2 < 92 ? "text-critical animate-pulse" : "text-slate-600")} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-mono font-bold text-white">{patient.vitals.respiratoryRate}</span>
                      <Wind className="w-3 h-3 mt-1 text-slate-600" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-mono font-bold text-white">{patient.vitals.temperature}°C</span>
                      <Thermometer className="w-3 h-3 mt-1 text-slate-600" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ width: `${patient.pdi}%` }}
                          className={cn(
                            "h-full rounded-full",
                            patient.pdi > 70 ? "bg-critical" : patient.pdi > 40 ? "bg-warning" : "bg-success"
                          )}
                        />
                      </div>
                      <span className={cn(
                        "text-xs font-mono font-bold w-6",
                        patient.pdi > 70 ? "text-critical" : patient.pdi > 40 ? "text-warning" : "text-success"
                      )}>{patient.pdi}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase border inline-flex items-center gap-1.5",
                      getStatusColor(patient.status)
                    )}>
                      {patient.status === 'Critical' && <AlertCircle className="w-3 h-3 animate-pulse" />}
                      {patient.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-slate-500" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
