import React, { useState } from 'react';
import { Check, Languages, ArrowRight } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface LanguageSelectorModalProps {
  onComplete: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({ onComplete }) => {
  const { setLanguage, t } = useLanguage();
  const [selected, setSelected] = useState<Language>('en');

  const languages: { id: Language; name: string; native: string }[] = [
    { id: 'en', name: 'English', native: 'English' },
    { id: 'hi', name: 'Hindi', native: 'हिंदी' },
    { id: 'te', name: 'Telugu', native: 'తెలుగు' },
    { id: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { id: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { id: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { id: 'mr', name: 'Marathi', native: 'मराठी' },
  ];

  const handleConfirm = () => {
    setLanguage(selected);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 bg-slate-50 border-b border-slate-200 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-india-navy shadow-md mb-4 border border-slate-100">
                <Languages className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Select Your Language</h2>
            <p className="text-slate-500 text-sm">Please choose your preferred language to proceed</p>
        </div>

        {/* Grid */}
        <div className="p-6 overflow-y-auto bg-slate-50/50 flex-grow">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {languages.map((lang) => (
                    <button
                        key={lang.id}
                        onClick={() => setSelected(lang.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group
                            ${selected === lang.id 
                                ? 'border-india-navy bg-indigo-50/50 shadow-md' 
                                : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'}
                        `}
                    >
                        <div className="flex flex-col">
                            <span className={`text-sm font-semibold mb-1 ${selected === lang.id ? 'text-india-navy' : 'text-slate-500'}`}>
                                {lang.name}
                            </span>
                            <span className={`text-lg font-bold ${selected === lang.id ? 'text-slate-900' : 'text-slate-800'}`}>
                                {lang.native}
                            </span>
                        </div>
                        
                        {selected === lang.id && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-india-navy rounded-full flex items-center justify-center text-white shadow-sm animate-in zoom-in duration-200">
                                <Check className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-200">
            <button 
                onClick={handleConfirm}
                className="w-full py-4 bg-india-navy hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 text-lg"
            >
                Continue <ArrowRight className="w-5 h-5" />
            </button>
        </div>

      </div>
    </div>
  );
};
