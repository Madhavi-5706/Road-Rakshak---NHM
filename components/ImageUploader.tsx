import React, { useCallback, useState } from 'react';
import { Upload, ScanLine, Aperture, FileUp } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelect(file);
      }
    }
  }, [onImageSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelect(e.target.files[0]);
    }
  }, [onImageSelect]);

  return (
    <div 
      className={`relative group w-full h-[320px] rounded-2xl transition-all duration-500 ease-out cursor-pointer overflow-hidden backdrop-blur-md
        ${isDragging 
          ? 'bg-cyan-900/20 ring-2 ring-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.3)]' 
          : 'bg-[#0B1120] border border-slate-700/50 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-900/10'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
      />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none"></div>

      {/* Animated Scan Line (Visible on Hover/Drag) */}
      <div className={`absolute left-0 right-0 h-1 bg-cyan-400/50 blur-sm transition-all duration-1000 ${isDragging ? 'animate-scan' : 'top-1/2 opacity-0 group-hover:opacity-100 group-hover:animate-scan'}`}></div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
        
        {/* Animated Icon Container */}
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 relative
             ${isDragging ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800/50 text-slate-400 group-hover:bg-cyan-950/50 group-hover:text-cyan-400 group-hover:scale-110'}
        `}>
          {isDragging ? <ScanLine className="w-10 h-10 animate-pulse" /> : <Upload className="w-10 h-10" />}
          
          {/* Rotating borders */}
          <div className="absolute inset-0 border border-current opacity-30 rounded-2xl animate-[spin_10s_linear_infinite]"></div>
        </div>
        
        <div className="space-y-3 max-w-sm">
          <h3 className={`text-xl font-bold tracking-tight transition-colors ${isDragging ? 'text-cyan-400' : 'text-white group-hover:text-cyan-100'}`}>
            {isDragging ? 'RELEASE TO SCAN' : 'Drop Evidence Imagery'}
          </h3>
          <p className="text-slate-500 text-sm font-medium">
            Drag & drop road hazard photos, or <span className="text-cyan-500 underline decoration-cyan-500/30 underline-offset-4">browse system</span>
          </p>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-6 flex gap-4 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
           <span className="flex items-center gap-1.5"><FileUp className="w-3 h-3" /> JPG</span>
           <span className="flex items-center gap-1.5"><FileUp className="w-3 h-3" /> PNG</span>
           <span className="flex items-center gap-1.5"><FileUp className="w-3 h-3" /> WEBP</span>
        </div>
      </div>
    </div>
  );
};