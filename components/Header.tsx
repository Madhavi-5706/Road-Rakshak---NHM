import React from 'react';
import { Shield, Activity, History, MapPin, Languages, HelpCircle, Lock } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface HeaderProps {
  onShowLogs: () => void;
  onStartTour: () => void;
  userId?: string;
}

export const Header: React.FC<HeaderProps> = ({ onShowLogs, onStartTour, userId }) => {
  const { language, setLanguage, t } = useLanguage();

  const languageOptions: { id: Language; label: string }[] = [
    { id: 'en', label: 'English' },
    { id: 'hi', label: 'हिंदी' },
    { id: 'ta', label: 'தமிழ்' },
    { id: 'te', label: 'తెలుగు' },
    { id: 'kn', label: 'ಕನ್ನಡ' },
    { id: 'ml', label: 'മലയാളം' },
    { id: 'mr', label: 'मराठी' }
  ];

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 h-16 shadow-lg border-b border-slate-200/60">
      {/* Tricolor Strip */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-[#138808]"></div>
      </div>

      <div className="container mx-auto px-4 h-full flex items-center justify-between py-2">
        
        {/* Brand */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 flex items-center justify-center bg-india-navy rounded-lg text-white shadow-lg shadow-blue-900/20">
             <Shield className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-india-navy tracking-tight leading-none">
              {t('app_name')}
            </h1>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-none mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3 text-green-600" /> {t('subtitle')}
            </span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-4">
            {/* Identity Badge */}
            {userId && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-slate-200 rounded-md border border-slate-700 font-mono text-[10px]">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="opacity-70">DID:</span>
                  <span className="font-bold text-white">{userId.substring(0, 6)}...{userId.substring(userId.length - 4)}</span>
              </div>
            )}

            {/* Language Selector */}
            <div className="relative group z-50">
               <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-india-navy font-bold text-xs transition-colors">
                  <Languages className="w-4 h-4" />
                  <span className="uppercase">{language}</span>
               </button>
               <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
                  {languageOptions.map((opt) => (
                      <button 
                        key={opt.id}
                        onClick={() => setLanguage(opt.id)} 
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 border-b border-slate-50 last:border-0 ${language === opt.id ? 'text-india-navy bg-blue-50/50' : 'text-slate-600'}`}
                      >
                        {opt.label}
                      </button>
                  ))}
               </div>
            </div>
            
            <div className="pl-4 sm:pl-6 border-l border-slate-200 flex items-center gap-2 sm:gap-4">
               <button 
                onClick={onStartTour}
                className="p-2 text-slate-400 hover:text-india-navy transition-colors rounded-full hover:bg-slate-50"
                title={t('help_tour')}
               >
                 <HelpCircle className="w-5 h-5" />
               </button>

               <button 
                onClick={onShowLogs}
                className="flex items-center gap-2 text-slate-500 hover:text-india-navy transition-colors text-xs font-bold uppercase tracking-wide px-2 sm:px-3 py-1.5 hover:bg-slate-50 rounded-lg"
               >
                 <History className="w-4 h-4" />
                 <span className="hidden sm:inline">{t('activity_log')}</span>
               </button>
            </div>
        </div>
      </div>
    </header>
  );
};
