import { useEffect, useRef, useState } from 'react';

interface WhiteboardCanvasProps {
  templateImage?: string;
  onStrokeComplete?: (stroke: any) => void;
  color?: string;
  brushSize?: number;
  tool?: 'pen' | 'eraser';
  isLocked?: boolean;
}

export default function WhiteboardCanvas({
  templateImage,
  onStrokeComplete,
  color = '#000000',
  brushSize = 3,
  tool = 'pen',
  isLocked = false,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLocked) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isLocked) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(currentStroke[currentStroke.length - 1].x, currentStroke[currentStroke.length - 1].y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    setCurrentStroke([...currentStroke, { x, y }]);
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke.length > 0) {
      onStrokeComplete?.({ points: currentStroke, color, brushSize, tool });
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {templateImage && (
        <img
          src={templateImage}
          alt="Template"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-30"
        />
      )}
      <canvas
        ref={canvasRef}
        data-testid="canvas-whiteboard"
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}
