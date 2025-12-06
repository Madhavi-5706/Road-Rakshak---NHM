import React, { useRef, useState, useEffect } from 'react';
import { Scan, MousePointer2, Check, RefreshCw, MapPin, Undo2, Redo2, Tag, Globe, Settings2 } from 'lucide-react';
import { LocationPicker } from './LocationPicker';

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

const HAZARD_TYPES = [
  "Pothole / Crack",
  "Streetlight Issue",
  "Waterlogging",
  "Obstruction",
  "Traffic Sign",
  "Other Hazard"
];

export const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({ imageBase64, onConfirm, onRetake }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [location, setLocation] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string>(HAZARD_TYPES[0]);
  const [showMap, setShowMap] = useState(false);

  // History State
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  // Load image onto canvas
  useEffect(() => {
    const img = new Image();
    img.src = imageBase64;
    img.onload = () => {
      setImageElement(img);
      draw(img, [], null); // Initial draw
    };
  }, [imageBase64]);

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const draw = (img: HTMLImageElement, currentAnnotations: Annotation[], currentRect: Annotation | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive Canvas Sizing
    if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
    }

    // Clear and draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const hasAnySelection = currentAnnotations.length > 0 || currentRect !== null;

    // Apply dark overlay for focus
    if (hasAnySelection) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.6)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const revealRect = (r: Annotation) => {
            ctx.save();
            ctx.beginPath();
            ctx.rect(r.x, r.y, r.w, r.h);
            ctx.clip();
            ctx.drawImage(img, 0, 0);
            ctx.restore();
        };

        currentAnnotations.forEach(revealRect);
        if (currentRect) revealRect(currentRect);

        // --- DRAW COMMITTED ANNOTATIONS ---
        currentAnnotations.forEach(rect => {
            // High contrast border
            ctx.strokeStyle = '#22d3ee'; // Cyan-400
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

            // Normalized coordinates
            const rx = rect.w > 0 ? rect.x : rect.x + rect.w;
            const ry = rect.h > 0 ? rect.y : rect.y + rect.h;
            const rw = Math.abs(rect.w);
            const rh = Math.abs(rect.h);

            // Tactical Corners
            const cornerSize = 10;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rx, ry + cornerSize); ctx.lineTo(rx, ry); ctx.lineTo(rx + cornerSize, ry);
            ctx.moveTo(rx + rw - cornerSize, ry); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + cornerSize);
            ctx.moveTo(rx + rw, ry + rh - cornerSize); ctx.lineTo(rx + rw, ry + rh); ctx.lineTo(rx + rw - cornerSize, ry + rh);
            ctx.moveTo(rx + cornerSize, ry + rh); ctx.lineTo(rx, ry + rh); ctx.lineTo(rx, ry + rh - cornerSize);
            ctx.stroke();

            // Label Tag
            if (rect.label) {
                ctx.font = "bold 14px 'JetBrains Mono', monospace";
                const textMetrics = ctx.measureText(rect.label);
                const textWidth = textMetrics.width;
                const textHeight = 14;
                const padding = 8;
                
                const tagX = rx;
                const tagY = ry - (textHeight + padding * 2);
                const drawY = tagY > 0 ? tagY : ry;
                
                ctx.fillStyle = '#0891b2'; // Cyan-600
                ctx.fillRect(tagX, drawY, textWidth + padding * 2, textHeight + padding * 2);
                
                ctx.fillStyle = '#ffffff';
                ctx.textBaseline = 'top';
                ctx.fillText(rect.label, tagX + padding, drawY + padding);
            }
        });

        // --- DRAW CURRENT RECT ---
        if (currentRect) {
            ctx.save();
            ctx.strokeStyle = '#fbbf24'; // Amber-400 for active drawing
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]); 
            ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
            ctx.restore();
        }
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getCanvasCoordinates(e);
    setStartPos(pos);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !imageElement) return;
    const pos = getCanvasCoordinates(e);
    
    const w = pos.x - startPos.x;
    const h = pos.y - startPos.y;
    
    const currentRect = { x: startPos.x, y: startPos.y, w, h, label: selectedLabel };
    draw(imageElement, annotations, currentRect);
  };

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !imageElement) return;
    setIsDrawing(false);
    
    const pos = getCanvasCoordinates(e);
    const w = pos.x - startPos.x;
    const h = pos.y - startPos.y;

    if (Math.abs(w) > 5 && Math.abs(h) > 5) {
        const newRect = { x: startPos.x, y: startPos.y, w, h, label: selectedLabel };
        const newAnnotations = [...annotations, newRect];
        
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newAnnotations);
        
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
        setAnnotations(newAnnotations);
        
        draw(imageElement, newAnnotations, null);
    } else {
        draw(imageElement, annotations, null);
    }
  };

  const handleUndo = () => {
    if (historyStep > 0 && imageElement) {
        const newStep = historyStep - 1;
        const prevAnnotations = history[newStep];
        setHistoryStep(newStep);
        setAnnotations(prevAnnotations);
        draw(imageElement, prevAnnotations, null);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1 && imageElement) {
        const newStep = historyStep + 1;
        const nextAnnotations = history[newStep];
        setHistoryStep(newStep);
        setAnnotations(nextAnnotations);
        draw(imageElement, nextAnnotations, null);
    }
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const loc = location.trim() === "" ? "Unknown Location" : location;
      onConfirm(canvas.toDataURL('image/jpeg', 0.8), loc);
    }
  };

  const handleMapConfirm = (address: string) => {
    setLocation(address);
    setShowMap(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0B1120] text-slate-200">
        {showMap && (
          <LocationPicker 
            onConfirm={handleMapConfirm} 
            onCancel={() => setShowMap(false)} 
            initialLocation={location}
          />
        )}

        {/* Floating Controls Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
            {/* Type Selector (Floating) */}
            <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg shadow-xl p-1.5 flex flex-col gap-1">
                 <div className="px-2 py-1 text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1">
                   <Settings2 className="w-3 h-3" /> Annotation Mode
                 </div>
                 <select
                      value={selectedLabel}
                      onChange={(e) => setSelectedLabel(e.target.value)}
                      className="bg-slate-800 border border-slate-600 text-white text-xs font-mono py-2 pl-3 pr-8 rounded focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 hover:bg-slate-700 cursor-pointer"
                  >
                      {HAZARD_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                      ))}
                  </select>
            </div>

            {/* History Controls (Floating) */}
            <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg shadow-xl p-1.5 flex items-center gap-1">
                 <button 
                  onClick={handleUndo} 
                  disabled={historyStep === 0}
                  className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Undo"
                >
                    <Undo2 className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <button 
                    onClick={handleRedo} 
                    disabled={historyStep === history.length - 1}
                    className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Redo"
                >
                    <Redo2 className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Canvas Area */}
        <div 
            ref={containerRef} 
            className="flex-grow relative bg-[#020617] flex items-center justify-center overflow-hidden cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        >
            {/* Grid Pattern */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain shadow-2xl relative z-0" />
            
            {!isDrawing && annotations.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="flex items-center gap-3 px-6 py-3 bg-black/70 backdrop-blur-md rounded-full border border-slate-700/50 text-slate-300">
                        <MousePointer2 className="w-4 h-4 text-cyan-400 animate-bounce" />
                        <span className="text-xs font-mono tracking-wide">CLICK & DRAG TO DESIGNATE TARGET</span>
                    </div>
                </div>
            )}
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row gap-4 items-stretch md:items-center relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
            
            {/* Location Input Group */}
            <div className="flex-grow flex items-center gap-2">
                <div className="flex-grow relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter location identifier..."
                    className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 text-sm font-sans py-2.5 pl-10 pr-3 rounded focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                  />
                </div>
                <button
                    onClick={() => setShowMap(true)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 text-cyan-400 px-4 py-2.5 rounded transition-all shadow-sm"
                    title="Open Map Interface"
                >
                    <Globe className="w-5 h-5" />
                </button>
            </div>

            <div className="flex gap-3 shrink-0">
              <button 
                  onClick={onRetake}
                  className="px-5 py-2.5 bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-sm rounded transition-colors flex items-center gap-2"
              >
                  <RefreshCw className="w-4 h-4" />
                  Reset
              </button>
              <button 
                  onClick={handleConfirm}
                  disabled={location.trim() === ""}
                  className={`px-8 py-2.5 font-bold text-sm uppercase tracking-wide rounded shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5
                    ${location.trim() === "" 
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-cyan-900/20'}
                  `}
              >
                  <Check className="w-4 h-4" />
                  Lock & Analyze
              </button>
            </div>
        </div>
    </div>
  );
};