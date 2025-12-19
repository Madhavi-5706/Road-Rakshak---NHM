
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, Camera, Video, Loader2, Image as ImageIcon, Film, X, SwitchCamera, Circle, StopCircle, RefreshCw, AlertCircle, Play, Pause, Check, RotateCcw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
}

type CaptureState = 'IDLE' | 'LIVE' | 'RECORDING' | 'PAUSED' | 'REVIEW';

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Camera & Recording State
  const [captureState, setCaptureState] = useState<CaptureState>('IDLE');
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Review State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const { t } = useLanguage();
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const reviewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Stop camera stream tracks
  const stopCameraStream = useCallback(() => {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
    }
  }, [cameraStream]);

  const resetCapture = useCallback(() => {
    stopCameraStream();
    if (timerRef.current) clearInterval(timerRef.current);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    
    setCaptureState('IDLE');
    setRecordingTime(0);
    setCameraError(null);
    setPreviewUrl(null);
    setCapturedFile(null);
    chunksRef.current = [];
  }, [stopCameraStream, previewUrl]);

  // Start camera for either photo or video
  const startCamera = async (type: 'photo' | 'video', mode: 'user' | 'environment' = 'environment') => {
    try {
        setCameraError(null);
        setCameraMode(type);
        setPreviewUrl(null);
        setCapturedFile(null);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Camera API not supported in this browser.");
        }

        const constraints = { 
            video: { 
                facingMode: mode,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: type === 'video'
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setCameraStream(stream);
            setCaptureState('LIVE');
            setFacingMode(mode);
        } catch (err: any) {
            console.warn("Primary camera constraints failed, attempting fallback:", err);
            const basicStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: type === 'video' 
            });
            setCameraStream(basicStream);
            setCaptureState('LIVE');
            setFacingMode('user');
        }
    } catch (err: any) {
        console.error("Camera access failed:", err);
        setCameraError("Camera access was denied or unavailable. Please check permissions.");
        setCaptureState('LIVE'); // To show the error UI in the modal
    }
  };

  const switchCameraMode = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    stopCameraStream();
    setTimeout(() => startCamera(cameraMode, newMode), 100);
  };

  // Capture Photo Logic
  const capturePhoto = () => {
    if (videoPreviewRef.current) {
        const video = videoPreviewRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            if (facingMode === 'user') {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }
            ctx.drawImage(video, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setCapturedFile(file);
                    setPreviewUrl(URL.createObjectURL(blob));
                    setCaptureState('REVIEW');
                    stopCameraStream();
                }
            }, 'image/jpeg', 0.95);
        }
    }
  };

  // Video Recording Logic
  const startRecording = () => {
    if (!cameraStream) return;
    
    chunksRef.current = [];
    const options = { mimeType: 'video/webm;codecs=vp8,opus' };
    
    try {
        const recorder = new MediaRecorder(cameraStream, options);
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
            setCapturedFile(file);
            setPreviewUrl(URL.createObjectURL(blob));
            setCaptureState('REVIEW');
            stopCameraStream();
        };
        
        recorder.start(1000); // Collect data every second
        mediaRecorderRef.current = recorder;
        setCaptureState('RECORDING');
        
        setRecordingTime(0);
        timerRef.current = window.setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);

    } catch (e) {
        setCameraError("Recording not supported on this browser.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && captureState === 'RECORDING') {
      mediaRecorderRef.current.pause();
      setCaptureState('PAUSED');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && captureState === 'PAUSED') {
      mediaRecorderRef.current.resume();
      setCaptureState('RECORDING');
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (captureState === 'RECORDING' || captureState === 'PAUSED')) {
        mediaRecorderRef.current.stop();
        if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleUseEvidence = async () => {
    if (!capturedFile) return;
    
    if (capturedFile.type.startsWith('video/')) {
      try {
        setIsProcessing(true);
        const frame = await extractFrameFromVideo(capturedFile);
        onImageSelect(frame);
      } catch (e) {
        alert("Frame extraction failed. Please try a photo.");
      } finally {
        setIsProcessing(false);
        resetCapture();
      }
    } else {
      onImageSelect(capturedFile);
      resetCapture();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (captureState === 'LIVE' || captureState === 'RECORDING' || captureState === 'PAUSED') {
      if (videoPreviewRef.current && cameraStream) {
          videoPreviewRef.current.srcObject = cameraStream;
      }
    }
  }, [captureState, cameraStream]);

  const extractFrameFromVideo = (videoFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(videoFile);
        video.muted = true;
        video.onloadeddata = () => { video.currentTime = Math.min(1.0, video.duration / 2); };
        video.onseeked = () => {
             const canvas = document.createElement('canvas');
             canvas.width = video.videoWidth;
             canvas.height = video.videoHeight;
             const ctx = canvas.getContext('2d');
             if (ctx) {
                 ctx.drawImage(video, 0, 0);
                 canvas.toBlob((blob) => {
                     if (blob) resolve(new File([blob], `frame_${videoFile.name}.jpg`, { type: 'image/jpeg' }));
                     else reject(new Error("Capture failed"));
                     URL.revokeObjectURL(video.src);
                 }, 'image/jpeg', 0.9);
             }
        };
        video.onerror = () => reject(new Error("Video error"));
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        processVideoFile(file);
      } else {
        onImageSelect(file);
      }
    }
  };

  const processVideoFile = async (file: File) => {
    try {
      setIsProcessing(true);
      const frame = await extractFrameFromVideo(file);
      onImageSelect(frame);
    } catch (e) {
      alert("Video processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
        
        <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
        />

        {/* Capture Suite Modal */}
        {captureState !== 'IDLE' && (
            <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
                {/* Top Nav */}
                <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                      <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${captureState === 'RECORDING' ? 'bg-red-500 animate-pulse' : (captureState === 'REVIEW' ? 'bg-blue-500' : 'bg-green-500')}`}></div>
                          {captureState === 'REVIEW' ? 'REVIEW EVIDENCE' : (cameraMode === 'photo' ? 'PHOTO MODE' : `REC ${formatTime(recordingTime)}`)}
                      </div>
                      {captureState === 'PAUSED' && (
                        <div className="px-3 py-1 bg-yellow-500 text-black text-[9px] font-black rounded-sm uppercase self-start">PAUSED</div>
                      )}
                    </div>

                    <button onClick={resetCapture} className="p-2.5 rounded-full bg-black/40 text-white hover:bg-red-600 transition-all hover:scale-110">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Main Viewport */}
                <div className="flex-grow relative flex items-center justify-center bg-black overflow-hidden">
                    {(captureState === 'LIVE' || captureState === 'RECORDING' || captureState === 'PAUSED') && !cameraError && (
                        <video 
                            ref={videoPreviewRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                        />
                    )}
                    
                    {captureState === 'REVIEW' && previewUrl && (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900">
                        {cameraMode === 'photo' ? (
                          <img src={previewUrl} className="max-w-full max-h-full object-contain shadow-2xl" />
                        ) : (
                          <video ref={reviewVideoRef} src={previewUrl} controls autoPlay className="max-w-full max-h-full" />
                        )}
                      </div>
                    )}

                    {cameraError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-8 text-center">
                            <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
                            <h3 className="text-xl font-bold text-white mb-2">Access Error</h3>
                            <p className="text-slate-400 max-w-sm mb-8">{cameraError}</p>
                            <button onClick={() => startCamera(cameraMode, facingMode)} className="px-8 py-3 bg-india-navy text-white font-bold rounded-lg flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Retry Access</button>
                        </div>
                    )}
                </div>

                {/* Bottom Controls */}
                <div className="h-40 bg-gradient-to-t from-black to-transparent flex items-center justify-around pb-8 px-8 relative z-50">
                    {captureState === 'REVIEW' ? (
                      <div className="flex items-center gap-12 w-full max-w-sm">
                        <button 
                          onClick={() => {
                            if (previewUrl) URL.revokeObjectURL(previewUrl);
                            setPreviewUrl(null);
                            setCapturedFile(null);
                            startCamera(cameraMode, facingMode);
                          }}
                          className="flex-1 flex flex-col items-center gap-2 group"
                        >
                          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-all">
                            <RotateCcw className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] text-white font-bold uppercase tracking-wider">Retake</span>
                        </button>

                        <button 
                          onClick={handleUseEvidence}
                          className="flex-1 flex flex-col items-center gap-2 group"
                        >
                          <div className="w-14 h-14 rounded-full bg-india-green flex items-center justify-center text-white group-hover:bg-green-600 transition-all shadow-lg shadow-green-900/40">
                            <Check className="w-8 h-8" />
                          </div>
                          <span className="text-[10px] text-white font-bold uppercase tracking-wider">Use Evidence</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                             onClick={switchCameraMode}
                             disabled={captureState === 'RECORDING' || captureState === 'PAUSED'}
                             className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90 disabled:opacity-0"
                        >
                            <SwitchCamera className="w-6 h-6" />
                        </button>

                        <div className="relative flex items-center justify-center">
                           {cameraMode === 'video' && (captureState === 'RECORDING' || captureState === 'PAUSED') && (
                             <button 
                               onClick={captureState === 'RECORDING' ? pauseRecording : resumeRecording}
                               className="absolute -left-16 p-3 rounded-full bg-white/20 text-white border border-white/20 animate-in slide-in-from-right-4"
                             >
                               {captureState === 'RECORDING' ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                             </button>
                           )}

                           {cameraMode === 'photo' ? (
                               <button 
                                   onClick={capturePhoto}
                                   className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-all shadow-2xl"
                               >
                                   <div className="w-16 h-16 rounded-full bg-white"></div>
                               </button>
                           ) : (
                               <button 
                                   onClick={captureState === 'RECORDING' || captureState === 'PAUSED' ? stopRecording : startRecording}
                                   className={`w-20 h-20 rounded-full border-4 flex items-center justify-center active:scale-95 transition-all shadow-2xl ${captureState === 'RECORDING' || captureState === 'PAUSED' ? 'border-white' : 'border-white'}`}
                               >
                                   {captureState === 'RECORDING' || captureState === 'PAUSED' ? (
                                       <div className="w-8 h-8 bg-red-600 rounded-sm shadow-inner"></div>
                                   ) : (
                                       <div className="w-16 h-16 rounded-full bg-red-600 border-2 border-black/10"></div>
                                   )}
                               </button>
                           )}
                        </div>

                        <div className="w-14 h-14 flex items-center justify-center text-white/40">
                           {cameraMode === 'photo' ? <ImageIcon className="w-6 h-6" /> : <Film className="w-6 h-6" />}
                        </div>
                      </>
                    )}
                </div>
            </div>
        )}

        {/* Home View Upload Area */}
        <div 
          className={`relative group w-full h-[240px] rounded-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden
            ${isDragging 
              ? 'bg-orange-50 border-2 border-orange-400 border-dashed' 
              : 'bg-white border-2 border-slate-200 border-dashed hover:border-india-navy hover:bg-slate-50 hover:shadow-lg'}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files) processVideoFile(e.dataTransfer.files[0]); }}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          {isProcessing ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-india-navy animate-spin mb-3" />
                  <p className="text-sm font-bold text-slate-700">{t('processing_video')}</p>
              </div>
          ) : (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-india-navy flex items-center justify-center mb-4 group-hover:bg-india-navy group-hover:text-white transition-colors">
                    <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{t('upload_title')}</h3>
                <p className="text-slate-500 text-xs mt-1">
                    {t('upload_desc')} <span className="text-india-navy font-semibold underline">{t('browse_files')}</span>
                </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
            <button 
                type="button"
                onClick={() => startCamera('photo')}
                className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-india-navy transition-all shadow-sm active:scale-95"
            >
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-700 text-sm">{t('take_photo')}</span>
            </button>

            <button 
                type="button"
                onClick={() => startCamera('video')}
                className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-india-navy transition-all shadow-sm active:scale-95"
            >
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                    <Video className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-700 text-sm">{t('record_video')}</span>
            </button>
        </div>
    </div>
  );
};
