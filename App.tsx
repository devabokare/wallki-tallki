import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Wifi, WifiOff, Users, Settings, UserPlus, Building } from 'lucide-react';
import { Channel, ChannelType, PTTState, ConnectionState, Department } from './types';
import ChannelList from './components/ChannelList';
import PTTButton from './components/PTTButton';
import Visualizer from './components/Visualizer';
import InviteModal from './components/InviteModal';
import CreateChannelModal from './components/CreateChannelModal';
import CreateDepartmentModal from './components/CreateDepartmentModal';
import SettingsModal from './components/SettingsModal';
import { GeminiService } from './services/geminiService';

// Mock Data
const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'COMMAND H.Q.' },
  { id: 'dept-2', name: 'FIELD OPS' },
  { id: 'dept-3', name: 'SUPPORT' }
];

const INITIAL_CHANNELS: Channel[] = [
  { id: 'ch-ai', name: 'AI TACTICAL', type: ChannelType.AI_ASSISTANT, members: 1, isSecure: true, departmentId: 'dept-1' },
  { id: 'ch-1', name: 'ALPHA SQUAD', type: ChannelType.TEAM, members: 12, isSecure: true, departmentId: 'dept-2' },
  { id: 'ch-2', name: 'BRAVO SQUAD', type: ChannelType.TEAM, members: 8, isSecure: true, departmentId: 'dept-2' },
  { id: 'ch-3', name: 'LOGISTICS', type: ChannelType.TEAM, members: 4, isSecure: false, departmentId: 'dept-3' },
  { id: 'ch-4', name: 'MAINTENANCE', type: ChannelType.TEAM, members: 6, isSecure: false, departmentId: 'dept-3' },
];

