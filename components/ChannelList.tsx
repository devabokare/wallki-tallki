import React from 'react';
import { Channel, ChannelType } from '../types';
import { Lock, Radio, Bot, Users } from 'lucide-react';

interface ChannelListProps {
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  isMobileMenuOpen: boolean;
}

const ChannelList: React.FC<ChannelListProps> = ({ 
  channels, 
  activeChannelId, 
  onSelectChannel,
  isMobileMenuOpen
}) => {
  return (
    <div className={`
      fixed inset-y-0 left-0 z-20 w-64 bg-ptt-panel border-r border-gray-800 transform transition-transform duration-300 ease-in-out
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0
    `}>
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold tracking-wider text-white flex items-center gap-2">
          <Radio className="text-ptt-accent" />
          SECURE PTT
        </h2>
        <div className="mt-2 text-xs text-gray-500 font-mono">v1.0.4 • ENCRYPTED</div>
      </div>

      <div className="p-4 space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
          Available Channels
        </div>
        
        {channels.map(channel => (
          <button
            key={channel.id}
            onClick={() => onSelectChannel(channel.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${activeChannelId === channel.id 
                ? 'bg-ptt-accent text-white shadow-lg shadow-blue-900/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
            `}
          >
            {channel.type === ChannelType.AI_ASSISTANT ? (
              <Bot size={18} className={activeChannelId === channel.id ? 'text-white' : 'text-purple-400'} />
            ) : channel.isSecure ? (
              <Lock size={18} className={activeChannelId === channel.id ? 'text-white' : 'text-green-500'} />
            ) : (
              <Users size={18} />
            )}
            
            <div className="flex-1 text-left">
              <div className="flex justify-between items-center">
                <span>{channel.name}</span>
                {activeChannelId !== channel.id && (
                  <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">
                    {channel.members}
                  </span>
                )}
              </div>
            </div>
            
            {activeChannelId === channel.id && (
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-ptt-panel">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
            ME
          </div>
          <div>
            <div className="text-sm font-medium text-white">Operator 1</div>
            <div className="text-xs text-green-500 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Online
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelList;