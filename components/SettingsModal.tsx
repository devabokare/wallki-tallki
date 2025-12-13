import React, { useState, useRef, useEffect } from 'react';
import { X, Settings, Upload, Save, Image as ImageIcon, Trash2, Download, Smartphone, Monitor, Activity, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentLogo: string | null;
  currentCodec: string;
  currentBitrate: string;
  onSave: (name: string, logo: string | null, codec: string, bitrate: string) => void;
  installPrompt?: any;
  onInstall?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentName, 
  currentLogo, 
  currentCodec = 'opus',
  currentBitrate = '32000',
  onSave, 
  installPrompt,
  onInstall 
}) => {
  const [name, setName] = useState(currentName);
  const [logo, setLogo] = useState<string | null>(currentLogo);
  const [codec, setCodec] = useState(currentCodec);
  const [bitrate, setBitrate] = useState(currentBitrate);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setLogo(currentLogo);
      setCodec(currentCodec);
      setBitrate(currentBitrate);
    }
  }, [isOpen, currentName, currentLogo, currentCodec, currentBitrate]);

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
    onSave(name, logo, codec, bitrate);
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
          
          {/* PWA Install */}
          {installPrompt && (
            <div className="bg-gradient-to-r from-blue-900/20 to-transparent border border-blue-900/50 rounded p-4 mb-2">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Download size={14} /> Web Application
              </h4>
              <p className="text-gray-400 text-xs mb-3">
                Install as a PWA for quick access.
              </p>
              <button
                onClick={onInstall}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-lg"
              >
                Add to Home Screen
              </button>
            </div>
          )}

          {/* Native Downloads */}
          <div className="bg-gray-900/50 border border-gray-700 rounded p-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Download size={14} /> Native Client Downloads
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <a 
                href="/downloads/secure-ptt.apk" 
                download
                className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-ptt-accent rounded transition-all text-center group"
              >
                <Smartphone size={20} className="text-gray-400 group-hover:text-green-400" />
                <span className="text-[10px] font-bold text-gray-300 group-hover:text-white">ANDROID (.APK)</span>
              </a>
              <a 
                href="/downloads/secure-ptt-setup.exe" 
                download
                className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-ptt-accent rounded transition-all text-center group"
              >
                <Monitor size={20} className="text-gray-400 group-hover:text-blue-400" />
                <span className="text-[10px] font-bold text-gray-300 group-hover:text-white">WINDOWS (.EXE)</span>
              </a>
            </div>
          </div>

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

            {/* Audio Configuration */}
            <div className="bg-gray-900/50 border border-gray-700 rounded p-4 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity size={14} /> Audio Transmission Profile
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                    {/* Codec Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Codec</label>
                        <select 
                            value={codec} 
                            onChange={(e) => setCodec(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-ptt-accent font-mono"
                        >
                            <option value="opus">Opus (Recommended)</option>
                            <option value="aac">AAC-LC</option>
                            <option value="pcm">G.711 PCM (Uncompressed)</option>
                        </select>
                    </div>

                    {/* Bitrate Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Bitrate</label>
                        <select 
                            value={bitrate} 
                            onChange={(e) => setBitrate(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-ptt-accent font-mono"
                        >
                            <option value="16000">16 kbps (Low Latency)</option>
                            <option value="32000">32 kbps (Standard)</option>
                            <option value="64000">64 kbps (High Fidelity)</option>
                            <option value="128000">128 kbps (Studio)</option>
                        </select>
                    </div>
                </div>
                
                <div className="text-[9px] text-gray-500 font-mono flex items-center gap-1">
                    <Cpu size={10} />
                    <span>Fallback to OPUS active if selected codec unavailable.</span>
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