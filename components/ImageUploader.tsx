import React, { useCallback, useState } from 'react';
import { Upload, Aperture } from 'lucide-react';

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
      className={`relative group w-full h-[300px] border border-dashed transition-all duration-300 ease-out cursor-pointer overflow-hidden bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center
        ${isDragging 
          ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]' 
          : 'border-slate-700 hover:border-cyan-500/50 hover:bg-slate-900'}
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
      
      {/* Corner Brackets */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-t border-l transition-colors duration-300 ${isDragging ? 'border-cyan-400' : 'border-slate-600'}`}></div>
      <div className={`absolute top-0 right-0 w-4 h-4 border-t border-r transition-colors duration-300 ${isDragging ? 'border-cyan-400' : 'border-slate-600'}`}></div>
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b border-l transition-colors duration-300 ${isDragging ? 'border-cyan-400' : 'border-slate-600'}`}></div>
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b border-r transition-colors duration-300 ${isDragging ? 'border-cyan-400' : 'border-slate-600'}`}></div>

      <div className="z-10 flex flex-col items-center space-y-6 px-4 text-center pointer-events-none">
        <div className={`p-6 rounded-full bg-slate-950 border transition-all duration-500 relative
             ${isDragging ? 'border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'border-slate-700 text-slate-500 group-hover:border-cyan-500/50 group-hover:text-cyan-500'}
        `}>
          <Upload className="w-8 h-8 relative z-10" />
          {/* Rotating ring effect */}
          <div className="absolute inset-0 rounded-full border border-dashed border-current opacity-20 animate-[spin_10s_linear_infinite]"></div>
        </div>
        
        <div className="space-y-1">
          <p className="text-lg font-mono font-bold tracking-wider uppercase text-slate-300 group-hover:text-white transition-colors">
            {isDragging ? '>> INITIALIZE UPLINK <<' : 'Upload Source Imagery'}
          </p>
          <p className="text-slate-500 text-xs font-mono">
            [ SUPPORTED FORMATS: JPG, PNG, WEBP ]
          </p>
        </div>
      </div>
    </div>
  );
};