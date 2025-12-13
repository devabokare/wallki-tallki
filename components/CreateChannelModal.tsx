import React, { useState, useEffect } from 'react';
import { X, Radio, Lock, Unlock, Hash, Activity, Folder } from 'lucide-react';
import { Department } from '../types';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, isSecure: boolean, departmentId: string) => void;
  departments: Department[];
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ isOpen, onClose, onCreate, departments }) => {
  const [name, setName] = useState('');
  const [isSecure, setIsSecure] = useState(true);
  const [departmentId, setDepartmentId] = useState('');

  // Set default department when opening
  useEffect(() => {
    if (isOpen && departments.length > 0 && !departmentId) {
      setDepartmentId(departments[0].id);
    }
  }, [isOpen, departments]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && departmentId) {
      onCreate(name, isSecure, departmentId);
      setName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-ptt-panel border border-gray-700 w-full max-w-md rounded-lg shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-black/20">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio size={18} className="text-ptt-accent" />
            INITIALIZE FREQUENCY
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Department Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Folder size={12} /> Assign to Department
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded px-4 py-3 focus:outline-none focus:border-ptt-accent font-mono appearance-none"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Hash size={12} /> Channel Designator
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ALPHA SQUAD"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded px-4 py-3 focus:outline-none focus:border-ptt-accent font-mono transition-colors placeholder-gray-600"
              autoFocus
            />
          </div>

          {/* Security Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Encryption Protocol</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsSecure(true)}
                className={`flex items-center justify-center gap-2 p-3 rounded border transition-all ${
                  isSecure 
                    ? 'bg-green-900/20 border-green-500/50 text-green-400' 
                    : 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-gray-700'
                }`}
              >
                <Lock size={16} />
                <span className="text-xs font-bold">SECURE (AES)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSecure(false)}
                className={`flex items-center justify-center gap-2 p-3 rounded border transition-all ${
                  !isSecure 
                    ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' 
                    : 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-gray-700'
                }`}
              >
                <Unlock size={16} />
                <span className="text-xs font-bold">OPEN LINE</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Abort
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !departmentId}
              className="flex-1 px-4 py-3 rounded bg-ptt-accent hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              <Activity size={16} />
              Establish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;