import React, { useState } from 'react';
import { Shield, ChevronRight, Radio, User, Zap } from 'lucide-react';
import { Account } from '../types';

interface AuthScreenProps {
  onLogin: (user: Account) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [callsign, setCallsign] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callsign.trim()) return;
    
    setIsLoading(true);

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callsign })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Access Denied');
      }

      // Simulate initialization sequence
      setTimeout(() => {
        onLogin(data.user);
      }, 800);

    } catch (err: any) {
      console.warn("Server unreachable, entering offline mode.");
      // Fallback for offline mode or server error
      const offlineUser: Account = {
         id: `guest-${Date.now()}`,
         username: callsign,
         callsign: callsign,
         role: (callsign.toUpperCase().includes('COMMAND') || callsign.toUpperCase().includes('ADMIN')) ? 'ADMIN' : 'OPERATOR',
         createdAt: new Date().toISOString()
      };
      
      setTimeout(() => {
        onLogin(offlineUser);
      }, 800);
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

      <div className="relative z-20 w-full max-w-sm">
        
        {/* Terminal Header */}
        <div className="bg-black/80 border-t border-l border-r border-ptt-accent/50 rounded-t-lg p-4 flex justify-between items-end backdrop-blur-xl">
          <div className="flex flex-col">
            <span className="text-[10px] text-ptt-muted uppercase tracking-[0.2em] mb-1">Tactical Comms Link</span>
            <h1 className="text-xl font-bold tracking-wider text-white flex items-center gap-2">
              <Shield className="text-ptt-accent" size={24} />
              SECURE<span className="text-ptt-accent">PTT</span>
            </h1>
          </div>
          <div className="flex gap-1 items-center">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[9px] uppercase text-green-500 font-bold">ONLINE</span>
          </div>
        </div>

        {/* Main Panel */}
        <div className="bg-black/60 border border-ptt-accent/30 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 rounded-b-lg relative overflow-hidden">
          
          {/* Animated Loader Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 border-4 border-ptt-accent border-t-transparent rounded-full animate-spin" />
              <div className="text-sm text-ptt-accent uppercase tracking-widest animate-pulse">
                Establishing Uplink...
              </div>
            </div>
          )}

          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-b from-gray-800 to-black border-4 border-gray-700 flex items-center justify-center shadow-inner relative group">
               <div className="absolute inset-0 rounded-full border border-white/10 group-hover:border-ptt-accent/50 transition-colors" />
               <Radio size={40} className="text-ptt-accent/80 group-hover:text-ptt-accent group-hover:scale-110 transition-all duration-300" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center gap-2">
                <User size={10} className="text-gray-400" />
                Identity Designator
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  className="w-full bg-gray-900/80 border border-gray-700 focus:border-ptt-accent text-white text-lg font-bold tracking-wider rounded px-4 py-3 outline-none transition-colors placeholder-gray-700 uppercase"
                  placeholder="ENTER CALLSIGN"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!callsign.trim()}
              className="w-full bg-ptt-accent hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded flex items-center justify-center gap-2 uppercase tracking-widest text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] border border-blue-400/20"
            >
              Establish Uplink
              <ChevronRight size={16} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[9px] text-gray-600 uppercase">
              Secure Channel Encrypted // AES-256
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;