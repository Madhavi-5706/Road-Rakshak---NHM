import React, { useState } from 'react';
import { AnalysisResult, RiskAnalysisResult } from '../types';
import { AlertTriangle, CheckCircle2, AlertOctagon, Info, FileText, Loader2, Copy, Send, Terminal, MapPin, BarChart3, TrendingUp, Clock, AlertCircle, Satellite, LocateFixed } from 'lucide-react';
import { generateComplaintLetter } from '../services/geminiService';

interface ResultCardProps {
  result: AnalysisResult;
  riskResult: RiskAnalysisResult | null;
  onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, riskResult, onReset }) => {
  const [letter, setLetter] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return {
          color: 'text-red-500',
          bg: 'bg-red-950/30',
          border: 'border-red-500/50',
          shadow: 'shadow-red-900/20',
          icon: <AlertOctagon className="w-5 h-5 text-red-500" />,
          label: 'CRITICAL'
        };
      case 'medium':
        return {
          color: 'text-amber-500',
          bg: 'bg-amber-950/30',
          border: 'border-amber-500/50',
          shadow: 'shadow-amber-900/20',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          label: 'MODERATE'
        };
      case 'low':
        return {
          color: 'text-blue-400',
          bg: 'bg-blue-950/30',
          border: 'border-blue-500/50',
          shadow: 'shadow-blue-900/20',
          icon: <Info className="w-5 h-5 text-blue-400" />,
          label: 'MINOR'
        };
      default:
        return {
          color: 'text-emerald-400',
          bg: 'bg-emerald-950/30',
          border: 'border-emerald-500/50',
          shadow: 'shadow-emerald-900/20',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          label: 'SECURE'
        };
    }
  };

  const handleGenerateLetter = async () => {
    setIsGenerating(true);
    try {
      // Use the pre-generated analytics summary from Module 2 if available
      const summary = riskResult?.analytics_summary || "Historical data unavailable.";
      const generatedText = await generateComplaintLetter(result, summary);
      setLetter(generatedText);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const config = getSeverityConfig(result.severity_score);
  const isSafe = result.severity_score === 'N/A';

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-emerald-500';
      default: return 'bg-slate-500';
    }
  };

  // Determine if inferred location provided valuable data
  const hasInferredLocation = result.inferred_location && 
    (result.inferred_location.city_or_landmark !== "N/A" || result.inferred_location.street_name_or_clue !== "N/A");

  return (
    <div className="h-full flex flex-col bg-slate-900/50 border border-slate-700 backdrop-blur-md rounded-lg overflow-hidden relative shadow-2xl">
      {/* Top Decor Bar */}
      <div className={`h-1 w-full ${config.bg.replace('/30', '')}`}></div>

      {/* Header */}
      <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-950/50">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-slate-500" />
          <h3 className="text-sm font-mono font-bold text-slate-300 tracking-wider uppercase">Analysis Output</h3>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded border ${config.border} ${config.bg}`}>
            {config.icon}
            <span className={`text-xs font-mono font-bold ${config.color} tracking-widest`}>{config.label}</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-grow p-6 overflow-y-auto font-mono text-sm space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        
        {/* Section 1: Detection */}
        <div className="space-y-2 animate-in slide-in-from-left-4 duration-500">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Detected Anomaly</div>
          <div className="text-xl text-white font-bold border-l-2 border-cyan-500 pl-4 py-1">
            {result.hazard_detected}
          </div>
        </div>

         {/* Section 1.5: Location Data (Hybrid) */}
        <div className="space-y-3 animate-in slide-in-from-left-4 duration-500 delay-75">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Geospatial Intelligence</div>
          
          {/* Official/User Location */}
          <div className="flex items-center gap-2 text-slate-300">
             <MapPin className="w-4 h-4 text-cyan-500" />
             <span className="font-bold">{result.location || "Coordinates Missing"}</span>
          </div>

          {/* Inferred Location (AI Visual Guess) */}
          {hasInferredLocation && result.inferred_location && (
            <div className="bg-slate-950/60 border border-slate-800 rounded p-3 text-xs space-y-2 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
               <div className="flex items-center gap-2 text-indigo-400 mb-1">
                  <Satellite className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wider font-bold">Visual Landmark Inference</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                      result.inferred_location.confidence_level === 'High' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/30' : 
                      result.inferred_location.confidence_level === 'Medium' ? 'border-amber-500/30 text-amber-400 bg-amber-950/30' : 
                      'border-slate-500/30 text-slate-400 bg-slate-950/30'
                  }`}>
                    {result.inferred_location.confidence_level.toUpperCase()} CONFIDENCE
                  </span>
               </div>
               
               <div className="grid grid-cols-1 gap-1 pl-2">
                 {result.inferred_location.city_or_landmark !== "N/A" && (
                    <div className="flex gap-2">
                       <LocateFixed className="w-3 h-3 text-slate-500 mt-0.5" />
                       <span className="text-slate-300">{result.inferred_location.city_or_landmark}</span>
                    </div>
                 )}
                 {result.inferred_location.street_name_or_clue !== "N/A" && (
                    <div className="flex gap-2">
                       <Info className="w-3 h-3 text-slate-500 mt-0.5" />
                       <span className="text-slate-400 italic">"{result.inferred_location.street_name_or_clue}"</span>
                    </div>
                 )}
               </div>
            </div>
          )}
        </div>

        {/* Section 1.75: Historical Risk & Data Intelligence (Module 2) */}
        {riskResult && (
          <div className="space-y-4 animate-in slide-in-from-left-4 duration-500 delay-100 bg-slate-950/50 p-4 rounded border border-slate-800">
             
             {/* Header */}
             <div className="flex justify-between items-end pb-2 border-b border-slate-800">
                 <div className="flex items-center gap-2">
                   <BarChart3 className="w-4 h-4 text-cyan-500" />
                   <div className="text-[10px] text-slate-400 uppercase tracking-widest">Data Intelligence (Module 2)</div>
                 </div>
                 <div className="text-[9px] text-slate-600 font-mono uppercase tracking-wider">
                    Source: MoRTH 🇮🇳
                 </div>
             </div>
             
             {/* Grid of Stats */}
             <div className="grid grid-cols-2 gap-4">
                
                {/* Hotspots */}
                <div className="col-span-2 sm:col-span-1 space-y-2">
                   <div className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Top Risk Zones
                   </div>
                   <ul className="space-y-1">
                      {riskResult.top_hotspots.map((spot, i) => (
                        <li key={i} className="text-[10px] text-slate-300 flex items-start gap-1.5">
                           <span className="text-cyan-500">::</span> {spot}
                        </li>
                      ))}
                   </ul>
                </div>

                {/* Common Cause */}
                <div className="col-span-2 sm:col-span-1 space-y-2">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Primary Factor
                   </div>
                   <div className="p-2 bg-red-950/20 border border-red-900/30 rounded text-center">
                      <span className="text-xs font-bold text-red-400 block">{riskResult.most_common_cause}</span>
                   </div>
                   
                   {/* Time Analysis */}
                   <div className="pt-2">
                       <div className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3" /> Time Analysis
                       </div>
                       <div className="h-2 w-full flex rounded overflow-hidden opacity-80">
                           <div style={{width: `${riskResult.time_analysis.day_percentage}%`}} className="bg-yellow-500/70" title={`Day: ${riskResult.time_analysis.day_percentage}%`}></div>
                           <div style={{width: `${riskResult.time_analysis.night_percentage}%`}} className="bg-blue-900/70" title={`Night: ${riskResult.time_analysis.night_percentage}%`}></div>
                       </div>
                       <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                          <span>DAY {riskResult.time_analysis.day_percentage}%</span>
                          <span>NIGHT {riskResult.time_analysis.night_percentage}%</span>
                       </div>
                   </div>
                </div>

                {/* Risk Bar Chart (Full Width) */}
                <div className="col-span-2 space-y-2 mt-2 pt-2 border-t border-slate-800">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Historical Severity Distribution</div>
                    <div className="space-y-1.5">
                        {riskResult.risk_breakdown.map((item) => (
                          <div key={item.risk_level} className="flex items-center gap-2">
                              <span className="w-12 text-[9px] font-bold text-slate-500">{item.risk_level}</span>
                              <div className="flex-grow h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${getRiskColor(item.risk_level)} transition-all duration-1000 ease-out`} 
                                  style={{ width: `${item.percentage}%` }}
                                ></div>
                              </div>
                              <span className="w-6 text-[9px] text-right text-slate-400">{item.percentage}%</span>
                          </div>
                        ))}
                    </div>
                </div>
             </div>
          </div>
        )}

        {/* Section 2: Details */}
        <div className="space-y-2 animate-in slide-in-from-left-4 duration-700 delay-150">
           <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Auditor Log</div>
           <div className="p-4 bg-black/40 border border-slate-800 rounded text-slate-300 leading-relaxed font-light">
             <span className="text-cyan-500 mr-2">$</span>{result.description}
             <span className="inline-block w-2 h-4 bg-cyan-500 ml-1 animate-pulse align-middle"></span>
           </div>
        </div>

        {/* Action Buttons */}
        {!isSafe && !letter && (
           <div className="pt-4 border-t border-slate-800 animate-in fade-in duration-1000 delay-200">
             <button 
                onClick={handleGenerateLetter}
                disabled={isGenerating}
                className="w-full group relative overflow-hidden bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 p-4 transition-all"
              >
                <div className="absolute inset-0 w-full h-full bg-cyan-400/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                <div className="relative flex items-center justify-center gap-3 font-mono text-sm uppercase tracking-widest">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Protocol...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Initiate Complaint Protocol</span>
                    </>
                  )}
                </div>
              </button>
           </div>
        )}

        {/* Generated Letter */}
        {letter && (
          <div className="space-y-4 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Draft_Output.txt</div>
                <div className="text-[10px] bg-emerald-950/30 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">READY_TO_TRANSMIT</div>
             </div>
             
             <div className="bg-slate-950 p-4 border border-slate-700 text-slate-400 text-xs leading-relaxed whitespace-pre-wrap font-mono shadow-inner">
               {letter}
             </div>

             <div className="flex gap-3">
                <button 
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-2 px-4 text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  onClick={() => alert("Transmitting data to municipal servers...")}
                >
                  <Send className="w-3 h-3" /> Transmit
                </button>
                <button 
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-400 transition-colors"
                  onClick={() => {navigator.clipboard.writeText(letter); alert("Copied")}}
                >
                  <Copy className="w-4 h-4" />
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
