import React, { useState } from 'react';
import { Shield, Lock, User, ChevronRight, Radio, Cpu, Activity, Smartphone, Mail } from 'lucide-react';
import { Account } from '../types';

interface AuthScreenProps {
  onLogin: (user: Account) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState(''); // Stores Email or Phone
  const [password, setPassword] = useState('');
  const [callsign, setCallsign] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const body = isLogin 
        ? { identifier, password }
        : { identifier, password, callsign };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Access Denied');
      }

      // Simulate a short delay for "system processing" effect
      setTimeout(() => {
        onLogin(data.user);
      }, 800);

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tech-grid flex items-center justify-center p-4 relative overflow-hidden text-white font-mono">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none vignette z-10" />
      <div className="absolute inset-0 pointer-events-none scanlines opacity-30 z-10" />
      
      {/* Decorative Grid Lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-ptt-accent to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-ptt-accent to-transparent opacity-50" />

      <div className="relative z-20 w-full max-w-md">
        
        {/* Terminal Header */}
        <div className="bg-black/80 border-t border-l border-r border-ptt-accent/50 rounded-t-lg p-4 flex justify-between items-end backdrop-blur-xl">
          <div className="flex flex-col">
            <span className="text-[10px] text-ptt-muted uppercase tracking-[0.2em] mb-1">Secure Uplink Protocol</span>
            <h1 className="text-xl font-bold tracking-wider text-white flex items-center gap-2">
              <Shield className="text-ptt-accent" size={24} />
              SECURE<span className="text-ptt-accent">PTT</span>
            </h1>
          </div>
          <div className="flex gap-1 items-center">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             <span className="text-[9px] uppercase text-red-500 font-bold">Restricted Access</span>
          </div>
        </div>

        {/* Main Panel */}
        <div className="bg-black/60 border border-ptt-accent/30 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 rounded-b-lg relative overflow-hidden">
          
          {/* Animated Loader Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 border-4 border-ptt-accent border-t-transparent rounded-full animate-spin" />
              <div className="text-sm text-ptt-accent uppercase tracking-widest animate-pulse">
                {isLogin ? 'Authenticating...' : 'Checking Manifest...'}
              </div>
            </div>
          )}

          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-b from-gray-800 to-black border-4 border-gray-700 flex items-center justify-center shadow-inner relative">
               <div className="absolute inset-0 rounded-full border border-white/10" />
               <Radio size={40} className="text-ptt-accent/80" />
               <div className="absolute bottom-0 right-0 p-1.5 bg-gray-900 rounded-full border border-gray-600">
                  <Lock size={12} className="text-green-500" />
               </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-900/20 border-l-2 border-red-500 p-3 text-red-400 text-xs uppercase tracking-wide flex items-center gap-2">
              <Activity size={14} className="animate-pulse" />
              Error: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Toggle Switch */}
            <div className="flex bg-gray-900/50 p-1 rounded mb-6 border border-gray-700">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${isLogin ? 'bg-ptt-accent text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${!isLogin ? 'bg-ptt-accent text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Register
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Company ID (Email / Mobile)</label>
                <div className="relative">
                  <div className="absolute left-3 top-2.5 text-gray-600 flex flex-col items-center">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-gray-900/80 border border-gray-700 focus:border-ptt-accent text-white text-sm rounded px-10 py-2.5 outline-none transition-colors placeholder-gray-700"
                    placeholder="name@company.com or 555-0100"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1 animate-in slide-in-from-left duration-300">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Preferred Callsign</label>
                  <div className="relative">
                    <Cpu className="absolute left-3 top-2.5 text-gray-600" size={16} />
                    <input
                      type="text"
                      value={callsign}
                      onChange={(e) => setCallsign(e.target.value)}
                      className="w-full bg-gray-900/80 border border-gray-700 focus:border-ptt-accent text-white text-sm rounded px-10 py-2.5 outline-none transition-colors placeholder-gray-700 uppercase"
                      placeholder="e.g. ALPHA LEAD"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Access Code</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-600" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900/80 border border-gray-700 focus:border-ptt-accent text-white text-sm rounded px-10 py-2.5 outline-none transition-colors placeholder-gray-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-ptt-accent hover:bg-blue-600 text-white font-bold py-3 rounded flex items-center justify-center gap-2 uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] border border-blue-400/20"
            >
              {isLogin ? 'Authenticate' : 'Verify & Register'}
              <ChevronRight size={14} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[9px] text-gray-600 uppercase">
              Restricted: Only Authorized Company Numbers/Emails permitted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;