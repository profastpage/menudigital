'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import type { Plan } from '@/lib/plans';

interface Props {
  initialUrl?: string;
  onUploaded: (url: string) => void;
  plan: Plan;
  imagesCount: number;
  shape?: 'circle' | 'square';
  size?: number;
}

export function ImageUploader({
  initialUrl = '',
  onUploaded,
  plan,
  imagesCount,
  shape = 'square',
  size = 80,
}: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canUpload = imagesCount < plan.limits.maxImages;

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Máximo 5MB por imagen');
      return;
    }
    if (!canUpload && !url) {
      toast.error(`Límite de ${plan.limits.maxImages} imágenes alcanzado. Upgrade a Pro.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setUrl(data.url);
      onUploaded(data.url);
      toast.success('Imagen subida');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  }, [canUpload, plan, url, onUploaded]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setUrl('');
    onUploaded('');
    if (inputRef.current) inputRef.current.value = '';
  }

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';
  const isCircle = shape === 'circle';

  return (
    <div className="flex items-start gap-3">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative cursor-pointer flex items-center justify-center transition-all ${
          shapeClass
        } ${
          dragOver ? 'border-[#d4af37] bg-[#d4af37]/10 scale-105' : 'border-white/15 hover:border-[#d4af37]/60 hover:bg-white/5'
        } ${url ? 'border-0' : 'border-2 border-dashed'}`}
        style={{ width: size, height: size }}
      >
        {url ? (
          <>
            <img
              src={url}
              alt=""
              className={`w-full h-full object-cover ${shapeClass}`}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className={`absolute ${isCircle ? '-top-1 -right-1' : 'top-1 right-1'} w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-red-500 z-10`}
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : uploading ? (
          <Loader2 className="w-5 h-5 text-[#d4af37] animate-spin" />
        ) : (
          <div className="text-center">
            {size >= 100 ? (
              <>
                <Upload className="w-5 h-5 text-white/40 mx-auto mb-1" />
                <div className="text-[10px] text-white/50">Click o arrastra</div>
              </>
            ) : (
              <ImageIcon className="w-4 h-4 text-white/30" />
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {size >= 100 && (
        <div className="flex-1 space-y-2 pt-1">
          <p className="text-xs text-white/40">
            {url ? 'Imagen cargada' : 'Sube desde tu dispositivo o arrastra aquí'}
          </p>
          {!canUpload && !url && (
            <p className="text-xs text-amber-400">
              Límite alcanzado ({plan.limits.maxImages}). Upgrade a Pro para más.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
