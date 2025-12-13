import React from 'react';
import { Channel, ChannelType, User, Department, Account } from '../types';
import { Lock, Radio, Bot, Users as UsersIcon, Mic, Plus, Building2, ChevronDown, Signal, SignalZero, UserCog, Power, Shield } from 'lucide-react';

interface ChannelListProps {
  companyName: string;
  companyLogo: string | null;
  departments: Department[];
  channels: Channel[];
  users: User[];
  activeChannelId: string;
  currentUser: Account;
  onSelectChannel: (id: string) => void;
  isMobileMenuOpen: boolean;
  onCreateChannel: () => void;
  onCreateDepartment: () => void;
  onManageUsers: () => void;
  onLogout: () => void;
}

const ChannelList: React.FC<ChannelListProps> = ({ 
  companyName,
  companyLogo,
  departments,
  channels,
  users,
  activeChannelId, 
  currentUser,
  onSelectChannel,
  isMobileMenuOpen,
  onCreateChannel,
  onCreateDepartment,
  onManageUsers,
  onLogout
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className={`
      fixed inset-y-0 left-0 z-20 w-72 
      bg-ptt-panel/95 backdrop-blur-xl border-r border-ptt-border
      transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0
    `}>
      {/* Sidebar Header: Company Info */}
      <div className="p-6 border-b border-ptt-border shrink-0 bg-gradient-to-b from-white/5 to-transparent">
        <h2 className="text-xl font-bold tracking-wider text-white flex items-center gap-3">
          {companyLogo ? (
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-glow">
               <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded bg-ptt-accent flex items-center justify-center shrink-0 shadow-glow">
               <Building2 className="text-white" size={18} />
            </div>
          )}
          <span className="truncate font-mono text-sm">{companyName}</span>
        </h2>
        <div className="mt-2 text-[10px] text-ptt-muted font-mono flex justify-between items-center bg-black/20 px-2 py-1 rounded">
          <span>SECURE UPLINK EST.</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#22c55e]"></span>
        </div>
      </div>

      {/* Global Actions */}
      <div className="px-3 py-4 flex gap-2 border-b border-ptt-border">
        <button 
          onClick={onCreateDepartment}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white py-2 rounded transition-all border border-transparent hover:border-gray-600"
          title="Add Department"
        >
          <Plus size={14} /> Dept
        </button>
        <button 
          onClick={onCreateChannel}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white py-2 rounded transition-all border border-transparent hover:border-gray-600"
          title="Add Frequency"
        >
          <Radio size={14} /> Freq
        </button>
        
        <button 
          onClick={onManageUsers}
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase py-2 rounded transition-all border ${isAdmin ? 'bg-red-900/20 hover:bg-red-800 text-red-400 hover:text-white border-red-900/50' : 'bg-ptt-accent/10 hover:bg-ptt-accent text-ptt-accent hover:text-white border-ptt-accent/30 hover:border-ptt-accent'}`}
          title={isAdmin ? "Command Console" : "Manage Users"}
        >
          {isAdmin ? <Shield size={14} /> : <UserCog size={14} />} 
          {isAdmin ? 'Admin' : 'Users'}
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
              <div className="flex items-center gap-2 px-2 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest group cursor-default">
                <ChevronDown size={10} />
                {dept.name}
              </div>

              {/* Channels in Department */}
              <div className="space-y-1">
                {deptChannels.map(channel => {
                  const isActive = activeChannelId === channel.id;
                  const channelUsers = users.filter(u => u.channelId === channel.id);
                  
                  return (
                    <div key={channel.id} className="flex flex-col gap-1">
                      <button
                        onClick={() => onSelectChannel(channel.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-all group relative overflow-hidden border
                          ${isActive 
                            ? 'bg-ptt-accent/10 text-white border-ptt-accent/50 shadow-glow' 
                            : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white border-transparent'}
                        `}
                      >
                        {/* Channel Icon */}
                        <div className="shrink-0 relative">
                          {channel.type === ChannelType.AI_ASSISTANT ? (
                            <Bot size={18} className={isActive ? 'text-purple-400' : 'text-gray-600 group-hover:text-purple-400 transition-colors'} />
                          ) : channel.isSecure ? (
                            <Lock size={16} className={isActive ? 'text-green-400' : 'text-gray-600 group-hover:text-green-400 transition-colors'} />
                          ) : (
                            <UsersIcon size={16} className={isActive ? 'text-blue-400' : 'text-gray-600 group-hover:text-blue-400 transition-colors'} />
                          )}
                        </div>
                        
                        {/* Channel Name */}
                        <div className="flex-1 text-left truncate font-mono text-xs tracking-wide">
                          {channel.name}
                        </div>
                        
                        {/* Active Indicator */}
                        {isActive && (
                           <div className="w-1.5 h-1.5 rounded-full bg-ptt-accent shadow-[0_0_8px_rgba(59,130,246,1)]" />
                        )}
                      </button>

                      {/* Active Channel User List */}
                      {isActive && (
                        <div className="ml-4 pl-3 space-y-0.5 py-1 border-l border-gray-700/50">
                          {channelUsers.length > 0 ? (
                            channelUsers.map(user => (
                              <div key={user.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-white/5 transition-colors group/user">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {/* Status Dot */}
                                  <div className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-gray-700'} shrink-0`} />
                                  
                                  {/* Name */}
                                  <span className={`text-[11px] font-mono truncate transition-colors ${user.isOnline ? 'text-gray-300 group-hover/user:text-white' : 'text-gray-600'}`}>
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
                            ))
                          ) : (
                            <div className="text-[10px] text-gray-600 px-2 py-1 italic">No active units</div>
                          )}
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
      <div className="p-4 border-t border-ptt-border bg-black/20 shrink-0">
        <div className="flex items-center justify-between bg-gray-800/30 p-2 rounded-lg border border-gray-700/30">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-ptt-accent/20 border border-ptt-accent/50 flex items-center justify-center text-xs font-bold text-ptt-accent shadow-lg shrink-0">
              {currentUser.callsign.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-white truncate font-mono">{currentUser.callsign}</div>
              <div className="text-[10px] text-green-500 flex items-center gap-1 font-mono uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Online
              </div>
            </div>
          </div>
          <button 
            onClick={onLogout} 
            className="text-gray-500 hover:text-red-400 transition-colors p-1" 
            title="Disconnect"
          >
            <Power size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelList;