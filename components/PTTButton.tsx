import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { PTTState } from '../types';

interface PTTButtonProps {
  state: PTTState;
  onDown: () => void;
  onUp: () => void;
  disabled: boolean;
}

const PTTButton: React.FC<PTTButtonProps> = ({ state, onDown, onUp, disabled }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Handle Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !disabled && state === PTTState.IDLE) {
        e.preventDefault(); // Prevent scrolling
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

  // Visual configuration based on state
  const config = {
    [PTTState.IDLE]: {
      text: 'HOLD TO TALK',
      subtext: 'SPACEBAR',
      color: 'bg-gray-700',
      border: 'border-gray-600',
      shadow: 'shadow-gray-900/50',
      icon: <Mic className="w-12 h-12 mb-2 opacity-50" />
    },
    [PTTState.TRANSMITTING]: {
      text: 'TRANSMITTING',
      subtext: 'RELEASE TO LISTEN',
      color: 'bg-ptt-danger',
      border: 'border-red-400',
      shadow: 'shadow-red-900/50',
      icon: <Mic className="w-12 h-12 mb-2 text-white animate-pulse" />
    },
    [PTTState.RECEIVING]: {
      text: 'RECEIVING AUDIO',
      subtext: 'CHANNEL BUSY',
      color: 'bg-ptt-success',
      border: 'border-green-400',
      shadow: 'shadow-green-900/50',
      icon: <Volume2 className="w-12 h-12 mb-2 text-white animate-bounce" />
    },
    [PTTState.BUSY]: {
      text: 'CONNECTING...',
      subtext: 'PLEASE WAIT',
      color: 'bg-ptt-warning',
      border: 'border-yellow-400',
      shadow: 'shadow-yellow-900/50',
      icon: <MicOff className="w-12 h-12 mb-2 text-white" />
    }
  };

  const current = config[state];

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!disabled && state === PTTState.TRANSMITTING) {
      onUp();
    }
  };

  return (
    <div className="relative group select-none touch-none">
      {/* Ripple Effect when Transmitting */}
      {state === PTTState.TRANSMITTING && (
        <>
           <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping" />
           <div className="absolute -inset-4 rounded-full bg-red-500 opacity-10 animate-pulse" />
        </>
      )}

      {/* Ripple Effect when Receiving */}
      {state === PTTState.RECEIVING && (
        <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ping" />
      )}

      <button
        className={`
          relative z-10 w-64 h-64 md:w-80 md:h-80 rounded-full flex flex-col items-center justify-center
          transition-all duration-100 transform
          border-4 md:border-8 ${current.border} ${current.color}
          ${isHovered && state === PTTState.IDLE ? 'scale-105' : 'scale-100'}
          ${state === PTTState.TRANSMITTING ? 'scale-95' : ''}
          shadow-2xl ${current.shadow}
          outline-none ring-0
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onMouseDown={!disabled ? onDown : undefined}
        onMouseUp={!disabled ? onUp : undefined}
        onTouchStart={!disabled ? (e) => { e.preventDefault(); onDown(); } : undefined}
        onTouchEnd={!disabled ? (e) => { e.preventDefault(); onUp(); } : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
      >
        <div className="pointer-events-none flex flex-col items-center">
          {current.icon}
          <span className="text-xl md:text-2xl font-bold tracking-wider text-white drop-shadow-md">
            {current.text}
          </span>
          <span className="text-xs md:text-sm font-mono mt-1 text-white/70 uppercase tracking-widest">
            {current.subtext}
          </span>
        </div>
      </button>
    </div>
  );
};

export default PTTButton;