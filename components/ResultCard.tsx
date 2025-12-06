import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, RiskAnalysisResult, AuthorityDetails } from '../types';
import { AlertTriangle, CheckCircle2, AlertOctagon, Info, FileText, Loader2, Copy, Send, Terminal, MapPin, BarChart3, TrendingUp, Clock, AlertCircle, Satellite, LocateFixed, Building2, Phone, Mail, FileCheck, ShieldAlert, ArrowRight, X, ExternalLink, Map as MapIcon } from 'lucide-react';
import { generateComplaintLetter, findRelevantAuthority } from '../services/geminiService';
import { addLog } from '../services/logService';

// Reusing the key from LocationPicker for consistency
const GEOAPIFY_API_KEY = "7aa08a8dfa7c401fbdf3fb69f7f06ca7";

interface ResultCardProps {
  result: AnalysisResult;
  riskResult: RiskAnalysisResult | null;
  onReset: () => void;
}

type Tab = 'overview' | 'intelligence' | 'protocol';
type MailProvider = 'GMAIL' | 'OUTLOOK' | 'YAHOO' | 'DEFAULT';

export const ResultCard: React.FC<ResultCardProps> = ({ result, riskResult, onReset }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [letter, setLetter] = useState<string | null>(null);
  const [authority, setAuthority] = useState<AuthorityDetails | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMailModal, setShowMailModal] = useState(false);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Initialize Map when Overview tab is active
  useEffect(() => {
    if (activeTab === 'overview' && result.location) {
       // Small delay to allow DOM render
       const timer = setTimeout(() => initMap(), 200);
       return () => clearTimeout(timer);
    }
  }, [activeTab, result.location]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
        if(mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  const initMap = async () => {
      if(!mapContainerRef.current) return;
      if(mapInstanceRef.current) return; // Already initialized
      
      if (!(window as any).L) return;
      const L = (window as any).L;

      try {
          // Geocode the location string to get coords
          const encoded = encodeURIComponent(result.location);
          const res = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encoded}&apiKey=${GEOAPIFY_API_KEY}&limit=1`);
          const data = await res.json();
          
          // Default to India center if fail
          let lat = 20.5937;
          let lng = 78.9629;
          let zoom = 5;
          
          if (data.features && data.features.length > 0) {
              lat = data.features[0].properties.lat;
              lng = data.features[0].properties.lon;
              zoom = 16;
          }

          const map = L.map(mapContainerRef.current, { 
              zoomControl: false,
              attributionControl: false,
              dragging: false, // Static-ish view
              scrollWheelZoom: false,
              doubleClickZoom: false
          }).setView([lat, lng], zoom);
          
          mapInstanceRef.current = map;

          // Dark/Cyber Theme Tiles if available, else OSM Bright
          L.tileLayer(`https://maps.geoapify.com/v1/tile/dark-matter-brown/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`, {
              maxZoom: 20, 
              id: 'dark-matter-brown',
          }).addTo(map);

          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });

          L.marker([lat, lng], { icon: customIcon }).addTo(map);
          
      } catch (e) {
          console.error("Map load failed", e);
      }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return {
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          border: 'border-red-500/50',
          icon: <AlertOctagon className="w-5 h-5 text-red-500" />,
          label: 'CRITICAL'
        };
      case 'medium':
        return {
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/50',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          label: 'MODERATE'
        };
      case 'low':
        return {
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/50',
          icon: <Info className="w-5 h-5 text-blue-400" />,
          label: 'MINOR'
        };
      default:
        return {
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/50',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          label: 'SECURE'
        };
    }
  };

  const handleGenerateLetter = async () => {
    setIsGenerating(true);
    addLog('REPORT_GENERATION', 'Generating formal complaint letter via AI...', 'INFO');
    try {
      const summary = riskResult?.analytics_summary || "Historical data unavailable.";
      const [generatedText, authorityData] = await Promise.all([
         generateComplaintLetter(result, summary),
         findRelevantAuthority(result.location)
      ]);
      setLetter(generatedText);
      setAuthority(authorityData);
      addLog('REPORT_READY', `Letter drafted for: ${authorityData.name}`, 'SUCCESS');
    } catch (error) {
      console.error(error);
      addLog('REPORT_FAILED', 'Failed to generate letter or find authority.', 'ERROR');
    } finally {
      setIsGenerating(false);
    }
  };

  const openMailLink = (provider: MailProvider) => {
    if (!letter || !authority) return;

    const email = authority.email;
    const subject = `URGENT: Road Hazard Report - ${result.location}`;
    const body = letter;

    const encode = encodeURIComponent;

    let url = "";

    switch (provider) {
        case 'GMAIL':
            url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encode(email)}&su=${encode(subject)}&body=${encode(body)}`;
            break;
        case 'OUTLOOK':
            url = `https://outlook.live.com/owa/?path=/mail/action/compose&to=${encode(email)}&subject=${encode(subject)}&body=${encode(body)}`;
            break;
        case 'YAHOO':
            url = `https://compose.mail.yahoo.com/?to=${encode(email)}&subject=${encode(subject)}&body=${encode(body)}`;
            break;
        case 'DEFAULT':
            url = `mailto:${email}?subject=${encode(subject)}&body=${encode(body)}`;
            break;
    }

    addLog('TRANSMISSION_INITIATED', `Opening mail client: ${provider}`, 'INFO');
    
    if (provider === 'DEFAULT') {
        window.location.href = url;
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
    
    setShowMailModal(false);
  };

  const handleGoogleMaps = () => {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.location)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      addLog('MAP_VIEW', 'Opened location in Google Maps', 'INFO');
  };

  const config = getSeverityConfig(result.severity_score);
  const isSafe = result.severity_score === 'N/A';
  const hasInferredLocation = result.inferred_location && 
    (result.inferred_location.city_or_landmark !== "N/A" || result.inferred_location.street_name_or_clue !== "N/A");

  return (
    <div className="h-full flex flex-col bg-[#0B1120] border border-slate-700/50 rounded-xl overflow-hidden relative shadow-2xl ring-1 ring-white/5">
      
      {/* Mail Selection Modal */}
      {showMailModal && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl relative">
                <button 
                    onClick={() => setShowMailModal(false)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <div className="mb-6 text-center">
                    <div className="w-12 h-12 bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-3 border border-cyan-500/30">
                        <Mail className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Select Gateway</h3>
                    <p className="text-xs text-slate-400">Choose your preferred mail terminal</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <button 
                        onClick={() => openMailLink('GMAIL')}
                        className="flex items-center gap-3 w-full p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-red-500/50 transition-all group"
                    >
                        <div className="w-8 h-8 flex items-center justify-center rounded bg-white text-red-600 font-bold text-lg group-hover:scale-110 transition-transform">M</div>
                        <div className="text-left">
                            <div className="text-sm font-bold text-slate-200 group-hover:text-white">Gmail</div>
                            <div className="text-[10px] text-slate-500">Google Workspace</div>
                        </div>
                    </button>

                    <button 
                        onClick={() => openMailLink('OUTLOOK')}
                        className="flex items-center gap-3 w-full p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 transition-all group"
                    >
                        <div className="w-8 h-8 flex items-center justify-center rounded bg-[#0078D4] text-white font-bold text-lg group-hover:scale-110 transition-transform">O</div>
                        <div className="text-left">
                            <div className="text-sm font-bold text-slate-200 group-hover:text-white">Outlook</div>
                            <div className="text-[10px] text-slate-500">Microsoft Office 365</div>
                        </div>
                    </button>

                    <button 
                        onClick={() => openMailLink('YAHOO')}
                        className="flex items-center gap-3 w-full p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500/50 transition-all group"
                    >
                        <div className="w-8 h-8 flex items-center justify-center rounded bg-[#6001D2] text-white font-bold text-lg group-hover:scale-110 transition-transform">Y!</div>
                        <div className="text-left">
                            <div className="text-sm font-bold text-slate-200 group-hover:text-white">Yahoo Mail</div>
                            <div className="text-[10px] text-slate-500">Yahoo Service</div>
                        </div>
                    </button>

                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-900 px-2 text-slate-600 font-mono">Or</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => openMailLink('DEFAULT')}
                        className="flex items-center justify-center gap-2 w-full p-3 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs font-mono uppercase tracking-wider"
                    >
                        Use System Default
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Header Status Bar */}
      <div className="p-5 border-b border-slate-800 bg-[#020617]/50 backdrop-blur-sm flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bg} border border-white/5`}>
            {config.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">Analysis Complete</h3>
            <div className={`text-[10px] font-mono font-bold ${config.color} tracking-widest mt-0.5`}>
              STATUS: {config.label}
            </div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
           <div className="text-[10px] text-slate-500 font-mono uppercase">Reference ID</div>
           <div className="text-xs font-mono text-slate-300">#RG-{Math.floor(Math.random()*10000)}</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-900/30">
        <button 
          onClick={() => setActiveTab('overview')}