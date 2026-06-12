import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Lock, Mail, ChevronRight, Fingerprint } from 'lucide-react';

export const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card p-10 relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 mb-6 glow-primary">
            <Heart className="text-primary w-10 h-10 fill-primary/20" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight text-center">KAVACH</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                placeholder="Hospital Email" 
                className="w-full bg-background border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                placeholder="Access Key" 
                className="w-full bg-background border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
              <input type="checkbox" className="rounded border-white/10 bg-background text-primary focus:ring-primary/20" />
              Remember this terminal
            </label>
            <a href="#" className="text-primary hover:underline">Forgot Access Key?</a>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-primary text-background rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all group glow-primary"
          >
            Authenticate
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Or use Biometric Access</p>
          <button className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors group">
            <Fingerprint className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
          </button>
        </div>
      </motion.div>

      <div className="absolute bottom-8 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
        Secure Terminal ID: KAVACH-772-ALPHA • HIPAA COMPLIANT
      </div>
    </div>
  );
};
