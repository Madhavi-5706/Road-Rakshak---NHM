import React, { useRef, useState, useEffect } from 'react';
import { Scan, MousePointer2, Check, RefreshCw, MapPin, Undo2, Redo2, Tag, Globe } from 'lucide-react';
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

    // Apply dark overlay to make selection pop (simulated night vision / tactical view)
    if (hasAnySelection) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.5)'; // Dark slate overlay
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Helper to punch holes in the overlay (reveal image below)
        const revealRect = (r: Annotation) => {
            ctx.save();
            ctx.beginPath();
            ctx.rect(r.x, r.y, r.w, r.h);
            ctx.clip();
            ctx.drawImage(img, 0, 0);
            ctx.restore();
        };

        // Reveal all committed annotations
        currentAnnotations.forEach(revealRect);
        // Reveal current drawing
        if (currentRect) revealRect(currentRect);

        // --- DRAW COMMITTED ANNOTATIONS ---
        currentAnnotations.forEach(rect => {
            // Solid Border
            ctx.strokeStyle = '#06b6d4'; // Cyan
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

            // Normalized coordinates for consistent corner drawing
            const rx = rect.w > 0 ? rect.x : rect.x + rect.w;
            const ry = rect.h > 0 ? rect.y : rect.y + rect.h;
            const rw = Math.abs(rect.w);
            const rh = Math.abs(rect.h);

            // Draw corner accents
            const cornerSize = 16;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            // TL
            ctx.moveTo(rx, ry + cornerSize); ctx.lineTo(rx, ry); ctx.lineTo(rx + cornerSize, ry);
            // TR
            ctx.moveTo(rx + rw - cornerSize, ry); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + cornerSize);
            // BR
            ctx.moveTo(rx + rw, ry + rh - cornerSize); ctx.lineTo(rx + rw, ry + rh); ctx.lineTo(rx + rw - cornerSize, ry + rh);
            // BL
            ctx.moveTo(rx + cornerSize, ry + rh); ctx.lineTo(rx, ry + rh); ctx.lineTo(rx, ry + rh - cornerSize);
            
            ctx.stroke();

            // Draw Label Tag
            if (rect.label) {
                ctx.font = "bold 12px 'JetBrains Mono', monospace";
                const textMetrics = ctx.measureText(rect.label);
                const textWidth = textMetrics.width;
                const textHeight = 12;
                const padding = 6;
                
                // Position tag above top-left
                const tagX = rx;
                const tagY = ry - (textHeight + padding * 2);
                
                // Draw tag background
                ctx.fillStyle = '#06b6d4';
                // If tag goes off top, move it inside
                const drawY = tagY > 0 ? tagY : ry;
                ctx.fillRect(tagX, drawY, textWidth + padding * 2, textHeight + padding * 2);
                
                // Draw text
                ctx.fillStyle = '#000000';
                ctx.textBaseline = 'top';
                ctx.fillText(rect.label, tagX + padding, drawY + padding);
            }
        });

        // --- DRAW CURRENT RECT (Dynamic Feedback) ---
        if (currentRect) {
            // Dashed Border
            ctx.save();
            ctx.strokeStyle = '#22d3ee'; // Lighter cyan
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]); // Dashed
            ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
            ctx.restore();

            // Dynamic Size Indicator
            const w = Math.round(Math.abs(currentRect.w));
            const h = Math.round(Math.abs(currentRect.h));
            const sizeText = `${w} × ${h}`;

            ctx.font = "11px 'JetBrains Mono', monospace";
            const tm = ctx.measureText(sizeText);
            const padding = 6;
            const bgHeight = 20;

            // Position near the bottom-right of the selection (follow cursor area)
            // Normalize current rect end point
            const endX = currentRect.x + currentRect.w;
            const endY = currentRect.y + currentRect.h;
            
            // Offset slightly
            const indicatorX = endX + 12;
            const indicatorY = endY + 12;

            // Draw pill background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.beginPath();
            ctx.roundRect(indicatorX, indicatorY, tm.width + padding * 2, bgHeight, 4);
            ctx.fill();
            
            // Draw text
            ctx.fillStyle = '#22d3ee';
            ctx.textBaseline = 'middle';
            ctx.fillText(sizeText, indicatorX + padding, indicatorY + bgHeight/2);
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

    // Only add if it's a significant drag
    if (Math.abs(w) > 5 && Math.abs(h) > 5) {
        const newRect = { x: startPos.x, y: startPos.y, w, h, label: selectedLabel };
        const newAnnotations = [...annotations, newRect];
        
        // Update History
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newAnnotations);
        
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
        setAnnotations(newAnnotations);
        
        draw(imageElement, newAnnotations, null);
    } else {
        // Redraw to clear the drag preview
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
    <div className="flex flex-col h-full w-full">
        {showMap && (
          <LocationPicker 
            onConfirm={handleMapConfirm} 
            onCancel={() => setShowMap(false)} 
            initialLocation={location}
          />
        )}

        {/* Instructions Bar */}
        <div className="bg-slate-900/80 border-b border-slate-700 p-2 sm:p-3 flex flex-wrap justify-between items-center backdrop-blur-md z-10 gap-2">
            <div className="flex items-center space-x-2 text-cyan-400">
                <Scan className="w-5 h-5 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-widest uppercase hidden sm:inline">Target Designation</span>
            </div>
            
            <div className="flex items-center gap-4 flex-grow justify-center sm:justify-end">
                {/* Hazard Type Selector */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <Tag className="h-3 w-3 text-cyan-500" />
                    </div>
                    <select
                        value={selectedLabel}
                        onChange={(e) => setSelectedLabel(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-slate-300 text-[10px] sm:text-xs font-mono py-1.5 pl-8 pr-8 rounded focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all uppercase appearance-none cursor-pointer hover:bg-slate-900"
                    >
                        {HAZARD_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                         <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-500"></div>
                    </div>
                </div>

                <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
                    {/* Counter Display */}
                     <div className="flex items-center gap-1.5" title="Total Targets Marked">
                        <span className="text-[10px] text-slate-500 font-mono uppercase">COUNT:</span>
                        <span className="text-xs font-bold text-cyan-400 font-mono">{annotations.length}</span>
                    </div>

                    {/* Edit Controls */}
                    <div className="flex items-center gap-1">
                        <button 
                          onClick={handleUndo} 
                          disabled={historyStep === 0}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Undo"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={handleRedo} 
                            disabled={historyStep === history.length - 1}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Redo"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Canvas Area */}
        <div 
            ref={containerRef} 
            className="flex-grow relative bg-black flex items-center justify-center overflow-hidden cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        >
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain shadow-2xl" />
            
            {!isDrawing && annotations.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center p-4 bg-black/60 backdrop-blur rounded-lg border border-slate-700">
                        <MousePointer2 className="w-8 h-8 text-white mx-auto mb-2 animate-bounce" />
                        <p className="text-xs font-mono text-slate-300">SELECT TYPE & DRAG TO MARK</p>
                    </div>
                </div>
            )}
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            
            {/* Location Input Group */}
            <div className="flex-grow flex items-center gap-2">
                <div className="flex-grow relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-500 group-focus-within:text-cyan-400" />
                  </div>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="ENTER LOCATION (e.g. MG Road, Near Clock Tower)"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono py-3 pl-10 pr-3 rounded-l focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all uppercase placeholder:text-slate-600"
                  />
                </div>
                <button
                    onClick={() => setShowMap(true)}
                    className="bg-slate-800 border border-slate-700 hover:border-cyan-500 text-cyan-400 px-3 py-3 rounded-r flex items-center justify-center transition-all hover:bg-slate-700"
                    title="Pin on Map"
                >
                    <Globe className="w-4 h-4" />
                </button>
            </div>

            <div className="flex gap-2 shrink-0">
              <button 
                  onClick={onRetake}
                  className="px-4 py-3 bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider hover:bg-slate-700 rounded transition-colors flex items-center justify-center gap-2"
              >
                  <RefreshCw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset</span>
              </button>
              <button 
                  onClick={handleConfirm}
                  disabled={location.trim() === ""}
                  className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider rounded shadow-lg flex items-center justify-center gap-2 transition-all
                    ${location.trim() === "" 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]'}
                  `}
              >
                  <Check className="w-4 h-4" />
                  Lock Target & Scan
              </button>
            </div>
        </div>
    </div>
  );
};