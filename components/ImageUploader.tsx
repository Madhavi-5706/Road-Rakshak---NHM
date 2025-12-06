import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, Camera, Video, Loader2, Image as ImageIcon, Film, X, SwitchCamera, Circle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { t } = useLanguage();
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Stop camera stream tracks
  const stopCamera = useCallback(() => {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
    }
    setShowCamera(false);
    setCameraError(null);
  }, [cameraStream]);

  // Start camera
  const startCamera = async (mode: 'user' | 'environment' = 'environment') => {
    try {
        setCameraError(null);
        // Check if browser supports mediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Camera API not supported");
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: mode,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false 
        });
        
        setCameraStream(stream);
        setShowCamera(true);
        setFacingMode(mode);

    } catch (err) {
        console.warn("In-app camera failed, falling back to native input", err);
        // Fallback to native input
        stopCamera();
        cameraInputRef.current?.click();
    }
  };

  // Switch between front/back camera
  const switchCameraMode = async () => {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    await startCamera(newMode);
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (videoPreviewRef.current) {
        const video = videoPreviewRef.current;
        const canvas = document.createElement('canvas');
        
        // Handle dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Flip if user mode (mirror effect fix)
            if (facingMode === 'user') {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onImageSelect(file);
                    stopCamera();
                } else {
                    setCameraError("Failed to capture image");
                }
            }, 'image/jpeg', 0.9);
        }
    }
  };

  const handleNativeFallback = () => {
      stopCamera();
      cameraInputRef.current?.click();
  };

  // Attach stream to video element when ready
  useEffect(() => {
    if (showCamera && videoPreviewRef.current && cameraStream) {
        videoPreviewRef.current.srcObject = cameraStream;
    }
  }, [showCamera, cameraStream]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
    };
  }, []);

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

        {/* Camera Modal Overlay */}
        {showCamera && (
            <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
                <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
                     <button 
                        onClick={handleNativeFallback} 
                        className="hidden md:block px-3 py-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm text-xs font-bold border border-white/20 transition-colors"
                     >
                        {t('use_native_camera')}
                     </button>
                    <button onClick={stopCamera} className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow relative flex items-center justify-center bg-black overflow-hidden">
                    <video 
                        ref={videoPreviewRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                    {cameraError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                            <span className="text-white font-bold px-4 text-center">{cameraError}</span>
                        </div>
                    )}
                    
                    {/* Native fallback button (mobile position) */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center md:hidden">
                        <button 
                            onClick={handleNativeFallback} 
                            className="px-4 py-2 rounded-full bg-black/50 text-white backdrop-blur-sm text-xs font-bold border border-white/20"
                        >
                            {t('use_native_camera')}
                        </button>
                    </div>
                </div>

                <div className="h-32 bg-black/90 flex items-center justify-around pb-6 px-8 relative z-30">
                    <button 
                         onClick={switchCameraMode}
                         className="p-3 rounded-full bg-slate-800 text-white hover:bg-slate-700 active:scale-95 transition-all"
                         aria-label="Switch Camera"
                    >
                        <SwitchCamera className="w-6 h-6" />
                    </button>

                    <button 
                        onClick={capturePhoto}
                        className="p-1 rounded-full border-4 border-white hover:border-slate-300 transition-colors active:scale-95"
                        aria-label="Capture Photo"
                    >
                        <div className="w-16 h-16 rounded-full bg-white hover:bg-slate-200 transition-colors"></div>
                    </button>

                    <div className="w-12"></div> {/* Spacer for symmetry */}
                </div>
            </div>
        )}

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
                onClick={() => startCamera()}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-india-navy transition-all shadow-sm group active:bg-slate-100"
                aria-label={t('take_photo')}
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
                className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-india-navy transition-all shadow-sm group active:bg-slate-100"
                aria-label={t('record_video')}
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