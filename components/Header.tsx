import React from 'react';
import { Shield, Activity, Wifi } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="relative">
             <div className="absolute inset-0 bg-cyan-500 blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
             <Shield className="w-6 h-6 text-cyan-400 relative z-10" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white tracking-widest font-mono leading-none">
              Road<span className="text-cyan-400">Guard</span>
            </h1>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] leading-none mt-1">
              AI_AUDITOR_V2.1
            </span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-slate-500">
                <span className="flex items-center gap-1.5">
                    <Wifi className="w-3 h-3 text-emerald-500" />
                    <span>NET: ONLINE</span>
                </span>
                <span className="w-px h-3 bg-slate-800"></span>
                <span className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-cyan-500 animate-pulse" />
                    <span>AI_CORE: ACTIVE</span>
                </span>
            </div>
            
            <div className="px-3 py-1 border border-cyan-500/30 bg-cyan-950/20 rounded text-[10px] font-mono text-cyan-400 tracking-wider">
                <span className="animate-blink mr-2">_</span>READY
            </div>
        </div>
      </div>
    </header>
  );
};