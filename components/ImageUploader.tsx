import React, { useCallback, useState } from 'react';
import { Upload, FileImage, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useLanguage();

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
      className={`relative group w-full h-[280px] rounded-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden
        ${isDragging 
          ? 'bg-orange-50 border-2 border-orange-400 border-dashed' 
          : 'bg-white border-2 border-slate-200 border-dashed hover:border-india-navy hover:bg-slate-50 hover:shadow-lg'}
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

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
        
        {/* Icon Container */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-300
             ${isDragging ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-india-navy group-hover:bg-india-navy group-hover:text-white'}
        `}>
          <Upload className="w-8 h-8" />
        </div>
        
        <div className="space-y-2 max-w-sm">
          <h3 className={`text-lg font-bold tracking-tight transition-colors ${isDragging ? 'text-orange-700' : 'text-slate-800'}`}>
            {isDragging ? t('drop_title') : t('upload_title')}
          </h3>
          <p className="text-slate-500 text-sm">
            {t('upload_desc')} <span className="text-india-navy font-semibold underline decoration-india-navy/30 underline-offset-4">{t('browse_files')}</span>
          </p>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-6 flex gap-6 text-xs font-semibold text-slate-400">
           <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> JPEG</span>
           <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> PNG</span>
           <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> WEBP</span>
        </div>
      </div>
    </div>
  );
};
