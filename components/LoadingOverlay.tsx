import React from 'react';
import { Scan, Cpu } from 'lucide-react';

export const LoadingOverlay: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-8 relative overflow-hidden">
      
      {/* Background Grid Animation */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse"></div>
           <Scan className="w-16 h-16 text-cyan-400 animate-spin-slow duration-[3s]" />
           <Cpu className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <h3 className="text-xl font-mono font-bold text-white tracking-widest mb-4 animate-pulse">
          ANALYZING SURFACE...
        </h3>

        <div className="w-48 space-y-1">
           <div className="h-1 w-full bg-slate-800 overflow-hidden">
             <div className="h-full bg-cyan-500 animate-[scan_1.5s_ease-in-out_infinite] w-1/2"></div>
           </div>
           <div className="flex justify-between text-[10px] font-mono text-cyan-500/70">
              <span>DETECTING_HAZARDS</span>
              <span>84%</span>
           </div>
        </div>

        <div className="mt-8 text-xs font-mono text-slate-500 space-y-1 text-center">
           <p>> Pothole_Detection_Model: LOADED</p>
           <p>> Lighting_Audit: PENDING</p>
           <p>> Infrastructure_Health: CALCULATING</p>
        </div>
      </div>
    </div>
  );
};