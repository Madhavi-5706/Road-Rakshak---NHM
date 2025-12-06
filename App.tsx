import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultCard } from './components/ResultCard';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ImageAnnotator } from './components/ImageAnnotator';
import { LogViewer } from './components/LogViewer';
import { OnboardingTour } from './components/OnboardingTour';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { AuthOverlay } from './components/AuthOverlay';
import { analyzeRoadImage, analyzeRiskProfile } from './services/geminiService';
import { addLog } from './services/logService';
import { sanitizeInput } from './services/securityService';
import { AnalysisResult, RiskAnalysisResult } from './types';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string>('');

  const [image, setImage] = useState<string | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("");
  const [step, setStep] = useState<'upload' | 'annotate' | 'analyzing' | 'result'>('upload');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [riskResult, setRiskResult] = useState<RiskAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
  const { t } = useLanguage();

  useEffect(() => {
    // Only check onboarding if authenticated
    if (isAuthenticated) {
      const savedLang = localStorage.getItem('roadguard_language');
      if (!savedLang) {
        setShowLanguageSelector(true);
      } else {
        checkTourStatus();
      }
    }
  }, [isAuthenticated]);

  const checkTourStatus = () => {
    const hasSeenTour = localStorage.getItem('roadguard_has_seen_tour');
    if (!hasSeenTour) {
      setShowTour(true);
    }
  };

  const handleAuthComplete = (did: string) => {
    setUserId(did);
    setIsAuthenticated(true);
    addLog('SESSION_START', 'User authenticated via decentralized ID', 'SUCCESS', did);
  };

  const handleLanguageSelectionComplete = () => {
    setShowLanguageSelector(false);
    setShowTour(true);
  };

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('roadguard_has_seen_tour', 'true');
    addLog('TOUR_COMPLETE', 'User completed the onboarding tour', 'INFO', userId);
  };

  const handleStartTour = () => {
    setShowTour(true);
  };

  const handleImageSelect = (file: File) => {
    setError(null);
    setResult(null);
    setRiskResult(null);
    setLocation("");
    
    addLog('IMAGE_UPLOAD', `Image selected: ${file.name} (${(file.size/1024).toFixed(1)} KB)`, 'INFO', userId);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setImage(base64Data);
      setStep('annotate'); 
    };
    reader.readAsDataURL(file);
  };

  const handleAnnotationConfirm = async (finalImage: string, loc: string) => {
    const cleanLoc = sanitizeInput(loc); // Security: Sanitize input
    setAnnotatedImage(finalImage);
    setLocation(cleanLoc);
    setStep('analyzing');
    addLog('ANNOTATION_CONFIRMED', `Location verified: ${cleanLoc}`, 'INFO', userId);
    await performAnalysis(finalImage, cleanLoc);
  };

  const performAnalysis = async (base64Image: string, loc: string) => {
    try {
      addLog('ANALYSIS_START', 'Initiating infrastructure analysis protocol.', 'INFO', userId);
      const base64Content = base64Image.split(',')[1];
      const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';'));
      
      const [analysisData, riskData] = await Promise.all([
        analyzeRoadImage(base64Content, mimeType, loc),
        analyzeRiskProfile(loc)
      ]);

      setResult(analysisData);
      setRiskResult(riskData);
      setStep('result');
      
      addLog('ANALYSIS_COMPLETE', `Report Generated: ${analysisData.hazard_detected} (Severity: ${analysisData.severity_score})`, 'SUCCESS', userId);
    } catch (err: any) {
      console.error(err);
      setError("Analysis Failed. Please verify network connection and try again.");
      setStep('result');
      addLog('ANALYSIS_FAILED', err.message || 'Unknown error occurred', 'ERROR', userId);
    }
  };

  const handleReset = () => {
    setImage(null);
    setAnnotatedImage(null);
    setResult(null);
    setRiskResult(null);
    setError(null);
    setLocation("");
    setStep('upload');
    addLog('SYSTEM_RESET', 'New audit session started.', 'INFO', userId);
  };

  if (!isAuthenticated) {
    return <AuthOverlay onAuthenticated={handleAuthComplete} />;
  }

  return (
    <div className="flex-grow flex flex-col bg-slate-50 text-slate-800 relative overflow-hidden font-sans min-h-screen">
      
      {showLanguageSelector && <LanguageSelectorModal onComplete={handleLanguageSelectionComplete} />}
      
      <Header onShowLogs={() => setShowLogs(true)} onStartTour={handleStartTour} userId={userId} />

      {!showLanguageSelector && showTour && <OnboardingTour onComplete={handleTourComplete} onSkip={handleTourComplete} />}
      <LogViewer isOpen={showLogs} onClose={() => setShowLogs(false)} />

      <main className="flex-grow container mx-auto px-4 py-8 z-10 flex flex-col h-[calc(100vh-64px)]">
        {step === 'upload' && (
          <div className="flex-grow flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
             <div className="text-center space-y-4 max-w-2xl relative">
               
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-700 text-xs font-bold tracking-wide shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  {t('official_portal')}
               </div>
               
               <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                 {t('hero_title_1')} <br/>
                 <span className="text-india-navy">{t('hero_title_2')}</span>
               </h2>
               
               <p className="text-slate-600 text-lg leading-relaxed max-w-lg mx-auto">
                 {t('hero_desc')}
               </p>
             </div>
             
             <div className="w-full max-w-xl">
                <ImageUploader onImageSelect={handleImageSelect} />
             </div>
             
             <div className="grid grid-cols-3 gap-8 text-center pt-8 border-t border-slate-200 w-full max-w-2xl">
                <div>
                   <div className="text-2xl font-bold text-india-navy">24/7</div>
                   <div className="text-xs text-slate-500 font-bold uppercase">{t('surveillance')}</div>
                </div>
                <div>
                   <div className="text-2xl font-bold text-india-navy">AI</div>
                   <div className="text-xs text-slate-500 font-bold uppercase">{t('data_insights')}</div>
                </div>
                <div>
                   <div className="text-2xl font-bold text-india-navy">Geo</div>
                   <div className="text-xs text-slate-500 font-bold uppercase">{t('geo_tagging')}</div>
                </div>
             </div>
          </div>
        )}

        {step === 'annotate' && image && (
            <div className="h-full flex flex-col items-center justify-center max-w-6xl mx-auto w-full animate-in zoom-in-95 duration-500 py-4">
                 <div className="w-full h-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden relative">
                    <ImageAnnotator 
                        imageBase64={image} 
                        onConfirm={handleAnnotationConfirm} 
                        onRetake={handleReset}
                    />
                 </div>
            </div>
        )}

        {(step === 'analyzing' || step === 'result') && annotatedImage && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0 py-4">
            
            {/* Left Column: Evidence */}
            <div className="lg:col-span-6 xl:col-span-7 h-full flex flex-col min-h-0">
              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white shadow-lg flex-grow flex items-center justify-center group p-2">
                 
                 {/* Image */}
                 <img 
                  src={annotatedImage} 
                  alt="Evidence" 
                  className="max-w-full max-h-full object-contain rounded"
                />
                
                {/* Labels */}
                <div className="absolute top-4 left-4">
                   <span className="px-3 py-1.5 bg-india-navy text-white text-xs font-bold rounded shadow-md">
                     {t('evidence_record')}
                   </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur border border-slate-200 p-3 rounded-lg shadow-sm flex justify-between items-center">
                   <div className="flex flex-col">
                     <span className="text-[10px] text-slate-500 font-bold uppercase">{t('location_coordinates')}</span>
                     <span className="text-sm font-semibold text-slate-800">
                       {location.substring(0, 40)}{location.length > 40 ? '...' : ''}
                     </span>
                   </div>
                   
                   {step === 'result' && (
                     <button 
                      onClick={handleReset}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded text-xs font-bold uppercase transition-colors"
                     >
                       {t('new_audit')}
                     </button>
                   )}
                </div>
              </div>
            </div>

            {/* Right Column: Report */}
            <div className="lg:col-span-6 xl:col-span-5 h-full min-h-0 flex flex-col">
              {error ? (
                <div className="h-full border border-red-200 bg-red-50 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-red-800 mb-2">{t('processing_error')}</h3>
                  <p className="text-red-700 text-sm mb-6 max-w-xs">{error}</p>
                  <button 
                    onClick={handleReset}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-md transition-colors"
                  >
                    {t('try_again')}
                  </button>
                </div>
              ) : step === 'result' && result ? (
                 <ResultCard result={result} riskResult={riskResult} onReset={handleReset} userId={userId} />
              ) : (
                 <LoadingOverlay />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
