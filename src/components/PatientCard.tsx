import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Droplets, Wind, Thermometer, ChevronRight, Signal } from 'lucide-react';
import { Patient, RiskLevel } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Link, useNavigate } from 'react-router-dom';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PatientCardProps {
  patient: Patient;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const navigate = useNavigate();
  const getStatusColor = (status: RiskLevel) => {
    switch (status) {
      case 'Critical': return 'text-critical border-critical/30 bg-critical/5';
      case 'Warning': return 'text-warning border-warning/30 bg-warning/5';
      default: return 'text-success border-success/30 bg-success/5';
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/patient/${patient.id}`)}
      className={cn(
        "glass-card p-6 group cursor-pointer transition-all duration-500 border-l-4",
        patient.status === 'Critical' ? "border-l-critical glow-critical" : 
        patient.status === 'Warning' ? "border-l-warning" : "border-l-success",
        "hover:bg-white/5"
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-8">
        {/* Patient Identity */}
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/10 rounded">
              {patient.bedNumber}
            </span>
            <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getStatusColor(patient.status))}>
              {patient.status}
            </div>
          </div>
          <Link to={`/patient/${patient.id}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-text-main hover:text-primary transition-colors mb-1">
              {patient.name}
            </h3>
          </Link>
          <p className="text-xs text-slate-400 font-medium">{patient.diagnosis}</p>
        </div>

        {/* Vitals Grid - Horizontal Layout */}
        <div className="flex-[2] grid grid-cols-2 sm:grid-cols-4 gap-8 lg:px-8 lg:border-x lg:border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-500">
              <Heart className={cn("w-3 h-3", patient.vitals.heartRate > 100 ? "text-critical" : "text-primary")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">HR</span>
            </div>
            <p className="text-xl font-mono font-bold text-text-main">
              {patient.vitals.heartRate}
              <span className="text-[10px] ml-1 text-slate-500 font-normal">BPM</span>
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-500">
              <Droplets className={cn("w-3 h-3", patient.vitals.spO2 < 92 ? "text-critical" : "text-secondary")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">SpO2</span>
            </div>
            <p className="text-xl font-mono font-bold text-text-main">
              {patient.vitals.spO2}
              <span className="text-[10px] ml-1 text-slate-500 font-normal">%</span>
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-500">
              <Wind className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">RR</span>
            </div>
            <p className="text-xl font-mono font-bold text-text-main">
              {patient.vitals.respiratoryRate}
              <span className="text-[10px] ml-1 text-slate-500 font-normal">/m</span>
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-500">
              <Thermometer className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Temp</span>
            </div>
            <p className="text-xl font-mono font-bold text-text-main">
              {patient.vitals.temperature}
              <span className="text-[10px] ml-1 text-slate-500 font-normal">°C</span>
            </p>
          </div>
        </div>

        {/* PDI Score & Action */}
        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 min-w-[140px]">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">PDI Index</p>
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-2xl font-black font-mono leading-none",
                patient.pdi > 70 ? "text-critical" : patient.pdi > 40 ? "text-warning" : "text-success"
              )}>
                {patient.pdi}
              </span>
              <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${patient.pdi}%` }}
                  className={cn(
                    "h-full rounded-full",
                    patient.pdi > 70 ? "bg-critical" : patient.pdi > 40 ? "bg-warning" : "bg-success"
                  )}
                />
              </div>
            </div>
          </div>
          <Link to={`/patient/${patient.id}`} className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/20 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-primary" />
          </Link>
        </div>
      </div>

      {/* Status Indicators (Battery & Signal) */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Battery Indicator */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Band battery</span>
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-4 border border-slate-500/50 rounded-sm p-[1px] bg-black/20">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${patient.vitals.batteryPct}%` }}
                  className={cn(
                    "h-full rounded-px transition-all duration-500",
                    patient.vitals.batteryPct >= 60 ? "bg-success" : 
                    patient.vitals.batteryPct >= 20 ? "bg-warning" : "bg-critical"
                  )}
                />
                <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-2 bg-slate-500/50 rounded-r-sm" />
              </div>
              <span className={cn(
                "text-xs font-mono font-bold",
                patient.vitals.batteryPct >= 60 ? "text-success" : 
                patient.vitals.batteryPct >= 20 ? "text-warning" : "text-critical"
              )}>
                {patient.vitals.batteryPct}%
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-white/5" />

          {/* Signal Indicator */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Signal</span>
            <div className="flex items-center gap-2">
              <div className="flex items-end gap-[2px] h-3">
                {[1, 2, 3, 4].map((bar) => {
                  const isActive = 
                    (patient.vitals.rssi >= -70 && bar <= 4) ||
                    (patient.vitals.rssi >= -85 && bar <= 3) ||
                    (patient.vitals.rssi >= -100 && bar <= 2) ||
                    (patient.vitals.rssi < -100 && bar <= 1);
                  
                  return (
                    <div 
                      key={bar}
                      className={cn(
                        "w-[3px] rounded-t-sm transition-all duration-500",
                        isActive ? (
                          patient.vitals.rssi >= -70 ? "bg-success" : 
                          patient.vitals.rssi >= -100 ? "bg-warning" : "bg-critical"
                        ) : "bg-white/10"
                      )}
                      style={{ height: `${bar * 25}%` }}
                    />
                  );
                })}
              </div>
              <span className={cn(
                "text-xs font-mono font-bold",
                patient.vitals.rssi >= -70 ? "text-success" : 
                patient.vitals.rssi >= -100 ? "text-warning" : "text-critical"
              )}>
                {patient.vitals.rssi} <span className="text-[10px] font-normal opacity-70">dBm</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-[10px] text-slate-500 font-medium">
            Last updated: {new Date(patient.vitals.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
