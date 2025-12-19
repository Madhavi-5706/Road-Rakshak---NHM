import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, RiskAnalysisResult, AuthorityDetails } from '../types';
import { AlertTriangle, CheckCircle2, AlertOctagon, Info, FileText, Loader2, Copy, Send, MapPin, BarChart3, TrendingUp, Clock, AlertCircle, LocateFixed, Building2, Phone, Mail, FileCheck, ArrowRight, X, ExternalLink, PieChart } from 'lucide-react';
import { generateComplaintLetter, findRelevantAuthority } from '../services/geminiService';
import { addLog } from '../services/logService';
import { useLanguage } from '../contexts/LanguageContext';

const GEOAPIFY_API_KEY = "7aa08a8dfa7c401fbdf3fb69f7f06ca7";

interface ResultCardProps {
  result: AnalysisResult;
  riskResult: RiskAnalysisResult | null;
  onReset: () => void;
  userId?: string;
}

type Tab = 'overview' | 'intelligence' | 'protocol';
type MailProvider = 'GMAIL' | 'OUTLOOK' | 'YAHOO' | 'DEFAULT';

export const ResultCard: React.FC<ResultCardProps> = ({ result, riskResult, onReset, userId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [letter, setLetter] = useState<string | null>(null);
  const [authority, setAuthority] = useState<AuthorityDetails | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMailModal, setShowMailModal] = useState(false);
  const { t, language } = useLanguage();

  const [isScrolled, setIsScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const coordsCache = useRef<{location: string, lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (activeTab === 'overview' && result.location) {
       const timer = setTimeout(() => initMap(), 50);
       return () => clearTimeout(timer);
    }
  }, [activeTab, result.location]);

  useEffect(() => {
    return () => {
        if(mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  const handleScroll = () => {
    if (contentRef.current) {
        setIsScrolled(contentRef.current.scrollTop > 10);
    }
  };

  const initMap = async () => {
      if(!mapContainerRef.current) return;
      if(mapInstanceRef.current) return;
      
      if (!(window as any).L) return;
      const L = (window as any).L;

      let lat = 20.5937;
      let lng = 78.9629;
      let zoom = 5;
      let shouldUseCache = false;

      if (coordsCache.current && coordsCache.current.location === result.location) {
          lat = coordsCache.current.lat;
          lng = coordsCache.current.lng;
          zoom = 16;
          shouldUseCache = true;
      }

      const map = L.map(mapContainerRef.current, { 
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false
      }).setView([lat, lng], zoom);
      
      mapInstanceRef.current = map;

      L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`, {
          maxZoom: 20, 
          id: 'osm-bright',
      }).addTo(map);

      const addMarker = (lt: number, lg: number) => {
          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          L.marker([lt, lg], { icon: customIcon }).addTo(map);
      };

      if (shouldUseCache) {
          addMarker(lat, lng);
      } else {
          try {
              const encoded = encodeURIComponent(result.location);
              const res = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encoded}&apiKey=${GEOAPIFY_API_KEY}&limit=1`);
              const data = await res.json();
              
              if (data.features && data.features.length > 0) {
                  const newLat = data.features[0].properties.lat;
                  const newLng = data.features[0].properties.lon;
                  
                  map.setView([newLat, newLng], 16);
                  addMarker(newLat, newLng);
                  coordsCache.current = { location: result.location, lat: newLat, lng: newLng };
              }
          } catch (e) {
              console.error("Map geocode failed", e);
          }
      }
      setTimeout(() => { map.invalidateSize(); }, 100);
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return {
          color: 'text-red-700',
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: <AlertOctagon className="w-5 h-5 text-red-600" />,
          label: 'CRITICAL PRIORITY'
        };
      case 'medium':
        return {
          color: 'text-orange-700',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
          label: 'MODERATE PRIORITY'
        };
      case 'low':
        return {
          color: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: <Info className="w-5 h-5 text-blue-600" />,
          label: 'LOW PRIORITY'
        };
      default:
        return {
          color: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
          label: 'NO HAZARD DETECTED'
        };
    }
  };

  const handleGenerateLetter = async () => {
    setIsGenerating(true);
    addLog('REPORT_GENERATION', 'Generating official complaint letter...', 'INFO', userId);
    try {
      const summary = riskResult?.analytics_summary || "Historical data unavailable.";
      const [generatedText, authorityData] = await Promise.all([
         generateComplaintLetter(result, summary, language),
         findRelevantAuthority(result.location)
      ]);
      setLetter(generatedText);
      setAuthority(authorityData);
      addLog('REPORT_READY', `Drafted for: ${authorityData.name}`, 'SUCCESS', userId);
    } catch (error) {
      console.error(error);
      addLog('REPORT_FAILED', 'Failed to generate letter.', 'ERROR', userId);
    } finally {
      setIsGenerating(false);
    }
  };

  const openMailLink = (provider: MailProvider) => {
    if (!letter || !authority) return;
    const email = authority.email;
    const subject = `Urgent: Infrastructure Report - ${result.location}`;
    const body = letter;
    const encode = encodeURIComponent;
    let url = "";

    switch (provider) {
        case 'GMAIL': url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encode(email)}&su=${encode(subject)}&body=${encode(body)}`; break;
        case 'OUTLOOK': url = `https://outlook.live.com/owa/?path=/mail/action/compose&to=${encode(email)}&subject=${encode(subject)}&body=${encode(body)}`; break;
        case 'YAHOO': url = `https://compose.mail.yahoo.com/?to=${encode(email)}&subject=${encode(subject)}&body=${encode(body)}`; break;
        case 'DEFAULT': url = `mailto:${email}?subject=${encode(subject)}&body=${encode(body)}`; break;
    }
    addLog('TRANSMISSION_INITIATED', `Opening mail client: ${provider}`, 'INFO', userId);
    if (provider === 'DEFAULT') window.location.href = url;
    else window.open(url, '_blank', 'noopener,noreferrer');
    setShowMailModal(false);
  };

  const handleGoogleMaps = () => {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.location)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      addLog('MAP_VIEW', 'Opened location in Google Maps', 'INFO', userId);
  };

  const config = getSeverityConfig(result.severity_score);
  const isSafe = result.severity_score === 'N/A';

  const tabs = [
    { id: 'overview' as Tab, label: t('tab_overview') },
    { id: 'intelligence' as Tab, label: t('tab_analysis') },
    { id: 'protocol' as Tab, label: t('tab_action') }
  ];

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden relative shadow-lg">
      
      {showMailModal && (
        <div className="absolute inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-2xl relative">
                <button onClick={() => setShowMailModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
                    <X className="w-5 h-5" />
                </button>
                <div className="mb-6 text-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{t('select_email')}</h3>
                    <p className="text-sm text-slate-500">{t('choose_send_method')}</p>
                </div>
                <div className="space-y-3">
                    <button onClick={() => openMailLink('GMAIL')} className="w-full p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-3 transition-colors text-slate-700 font-medium text-sm group">
                        <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-red-600 font-bold group-hover:scale-110 transition-transform">M</div> 
                        <span className="font-bold">Gmail</span>
                    </button>
                    <button onClick={() => openMailLink('OUTLOOK')} className="w-full p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-3 transition-colors text-slate-700 font-medium text-sm group">
                        <div className="w-8 h-8 rounded bg-[#0078D4] text-white flex items-center justify-center font-bold group-hover:scale-110 transition-transform">O</div>
                        <span className="font-bold">Outlook</span>
                    </button>
                    <div className="border-t border-slate-200 my-2 pt-2">
                        <button onClick={() => openMailLink('DEFAULT')} className="w-full p-2 text-center text-xs text-slate-500 hover:text-india-navy font-semibold uppercase">{t('use_default_app')}</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Header Status Bar */}
      <div className={`p-6 border-b border-slate-200 ${config.bg} flex justify-between items-center relative z-10`}>
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-full bg-white border ${config.border} shadow-sm`}>
            {config.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{t('inspection_status')}</h3>
            <div className={`text-xs font-bold ${config.color} mt-0.5`}>
              {config.label}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
               <div className="text-xs text-slate-500 font-medium">{t('report_ref')}</div>
               <div className="text-sm font-bold text-slate-700">RG-{Math.floor(Math.random()*10000)}</div>
            </div>

            <button 
                onClick={onReset}
                className="p-2 text-slate-400 hover:text-red-600 transition-colors hover:bg-white/50 rounded-full"
                title="Dismiss Report"
            >
                <X className="w-6 h-6" />
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 z-10">
        {tabs.map((tab) => (
            <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.id === 'protocol' && isSafe}
            className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 
                ${activeTab === tab.id ? 'border-india-navy text-india-navy bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                ${(tab.id === 'protocol' && isSafe) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            >
            {tab.label}
            </button>
        ))}
      </div>

      {/* Body Container with Scrolling Indicator */}
      <div className="flex-grow relative overflow-hidden bg-white">
        {isScrolled && <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-slate-900/5 to-transparent z-10 pointer-events-none"></div>}
        
        <div 
            ref={contentRef}
            onScroll={handleScroll}
            className="h-full p-6 overflow-y-auto"
        >
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-inner">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex justify-between">
                    <span>{t('issue_identified')}</span>
                    {userId && <span className="text-[10px] bg-slate-200 px-1 rounded text-slate-600">ID: {userId.slice(0,6)}</span>}
                    </div>
                    <div className="text-lg text-slate-900 font-bold mb-2">{result.hazard_detected}</div>
                    <div className="text-sm text-slate-600 leading-relaxed">
                    {result.description}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <div className="text-xs text-slate-500 font-bold uppercase flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> {t('location_details')}
                        </div>
                        {result.location && (
                        <button onClick={handleGoogleMaps} className="flex items-center gap-1 text-india-navy hover:text-blue-700 text-xs font-bold">
                            <ExternalLink className="w-3 h-3" /> {t('view_maps')}
                        </button>
                    )}
                    </div>
                    
                    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="p-4 bg-slate-50 border-b border-slate-200">
                            <div className="text-sm font-medium text-slate-800">{result.location}</div>
                            {result.inferred_location && (
                                <div className="mt-2 flex items-start gap-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-200">
                                    <LocateFixed className="w-3 h-3 mt-0.5 text-india-navy" />
                                    <div>
                                        <span className="font-semibold text-india-navy">{t('ai_cross_reference')}:</span> {result.inferred_location.city_or_landmark} ({result.inferred_location.confidence_level} Confidence)
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="w-full h-48 bg-slate-100 relative">
                            <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
                        </div>
                    </div>
                </div>
                
                {!isSafe && (
                <button 
                    onClick={() => setActiveTab('protocol')}
                    className="w-full py-3 rounded bg-india-navy hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                    {t('proceed_action')} <ArrowRight className="w-4 h-4" />
                </button>
                )}
            </div>
            )}
            
            {activeTab === 'intelligence' && riskResult && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2 text-india-navy mb-3">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">{t('data_insights')}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                    {riskResult.analytics_summary}
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-xs text-slate-500 font-bold uppercase flex items-center gap-2 mb-2">
                        <TrendingUp className="w-3 h-3" /> {t('leading_cause')}
                        </div>
                        <div className="text-sm font-bold text-slate-800">{riskResult.most_common_cause}</div>
                    </div>

                    <div className="p-4 border border-slate-200 rounded-lg bg-red-50/50 hover:bg-red-50 transition-colors">
                        <div className="text-xs text-red-700 font-bold uppercase flex items-center gap-2 mb-2">
                        <AlertCircle className="w-3 h-3" /> {t('high_risk_zones')}
                        </div>
                        <div className="text-xs text-slate-700 truncate">{riskResult.top_hotspots[0]}</div>
                    </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-4">{t('risk_breakdown')}</div>
                    <div className="space-y-3">
                        {riskResult.risk_breakdown.map((r, i) => (
                            <div key={i} className="flex flex-col gap-1">
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-slate-700">{r.risk_level}</span>
                                    <span className="text-india-navy">{r.percentage}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${r.risk_level === 'CRITICAL' ? 'bg-red-500' : r.risk_level === 'HIGH' ? 'bg-orange-500' : r.risk_level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${r.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            )}
            
            {activeTab === 'protocol' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {!letter ? (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-india-navy">
                        <FileCheck className="w-8 h-8" />
                        </div>
                        <div>
                        <h3 className="text-slate-900 font-bold">{t('generate_complaint')}</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                            {t('draft_instruction')}
                        </p>
                        </div>
                        <button onClick={handleGenerateLetter} disabled={isGenerating} className="mt-2 px-6 py-2 bg-india-navy hover:bg-blue-800 text-white font-bold rounded shadow-sm flex items-center gap-2 mx-auto text-sm">
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        {isGenerating ? t('drafting') : t('draft_button')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {authority && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Building2 className="w-5 h-5 text-india-navy" />
                                <h4 className="font-bold text-slate-800">{authority.name}</h4>
                            </div>
                            <div className="text-sm text-slate-600 ml-7 mb-4">{authority.address}</div>
                            <div className="grid grid-cols-2 gap-4 ml-7">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Phone className="w-3 h-3" /> {authority.phone}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                                    <Mail className="w-3 h-3" /> {authority.email}
                                </div>
                            </div>
                        </div>
                        )}
                        <div className="relative group">
                            <div className="bg-white border border-slate-300 rounded-lg p-5 min-h-[16rem] h-auto text-sm text-slate-800 leading-relaxed font-mono whitespace-pre-wrap shadow-inner relative">
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-100 text-[9px] text-slate-400 font-bold rounded">ENCRYPTED_DRAFT</div>
                                {letter}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <button onClick={() => setShowMailModal(true)} className="w-full py-3 bg-india-green hover:bg-green-700 text-white font-bold rounded shadow-md flex items-center justify-center gap-2 text-sm uppercase">
                            <Send className="w-4 h-4" /> {t('send_complaint')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
      </div>
    </div>
  );
};