import React, { useCallback, useState, useRef } from 'react';
import { Upload, Camera, Video, Loader2, Image as ImageIcon, Film } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useLanguage();
  
  // Refs for different input types
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const extractFrameFromVideo = (videoFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        // Safety timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            reject(new Error("Video processing timed out"));
        }, 15000);

        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(videoFile);
        video.muted = true;
        video.playsInline = true;

        video.onloadeddata = () => {
             // Seek to 1 second to avoid black frames at start, or half duration if short
             let timeToCapture = 1.0;
             if (video.duration < 2 && video.duration > 0) {
                 timeToCapture = video.duration / 2;
             }
             video.currentTime = timeToCapture;
        };

        video.onseeked = () => {
             clearTimeout(timeoutId);
             const canvas = document.createElement('canvas');
             canvas.width = video.videoWidth;
             canvas.height = video.videoHeight;
             
             const ctx = canvas.getContext('2d');
             if (ctx) {
                 ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                 canvas.toBlob((blob) => {
                     if (blob) {
                         const capturedFile = new File([blob], `frame_${videoFile.name}.jpg`, { type: 'image/jpeg' });
                         resolve(capturedFile);
                     } else {
                         reject(new Error("Frame capture failed"));
                     }
                     // Cleanup
                     URL.revokeObjectURL(video.src);
                 }, 'image/jpeg', 0.9);
             } else {
                 reject(new Error("Canvas context failed"));
             }
        };

        video.onerror = (e) => {
            clearTimeout(timeoutId);
            reject(new Error("Video load failed"));
        };
    });
  };

  const processFile = async (file: File) => {
      if (!file) return;
      
      if (file.type.startsWith('video/')) {
          try {
              setIsProcessing(true);
              const frame = await extractFrameFromVideo(file);
              onImageSelect(frame);
          } catch (e) {
              console.error(e);
              alert("Could not process video. Please ensure the format is supported or upload an image.");
          } finally {
              setIsProcessing(false);
          }
      } else if (file.type.startsWith('image/')) {
          onImageSelect(file);
      } else {
          alert("Unsupported file type. Please upload an image or video.");
      }
  };

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
      processFile(e.dataTransfer.files[0]);
    }
  }, [onImageSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  }, [onImageSelect]);

  const resetInput = (e: React.MouseEvent<HTMLInputElement>) => {
      (e.target as HTMLInputElement).value = '';
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Hidden Inputs */}
        <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onClick={resetInput}
            onChange={handleFileInput}
            className="hidden"
        />
        <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onClick={resetInput}
            onChange={handleFileInput}
            className="hidden"
        />
        <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            onClick={resetInput}
            onChange={handleFileInput}
            className="hidden"
        />

        {/* Main Drag & Drop Area */}
        <div 
          className={`relative group w-full h-[240px] rounded-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden
            ${isDragging 
              ? 'bg-orange-50 border-2 border-orange-400 border-dashed' 
              : 'bg-white border-2 border-slate-200 border-dashed hover:border-india-navy hover:bg-slate-50 hover:shadow-lg'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          
          {isProcessing ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-india-navy animate-spin mb-3" />
                  <p className="text-sm font-bold text-slate-700 animate-pulse">{t('processing_video')}</p>
              </div>
          ) : (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors duration-300
                    ${isDragging ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-india-navy group-hover:bg-india-navy group-hover:text-white'}
                `}>
                <Upload className="w-7 h-7" />
                </div>
                
                <div className="space-y-1 max-w-sm">
                    <h3 className={`text-lg font-bold tracking-tight transition-colors ${isDragging ? 'text-orange-700' : 'text-slate-800'}`}>
                        {isDragging ? t('drop_title') : t('upload_title')}
                    </h3>
                    <p className="text-slate-500 text-xs">
                        {t('upload_desc')} <span className="text-india-navy font-semibold underline decoration-india-navy/30 underline-offset-4">{t('browse_files')}</span>
                    </p>
                </div>

                <div className="mt-6 flex items-center gap-3 opacity-60">
                    <div className="flex flex-col items-center gap-1">
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-mono">JPG/PNG</span>
                    </div>
                    <div className="w-px h-6 bg-slate-300"></div>
                    <div className="flex flex-col items-center gap-1">
                        <Film className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-mono">MP4/MOV</span>
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Mobile Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
            <button 
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-india-navy transition-all shadow-sm group"
            >
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-700 text-sm">{t('take_photo')}</span>
            </button>

            <button 
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-india-navy transition-all shadow-sm group"
            >
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Video className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-700 text-sm">{t('record_video')}</span>
            </button>
        </div>

    </div>
  );
};