import React, { useRef, useState, useEffect } from 'react';
import { MousePointer2, Check, RefreshCw, MapPin, Undo2, Redo2, Settings2, Globe, Trash2 } from 'lucide-react';
import { LocationPicker } from './LocationPicker';
import { useLanguage } from '../contexts/LanguageContext';

interface Annotation {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

interface ImageAnnotatorProps {
  imageBase64: string;
  onConfirm: (annotatedImageBase64: string, location: string) => void;
  onRetake: () => void;
}

const HAZARD_TYPES = ["Pothole / Crack", "Streetlight Issue", "Waterlogging", "Obstruction", "Traffic Sign", "Other Hazard"];

export const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({ imageBase64, onConfirm, onRetake }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [location, setLocation] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string>(HAZARD_TYPES[0]);
  const [showMap, setShowMap] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const img = new Image();
    img.src = imageBase64;
    img.onload = () => {
      setImageElement(img);
      draw(img, [], null);
    };
  }, [imageBase64]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (isCtrlOrMeta && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
          // Future feature: Delete selected annotation
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyStep, history, imageElement]);

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const draw = (img: HTMLImageElement, currentAnnotations: Annotation[], currentRect: Annotation | null) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext('2d')) return;
    const ctx = canvas.getContext('2d')!;
    if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width; canvas.height = img.height;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const hasSelection = currentAnnotations.length > 0 || currentRect !== null;
    if (hasSelection) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const reveal = (r: Annotation) => {
            ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.drawImage(img, 0, 0); ctx.restore();
        };
        currentAnnotations.forEach(reveal);
        if (currentRect) reveal(currentRect);

        currentAnnotations.forEach(rect => {
            ctx.strokeStyle = '#FF9933'; // Saffron
            ctx.lineWidth = 3; ctx.setLineDash([]); ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
            const rx = rect.w > 0 ? rect.x : rect.x + rect.w;
            const ry = rect.h > 0 ? rect.y : rect.y + rect.h;
            
            if (rect.label) {
                ctx.font = "bold 14px 'Inter', sans-serif";
                const tm = ctx.measureText(rect.label);
                ctx.fillStyle = '#FF9933';
                ctx.fillRect(rx, ry - 24, tm.width + 10, 24);
                ctx.fillStyle = '#000000';
                ctx.textBaseline = 'top';
                ctx.fillText(rect.label, rx + 5, ry - 20);
            }
        });

        if (currentRect) {
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); 
            ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
        }
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true); setStartPos(getCanvasCoordinates(e));
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !imageElement) return;
    const pos = getCanvasCoordinates(e);
    const rect = { x: startPos.x, y: startPos.y, w: pos.x - startPos.x, h: pos.y - startPos.y, label: selectedLabel };
    draw(imageElement, annotations, rect);
  };

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !imageElement) return;
    setIsDrawing(false);
    const pos = getCanvasCoordinates(e);
    const w = pos.x - startPos.x;
    const h = pos.y - startPos.y;
    if (Math.abs(w) > 5 && Math.abs(h) > 5) {
        const newAnnot = [...annotations, { x: startPos.x, y: startPos.y, w, h, label: selectedLabel }];
        const newHist = history.slice(0, historyStep + 1); newHist.push(newAnnot);
        setHistory(newHist); setHistoryStep(newHist.length - 1); setAnnotations(newAnnot);
        draw(imageElement, newAnnot, null);
    } else {
        draw(imageElement, annotations, null);
    }
  };

  const handleUndo = () => {
    if (historyStep > 0 && imageElement) {
        const prevStep = historyStep - 1;
        setHistoryStep(prevStep); 
        setAnnotations(history[prevStep]); 
        draw(imageElement, history[prevStep], null);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1 && imageElement) {
        const nextStep = historyStep + 1;
        setHistoryStep(nextStep); 
        setAnnotations(history[nextStep]); 
        draw(imageElement, history[nextStep], null);
    }
  };

  const handleClearAll = () => {
    if (annotations.length === 0 || !imageElement) return;
    const newAnnot: Annotation[] = [];
    const newHist = history.slice(0, historyStep + 1);
    newHist.push(newAnnot);
    setHistory(newHist);
    setHistoryStep(newHist.length - 1);
    setAnnotations(newAnnot);
    draw(imageElement, newAnnot, null);
  };

  const handleConfirm = () => {
    if (canvasRef.current) {
        const loc = location.trim() === "" ? t('unknown_location') : location;
        onConfirm(canvasRef.current.toDataURL('image/jpeg', 0.8), loc);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 relative">
        {showMap && <LocationPicker onConfirm={(addr) => {setLocation(addr); setShowMap(false);}} onCancel={() => setShowMap(false)} initialLocation={location} />}

        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
            <div className="pointer-events-auto bg-white/90 backdrop-blur border border-slate-200 rounded-lg shadow-md p-1.5 flex flex-col gap-1">
                 <div className="px-2 py-1 text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                   <Settings2 className="w-3 h-3" /> {t('issue_type')}
                 </div>
                 <select value={selectedLabel} onChange={(e) => setSelectedLabel(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-medium py-2 pl-3 pr-8 rounded focus:outline-none focus:ring-1 focus:ring-india-navy cursor-pointer">
                      {HAZARD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
            </div>
            
            <div className="pointer-events-auto bg-white/90 backdrop-blur border border-slate-200 rounded-lg shadow-md p-1.5 flex items-center gap-1">
                 <button 
                    onClick={handleUndo} 
                    disabled={historyStep === 0} 
                    className="p-2 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors relative group"
                    title="Undo (Ctrl+Z)"
                 >
                    <Undo2 className="w-4 h-4" />
                 </button>
                 
                 <button 
                    onClick={handleRedo} 
                    disabled={historyStep === history.length - 1} 
                    className="p-2 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors relative group"
                    title="Redo (Ctrl+Y)"
                 >
                    <Redo2 className="w-4 h-4" />
                 </button>
                 
                 <div className="w-px h-4 bg-slate-300 mx-1"></div>
                 
                 <button 
                    onClick={handleClearAll} 
                    disabled={annotations.length === 0} 
                    className="p-2 rounded hover:bg-red-50 text-red-600 disabled:text-slate-400 disabled:opacity-30 transition-colors"
                    title="Clear All"
                 >
                    <Trash2 className="w-4 h-4" />
                 </button>
            </div>
        </div>

        <div 
            ref={containerRef} 
            className="flex-grow relative bg-slate-100 flex items-center justify-center overflow-hidden cursor-crosshair"
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}
        >
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-50"></div>
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain shadow-md relative z-0" />
            {!isDrawing && annotations.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur rounded-full text-white text-xs font-medium shadow-lg animate-in fade-in zoom-in duration-300">
                        <MousePointer2 className="w-4 h-4 animate-bounce" /> {t('click_drag')}
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex flex-col md:flex-row gap-4 items-stretch md:items-center relative z-20">
            <div className="flex-grow flex items-center gap-2">
                <div className="flex-grow relative group">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('enter_location')} className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm py-2 pl-10 pr-3 rounded focus:outline-none focus:border-india-navy focus:ring-1 focus:ring-india-navy" />
                </div>
                <button onClick={() => setShowMap(true)} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded shadow-sm transition-colors" title="Pick Location"><Globe className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={onRetake} className="px-4 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium text-sm rounded flex items-center gap-2 transition-colors"><RefreshCw className="w-4 h-4" /> {t('reset')}</button>
              <button onClick={handleConfirm} disabled={location.trim() === ""} className={`px-6 py-2 font-bold text-sm text-white rounded shadow-md flex items-center gap-2 transition-all ${location.trim() === "" ? 'bg-slate-300 cursor-not-allowed' : 'bg-india-navy hover:bg-blue-800'}`}><Check className="w-4 h-4" /> {t('analyze')}</button>
            </div>
        </div>
    </div>
  );
};