import React, { useState } from 'react';
import { X, Building2, CheckCircle2 } from 'lucide-react';

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

const CreateDepartmentModal: React.FC<CreateDepartmentModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name);
      setName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-ptt-panel border border-gray-700 w-full max-w-md rounded-lg shadow-2xl overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-black/20">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 size={18} className="text-ptt-accent" />
            NEW DEPARTMENT
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Department Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. LOGISTICS"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded px-4 py-3 focus:outline-none focus:border-ptt-accent font-mono transition-colors"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-3 rounded bg-ptt-accent hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDepartmentModal;