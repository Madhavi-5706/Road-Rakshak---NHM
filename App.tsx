import React, { useState } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultCard } from './components/ResultCard';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ImageAnnotator } from './components/ImageAnnotator';
import { LogViewer } from './components/LogViewer';
import { analyzeRoadImage, analyzeRiskProfile } from './services/geminiService';
import { addLog } from './services/logService';
import { AnalysisResult, RiskAnalysisResult } from './types';
import { AlertCircle, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("");
  const [step, setStep] = useState<'upload' | 'annotate' | 'analyzing' | 'result'>('upload');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [riskResult, setRiskResult] = useState<RiskAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const handleImageSelect = (file: File) => {
    setError(null);
    setResult(null);
    setRiskResult(null);
    setLocation("");
    
    addLog('IMAGE_UPLOAD', `Image selected: ${file.name} (${(file.size/1024).toFixed(1)} KB)`, 'INFO');

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setImage(base64Data);
      setStep('annotate'); 
    };
    reader.readAsDataURL(file);
  };

  const handleAnnotationConfirm = async (finalImage: string, loc: string) => {
    setAnnotatedImage(finalImage);
    setLocation(loc);
    setStep('analyzing');
    addLog('ANNOTATION_CONFIRMED', `Target locked at location: ${loc}`, 'INFO');
    await performAnalysis(finalImage, loc);
  };

  const performAnalysis = async (base64Image: string, loc: string) => {
    try {
      addLog('ANALYSIS_START', 'AI Vision Core and Risk Intelligence modules engaged.', 'INFO');
      const base64Content = base64Image.split(',')[1];
      const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';'));
      
      const [analysisData, riskData] = await Promise.all([
        analyzeRoadImage(base64Content, mimeType, loc),
        analyzeRiskProfile(loc)
      ]);

      setResult(analysisData);
      setRiskResult(riskData);
      setStep('result');
      
      addLog('ANALYSIS_COMPLETE', `Detected: ${analysisData.hazard_detected} (Severity: ${analysisData.severity_score})`, 'SUCCESS');
    } catch (err: any) {
      console.error(err);
      setError("SYSTEM ERROR: Analysis sequence failed. Check connection uplink.");
      setStep('result');
      addLog('ANALYSIS_FAILED', err.message || 'Unknown error occurred during processing', 'ERROR');
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
    addLog('SYSTEM_RESET', 'User initiated a new audit session.', 'INFO');
  };

  return (
    <div className="flex-grow flex flex-col bg-[#030712] text-slate-300 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#030712] to-[#030712]"></div>
          <div className="absolute inset-0 opacity-10" 
             style={{
               backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)', 
               backgroundSize: '50px 50px'
             }}>
          </div>
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-900/5 to-transparent"></div>
      </div>

      <Header onShowLogs={() => setShowLogs(true)} />

      <LogViewer isOpen={showLogs} onClose={() => setShowLogs(false)} />

      <main className="flex-grow container mx-auto px-4 py-6 z-10 flex flex-col h-[calc(100vh-80px)]">
        {step === 'upload' && (
          <div className="flex-grow flex flex-col items-center justify-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
             <div className="text-center space-y-6 max-w-3xl relative">
               {/* Decorative elements behind text */}
               <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
               
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/30 text-cyan-400 text-xs font-mono tracking-widest backdrop-blur-md shadow-lg shadow-cyan-900/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  SYSTEM ONLINE v2.4
               </div>
               
               <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                 Road<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Guard</span>
               </h2>
               
               <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed max-w-xl mx-auto">
                 Deploying AI vision to secure municipal infrastructure. <br/>
                 <span className="text-cyan-500/80">Detect. Analyze. Report.</span>
               </p>
             </div>
             
             <div className="w-full max-w-xl relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 animate-pulse"></div>
                <ImageUploader onImageSelect={handleImageSelect} />
             </div>
             
             <div className="flex gap-8 text-xs font-mono text-slate-600 uppercase tracking-widest opacity-60">
                <div className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-cyan-500" /> Secure Upload</div>
                <div className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-cyan-500" /> Geo-Tagging</div>
                <div className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-cyan-500" /> Real-time Audit</div>
             </div>
          </div>
        )}

        {step === 'annotate' && image && (
            <div className="h-full flex flex-col items-center justify-center max-w-6xl mx-auto w-full animate-in zoom-in-95 duration-500">
                 <div className="w-full h-full bg-[#0B1120] border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl relative ring-1 ring-white/5">
                    <ImageAnnotator 
                        imageBase64={image} 
                        onConfirm={handleAnnotationConfirm} 
                        onRetake={handleReset}
                    />
                 </div>
            </div>
        )}

        {(step === 'analyzing' || step === 'result') && annotatedImage && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
            
            {/* Left Column: Visual Feed */}
            <div className="lg:col-span-6 xl:col-span-7 h-full flex flex-col min-h-0">
              <div className="relative rounded-xl overflow-hidden border border-slate-700/50 bg-[#0B1120] shadow-2xl flex-grow flex items-center justify-center group ring-1 ring-white/5">
                 
                 {/* Image */}
                 <img 
                  src={annotatedImage} 
                  alt="Target" 
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* HUD Overlays - Top */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                   <div className="flex gap-2">
                      <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-[10px] font-mono font-bold text-red-400 rounded backdrop-blur-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> LIVE FEED
                      </span>
                      <span className="px-2 py-1 bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 rounded backdrop-blur-md">
                        ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}
                      </span>
                   </div>
                </div>

                {/* HUD Overlays - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                   <div className="flex flex-col gap-1">
                     <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Coordinates</span>
                     <span className="px-3 py-1.5 bg-slate-900/80 border border-slate-600 text-slate-200 text-xs font-mono rounded flex items-center gap-2">
                       <span className="text-cyan-500">LOC:</span> {location.substring(0, 30)}{location.length > 30 ? '...' : ''}
                     </span>
                   </div>
                   
                   {/* Reset Button (Visible on Result) */}
                   {step === 'result' && (
                     <button 
                      onClick={handleReset}
                      className="bg-slate-800/80 hover:bg-cyan-600 text-slate-200 hover:text-white border border-slate-600 hover:border-cyan-500 px-4 py-2 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg backdrop-blur-sm"
                     >
                       New Audit
                     </button>
                   )}
                </div>
                
                {/* Scanning Laser (only when analyzing) */}
                {step === 'analyzing' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent animate-scan pointer-events-none border-b-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                )}
              </div>
            </div>

            {/* Right Column: Analysis Terminal */}
            <div className="lg:col-span-6 xl:col-span-5 h-full min-h-0 flex flex-col">
              {error ? (
                <div className="h-full border border-red-900/50 bg-red-950/10 rounded-xl p-8 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Protocol Failure</h3>
                  <p className="text-red-400/80 font-mono text-sm mb-8 bg-red-950/30 px-4 py-2 rounded border border-red-500/20">{error}</p>
                  <button 
                    onClick={handleReset}
                    className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-900/20 transition-all hover:scale-105 active:scale-95"
                  >
                    Re-Initialize System
                  </button>
                </div>
              ) : step === 'result' && result ? (
                 <ResultCard result={result} riskResult={riskResult} onReset={handleReset} />
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
