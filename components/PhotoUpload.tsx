import React, { useState } from 'react';

const MAX_DATA_URL_LENGTH = 60000;
const MAX_FILE_SIZE_MB = 8;

export async function compressImageFile(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    });

    const originalW = Math.max(1, img.naturalWidth || img.width || 1);
    const originalH = Math.max(1, img.naturalHeight || img.height || 1);

    const targets = [
      { maxSide: 512, quality: 0.82 },
      { maxSide: 384, quality: 0.78 },
      { maxSide: 256, quality: 0.74 },
      { maxSide: 192, quality: 0.7 },
      { maxSide: 160, quality: 0.68 },
      { maxSide: 128, quality: 0.65 },
    ];

    for (const t of targets) {
      const scale = Math.min(1, t.maxSide / Math.max(originalW, originalH));
      const w = Math.max(1, Math.round(originalW * scale));
      const h = Math.max(1, Math.round(originalH * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      ctx.drawImage(img, 0, 0, w, h);

      const webp = canvas.toDataURL('image/webp', t.quality);
      if (webp.length <= MAX_DATA_URL_LENGTH) return webp;

      const jpeg = canvas.toDataURL('image/jpeg', Math.min(0.85, t.quality + 0.08));
      if (jpeg.length <= MAX_DATA_URL_LENGTH) return jpeg;
    }

    throw new Error('Imagem muito grande. Tente uma foto menor.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

interface PhotoUploadProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  className?: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  value,
  onChange,
  label = 'Foto do equipamento',
  placeholder = 'Clique para adicionar foto',
  helperText,
  className = '',
}) => {
  const inputId = React.useId();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    void (async () => {
      try {
        if (!file.type.startsWith('image/')) {
          setError('Arquivo inválido. Selecione uma imagem (JPG, PNG, etc.).');
          return;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          setError(`Imagem muito grande. Use até ${MAX_FILE_SIZE_MB}MB.`);
          return;
        }
        const dataUrl = await compressImageFile(file);
        onChange(dataUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao processar imagem';
        setError(msg);
      } finally {
        setIsUploading(false);
      }
    })();
    e.target.value = '';
  };

  const handleClear = () => {
    setError(null);
    onChange('');
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal">{label}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <label
          htmlFor={inputId}
          className={`
            flex-shrink-0 w-full sm:w-40 h-40 rounded-xl border-2 border-dashed cursor-pointer
            flex flex-col items-center justify-center gap-2
            transition-colors overflow-hidden
            ${value
              ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
              : 'border-slate-300 dark:border-slate-600 hover:border-primary/50 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
            }
            ${isUploading ? 'pointer-events-none opacity-70' : ''}
          `}
        >
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {isUploading ? (
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : value ? (
            <>
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              <span className="text-xs text-primary font-medium">Trocar foto</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-4xl text-slate-400">add_a_photo</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 text-center px-2">{placeholder}</span>
            </>
          )}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Remover foto
          </button>
        )}
      </div>
      {helperText && !error && <p className="text-xs text-text-sub-light dark:text-slate-400">{helperText}</p>}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export default PhotoUpload;
