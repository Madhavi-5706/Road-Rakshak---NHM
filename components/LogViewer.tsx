import React, { useEffect, useState } from 'react';
import { X, Terminal, Trash2, Clock, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { ActivityLog } from '../types';
import { getLogs, clearLogs } from '../services/logService';

interface LogViewerProps {
  onClose: () => void;
  isOpen: boolean;
}

export const LogViewer: React.FC<LogViewerProps> = ({ onClose, isOpen }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLogs(getLogs());
    }
  }, [isOpen]);

  const handleClear = () => {
    clearLogs();
    setLogs([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0B1120] border border-slate-700 rounded-lg shadow-2xl flex flex-col h-[70vh] relative ring-1 ring-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2 text-cyan-400">
            <Terminal className="w-5 h-5" />
            <h3 className="font-mono font-bold uppercase tracking-wider">System Activity Logs</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={handleClear}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                title="Clear Logs"
            >
                <Trash2 className="w-4 h-4" />
            </button>
            <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Log List */}
        <div className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 font-mono text-sm">
                <Clock className="w-8 h-8 mb-3 opacity-20" />
                <span>NO ACTIVITY RECORDED</span>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-slate-900/50 border border-slate-800/50 rounded p-3 hover:border-slate-700 transition-colors">
                 <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                        {log.status === 'SUCCESS' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        {log.status === 'ERROR' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                        {log.status === 'INFO' && <Info className="w-3.5 h-3.5 text-blue-500" />}
                        <span className={`text-xs font-bold font-mono ${
                            log.status === 'SUCCESS' ? 'text-emerald-400' :
                            log.status === 'ERROR' ? 'text-red-400' : 'text-blue-400'
                        }`}>
                            {log.action}
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                 </div>
                 <p className="text-xs text-slate-300 pl-5.5 leading-relaxed font-mono opacity-80">
                    {log.details}
                 </p>
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="p-2 border-t border-slate-800 bg-slate-950 text-[10px] text-slate-600 font-mono text-center uppercase tracking-widest">
            End of Record Stream
        </div>
      </div>
    </div>
  );
};