export default function App() {
  // Initialize from LocalStorage if available
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('companyName') || "VANGUARD CORP");
  const [companyLogo, setCompanyLogo] = useState<string | null>(() => localStorage.getItem('companyLogo'));

  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>(INITIAL_CHANNELS[0].id);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isCreateDepartmentOpen, setIsCreateDepartmentOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [pttState, setPttState] = useState<PTTState>(PTTState.IDLE);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.CONNECTED);
  const [lastLog, setLastLog] = useState<string>("System Ready. Standing by.");
  const [transcription, setTranscription] = useState<string>("");

  // PWA Install Prompt State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Refs for state that needs to be accessed in callbacks (stale closure prevention)
  const pttStateRef = useRef<PTTState>(PTTState.IDLE);

  // Audio & AI Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const geminiServiceRef = useRef<GeminiService | null>(null);
  
  // Audio Output Refs (for incoming audio playback)
  const nextStartTimeRef = useRef<number>(0);
  const receivingTimeoutRef = useRef<number | null>(null);
  
  // Sync Ref with State
  useEffect(() => {
    pttStateRef.current = pttState;
  }, [pttState]);

  // Capture PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setInstallPrompt(null);
    });
  };

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

  // Audio Playback Queue Logic
  const playAudioBuffer = useCallback((buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    const currentTime = ctx.currentTime;
    
    if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime + 0.02; // 20ms safety buffer
    }
    
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;

    if (receivingTimeoutRef.current) {
        window.clearTimeout(receivingTimeoutRef.current);
        receivingTimeoutRef.current = null;
    }

    if (pttStateRef.current !== PTTState.TRANSMITTING) {
        setPttState(PTTState.RECEIVING);
        const timeUntilFinish = (nextStartTimeRef.current - ctx.currentTime) * 1000;
        receivingTimeoutRef.current = window.setTimeout(() => {
            if (pttStateRef.current === PTTState.RECEIVING) {
                setPttState(PTTState.IDLE);
            }
        }, timeUntilFinish);
    }
  }, []); 

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
        if (pttStateRef.current === PTTState.TRANSMITTING) {
            console.log("Ignored incoming audio while transmitting");
            return;
        }
        playAudioBuffer(audioBuffer);
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
    nextStartTimeRef.current = 0;
  };
  
  const handleChannelSelect = async (id: string) => {
    const currentChannel = channels.find(c => c.id === activeChannelId);
    if (currentChannel?.type === ChannelType.AI_ASSISTANT) {
       disconnectGemini();
    }
    
    setActiveChannelId(id);
    setIsMobileMenuOpen(false);
    
    const newChannel = channels.find(c => c.id === id);
    setLastLog(`Channel Switched: ${newChannel?.name}`);

    if (newChannel?.type === ChannelType.AI_ASSISTANT) {
      await connectGemini();
    }
  };

  const handleCreateChannel = (name: string, isSecure: boolean, departmentId: string) => {
    const newChannel: Channel = {
      id: `ch-${Date.now()}`,
      name: name,
      type: ChannelType.TEAM,
      members: 1,
      isSecure: isSecure,
      departmentId: departmentId
    };
    
    setChannels(prev => [...prev, newChannel]);
    setActiveChannelId(newChannel.id);
    setLastLog(`New Frequency Assigned: ${name}`);
  };

  const handleCreateDepartment = (name: string) => {
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: name.toUpperCase()
    };
    setDepartments(prev => [...prev, newDept]);
    setLastLog(`Department Created: ${newDept.name}`);
  };

  const handleSettingsSave = (name: string, logo: string | null) => {
    setCompanyName(name);
    setCompanyLogo(logo);
    
    // Persist to LocalStorage
    localStorage.setItem('companyName', name);
    if (logo) {
      localStorage.setItem('companyLogo', logo);
    } else {
      localStorage.removeItem('companyLogo');
    }
    
    setLastLog("System Configuration Updated");
  };

  // PTT Handlers
  const startTransmission = async () => {
    await initAudio();
    if (!audioContextRef.current || !mediaStreamRef.current) return;

    setPttState(PTTState.TRANSMITTING);
    setLastLog("Transmitting...");

    const activeCh = channels.find(c => c.id === activeChannelId);

    if (activeCh?.type === ChannelType.AI_ASSISTANT) {
      const ctx = audioContextRef.current;
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        if (geminiServiceRef.current) {
          geminiServiceRef.current.sendAudioChunk(inputData);
        }
      };

      const source = ctx.createMediaStreamSource(mediaStreamRef.current);
      source.connect(processor);
      
      const mute = ctx.createGain();
      mute.gain.value = 0;
      processor.connect(mute);
      mute.connect(ctx.destination);

      sourceRef.current = source;
      processorRef.current = processor;
    }
  };

  const stopTransmission = () => {
    setPttState(PTTState.IDLE);
    setLastLog("Transmission Ended.");

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
  };

  const activeChannel = channels.find(c => c.id === activeChannelId)!;
  const activeDept = departments.find(d => d.id === activeChannel.departmentId);

  return (
    <div className="flex h-screen w-screen bg-ptt-dark overflow-hidden font-sans text-white">
      {/* Sidebar Channel List */}
      <ChannelList 
        companyName={companyName}
        companyLogo={companyLogo}
        departments={departments}
        channels={channels} 
        activeChannelId={activeChannelId} 
        onSelectChannel={handleChannelSelect}
        isMobileMenuOpen={isMobileMenuOpen}
        onCreateChannel={() => setIsCreateChannelOpen(true)}
        onCreateDepartment={() => setIsCreateDepartmentOpen(true)}
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
             <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold uppercase">{companyName} // {activeDept?.name}</span>
             </div>
             <h1 className="text-lg font-bold tracking-widest uppercase flex items-center gap-2">
                {activeChannel.name}
                {activeChannel.isSecure && <span className="bg-green-900/50 text-green-400 text-[10px] px-1.5 py-0.5 rounded border border-green-800">ENCRYPTED</span>}
             </h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsInviteOpen(true)}
              className="text-gray-500 hover:text-white transition-colors"
              title="Invite People"
            >
              <UserPlus size={20} />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-gray-500 hover:text-white transition-colors relative"
              title="Settings"
            >
              <Settings size={20} />
              {installPrompt && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-ptt-accent rounded-full animate-pulse" />
              )}
            </button>
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

      <InviteModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        channelName={activeChannel.name}
        isSecure={activeChannel.isSecure}
      />

      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        onCreate={handleCreateChannel}
        departments={departments}
      />

      <CreateDepartmentModal
        isOpen={isCreateDepartmentOpen}
        onClose={() => setIsCreateDepartmentOpen(false)}
        onCreate={handleCreateDepartment}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentName={companyName}
        currentLogo={companyLogo}
        onSave={handleSettingsSave}
        installPrompt={installPrompt}
        onInstall={handleInstallApp}
      />

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