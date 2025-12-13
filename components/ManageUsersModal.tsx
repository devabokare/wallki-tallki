import React, { useState } from 'react';
import { X, UserCog, UserPlus, Trash2, Shield, User } from 'lucide-react';
import { User as UserType, Channel } from '../types';

interface ManageUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserType[];
  channels: Channel[];
  onAddUser: (name: string, channelId: string) => void;
  onDeleteUser: (userId: string) => void;
}

const ManageUsersModal: React.FC<ManageUsersModalProps> = ({ 
  isOpen, 
  onClose, 
  users, 
  channels, 
  onAddUser, 
  onDeleteUser 
}) => {
  const [newUserName, setNewUserName] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');

  // Set initial selected channel if available
  React.useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim() && selectedChannelId) {
      onAddUser(newUserName.trim(), selectedChannelId);
      setNewUserName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-ptt-panel border border-gray-700 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-black/20 shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCog size={18} className="text-ptt-accent" />
            PERSONNEL MANAGEMENT
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Add User Form */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <UserPlus size={14} /> Register New Unit
            </h4>
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Unit Callsign / Name"
                className="bg-gray-900 border border-gray-600 text-white text-sm rounded px-3 py-2.5 focus:outline-none focus:border-ptt-accent font-mono"
              />
              <div className="flex gap-2">
                <select
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-600 text-white text-sm rounded px-3 py-2.5 focus:outline-none focus:border-ptt-accent font-mono"
                >
                  {channels.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!newUserName.trim() || !selectedChannelId}
                  className="px-4 bg-ptt-accent hover:bg-blue-600 disabled:opacity-50 text-white rounded font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          </div>

          {/* User List */}
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield size={14} /> Active Personnel ({users.length})
          </h4>
          
          <div className="space-y-2">
            {users.length === 0 ? (
              <div className="text-center text-gray-600 italic text-sm py-4">No personnel registered.</div>
            ) : (
              users.map(user => {
                const assignedChannel = channels.find(c => c.id === user.channelId);
                return (
                  <div key={user.id} className="flex items-center justify-between bg-gray-900/40 border border-gray-800 p-3 rounded hover:bg-gray-800/60 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-gray-500">
                        <User size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-200 font-mono">{user.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Freq: <span className="text-blue-400">{assignedChannel?.name || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-900/20 rounded transition-colors opacity-50 group-hover:opacity-100"
                      title="Revoke Access"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50 text-[10px] text-gray-500 font-mono text-center">
          SYSTEM_ADMIN_ACCESS_LEVEL_5
        </div>
      </div>
    </div>
  );
};

export default ManageUsersModal;
