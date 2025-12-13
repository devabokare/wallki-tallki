import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Wifi, WifiOff, Users, Settings, UserPlus, Building, Download, Share, Radio } from 'lucide-react';
import { Channel, ChannelType, PTTState, ConnectionState, Department, User, Account, AllowedMember } from './types';
import ChannelList from './components/ChannelList';
import PTTButton from './components/PTTButton';
import Visualizer from './components/Visualizer';
import InviteModal from './components/InviteModal';
import CreateChannelModal from './components/CreateChannelModal';
import CreateDepartmentModal from './components/CreateDepartmentModal';
import SettingsModal from './components/SettingsModal';
import ManageUsersModal from './components/ManageUsersModal';
import AuthScreen from './components/AuthScreen';
import AdminConsole from './components/AdminConsole';
import { GeminiService } from './services/geminiService';

// --- FALLBACK DATA (Offline Mode) ---
const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'ADROIT HQ' },
  { id: 'dept-2', name: 'SECURITY OPS' },
  { id: 'dept-3', name: 'SITE MANAGEMENT' }
];

const INITIAL_CHANNELS: Channel[] = [
  { id: 'ch-ai', name: 'AI DISPATCH', type: ChannelType.AI_ASSISTANT, members: 1, isSecure: true, departmentId: 'dept-1' },
  { id: 'ch-1', name: 'COMMAND NET', type: ChannelType.TEAM, members: 5, isSecure: true, departmentId: 'dept-1' },
  { id: 'ch-2', name: 'PATROL ALPHA', type: ChannelType.TEAM, members: 8, isSecure: true, departmentId: 'dept-2' },
  { id: 'ch-3', name: 'PATROL BRAVO', type: ChannelType.TEAM, members: 8, isSecure: true, departmentId: 'dept-2' },
  { id: 'ch-4', name: 'FACILITIES', type: ChannelType.TEAM, members: 4, isSecure: false, departmentId: 'dept-3' },
];

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Commander', isOnline: true, isTalking: false, channelId: 'ch-1' },
  { id: 'u2', name: 'Alpha Lead', isOnline: true, isTalking: false, channelId: 'ch-2' },
  { id: 'u3', name: 'Bravo Lead', isOnline: true, isTalking: false, channelId: 'ch-3' },
  { id: 'ai-1', name: 'Adroit AI', isOnline: true, isTalking: false, channelId: 'ch-ai' },
];

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<Account | null>(() => {
    const saved = localStorage.getItem('secure_ptt_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Initialize from LocalStorage if available
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('companyName') || "ADROIT GROUP");
  const [companyLogo, setCompanyLogo] = useState<string | null>(() => localStorage.getItem('companyLogo'));

  // State now defaults to empty arrays, populated by API or Fallback
  const [departments, setDepartments] = useState<Department[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [whitelist, setWhitelist] = useState<AllowedMember[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isCreateDepartmentOpen, setIsCreateDepartmentOpen] = useState(false);
  const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
  const [isAdminConsoleOpen, setIsAdminConsoleOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showIOSInstallPrompt, setShowIOSInstallPrompt] = useState(false);
  
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

  // Auth Handlers
  const handleLogin = (user: Account) => {
    setCurrentUser(user);
    localStorage.setItem('secure_ptt_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('secure_ptt_user');
    disconnectGemini();
  };

  // --- API INITIALIZATION WITH FALLBACK ---
  useEffect(() => {
    if (!currentUser) return; // Don't fetch if not logged in

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
        setLastLog("Adroit Secure Uplink: CONNECTED");
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
  }, [currentUser]);

  // Fetch whitelist when Admin Console opens
  useEffect(() => {
    if (isAdminConsoleOpen && currentUser?.role === 'ADMIN') {
        fetch('/api/admin/whitelist', { 
            headers: { 'x-admin-id': currentUser.id } 
        })
        .then(res => res.json())
        .then(data => setWhitelist(data))
        .catch(err => console.error("Failed to fetch whitelist", err));
    }
  }, [isAdminConsoleOpen, currentUser]);

  // Capture PWA Install Prompt & iOS Detection
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setLastLog("System Update Available: App Install Ready");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window as any).navigator.standalone;
    
    if (isIOS && !isStandalone) {
      setShowIOSInstallPrompt(true);
      // Auto-hide after 10s
      const timer = setTimeout(() => setShowIOSInstallPrompt(false), 10000);
      return () => clearTimeout(timer);
    }

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
        setLastLog("Installing SecurePTT App...");
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

    // process.env.API_KEY is replaced by Vite at build time via define config
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
        setPttState(PTTState.BUSY);
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

  const handleCreateChannel = async (name: string, isSecure: boolean, departmentId: string) => {
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
      isOnline: false,
      isTalking: false,
      channelId: channelId
    };

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
    setUsers(prev => prev.filter(u => u.id !== userId));
    setLastLog(`User Access Revoked: ID ${userId.slice(-4)}`);

    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    } catch (e) {
       console.warn("Backend update failed, running in offline mode");
    }
  };

  // ADMIN ACTION: Whitelist Authorization
  const handleAuthorizeMember = async (name: string, identifier: string) => {
    if (!currentUser) return;
    try {
        const res = await fetch('/api/admin/whitelist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adminId: currentUser.id,
                name,
                identifier
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        // Update local state if console is open
        setWhitelist(prev => [...prev, data.member]);
        setLastLog(`Admin: ${name} Authorized`);
    } catch (e: any) {
        setLastLog(`Command Rejected: ${e.message}`);
    }
  };

  const handleSettingsSave = (name: string, logo: string | null) => {
    setCompanyName(name);
    setCompanyLogo(logo);
    localStorage.setItem('companyName', name);
    if (logo) {
      localStorage.setItem('companyLogo', logo);
    } else {
      localStorage.removeItem('companyLogo');
    }
    setLastLog("System Configuration Updated");
  };

  const startTransmission = async () => {
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

  // --- AUTH CHECK ---
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];
  const activeDept = activeChannel ? departments.find(d => d.id === activeChannel.departmentId) : undefined;

  if (!activeChannel) {
    return (
      <div className="flex h-screen w-screen bg-ptt-dark items-center justify-center text-white flex-col gap-4 bg-tech-grid">
        <div className="w-12 h-12 border-4 border-ptt-accent border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm font-mono tracking-widest animate-pulse mt-4">ESTABLISHING SECURE CONNECTION...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-tech-grid overflow-hidden font-sans text-ptt-text selection:bg-ptt-accent selection:text-white">
      {/* Background Vignette & Scanlines */}
      <div className="absolute inset-0 z-0 pointer-events-none vignette" />
      <div className="absolute inset-0 z-0 pointer-events-none scanlines opacity-50" />

      {/* Sidebar Channel List */}
      <ChannelList 
        companyName={companyName}
        companyLogo={companyLogo}
        departments={departments}
        channels={channels}
        users={users} 
        activeChannelId={activeChannelId} 
        currentUser={currentUser}
        onSelectChannel={handleChannelSelect}
        isMobileMenuOpen={isMobileMenuOpen}
        onCreateChannel={() => setIsCreateChannelOpen(true)}
        onCreateDepartment={() => setIsCreateDepartmentOpen(true)}
        onManageUsers={() => currentUser.role === 'ADMIN' ? setIsAdminConsoleOpen(true) : setIsManageUsersOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10">
        
        {/* Header */}
        <header className="h-16 border-b border-ptt-border bg-ptt-panel/80 backdrop-blur-md flex items-center justify-between px-4 z-20 shadow-lg">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <Menu />
          </button>

          <div className="flex flex-col items-center md:items-start">
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-ptt-muted font-bold uppercase tracking-widest">{companyName} // {activeDept?.name || 'UNASSIGNED'}</span>
             </div>
             <h1 className="text-lg font-bold tracking-widest uppercase flex items-center gap-2 text-white">
                <Radio size={16} className="text-ptt-accent animate-pulse" />
                {activeChannel.name}
                {activeChannel.isSecure && (
                  <span className="bg-green-500/10 text-green-400 text-[9px] px-1.5 py-0.5 rounded border border-green-500/30 flex items-center gap-1">
                    AES-256
                  </span>
                )}
             </h1>
          </div>

          <div className="flex items-center gap-4">
             {/* Install App Button */}
             {installPrompt && (
              <button
                onClick={handleInstallApp}
                className="text-ptt-accent hover:text-blue-400 transition-colors animate-pulse mr-2 flex items-center gap-1 border border-ptt-accent/30 bg-ptt-accent/10 px-3 py-1.5 rounded-full"
                title="Install App"
              >
                <Download size={16} />
                <span className="text-xs font-bold hidden md:inline">INSTALL</span>
              </button>
            )}

            <button 
              onClick={() => setIsInviteOpen(true)}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
              title="Invite People"
            >
              <UserPlus size={20} />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-gray-400 hover:text-white transition-colors relative p-2 hover:bg-white/5 rounded-full"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Central Visualization Area */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-4">
          
          {/* iOS Install Prompt */}
          {showIOSInstallPrompt && (
            <div className="absolute top-4 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="bg-blue-600/90 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-blue-400/30 flex items-start gap-3">
                  <Share className="shrink-0 mt-0.5" size={20} />
                  <div>
                    <div className="font-bold text-sm">Install App</div>
                    <div className="text-xs opacity-90">Tap the Share button below and select <span className="font-bold">"Add to Home Screen"</span></div>
                  </div>
                  <button onClick={() => setShowIOSInstallPrompt(false)} className="ml-auto"><div className="text-xl">×</div></button>
               </div>
               <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-blue-600/90 mx-auto mt-[-1px]"></div>
            </div>
          )}

          {/* Audio Visualizer Overlay */}
          <div className="absolute top-12 left-0 right-0 h-32 px-8 flex items-center justify-center pointer-events-none">
             <div className="w-full max-w-3xl opacity-60">
                <Visualizer 
                    stream={mediaStreamRef.current} 
                    isActive={pttState === PTTState.TRANSMITTING || pttState === PTTState.RECEIVING || pttState === PTTState.BUSY} 
                    color={(pttState === PTTState.RECEIVING || pttState === PTTState.BUSY) ? '#f59e0b' : '#ef4444'}
                />
             </div>
          </div>

          {/* Connection Status Icons */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur rounded-full px-3 py-1 border border-white/5">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Uplink</span>
                {connectionState === ConnectionState.CONNECTED 
                ? <Wifi size={14} className="text-green-500" />
                : <WifiOff size={14} className="text-red-500" />
                }
            </div>
          </div>

          {/* PTT Button */}
          <div className="mt-8 relative z-10">
            <PTTButton 
              state={pttState} 
              onDown={startTransmission} 
              onUp={stopTransmission} 
              disabled={connectionState !== ConnectionState.CONNECTED && activeChannel.type === ChannelType.AI_ASSISTANT}
            />
          </div>

          {/* Transcription / Status Log */}
          <div className="absolute bottom-8 left-4 right-4 flex justify-center">
            <div className="w-full max-w-lg">
                <div className="bg-black/60 backdrop-blur-xl border border-gray-700/50 rounded-lg overflow-hidden shadow-2xl">
                    <div className="bg-gray-900/50 px-3 py-1 border-b border-gray-700/50 flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold font-mono">System Log</span>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="font-mono text-sm text-ptt-accent truncate animate-pulse">
                            {'>'} {lastLog}
                        </div>
                        {transcription && (
                            <div className="mt-2 text-xs text-white/90 font-mono border-t border-gray-700/50 pt-2 flex flex-col gap-1">
                                <span className="text-gray-500 text-[9px] uppercase">Audio Transcript</span>
                                <span>"{transcription}"</span>
                            </div>
                        )}
                    </div>
                </div>
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

      {/* Admin Console or Regular User Management */}
      <AdminConsole 
        isOpen={isAdminConsoleOpen}
        onClose={() => setIsAdminConsoleOpen(false)}
        currentUser={currentUser}
        users={users}
        whitelist={whitelist}
        onAuthorizeMember={handleAuthorizeMember}
        onDeleteUser={handleDeleteUser}
      />

      <ManageUsersModal 
        isOpen={isManageUsersOpen}
        onClose={() => setIsManageUsersOpen(false)}
        users={users}
        channels={channels}
        currentUser={currentUser}
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
        onAuthorizeMember={handleAuthorizeMember}
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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-10 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}