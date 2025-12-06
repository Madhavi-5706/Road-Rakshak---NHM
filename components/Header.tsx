import React from 'react';
import { Shield, Activity, Wifi, Radio, History } from 'lucide-react';

interface HeaderProps {
  onShowLogs: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onShowLogs }) => {
  return (
    <header className="border-b border-white/5 bg-[#030712]/70 backdrop-blur-md sticky top-0 z-50 h-16 shadow-lg shadow-black/20">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative w-10 h-10 flex items-center justify-center bg-cyan-950/50 rounded-lg border border-cyan-500/20 group-hover:border-cyan-500/50 transition-colors">
             <Shield className="w-6 h-6 text-cyan-400" />
             <div className="absolute inset-0 bg-cyan-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white tracking-wide font-sans leading-none">
              Road<span className="text-cyan-400">Guard</span>
            </h1>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.25em] leading-none mt-1.5">
              Civic_Defense_AI
            </span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-[10px] font-mono font-bold tracking-wider text-slate-500">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded border border-slate-800">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span>UPLINK_STABLE</span>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded border border-slate-800">
                     <Activity className="w-3 h-3 text-cyan-500" />
                    <span>AI_CORE_READY</span>
                </div>
            </div>
            
            <div className="pl-6 border-l border-slate-800 flex items-center gap-4">
               <button 
                onClick={onShowLogs}
                className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors text-xs font-bold uppercase tracking-wider"
               >
                 <History className="w-4 h-4" />
                 <span className="hidden sm:inline">Logs</span>
               </button>

               <div className="flex items-center gap-2">
                 <Radio className="w-4 h-4 text-slate-400" />
                 <span className="text-xs font-bold text-slate-300">V2.4</span>
               </div>
            </div>
        </div>
      </div>
    </header>
  );
};
