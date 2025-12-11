import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Wifi, WifiOff, Users, Settings } from 'lucide-react';
import { Channel, ChannelType, PTTState, ConnectionState } from './types';
import ChannelList from './components/ChannelList';
import PTTButton from './components/PTTButton';
import Visualizer from './components/Visualizer';
import { GeminiService } from './services/geminiService';

// Mock Data
const MOCK_CHANNELS: Channel[] = [
  { id: 'ch-1', name: 'Tactical Ops', type: ChannelType.TEAM, members: 12, isSecure: true },
  { id: 'ch-2', name: 'Security Detail', type: ChannelType.TEAM, members: 4, isSecure: true },
  { id: 'ch-3', name: 'General Comms', type: ChannelType.TEAM, members: 28, isSecure: false },
  { id: 'ch-ai', name: 'AI Command', type: ChannelType.AI_ASSISTANT, members: 1, isSecure: true },
];

export default function App() {
  const [activeChannelId, setActiveChannelId] = useState<string>(MOCK_CHANNELS[0].id);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pttState, setPttState] = useState<PTTState>(PTTState.IDLE);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.CONNECTED);
  const [lastLog, setLastLog] = useState<string>("System Ready. Standing by.");
  const [transcription, setTranscription] = useState<string>("");

  // Audio & AI Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const geminiServiceRef = useRef<GeminiService | null>(null);
  
  // Audio Output Refs (for incoming audio playback)
  const nextStartTimeRef = useRef<number>(0);
  
  // Initialize Audio Context on first interaction
  const initAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await audioContextRef.current.resume();
    }
    if (!mediaStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        } });
        mediaStreamRef.current = stream;
      } catch (e) {
        console.error("Mic Error", e);
        setLastLog("Error: Microphone access denied.");
      }
    }
  };

  // Channel Switching Logic
  const handleChannelSelect = async (id: string) => {
    // If we were connected to AI, disconnect
    const currentChannel = MOCK_CHANNELS.find(c => c.id === activeChannelId);
    if (currentChannel?.type === ChannelType.AI_ASSISTANT) {
       disconnectGemini();
    }
    
    setActiveChannelId(id);
    setIsMobileMenuOpen(false);
    
    const newChannel = MOCK_CHANNELS.find(c => c.id === id);
    setLastLog(`Switched to channel: ${newChannel?.name}`);

    // If switching TO AI, connect immediately
    if (newChannel?.type === ChannelType.AI_ASSISTANT) {
      await connectGemini();
    }
  };

  // Gemini Connection Handlers
  const connectGemini = async () => {
    await initAudio();
    if (!audioContextRef.current) return;
    
    setConnectionState(ConnectionState.CONNECTING);
    setLastLog("Establishing secure uplink to AI Command...");

    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      setLastLog("Error: Missing Encryption Key (API_KEY)");
      setConnectionState(ConnectionState.ERROR);
      return;
    }

    const service = new GeminiService(apiKey);
    geminiServiceRef.current = service;

    await service.connect(audioContextRef.current, {
      onOpen: () => {
        setConnectionState(ConnectionState.CONNECTED);
        setLastLog("AI Command Uplink: SECURE");
      },
      onAudioData: (audioBuffer) => {
        // Enforcing Half-Duplex: Only play if we are NOT transmitting
        // Note: In a real PTT app, we might also lock PTT if receiving.
        // For smoother AI interaction, we allow full duplex technically but visually show RECEIVING.
        
        if (pttState === PTTState.TRANSMITTING) return; 

        playAudioBuffer(audioBuffer);
        setPttState(PTTState.RECEIVING);
        
        // Reset to IDLE after audio finishes (rough estimation)
        const durationMs = audioBuffer.duration * 1000;
        setTimeout(() => {
          setPttState(prev => prev === PTTState.RECEIVING ? PTTState.IDLE : prev);
        }, durationMs);
      },
      onClose: () => {
        setLastLog("AI Uplink Terminated.");
      },
      onError: (err) => {
        setLastLog(`Uplink Error: ${err.message}`);
        setConnectionState(ConnectionState.ERROR);
      },
      onTranscription: (text, isUser) => {
          setTranscription(`${isUser ? 'ME' : 'AI'}: ${text}`);
      }
    });
  };

  const disconnectGemini = () => {
    if (geminiServiceRef.current) {
      geminiServiceRef.current.disconnect();
      geminiServiceRef.current = null;
    }
  };

  // Audio Playback Queue Logic
  const playAudioBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    // Schedule playback
    const currentTime = ctx.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime;
    }
    
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
  };

  // PTT Handlers
  const startTransmission = async () => {
    await initAudio();
    if (!audioContextRef.current || !mediaStreamRef.current) return;

    setPttState(PTTState.TRANSMITTING);
    setLastLog("Transmitting...");

    const activeCh = MOCK_CHANNELS.find(c => c.id === activeChannelId);

    // If AI Channel, start pumping audio to Gemini
    if (activeCh?.type === ChannelType.AI_ASSISTANT) {
      // Setup Processor
      const ctx = audioContextRef.current;
      // Using ScriptProcessor for compatibility and ease of single-file embedding
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        if (geminiServiceRef.current) {
          geminiServiceRef.current.sendAudioChunk(inputData);
        }
      };

      const source = ctx.createMediaStreamSource(mediaStreamRef.current);
      source.connect(processor);
      processor.connect(ctx.destination); // Mute locally? Usually destination is speakers. Connect to destination to keep graph alive but maybe gain 0.

      // Store refs to clean up
      sourceRef.current = source;
      processorRef.current = processor;
      
      // Mute local output for the microphone stream to prevent feedback
      // Actually, ScriptProcessor needs to connect to destination to fire events in some browsers,
      // but we can create a GainNode(0)
      const mute = ctx.createGain();
      mute.gain.value = 0;
      processor.connect(mute);
      mute.connect(ctx.destination);
    } else {
        // Mock Channel Transmission
        // In a real app, this would send RTP packets via WebSocket/WebRTC
        // Here we just simulate visual feedback
        setTimeout(() => {
            // Simulate random incoming chatter after releasing
            // Not implemented for simplicity, focusing on AI demo
        }, 1000);
    }
  };

  const stopTransmission = () => {
    setPttState(PTTState.IDLE);
    setLastLog("Transmission Ended.");

    // Clean up audio nodes
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
  };

  const activeChannel = MOCK_CHANNELS.find(c => c.id === activeChannelId)!;

  return (
    <div className="flex h-screen w-screen bg-ptt-dark overflow-hidden font-sans text-white">
      {/* Sidebar Channel List */}
      <ChannelList 
        channels={MOCK_CHANNELS} 
        activeChannelId={activeChannelId} 
        onSelectChannel={handleChannelSelect}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Header */}
        <header className="h-16 border-b border-gray-800 bg-ptt-panel flex items-center justify-between px-4 z-10">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <Menu />
          </button>

          <div className="flex flex-col items-center md:items-start">
             <h1 className="text-lg font-bold tracking-widest uppercase flex items-center gap-2">
                {activeChannel.name}
                {activeChannel.isSecure && <span className="bg-green-900/50 text-green-400 text-[10px] px-1.5 py-0.5 rounded border border-green-800">ENCRYPTED</span>}
             </h1>
             <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                <span className={`w-2 h-2 rounded-full ${connectionState === ConnectionState.CONNECTED ? 'bg-green-500' : 'bg-red-500'}`} />
                {connectionState === ConnectionState.CONNECTED ? 'SIGNAL STRONG' : 'NO SIGNAL'}
                <span className="mx-1">|</span>
                {activeChannel.members} ACTIVE
             </div>
          </div>

          <div className="flex items-center gap-4">
            <Settings className="text-gray-500 hover:text-white cursor-pointer" size={20} />
          </div>
        </header>

        {/* Central Visualization Area */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-4">
          
          {/* Audio Visualizer Overlay */}
          <div className="absolute top-8 left-0 right-0 h-24 px-8 opacity-50">
             <Visualizer 
                stream={mediaStreamRef.current} 
                isActive={pttState === PTTState.TRANSMITTING || pttState === PTTState.RECEIVING} 
                color={pttState === PTTState.TRANSMITTING ? '#ef4444' : '#22c55e'}
             />
          </div>

          {/* Connection Status Icons */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1 opacity-40">
            {connectionState === ConnectionState.CONNECTED 
              ? <Wifi className="text-green-500" />
              : <WifiOff className="text-red-500" />
            }
          </div>

          {/* PTT Button */}
          <div className="mt-8">
            <PTTButton 
              state={pttState} 
              onDown={startTransmission} 
              onUp={stopTransmission} 
              disabled={connectionState !== ConnectionState.CONNECTED && activeChannel.type === ChannelType.AI_ASSISTANT}
            />
          </div>

          {/* Transcription / Status Log */}
          <div className="absolute bottom-8 left-4 right-4 text-center">
            <div className="inline-block bg-black/40 backdrop-blur-md border border-gray-800 rounded-lg px-6 py-3 max-w-lg w-full">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Status Log</div>
              <div className="font-mono text-sm text-ptt-accent truncate">
                {lastLog}
              </div>
              {transcription && (
                <div className="mt-2 text-xs text-white/80 italic border-t border-gray-700 pt-2">
                   "{transcription}"
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-10 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}