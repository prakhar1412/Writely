import { useEffect, useRef, useState } from 'react';
import type { Stroke, InsertStroke } from '@shared/schema';

interface WhiteboardCanvasProps {
  templateImage?: string;
  onStrokeComplete?: (stroke: InsertStroke) => void;
  color?: string;
  brushSize?: number;
  tool?: 'pen' | 'eraser';
  isLocked?: boolean;
  existingStrokes?: Stroke[];
}

export default function WhiteboardCanvas({
  templateImage,
  onStrokeComplete,
  color = '#000000',
  brushSize = 3,
  tool = 'pen',
  isLocked = false,
  existingStrokes = [],
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);

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
      
      // Redraw existing strokes
      existingStrokes.forEach(drawStoredStroke);
    };

    const drawStoredStroke = (stroke: Stroke) => {
      if (!ctx || stroke.points.length === 0) return;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
      ctx.lineWidth = stroke.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Listen for remote strokes
    const handleRemoteStroke = (event: Event) => {
      const customEvent = event as CustomEvent<Stroke>;
      drawStoredStroke(customEvent.detail);
    };

    window.addEventListener('remote-stroke', handleRemoteStroke);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('remote-stroke', handleRemoteStroke);
    };
  }, [existingStrokes]);

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
