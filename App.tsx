import React, { useState } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultCard } from './components/ResultCard';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ImageAnnotator } from './components/ImageAnnotator';
import { analyzeRoadImage, analyzeRiskProfile } from './services/geminiService';
import { AnalysisResult, RiskAnalysisResult } from './types';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("");
  const [step, setStep] = useState<'upload' | 'annotate' | 'analyzing' | 'result'>('upload');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [riskResult, setRiskResult] = useState<RiskAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (file: File) => {
    setError(null);
    setResult(null);
    setRiskResult(null);
    setLocation("");
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setImage(base64Data);
      setStep('annotate'); // Move to annotation step
    };
    reader.readAsDataURL(file);
  };

  const handleAnnotationConfirm = async (finalImage: string, loc: string) => {
    setAnnotatedImage(finalImage);
    setLocation(loc);
    setStep('analyzing');
    await performAnalysis(finalImage, loc);
  };

  const performAnalysis = async (base64Image: string, loc: string) => {
    try {
      // Extract base64 content
      const base64Content = base64Image.split(',')[1];
      const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';'));
      
      // Run both analyses in parallel for speed
      const [analysisData, riskData] = await Promise.all([
        analyzeRoadImage(base64Content, mimeType, loc),
        analyzeRiskProfile(loc)
      ]);

      setResult(analysisData);
      setRiskResult(riskData);
      setStep('result');
    } catch (err) {
      console.error(err);
      setError("SYSTEM ERROR: Analysis sequence failed. Check connection uplink.");
      setStep('result'); // Show error state
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
  };

  return (
    <div className="flex-grow flex flex-col bg-slate-950 text-slate-300 relative overflow-hidden">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-10" 
           style={{backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
      </div>

      <Header />

      <main className="flex-grow container mx-auto px-4 py-6 z-10 flex flex-col h-[calc(100vh-80px)]">
        {step === 'upload' && (
          <div className="flex-grow flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
             <div className="text-center space-y-4 max-w-2xl">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 text-xs font-mono tracking-widest mb-4">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  SYSTEM READY
               </div>
               <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter uppercase font-mono">
                 Road<span className="text-cyan-400">Guard</span>
               </h2>
               <p className="text-slate-400 text-lg font-light leading-relaxed max-w-lg mx-auto">
                 Advanced AI Diagnostics for Municipal Infrastructure.
                 <br/><span className="text-slate-600 text-sm font-mono">Initiate uplink to detect hazards.</span>
               </p>
             </div>
             <div className="w-full max-w-md">
                <ImageUploader onImageSelect={handleImageSelect} />
             </div>
          </div>
        )}

        {step === 'annotate' && image && (
            <div className="h-full flex flex-col items-center justify-center max-w-5xl mx-auto w-full animate-in zoom-in-95 duration-500">
                 <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl relative">
                    <ImageAnnotator 
                        imageBase64={image} 
                        onConfirm={handleAnnotationConfirm} 
                        onRetake={handleReset}
                    />
                     {/* Corner Markers for the container */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50 pointer-events-none"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50 pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50 pointer-events-none"></div>
                 </div>
            </div>
        )}

        {(step === 'analyzing' || step === 'result') && annotatedImage && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
            
            {/* Left Column: Visual Feed */}
            <div className="lg:col-span-7 h-full flex flex-col min-h-0">
              <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-black/50 backdrop-blur-sm shadow-2xl flex-grow flex items-center justify-center group">
                 <img 
                  src={annotatedImage} 
                  alt="Target" 
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* HUD Overlays */}
                <div className="absolute top-4 left-4 flex gap-2">
                   <span className="px-2 py-1 bg-black/60 border border-slate-600 text-[10px] font-mono text-cyan-500 rounded">LIVE FEED</span>
                   <span className="px-2 py-1 bg-black/60 border border-slate-600 text-[10px] font-mono text-slate-400 rounded">TARGET_LOCKED</span>
                </div>

                <div className="absolute bottom-4 right-4 flex gap-2">
                   <span className="px-3 py-1 bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 text-[10px] font-mono rounded uppercase">
                     LOC: {location}
                   </span>
                </div>
                
                {/* Scanning Overlay (only when analyzing) */}
                {step === 'analyzing' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent animate-scan pointer-events-none border-b border-cyan-500/50"></div>
                )}

                {/* Reset Button (Hover) */}
                {step === 'result' && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                     <button 
                      onClick={handleReset}
                      className="bg-black/80 hover:bg-cyan-950 text-cyan-400 border border-cyan-500/50 px-6 py-2 rounded-none clip-path-polygon font-mono text-xs tracking-widest uppercase transition-colors"
                     >
                       [ Reset Stream ]
                     </button>
                  </div>
                )}

                {/* Corner Markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50"></div>
              </div>
            </div>

            {/* Right Column: Analysis Terminal */}
            <div className="lg:col-span-5 h-full min-h-0 flex flex-col">
              {error ? (
                <div className="h-full border border-red-900/50 bg-red-950/10 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-6 animate-pulse" />
                  <h3 className="text-xl font-mono text-red-500 uppercase tracking-widest mb-2">System Failure</h3>
                  <p className="text-red-400/70 font-mono text-sm mb-6">Error Code: {error}</p>
                  <button 
                    onClick={handleReset}
                    className="px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 font-mono text-sm uppercase transition-colors"
                  >
                    Re-Initialize
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