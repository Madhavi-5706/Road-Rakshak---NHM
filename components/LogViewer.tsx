import React, { useEffect, useState } from 'react';
import { X, FileText, Trash2, Clock, CheckCircle2, AlertCircle, Info, Download } from 'lucide-react';
import { ActivityLog } from '../types';
import { getLogs, clearLogs, downloadLogsAsCSV } from '../services/logService';
import { useLanguage } from '../contexts/LanguageContext';

interface LogViewerProps {
  onClose: () => void;
  isOpen: boolean;
}

export const LogViewer: React.FC<LogViewerProps> = ({ onClose, isOpen }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setLogs(getLogs());
    }
  }, [isOpen]);

  const handleClear = () => {
    clearLogs();
    setLogs([]);
  };

  const handleExport = () => {
    downloadLogsAsCSV();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col h-[70vh]">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-2 text-slate-800">
            <FileText className="w-5 h-5 text-india-navy" />
            <h3 className="font-bold text-sm uppercase">{t('activity_log')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={handleExport} 
                disabled={logs.length === 0}
                className="p-2 text-slate-500 hover:text-india-navy hover:bg-slate-200 rounded transition-colors disabled:opacity-50" 
                title="Export Logs as CSV"
            >
                <Download className="w-4 h-4" />
            </button>
            <button onClick={handleClear} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Clear Logs">
                <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors">
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-slate-50/50">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Clock className="w-10 h-10 mb-2 opacity-50" />
                <span className="text-sm">No activity recorded</span>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                        {log.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-india-green" />}
                        {log.status === 'ERROR' && <AlertCircle className="w-4 h-4 text-red-600" />}
                        {log.status === 'INFO' && <Info className="w-4 h-4 text-blue-600" />}
                        <span className={`text-xs font-bold ${
                            log.status === 'SUCCESS' ? 'text-india-green' :
                            log.status === 'ERROR' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                            {log.action}
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                 </div>
                 <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                    {log.details}
                 </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};