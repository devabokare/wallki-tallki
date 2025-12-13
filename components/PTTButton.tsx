import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Volume2, Radio } from 'lucide-react';
import { PTTState } from '../types';

interface PTTButtonProps {
  state: PTTState;
  onDown: () => void;
  onUp: () => void;
  disabled: boolean;
}

const PTTButton: React.FC<PTTButtonProps> = ({ state, onDown, onUp, disabled }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<number[]>([]);

  // Handle Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !disabled && state === PTTState.IDLE) {
        e.preventDefault(); 
        onDown();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (state === PTTState.TRANSMITTING)) {
        e.preventDefault();
        onUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state, onDown, onUp, disabled]);

  // Create ripple effect interval
  useEffect(() => {
    let interval: number;
    if (state === PTTState.TRANSMITTING || state === PTTState.RECEIVING) {
        interval = window.setInterval(() => {
            setRipples(prev => [...prev, Date.now()].slice(-3));
        }, 1000);
    } else {
        setRipples([]);
    }
    return () => clearInterval(interval);
  }, [state]);

  const config = {
    [PTTState.IDLE]: {
      text: 'HOLD TO TALK',
      subtext: 'READY',
      baseColor: 'bg-gray-800',
      gradient: 'from-gray-700 to-gray-800',
      borderColor: 'border-gray-600',
      shadowColor: 'shadow-gray-900',
      iconColor: 'text-gray-400',
      icon: <Mic className="w-10 h-10 mb-2" />
    },
    [PTTState.TRANSMITTING]: {
      text: 'TRANSMITTING',
      subtext: 'LIVE AUDIO',
      baseColor: 'bg-red-900',
      gradient: 'from-red-600 to-red-800',
      borderColor: 'border-red-500',
      shadowColor: 'shadow-red-900',
      iconColor: 'text-white',
      icon: <Mic className="w-10 h-10 mb-2 animate-pulse" />
    },
    [PTTState.RECEIVING]: {
      text: 'INCOMING',
      subtext: 'RECEIVING',
      baseColor: 'bg-amber-900',
      gradient: 'from-amber-500 to-amber-700',
      borderColor: 'border-amber-400',
      shadowColor: 'shadow-amber-900',
      iconColor: 'text-white',
      icon: <Volume2 className="w-10 h-10 mb-2 animate-bounce" />
    },
    [PTTState.BUSY]: {
      text: 'CONNECTING',
      subtext: 'WAIT',
      baseColor: 'bg-gray-700',
      gradient: 'from-gray-600 to-gray-700',
      borderColor: 'border-yellow-500',
      shadowColor: 'shadow-yellow-900',
      iconColor: 'text-yellow-400',
      icon: <Radio className="w-10 h-10 mb-2 animate-spin" />
    }
  };

  const current = config[state];
  const isPressed = state === PTTState.TRANSMITTING;

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!disabled && state === PTTState.TRANSMITTING) {
      onUp();
    }
  };

  return (
    <div className="relative group select-none touch-none flex items-center justify-center">
      
      {/* Animated Rings */}
      {ripples.map((id, index) => (
        <div 
            key={id}
            className={`
                absolute rounded-full border opacity-0 animate-ping-slow
                ${state === PTTState.TRANSMITTING ? 'border-red-500' : 'border-amber-500'}
            `}
            style={{
                width: '100%',
                height: '100%',
                padding: '4rem',
                animationDelay: `${index * 0.5}s`
            }}
        />
      ))}

      {/* Button Base (Outer Ring) */}
      <div className={`
        relative rounded-full p-2
        bg-gradient-to-br from-gray-700 to-black
        shadow-2xl
        transition-transform duration-100
        ${isPressed ? 'scale-95' : 'scale-100'}
      `}>
          {/* Inner Button Surface */}
          <button
            className={`
              relative w-64 h-64 md:w-72 md:h-72 rounded-full flex flex-col items-center justify-center
              border-4 ${current.borderColor}
              bg-gradient-to-b ${current.gradient}
              shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.5)]
              outline-none ring-0
              transition-all duration-200
              ${isPressed ? 'shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] translate-y-1' : 'shadow-[0_10px_20px_rgba(0,0,0,0.5)]'}
              ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
              ${state === PTTState.TRANSMITTING ? 'shadow-glow-danger' : ''}
              ${state === PTTState.RECEIVING ? 'shadow-glow' : ''}
            `}
            onMouseDown={!disabled ? onDown : undefined}
            onMouseUp={!disabled ? onUp : undefined}
            onTouchStart={!disabled ? (e) => { e.preventDefault(); onDown(); } : undefined}
            onTouchEnd={!disabled ? (e) => { e.preventDefault(); onUp(); } : undefined}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
          >
            {/* Texture/Pattern Overlay */}
            <div className="absolute inset-0 rounded-full opacity-10 bg-[radial-gradient(circle,transparent_20%,#000_120%)]" />
            <div className="absolute inset-0 rounded-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />

            {/* Content */}
            <div className={`relative z-10 flex flex-col items-center pointer-events-none transition-all duration-200 ${isPressed ? 'scale-95' : ''}`}>
               <div className={`${current.iconColor} drop-shadow-md`}>
                 {current.icon}
               </div>
               <span className="text-2xl font-bold tracking-widest text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] font-mono">
                 {current.text}
               </span>
               <span className="text-xs font-mono mt-2 text-white/60 uppercase tracking-[0.2em] border-t border-white/20 pt-1 px-4">
                 {current.subtext}
               </span>
            </div>
            
            {/* Shine Reflection */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none" />
          </button>
      </div>
    </div>
  );
};

export default PTTButton;