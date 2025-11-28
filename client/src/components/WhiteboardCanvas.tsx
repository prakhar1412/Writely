import { useEffect, useRef, useState } from "react";
import type { Stroke, InsertStroke } from "@shared/schema";

interface WhiteboardCanvasProps {
  templateImage?: string;
  onStrokeComplete?: (stroke: InsertStroke) => void;
  color?: string;
  brushSize?: number;
  tool?: "pen" | "eraser" | "rectangle" | "circle" | "text" | "marker" | "highlighter";
  isLocked?: boolean;
  existingStrokes?: Stroke[];
}

export default function WhiteboardCanvas({
  templateImage,
  onStrokeComplete,
  color = "#000000",
  brushSize = 3,
  tool = "pen",
  isLocked = false,
  existingStrokes = [],
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<
    { x: number; y: number }[]
  >([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const drawStoredStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return;

    ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
    ctx.lineWidth = stroke.brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();

    if (stroke.tool === "highlighter") {
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = stroke.brushSize * 2; // Thicker for highlighter
      ctx.globalCompositeOperation = "source-over";
    } else if (stroke.tool === "marker") {
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = stroke.brushSize;
      ctx.globalCompositeOperation = "source-over";
      // Marker could have a different cap/join if we wanted, but round is fine for now
    } else if (stroke.tool === "eraser") {
      ctx.strokeStyle = "#ffffff";
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = stroke.brushSize;
      ctx.lineCap = "square";
      ctx.lineJoin = "bevel";
    } else {
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = "source-over";
    }

    if (stroke.tool === "rectangle") {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (stroke.tool === "circle") {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (stroke.tool === "text") {
      if (stroke.text) {
        ctx.font = `${stroke.brushSize * 5}px sans-serif`;
        ctx.fillStyle = stroke.color;
        ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
      }
    } else {
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0; // Reset alpha
    ctx.globalCompositeOperation = "source-over"; // Reset composite operation
  };

  const redrawCanvas = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (templateImage) {
      // We need to redraw the image if it exists, but since it's an img tag overlay, we might not need to draw it on canvas for display,
      // BUT we need it for export. For now, let's assume export only captures strokes or we need to draw image on canvas.
      // The current implementation uses an <img> tag for display.
      // For export, we'll handle it separately or draw it here.
      // Let's stick to strokes for now to avoid complexity with image loading.
    }
    existingStrokes.forEach((stroke) => drawStoredStroke(ctx, stroke));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      redrawCanvas(ctx, canvas);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Listen for remote strokes
    const handleRemoteStroke = (event: Event) => {
      const customEvent = event as CustomEvent<Stroke>;
      drawStoredStroke(ctx, customEvent.detail);
    };

    const handleSaveCanvas = () => {
      const link = document.createElement('a');
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };

    window.addEventListener("remote-stroke", handleRemoteStroke);
    window.addEventListener("save-canvas", handleSaveCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("remote-stroke", handleRemoteStroke);
      window.removeEventListener("save-canvas", handleSaveCanvas);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    redrawCanvas(ctx, canvas);
  }, [existingStrokes]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLocked) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "text") {
      const text = prompt("Enter text:");
      if (text) {
        onStrokeComplete?.({
          points: [{ x, y }],
          color,
          brushSize,
          tool,
          text
        });
      }
      return;
    }

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentStroke([{ x, y }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isLocked) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "rectangle" || tool === "circle") {
      redrawCanvas(ctx, canvas); // Clear and redraw existing
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      if (startPoint) {
        if (tool === "rectangle") {
          ctx.strokeRect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y);
        } else {
          const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
          ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(
        currentStroke[currentStroke.length - 1].x,
        currentStroke[currentStroke.length - 1].y
      );
      ctx.lineTo(x, y);

      if (tool === "highlighter") {
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize * 2;
        ctx.globalAlpha = 0.5;
        ctx.globalCompositeOperation = "source-over";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      } else if (tool === "eraser") {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = brushSize;
        ctx.globalCompositeOperation = "source-over";
        ctx.lineCap = "square";
        ctx.lineJoin = "bevel";
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = "source-over";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }

      ctx.stroke();
      ctx.globalAlpha = 1.0; // Reset
      ctx.globalCompositeOperation = "source-over"; // Reset
    }

    setCurrentStroke([...currentStroke, { x, y }]);
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke.length > 0) {
      onStrokeComplete?.({ points: currentStroke, color, brushSize, tool });
    }
    setIsDrawing(false);
    setCurrentStroke([]);
    setStartPoint(null);
  };

  const getCursor = () => {
    const createCursor = (icon: string, size: number = 24) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`;
      const url = `data:image/svg+xml;base64,${btoa(svg)}`;
      return `url("${url}") 0 24, auto`;
    };

    if (tool === "eraser") {
      const size = Math.max(brushSize, 12);
      const halfSize = size / 2;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect x="0" y="0" width="${size}" height="${size}" fill="white" stroke="black" stroke-width="1"/></svg>`;
      const url = `data:image/svg+xml;base64,${btoa(svg)}`;
      return `url("${url}") ${halfSize} ${halfSize}, auto`;
    }

    if (tool === "text") {
      return "text";
    }

    if (tool === "pen") {
      // Simple pen icon
      return createCursor('<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>');
    }

    if (tool === "marker" || tool === "highlighter") {
      // Marker icon
      return createCursor('<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>');
    }

    return "crosshair";
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
        className="absolute inset-0"
        style={{ cursor: getCursor() }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}
