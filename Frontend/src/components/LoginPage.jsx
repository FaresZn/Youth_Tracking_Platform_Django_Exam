import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Lock, Briefcase } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '', role: 'Operator' });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // Connects to your Django backend endpoint
      const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Forward the username and role to the OTP phase for verification context
        navigate('/verify-otp', { 
          state: { 
            username: formData.username,
            role: formData.role 
          } 
        });
      } else {
        setErrorMessage(data.error || 'Invalid credentials or unauthorized role assignment.');
      }
    } catch (error) {
      setErrorMessage('Network connection to gateway timed out. Is Django running?');
      console.error('Login connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-crvs-canvas font-sans text-crvs-navy">
      <div className="w-full max-w-md bg-white border border-stone-200/80 p-10 rounded-2xl shadow-xl space-y-8 animate-fade-in">
        
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-crvs-canvas flex items-center justify-center text-crvs-blue mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-crvs-navy">Identity Authentication</h2>
          <p className="text-xs text-stone-500 font-medium max-w-xs mx-auto">
            Access requires valid programmatic tokens and pre-assigned deployment roles.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-4 rounded-xl animate-fade-in">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Account Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
              <input 
                type="text" 
                required
                className="w-full text-sm pl-11 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-crvs-blue focus:ring-1 focus:ring-crvs-blue transition bg-stone-50/40" 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Secret Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
              <input 
                type="password" 
                required
                className="w-full text-sm pl-11 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-crvs-blue focus:ring-1 focus:ring-crvs-blue transition bg-stone-50/40" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">System Deployment Node</label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
              <select 
                className="w-full text-sm pl-11 pr-10 py-3 border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-crvs-blue focus:ring-1 focus:ring-crvs-blue transition appearance-none cursor-pointer"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="Operator">Operator (Data Intake Clerk)</option>
                <option value="Counselor">Counselor (Clinical Reviewer)</option>
                <option value="Admin">System Administrator</option>
              </select>
              <div className="absolute right-4 top-4.5 w-2 h-2 border-r-2 border-b-2 border-stone-400 transform rotate-45 pointer-events-none"></div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-crvs-navy text-white font-bold text-xs tracking-wider uppercase py-4 rounded-xl hover:bg-black transition duration-200 shadow-sm mt-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Requesting Handshake..." : "Authorize Identity Session"}
          </button>
        </form>
      </div>
    </div>
  );
}