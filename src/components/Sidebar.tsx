import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  BrainCircuit, 
  UserPlus, 
  BarChart3, 
  Settings, 
  LogOut,
  Heart,
  Sun,
  Moon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../context/ThemeContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Activity, label: 'Watchlist', path: '/watchlist' },
  { icon: BrainCircuit, label: 'Clinical Insights', path: '/insights' },
  { icon: UserPlus, label: 'Admit Patient', path: '/admit' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar = ({ onLogout }: { onLogout: () => void }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-64 h-screen bg-surface border-r border-white/5 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
            <Heart className="text-primary w-6 h-6 fill-primary/20" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-text-main">KAVACH</h1>
          </div>
        </div>
        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-primary transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
              isActive 
                ? "bg-primary/10 text-primary border border-primary/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-text-main"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            <motion.div
              layoutId="active-pill"
              className="ml-auto w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100"
            />
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-critical hover:bg-critical/5 rounded-xl transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
