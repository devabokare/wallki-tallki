import React, { useState } from 'react';
import { Shield, Users, FileCheck, X, Plus, Trash2, Search, UserCheck, AlertTriangle } from 'lucide-react';
import { User, AllowedMember, Account } from '../types';

interface AdminConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Account;
  users: User[]; // Registered users
  whitelist: AllowedMember[]; // Allowed IDs
  onAuthorizeMember: (name: string, identifier: string) => void;
  onDeleteUser: (userId: string) => void;
}

const AdminConsole: React.FC<AdminConsoleProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  whitelist,
  onAuthorizeMember,
  onDeleteUser
}) => {
  const [activeTab, setActiveTab] = useState<'whitelist' | 'roster'>('whitelist');
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName && newId) {
      onAuthorizeMember(newName, newId);
      setNewName('');
      setNewId('');
    }
  };

  const filteredWhitelist = whitelist.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.email && m.email.includes(searchTerm)) || 
    (m.phone && m.phone.includes(searchTerm))
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black text-white font-mono flex flex-col animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="h-16 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-900/20 border border-red-500 rounded flex items-center justify-center text-red-500">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-white">ADROIT GROUP // COMMAND CONSOLE</h1>
            <div className="text-[10px] text-red-500 uppercase font-bold tracking-[0.2em] animate-pulse">
               Admin Clearance Verified: {currentUser.callsign}
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded border border-gray-700 flex items-center gap-2 uppercase text-xs font-bold tracking-wider transition-colors"
        >
          <X size={16} /> Close Console
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-64 bg-black border-r border-gray-800 p-4 flex flex-col gap-2">
           <div className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-2">Modules</div>
           <button 
              onClick={() => setActiveTab('whitelist')}
              className={`flex items-center gap-3 px-4 py-3 rounded border transition-all text-left ${activeTab === 'whitelist' ? 'bg-red-900/20 border-red-500/50 text-white' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-900 hover:text-gray-300'}`}
           >
              <FileCheck size={18} />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">Manifest</div>
                <div className="text-[9px] opacity-60">Authorize Personnel</div>
              </div>
           </button>

           <button 
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-3 px-4 py-3 rounded border transition-all text-left ${activeTab === 'roster' ? 'bg-blue-900/20 border-blue-500/50 text-white' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-900 hover:text-gray-300'}`}
           >
              <Users size={18} />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">Active Roster</div>
                <div className="text-[9px] opacity-60">Manage Users</div>
              </div>
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gray-900/50 p-8 overflow-y-auto">
          
          <div className="max-w-5xl mx-auto">
            {/* Search Bar */}
            <div className="mb-6 flex gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-3 text-gray-600" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search personnel DB..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded py-2.5 pl-12 pr-4 text-sm focus:border-red-500 outline-none transition-colors"
                  />
               </div>
            </div>

            {activeTab === 'whitelist' && (
              <div className="space-y-6">
                
                {/* Authorization Form */}
                <div className="bg-black border border-gray-800 rounded p-6">
                   <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <Plus size={16} /> Authorize New Entry
                   </h3>
                   <form onSubmit={handleAuthorize} className="flex gap-4 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Full Name</label>
                        <input 
                           type="text" 
                           value={newName}
                           onChange={(e) => setNewName(e.target.value)}
                           className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-red-500 outline-none"
                           placeholder="e.g. Lt. John Doe"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">ID (Email or Mobile)</label>
                        <input 
                           type="text" 
                           value={newId}
                           onChange={(e) => setNewId(e.target.value)}
                           className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-red-500 outline-none"
                           placeholder="e.g. john@adroit.com"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={!newName || !newId}
                        className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-wider h-[38px] transition-colors"
                      >
                        Authorize
                      </button>
                   </form>
                </div>

                {/* List */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Authorized Personnel ({filteredWhitelist.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {filteredWhitelist.map(member => (
                       <div key={member.id} className="bg-black border border-gray-800 p-4 rounded flex items-center justify-between group hover:border-gray-600 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center text-gray-500">
                                <FileCheck size={16} />
                             </div>
                             <div>
                                <div className="text-sm font-bold text-gray-300">{member.name}</div>
                                <div className="text-xs text-gray-600 font-mono">{member.email || member.phone}</div>
                             </div>
                          </div>
                          <div className="px-2 py-1 bg-green-900/20 text-green-500 text-[10px] font-bold uppercase rounded border border-green-900/50">
                             Cleared
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'roster' && (
              <div className="space-y-6">
                 <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Registered Units ({filteredUsers.length})</h3>
                  <div className="bg-black border border-gray-800 rounded overflow-hidden">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                           <tr>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3">Unit Name</th>
                              <th className="px-6 py-3">Channel ID</th>
                              <th className="px-6 py-3 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                           {filteredUsers.map(user => (
                              <tr key={user.id} className="hover:bg-gray-900/50 transition-colors">
                                 <td className="px-6 py-4">
                                    <div className={`flex items-center gap-2 text-xs font-bold ${user.isOnline ? 'text-green-500' : 'text-gray-600'}`}>
                                       <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                                       {user.isOnline ? 'ONLINE' : 'OFFLINE'}
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 font-mono text-gray-300">
                                    {user.name}
                                 </td>
                                 <td className="px-6 py-4 font-mono text-gray-500">
                                    {user.channelId}
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <button 
                                      onClick={() => onDeleteUser(user.id)}
                                      className="text-gray-600 hover:text-red-500 transition-colors"
                                      title="Revoke Access"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                           {filteredUsers.length === 0 && (
                             <tr>
                               <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No units found matching criteria.</td>
                             </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConsole;