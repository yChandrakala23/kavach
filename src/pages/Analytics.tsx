import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Activity,
  Calendar,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Mon', alerts: 12, pdi: 45 },
  { name: 'Tue', alerts: 19, pdi: 52 },
  { name: 'Wed', alerts: 15, pdi: 48 },
  { name: 'Thu', alerts: 22, pdi: 61 },
  { name: 'Fri', alerts: 30, pdi: 65 },
  { name: 'Sat', alerts: 18, pdi: 55 },
  { name: 'Sun', alerts: 10, pdi: 42 },
];

const wardData = [
  { name: 'ICU', value: 40 },
  { name: 'General', value: 30 },
  { name: 'Emergency', value: 20 },
  { name: 'Pediatrics', value: 10 },
];

const COLORS = ['#00f2ff', '#00d1ff', '#7000ff', '#ff3e3e'];

export const Analytics = () => {
  const handleExport = () => {
    // Prepare CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Weekly Data
    csvContent += "Weekly Performance\n";
    csvContent += "Day,Alerts,PDI Score\n";
    data.forEach(row => {
      csvContent += `${row.name},${row.alerts},${row.pdi}\n`;
    });
    
    csvContent += "\nWard Distribution\n";
    csvContent += "Ward,Percentage\n";
    wardData.forEach(row => {
      csvContent += `${row.name},${row.value}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KAVACH_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Hospital Analytics</h2>
          <p className="text-slate-400 text-sm">Clinical performance and ward risk distribution insights</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/5 rounded-xl text-sm font-bold text-slate-300 hover:text-text-main transition-colors">
            <Calendar className="w-4 h-4" />
            Last 7 Days
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/5 rounded-xl text-sm font-bold text-slate-300 hover:text-text-main transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Avg. PDI Score', value: '42.5', change: '+2.4%', icon: Activity, color: 'text-primary' },
          { label: 'Critical Alerts', value: '124', change: '-12%', icon: AlertTriangle, color: 'text-critical' },
          { label: 'Patient Recovery', value: '88%', change: '+5.2%', icon: TrendingUp, color: 'text-success' },
          { label: 'Total Admissions', value: '1,240', change: '+18%', icon: Users, color: 'text-secondary' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded",
                stat.change.startsWith('+') ? "text-success bg-success/10" : "text-critical bg-critical/10"
              )}>
                {stat.change}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-text-main">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alerts Frequency */}
        <div className="glass-card p-8">
          <h3 className="text-lg font-bold text-text-main mb-8 flex items-center gap-2">
            <BarChart3 className="text-primary w-5 h-5" />
            Critical Alerts Frequency
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)' }}
                />
                <Bar dataKey="alerts" fill="#00f2ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ward Distribution */}
        <div className="glass-card p-8">
          <h3 className="text-lg font-bold text-text-main mb-8 flex items-center gap-2">
            <Users className="text-secondary w-5 h-5" />
            Ward Risk Distribution
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wardData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {wardData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4 ml-8">
              {wardData.map((entry, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-xs text-slate-400">{entry.name}</span>
                  <span className="text-xs font-bold text-text-main ml-auto">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PDI Trends */}
        <div className="lg:col-span-2 glass-card p-8">
          <h3 className="text-lg font-bold text-text-main mb-8 flex items-center gap-2">
            <TrendingUp className="text-accent w-5 h-5" />
            Average PDI Trend Analysis
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorPdiAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7000ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7000ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)' }}
                />
                <Area type="monotone" dataKey="pdi" stroke="#7000ff" fillOpacity={1} fill="url(#colorPdiAnalytics)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
