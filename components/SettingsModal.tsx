import React, { useState, useRef, useEffect } from 'react';
import { X, Settings, Upload, Save, Image as ImageIcon, Trash2, Download } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentLogo: string | null;
  onSave: (name: string, logo: string | null) => void;
  installPrompt?: any;
  onInstall?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentName, 
  currentLogo, 
  onSave, 
  installPrompt,
  onInstall 
}) => {
  const [name, setName] = useState(currentName);
  const [logo, setLogo] = useState<string | null>(currentLogo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setLogo(currentLogo);
    }
  }, [isOpen, currentName, currentLogo]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name, logo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-ptt-panel border border-gray-700 w-full max-w-md rounded-lg shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-black/20">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings size={18} className="text-ptt-accent" />
            SYSTEM CONFIGURATION
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6">
          
          {/* Install Application Section - Only shows if supported */}
          {installPrompt && (
            <div className="bg-gradient-to-r from-blue-900/20 to-transparent border border-blue-900/50 rounded p-4 mb-4">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Download size={14} /> Desktop / Mobile App
              </h4>
              <p className="text-gray-400 text-xs mb-3">
                Install this frequency terminal as a native application for better performance and easier access.
              </p>
              <button
                onClick={onInstall}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-lg"
              >
                Install to Device
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Logo Upload Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={12} /> Organization Logo
              </label>
              
              <div className="flex items-center gap-4 p-4 border border-gray-800 rounded bg-gray-900/50">
                {/* Preview */}
                <div className="w-16 h-16 rounded bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {logo ? (
                    <img src={logo} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="text-gray-600" />
                  )}
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-2 flex-1">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs text-gray-300 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Upload size={14} /> Upload Image
                  </button>
                  
                  {logo && (
                    <button 
                      type="button"
                      onClick={() => setLogo(null)}
                      className="px-3 py-1 bg-transparent hover:bg-red-900/30 text-red-500 hover:text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors self-start"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Company Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company Designator</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. VANGUARD CORP"
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded px-4 py-3 focus:outline-none focus:border-ptt-accent font-mono transition-colors uppercase"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 rounded bg-ptt-accent hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save Config
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;