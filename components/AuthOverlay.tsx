import React, { useState, useEffect } from 'react';
import { Shield, Lock, Cpu, Fingerprint, CheckCircle2, Globe } from 'lucide-react';
import { generateDID } from '../services/securityService';

interface AuthOverlayProps {
  onAuthenticated: (did: string) => void;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ onAuthenticated }) => {
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'VERIFYING' | 'GRANTED'>('IDLE');
  const [did, setDid] = useState<string | null>(null);

  const handleConnect = () => {
    setStatus('CONNECTING');
    
    // Simulate Blockchain Connection Handshake
    setTimeout(() => {
      const newDid = generateDID();
      setDid(newDid);
      setStatus('VERIFYING');
      
      // Simulate Identity Verification
      setTimeout(() => {
        setStatus('GRANTED');
        setTimeout(() => {
          onAuthenticated(newDid);
        }, 800);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-india-saffron to-transparent opacity-50"></div>
         <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-india-green to-transparent opacity-50"></div>
         {/* Cyber grid bg */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.9)_2px,transparent_2px),linear-gradient(90deg,rgba(15,23,42,0.9)_2px,transparent_2px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Animated Glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-india-saffron via-white to-india-green animate-[scan_3s_ease-in-out_infinite]"></div>
          
          <div className="flex flex-col items-center text-center space-y-6">
            
            <div className="relative">
               <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
               <div className="w-20 h-20 bg-slate-900 rounded-full border border-slate-700 flex items-center justify-center relative z-10 shadow-inner">
                  {status === 'IDLE' && <Shield className="w-10 h-10 text-slate-400" />}
                  {status === 'CONNECTING' && <Cpu className="w-10 h-10 text-india-saffron animate-spin" />}
                  {status === 'VERIFYING' && <Fingerprint className="w-10 h-10 text-blue-400 animate-pulse" />}
                  {status === 'GRANTED' && <CheckCircle2 className="w-10 h-10 text-india-green" />}
               </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">RoadGuard Secure Access</h2>
              <p className="text-slate-400 text-sm">
                Blockchain-Enabled Infrastructure Audit Protocol
              </p>
            </div>

            {status === 'IDLE' && (
              <button 
                onClick={handleConnect}
                className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 group"
              >
                <Lock className="w-5 h-5 text-india-navy group-hover:scale-110 transition-transform" />
                <span>Connect via Secure ID</span>
              </button>
            )}

            {status !== 'IDLE' && (
              <div className="w-full bg-slate-900/50 rounded-lg p-4 border border-white/5 font-mono text-xs text-left space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>Status:</span>
                  <span className={`font-bold ${
                    status === 'CONNECTING' ? 'text-yellow-500' :
                    status === 'VERIFYING' ? 'text-blue-500' : 'text-green-500'
                  }`}>{status}</span>
                </div>
                {did && (
                  <div className="flex justify-between text-slate-500 animate-in fade-in slide-in-from-bottom-2">
                    <span>Identity:</span>
                    <span className="text-slate-300 truncate max-w-[150px]">{did}</span>
                  </div>
                )}
                <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden mt-2">
                   <div className={`h-full bg-blue-500 transition-all duration-1000 ${
                     status === 'CONNECTING' ? 'w-1/3' :
                     status === 'VERIFYING' ? 'w-2/3' : 'w-full bg-green-500'
                   }`}></div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold opacity-60">
              <Globe className="w-3 h-3" />
              <span>Decentralized Network</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
