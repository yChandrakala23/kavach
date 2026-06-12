import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  User, 
  Calendar, 
  MapPin, 
  Stethoscope, 
  ShieldCheck,
  ChevronRight,
  Save,
  Loader2
} from 'lucide-react';

export const AddPatient = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    bedNumber: '',
    ward: 'Intensive Care',
    diagnosis: '',
    doctorAssigned: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/patient/${data.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to admit patient'}`);
      }
    } catch (error) {
      console.error('Admission error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
          <UserPlus className="text-primary w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Admit New Patient</h2>
          <p className="text-slate-400 text-sm">Register a new patient into the KAVACH Clinical Command Center</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Information */}
          <section className="glass-card p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <User className="text-primary w-5 h-5" />
              Personal Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Johnathan Smith"
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Age</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 45"
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Gender</label>
                  <select 
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all appearance-none"
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Clinical Assignment */}
          <section className="glass-card p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <MapPin className="text-secondary w-5 h-5" />
              Clinical Assignment
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Bed Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ICU-105"
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    value={formData.bedNumber}
                    onChange={(e) => setFormData({...formData, bedNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Ward</label>
                  <select 
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all appearance-none"
                    value={formData.ward}
                    onChange={(e) => setFormData({...formData, ward: e.target.value})}
                  >
                    <option>Intensive Care</option>
                    <option>General Ward</option>
                    <option>Emergency</option>
                    <option>Pediatrics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Assigned Doctor</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dr. Sarah Chen"
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  value={formData.doctorAssigned}
                  onChange={(e) => setFormData({...formData, doctorAssigned: e.target.value})}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Diagnosis & Notes */}
        <section className="glass-card p-8 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
            <Stethoscope className="text-accent w-5 h-5" />
            Diagnosis & Initial Assessment
          </h3>
          
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Primary Diagnosis</label>
            <textarea 
              rows={4}
              placeholder="Describe the patient's primary condition and reason for admission..."
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none"
              value={formData.diagnosis}
              onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
            ></textarea>
          </div>
        </section>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs">All data is encrypted and HIPAA compliant</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              type="button"
              className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-background rounded-xl font-bold hover:bg-primary/90 transition-all glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isSubmitting ? 'Processing...' : 'Complete Admission'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
