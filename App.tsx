import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Wifi, WifiOff, Users, Settings, UserPlus, Building } from 'lucide-react';
import { Channel, ChannelType, PTTState, ConnectionState, Department, User } from './types';
import ChannelList from './components/ChannelList';
import PTTButton from './components/PTTButton';
import Visualizer from './components/Visualizer';
import InviteModal from './components/InviteModal';
import CreateChannelModal from './components/CreateChannelModal';
import CreateDepartmentModal from './components/CreateDepartmentModal';
import SettingsModal from './components/SettingsModal';
import ManageUsersModal from './components/ManageUsersModal';
import { GeminiService } from './services/geminiService';

// --- FALLBACK DATA (Offline Mode) ---
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

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Alpha Lead', isOnline: true, isTalking: false, channelId: 'ch-1' },
  { id: 'u2', name: 'Operator 2', isOnline: true, isTalking: false, channelId: 'ch-1' },
  { id: 'u3', name: 'Operator 3', isOnline: true, isTalking: false, channelId: 'ch-1' },
  { id: 'u6', name: 'Sec Lead', isOnline: true, isTalking: false, channelId: 'ch-2' },
  { id: 'u7', name: 'Gate 1', isOnline: true, isTalking: false, channelId: 'ch-2' },
  { id: 'u9', name: 'Dispatch', isOnline: true, isTalking: false, channelId: 'ch-3' },
  { id: 'u12', name: 'Whse Mgr', isOnline: true, isTalking: false, channelId: 'ch-3' },
  { id: 'ai-1', name: 'AI Command', isOnline: true, isTalking: false, channelId: 'ch-ai' },
];

export default function App() {
  // Initialize from LocalStorage if available
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('companyName') || "VANGUARD CORP");
  const [companyLogo, setCompanyLogo] = useState<string | null>(() => localStorage.getItem('companyLogo'));

  // State now defaults to empty arrays, populated by API or Fallback
  const [departments, setDepartments] = useState<Department[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isCreateDepartmentOpen, setIsCreateDepartmentOpen] = useState(false);
  const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [pttState, setPttState] = useState<PTTState>(PTTState.IDLE);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.CONNECTING);
  const [lastLog, setLastLog] = useState<string>("Initializing System...");
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

  // --- API INITIALIZATION WITH FALLBACK ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLastLog("Fetching Unit Data...");
        // Attempt to fetch from backend
        const res = await fetch('/api/init');
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        
        setDepartments(data.departments);
        setChannels(data.channels);
        setUsers(data.users);
        
        if (data.channels.length > 0) {
          setActiveChannelId(data.channels[0].id);
        }

        setConnectionState(ConnectionState.CONNECTED);
        setLastLog("System Ready. Connected to HQ.");
      } catch (error) {
        console.warn("Backend API unreachable. Switching to Offline Mode.", error);
        
        // Fallback to local data
        setDepartments(INITIAL_DEPARTMENTS);
        setChannels(INITIAL_CHANNELS);
        setUsers(INITIAL_USERS);
        setActiveChannelId(INITIAL_CHANNELS[0].id);
        
        setConnectionState(ConnectionState.CONNECTED);
        setLastLog("Offline Mode: Local Systems Active.");
      }
    };

    fetchData();
  }, []);

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
        // Explicitly check for BUSY state logic if needed, but RECEIVING covers the UI blocking
        // setPttState(PTTState.BUSY); // Optional: if you want BUSY logic during simple RX
        
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
        // Force BUSY state logic visual via playAudioBuffer or here
        setPttState(PTTState.BUSY); // Force BUSY immediately
        playAudioBuffer(audioBuffer);
        
        // Reset from BUSY to IDLE handled in playAudioBuffer timeout
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

  const handleCreateChannel = async (name: string, isSecure: boolean, departmentId: string) => {
    const newChannel: Channel = {
      id: `ch-${Date.now()}`,
      name: name,
      type: ChannelType.TEAM,
      members: 1,
      isSecure: isSecure,
      departmentId: departmentId
    };

    // Optimistically update UI, try backend in background
    setChannels(prev => [...prev, newChannel]);
    setActiveChannelId(newChannel.id);
    setLastLog(`New Frequency Assigned: ${name}`);

    try {
      await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannel)
      });
    } catch (e) {
      console.warn("Backend update failed, running in offline mode");
    }
  };

  const handleCreateDepartment = async (name: string) => {
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: name.toUpperCase()
    };
    
    // Optimistic update
    setDepartments(prev => [...prev, newDept]);
    setLastLog(`Department Created: ${newDept.name}`);

    try {
      await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDept)
      });
    } catch (e) {
       console.warn("Backend update failed, running in offline mode");
    }
  };

  const handleAddUser = async (name: string, channelId: string) => {
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: name,
      isOnline: false, // Default offline until they 'login' (mock)
      isTalking: false,
      channelId: channelId
    };

    // Optimistic update
    setUsers(prev => [...prev, newUser]);
    setLastLog(`User Authorized: ${name}`);

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
    } catch (e) {
       console.warn("Backend update failed, running in offline mode");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Optimistic update
    setUsers(prev => prev.filter(u => u.id !== userId));
    setLastLog(`User Access Revoked: ID ${userId.slice(-4)}`);

    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    } catch (e) {
       console.warn("Backend update failed, running in offline mode");
    }
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
    // Strict Half-Duplex check
    if (pttStateRef.current !== PTTState.IDLE) {
        setLastLog("Error: Channel Busy. Wait to transmit.");
        return;
    }

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

  // Safe fallback if data hasn't loaded
  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];
  const activeDept = activeChannel ? departments.find(d => d.id === activeChannel.departmentId) : undefined;

  // Show Loading only if no data AND no active channel (initial mount before effect)
  if (!activeChannel) {
    return (
      <div className="flex h-screen w-screen bg-ptt-dark items-center justify-center text-white flex-col gap-4">
        <div className="w-12 h-12 border-4 border-ptt-accent border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm font-mono tracking-widest animate-pulse">ESTABLISHING SECURE CONNECTION...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-ptt-dark overflow-hidden font-sans text-white">
      {/* Sidebar Channel List */}
      <ChannelList 
        companyName={companyName}
        companyLogo={companyLogo}
        departments={departments}
        channels={channels}
        users={users} 
        activeChannelId={activeChannelId} 
        onSelectChannel={handleChannelSelect}
        isMobileMenuOpen={isMobileMenuOpen}
        onCreateChannel={() => setIsCreateChannelOpen(true)}
        onCreateDepartment={() => setIsCreateDepartmentOpen(true)}
        onManageUsers={() => setIsManageUsersOpen(true)}
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
                <span className="text-xs text-gray-500 font-bold uppercase">{companyName} // {activeDept?.name || 'UNASSIGNED'}</span>
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
                isActive={pttState === PTTState.TRANSMITTING || pttState === PTTState.RECEIVING || pttState === PTTState.BUSY} 
                color={(pttState === PTTState.RECEIVING || pttState === PTTState.BUSY) ? '#f59e0b' : '#ef4444'}
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

      <ManageUsersModal 
        isOpen={isManageUsersOpen}
        onClose={() => setIsManageUsersOpen(false)}
        users={users}
        channels={channels}
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
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