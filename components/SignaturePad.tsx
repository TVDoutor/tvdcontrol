import React, { useRef, useEffect, useState, useCallback } from 'react';

interface SignaturePadProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const WIDTH = 300;
const HEIGHT = 120;

const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  label = 'Assinatura',
  placeholder = 'Assine no quadro abaixo',
  disabled = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const hasDrawn = useRef(false);

  const getPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const point = getPoint(e);
      if (!point) return;

      e.preventDefault();
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#1e293b';
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      hasDrawn.current = true;
    },
    [disabled, getPoint]
  );

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      const point = getPoint(e);
      if (!point) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      setIsDrawing(true);
    },
    [disabled, getPoint]
  );

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn.current) return;

    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  }, [isDrawing, onChange]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onChange('');
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, WIDTH, HEIGHT);

    if (value && value.startsWith('data:image')) {
      hasDrawn.current = true;
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
      };
      img.src = value;
    } else {
      hasDrawn.current = false;
    }
  }, [value]);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{placeholder}</p>
      <div className="relative rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="w-full touch-none cursor-crosshair block"
          style={{ width: '100%', height: HEIGHT }}
          onMouseDown={startDraw}
          onMouseMove={isDrawing ? draw : undefined}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          onTouchCancel={endDraw}
        />
      </div>
      <button
        type="button"
        onClick={clear}
        disabled={disabled || !value}
        className="mt-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50"
      >
        Limpar assinatura
      </button>
    </div>
  );
};

export default SignaturePad;
