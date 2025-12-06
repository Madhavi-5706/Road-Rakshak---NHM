import React, { useState } from 'react';
import { ArrowRight, Check, X, Languages, History, UploadCloud, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(0);
  const { t } = useLanguage();

  // Step definitions
  const steps = [
    {
      id: 'welcome',
      title: t('tour_welcome_title'),
      desc: t('tour_welcome_desc'),
      position: 'center',
      arrow: 'none',
      icon: <Shield className="w-12 h-12 text-india-navy" />,
    },
    {
      id: 'language',
      title: t('tour_lang_title'),
      desc: t('tour_lang_desc'),
      position: 'top-right-lang',
      arrow: 'top-right',
      icon: <Languages className="w-8 h-8 text-india-saffron" />,
    },
    {
      id: 'logs',
      title: t('tour_logs_title'),
      desc: t('tour_logs_desc'),
      position: 'top-right-logs',
      arrow: 'top-right',
      icon: <History className="w-8 h-8 text-india-green" />,
    },
    {
      id: 'upload',
      title: t('tour_upload_title'),
      desc: t('tour_upload_desc'),
      position: 'center-upload',
      arrow: 'bottom-center',
      icon: <UploadCloud className="w-8 h-8 text-blue-500" />,
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const currentStep = steps[step];

  // Dynamic CSS classes for positioning the "Spotlight Card"
  const getPositionClasses = (pos: string) => {
    switch(pos) {
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'top-right-lang':
        // Below language button
        return 'top-20 right-20 md:right-40 origin-top-right';
      case 'top-right-logs':
        // Below logs button
        return 'top-20 right-4 origin-top-right';
      case 'center-upload':
         // Above upload area
        return 'top-1/4 left-1/2 -translate-x-1/2 -mt-8';
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  // Arrow styles based on direction
  const getArrowClasses = (type: string) => {
      switch(type) {
          case 'top-right':
              return 'absolute -top-3 right-8 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-white';
          case 'bottom-center':
              return 'absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-white';
          default:
              return 'hidden';
      }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-opacity duration-500"></div>

      {/* The Guide Card */}
      <div 
        className={`absolute bg-white rounded-xl shadow-2xl p-6 border border-slate-200 transition-all duration-500 ease-in-out w-[90vw] max-w-sm ${getPositionClasses(currentStep.position)}`}
      >
        {/* Arrow Element */}
        <div className={getArrowClasses(currentStep.arrow)}></div>

        <button 
            onClick={onSkip}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-2">
                {currentStep.icon}
            </div>
            
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{currentStep.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                    {currentStep.desc}
                </p>
            </div>

            {/* Progress Dots */}
            <div className="flex items-center gap-1.5 mt-2">
                {steps.map((_, idx) => (
                    <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === step ? 'w-6 bg-india-navy' : 'w-1.5 bg-slate-200'}`}></div>
                ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <button 
                    onClick={onSkip}
                    className="text-slate-500 font-bold text-sm hover:text-slate-800 px-2"
                >
                    {t('tour_skip')}
                </button>
                <button 
                    onClick={handleNext}
                    className="bg-india-navy hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition-all transform active:scale-95"
                >
                    {step === steps.length - 1 ? t('tour_finish') : t('tour_next')}
                    {step === steps.length - 1 ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
