import React, { useState, useEffect } from 'react';
import { Copy, Check, X, ShieldAlert, Radio, Share2 } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  isSecure: boolean;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, channelName, isSecure }) => {
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [canShare, setCanShare] = useState(false);

  // Check for native share support
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  // Generate code when modal opens
  useEffect(() => {
    if (isOpen) {
      const code = `FREQ-${Math.floor(Math.random() * 9000) + 1000}-${isSecure ? 'ENC' : 'CLR'}`;
      setInviteCode(code);
    }
  }, [isOpen, isSecure]);

  if (!isOpen) return null;

  const inviteLink = `https://secureptt.app/join/${inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Join me on SecurePTT Channel: ${channelName}\nFrequency: ${inviteCode}\nLink: ${inviteLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'SecurePTT Invite',
        text: `Join me on SecurePTT Channel: ${channelName}\nFrequency: ${inviteCode}`,
        url: inviteLink,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-ptt-panel border border-gray-700 w-full max-w-md rounded-lg shadow-2xl overflow-hidden relative transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-black/20">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio size={18} className="text-ptt-accent" />
            INVITE OPERATOR
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-400 text-sm mb-6">
            Share this secure frequency key to invite personnel to <span className="text-white font-mono font-bold">{channelName}</span>.
          </p>

          {/* Code Display */}
          <div className="bg-black/50 border border-gray-800 rounded p-4 mb-4 relative overflow-hidden group">
            {/* Security Indicator with Tooltip */}
            <div className="absolute top-2 right-2 z-10">
              {isSecure && (
                <div className="group/tooltip relative">
                  <ShieldAlert size={16} className="text-green-500 opacity-60 hover:opacity-100 transition-opacity cursor-help" />
                  <div className="absolute right-0 top-full mt-2 w-max opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 bg-black/90 border border-green-900/50 backdrop-blur text-[10px] font-mono text-gray-300 px-2 py-1 rounded shadow-xl pointer-events-none select-none z-20 translate-y-1 group-hover/tooltip:translate-y-0 transform ease-out">
                    <span className="text-green-400 font-bold">AES-256</span> ENCRYPTION ACTIVE
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Secure Frequency Key</div>
            <div className="font-mono text-2xl text-ptt-accent tracking-wider font-bold drop-shadow-lg">
              {inviteCode}
            </div>
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent translate-y-[-100%] animate-[shimmer_2s_infinite] pointer-events-none" />
          </div>

          {/* Link Input & Actions */}
          <div className="space-y-3">
            <div className="relative">
              <input 
                type="text" 
                readOnly 
                value={inviteLink}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded px-3 py-2.5 focus:outline-none focus:border-ptt-accent font-mono transition-colors"
              />
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleCopy}
                className={`
                  flex-1 px-4 py-2.5 rounded flex items-center justify-center gap-2 transition-all duration-200 font-bold text-xs uppercase tracking-wider
                  ${copied ? 'bg-green-600 text-white' : 'bg-ptt-accent hover:bg-blue-600 text-white'}
                `}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
              
              {canShare && (
                <button 
                  onClick={handleShare}
                  className="px-4 py-2.5 rounded flex items-center justify-center gap-2 transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs uppercase tracking-wider"
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 text-[10px] text-gray-600 text-center font-mono">
            // AUTHORIZED ACCESS ONLY // ENCRYPTION: AES-256 //
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;