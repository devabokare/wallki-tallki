import React from 'react';
import { Channel, ChannelType, User, Department } from '../types';
import { Lock, Radio, Bot, Users as UsersIcon, Circle, Mic, Plus, Building2, ChevronDown, Signal, SignalLow, SignalZero } from 'lucide-react';

interface ChannelListProps {
  companyName: string;
  companyLogo: string | null;
  departments: Department[];
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  isMobileMenuOpen: boolean;
  onCreateChannel: () => void;
  onCreateDepartment: () => void;
}

// Mock users data for demonstration
const MOCK_CHANNEL_USERS: Record<string, User[]> = {
  'ch-1': [
    { id: 'u1', name: 'Alpha Lead', isOnline: true, isTalking: false },
    { id: 'u2', name: 'Operator 2', isOnline: true, isTalking: true }, // Set one to talking for demo
    { id: 'u3', name: 'Operator 3', isOnline: true, isTalking: false },
    { id: 'u4', name: 'Scout 1', isOnline: false, isTalking: false },
    { id: 'u5', name: 'Scout 2', isOnline: false, isTalking: false },
  ],
  'ch-2': [
    { id: 'u6', name: 'Sec Lead', isOnline: true, isTalking: false },
    { id: 'u7', name: 'Gate 1', isOnline: true, isTalking: false },
    { id: 'u8', name: 'Rover', isOnline: true, isTalking: false },
  ],
  'ch-3': [
    { id: 'u9', name: 'Dispatch', isOnline: true, isTalking: false },
    { id: 'u10', name: 'Driver 1', isOnline: false, isTalking: false },
    { id: 'u11', name: 'Driver 2', isOnline: false, isTalking: false },
    { id: 'u12', name: 'Whse Mgr', isOnline: true, isTalking: false },
  ],
  'ch-ai': [
    { id: 'ai-1', name: 'AI Command', isOnline: true, isTalking: false },
  ]
};

const ChannelList: React.FC<ChannelListProps> = ({ 
  companyName,
  companyLogo,
  departments,
  channels, 
  activeChannelId, 
  onSelectChannel,
  isMobileMenuOpen,
  onCreateChannel,
  onCreateDepartment
}) => {
  return (
    <div className={`
      fixed inset-y-0 left-0 z-20 w-72 bg-ptt-panel border-r border-gray-800 transform transition-transform duration-300 ease-in-out flex flex-col
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0
    `}>
      {/* Sidebar Header: Company Info */}
      <div className="p-6 border-b border-gray-800 shrink-0 bg-black/20">
        <h2 className="text-xl font-bold tracking-wider text-white flex items-center gap-3">
          {companyLogo ? (
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center overflow-hidden shrink-0">
               <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <Building2 className="text-ptt-accent shrink-0" size={24} />
          )}
          <span className="truncate">{companyName}</span>
        </h2>
        <div className="mt-2 text-xs text-gray-500 font-mono flex justify-between items-center">
          <span>SECURE UPLINK EST.</span>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        </div>
      </div>

      {/* Global Actions */}
      <div className="px-4 py-3 flex gap-2 border-b border-gray-800/50">
        <button 
          onClick={onCreateDepartment}
          className="flex-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded transition-colors"
        >
          <Plus size={12} /> Add Dept
        </button>
        <button 
          onClick={onCreateChannel}
          className="flex-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase bg-ptt-accent hover:bg-blue-600 text-white py-2 rounded transition-colors"
        >
          <Radio size={12} /> Add Freq
        </button>
      </div>

      {/* Channel List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        
        {departments.map(dept => {
          const deptChannels = channels.filter(c => c.departmentId === dept.id);
          if (deptChannels.length === 0) return null;

          return (
            <div key={dept.id}>
              {/* Department Header */}
              <div className="flex items-center gap-2 px-2 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest group cursor-default">
                <ChevronDown size={12} />
                {dept.name}
              </div>

              {/* Channels in Department */}
              <div className="space-y-1">
                {deptChannels.map(channel => {
                  const isActive = activeChannelId === channel.id;
                  const users = MOCK_CHANNEL_USERS[channel.id] || [];
                  
                  return (
                    <div key={channel.id} className="flex flex-col gap-1">
                      <button
                        onClick={() => onSelectChannel(channel.id)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group relative overflow-hidden
                          ${isActive 
                            ? 'bg-gray-800 text-white border-l-2 border-ptt-accent' 
                            : 'bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-white border-l-2 border-transparent'}
                        `}
                      >
                        {/* Channel Icon */}
                        <div className="shrink-0">
                          {channel.type === ChannelType.AI_ASSISTANT ? (
                            <Bot size={16} className={isActive ? 'text-white' : 'text-purple-400'} />
                          ) : channel.isSecure ? (
                            <Lock size={16} className={isActive ? 'text-white' : 'text-green-500'} />
                          ) : (
                            <UsersIcon size={16} className={isActive ? 'text-white' : 'text-gray-500'} />
                          )}
                        </div>
                        
                        {/* Channel Name */}
                        <div className="flex-1 text-left truncate font-mono text-xs">
                          {channel.name}
                        </div>
                        
                        {/* Member Count */}
                        {isActive && (
                           <div className="w-1.5 h-1.5 rounded-full bg-ptt-accent shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                        )}
                      </button>

                      {/* Active Channel User List */}
                      {isActive && (
                        <div className="ml-8 pr-2 space-y-0.5 py-1 animate-in slide-in-from-left-2 duration-200 border-l border-gray-800 pl-2">
                          {users.map(user => (
                            <div key={user.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-white/5 transition-colors group/user">
                              <div className="flex items-center gap-2 overflow-hidden">
                                {/* Status Dot */}
                                <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-gray-700 border border-gray-600'} shrink-0 transition-colors`} />
                                
                                {/* Name */}
                                <span className={`text-[10px] font-mono truncate transition-colors ${user.isOnline ? 'text-gray-300 group-hover/user:text-white' : 'text-gray-600'}`}>
                                  {user.name}
                                </span>
                              </div>

                              {/* Status Indicators */}
                              <div className="flex items-center gap-2">
                                {user.isTalking ? (
                                   <div className="flex items-center gap-1 text-[9px] font-bold text-red-500 animate-pulse uppercase tracking-wider">
                                     <Mic size={10} className="fill-current" />
                                     <span>TX</span>
                                   </div>
                                ) : user.isOnline ? (
                                  <div className="flex items-center gap-1" title="Signal Good">
                                     <Signal size={10} className="text-green-500/40" />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1" title="Offline">
                                     <SignalZero size={10} className="text-gray-700" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-800 bg-ptt-panel shrink-0">
        <div className="flex items-center gap-3 bg-gray-800/50 p-2 rounded-lg border border-gray-700/50">
          <div className="w-8 h-8 rounded bg-ptt-accent flex items-center justify-center text-xs font-bold text-white shadow-lg">
            OP
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-white truncate">Operator 1</div>
            <div className="text-[10px] text-green-500 flex items-center gap-1 font-mono uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online • Ready
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelList;