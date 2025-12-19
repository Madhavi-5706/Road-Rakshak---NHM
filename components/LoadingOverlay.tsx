import React from 'react';
import { Loader2, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LoadingOverlayProps {
  onCancel?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ onCancel }) => {
  const { t } = useLanguage();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg p-8 relative shadow-lg">
      
      {onCancel && (
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 transition-colors"
          title="Cancel Analysis"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6">
           <div className="absolute inset-0 bg-india-navy/10 rounded-full animate-pulse"></div>
           <Loader2 className="w-12 h-12 text-india-navy animate-spin" />
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-2">
          {t('processing')}
        </h3>

        <p className="text-sm text-slate-500 max-w-xs mb-6">
          {t('processing_desc')}
        </p>

        <div className="w-full max-w-[200px] bg-slate-100 rounded-full h-1.5 overflow-hidden mb-8">
           <div className="h-full bg-india-navy animate-[scan_2s_ease-in-out_infinite] w-1/3 rounded-full"></div>
        </div>

        {onCancel && (
          <button 
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
          >
            Cancel Analysis
          </button>
        )}
      </div>
    </div>
  );
};