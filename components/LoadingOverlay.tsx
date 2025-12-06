import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const LoadingOverlay: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg p-8 relative shadow-lg">
      
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

        <div className="w-full max-w-[200px] bg-slate-100 rounded-full h-1.5 overflow-hidden">
           <div className="h-full bg-india-navy animate-[scan_2s_ease-in-out_infinite] w-1/3 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
