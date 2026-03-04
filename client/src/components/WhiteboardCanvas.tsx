import { useEffect, useRef, useState, useCallback } from "react";
import type { Stroke, InsertStroke } from "@shared/schema";

interface WhiteboardCanvasProps {
  templateImage?: string;
  onStrokeComplete?: (stroke: InsertStroke) => void;
  color?: string;
  brushSize?: number;
  tool?: "pen" | "eraser" | "rectangle" | "circle" | "text" | "marker" | "highlighter" | "magic";
  isLocked?: boolean;
  existingStrokes?: Stroke[];
  remoteStrokes?: Stroke[];
  onRemoteStrokesConsumed?: () => void;
  saveRef?: React.MutableRefObject<(() => void) | null>;
  /** Called on every pointer/touch move so the parent can emit cursor position */
  onCursorMove?: (x: number, y: number) => void;
}

export default function WhiteboardCanvas({
  templateImage,
  onStrokeComplete,
  color = "#000000",
  brushSize = 3,
  tool = "pen",
  isLocked = false,
  existingStrokes = [],
  remoteStrokes = [],
  onRemoteStrokesConsumed,
  saveRef,
  onCursorMove,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  // ─── Drawing helpers ───────────────────────────────────────────────────────

  const getCtx = () => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  };

  const drawStoredStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return;

    ctx.save();
    ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
    ctx.lineWidth = stroke.brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";

    if (stroke.tool === "highlighter") {
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = stroke.brushSize * 2;
    } else if (stroke.tool === "eraser") {
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = stroke.brushSize * 2;
    }

    ctx.beginPath();

    if (stroke.tool === "rectangle") {
      const s = stroke.points[0];
      const e = stroke.points[stroke.points.length - 1];
      ctx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
    } else if (stroke.tool === "circle") {
      const s = stroke.points[0];
      const e = stroke.points[stroke.points.length - 1];
      const radius = Math.hypot(e.x - s.x, e.y - s.y);
      ctx.arc(s.x, s.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (stroke.tool === "text") {
      if (stroke.text) {
        ctx.font = `${stroke.brushSize * 5}px sans-serif`;
        ctx.fillStyle = stroke.color;
        ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
      }
    } else {
      if (stroke.points.length < 3) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
      } else {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length - 1; i++) {
          const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
          const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
        }
        ctx.lineTo(
          stroke.points[stroke.points.length - 1].x,
          stroke.points[stroke.points.length - 1].y
        );
      }
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    existingStrokes.forEach(s => drawStoredStroke(ctx, s));
  }, [existingStrokes, drawStoredStroke]);

  // ─── Resize ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      redrawCanvas();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    if (saveRef) {
      saveRef.current = () => {
        // Create a temporary canvas with a white background so saved PNGs aren't transparent
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.fillStyle = "#ffffff";
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.drawImage(canvas, 0, 0);
        }
        const link = document.createElement("a");
        link.download = `whiteboard-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL("image/png");
        link.click();
      };
    }

    return () => {
      ro.disconnect();
      if (saveRef) saveRef.current = null;
    };
  }, []);

  useEffect(() => { redrawCanvas(); }, [existingStrokes]);

  // ─── Remote strokes ────────────────────────────────────────────────────────

  useEffect(() => {
    if (remoteStrokes.length === 0) return;
    const ctx = getCtx();
    if (!ctx) return;
    remoteStrokes.forEach(s => drawStoredStroke(ctx, s));
    onRemoteStrokesConsumed?.();
  }, [remoteStrokes]);

  // ─── Image paste (Ctrl+V) ──────────────────────────────────────────────────

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(
        i => i.type.startsWith("image/")
      );
      if (!item) return;
      const file = item.getAsFile();
      if (!file) return;
      pasteImage(file);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // ─── Drag-and-drop image ───────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith("image/"));
    if (file) pasteImage(file);
  };

  const pasteImage = (file: File) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Scale to fit canvas while maintaining aspect ratio, centred
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // ─── Coordinate helpers ────────────────────────────────────────────────────

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // ─── Mouse events ──────────────────────────────────────────────────────────

  const startDrawing = (clientX: number, clientY: number) => {
    if (isLocked) return;
    const { x, y } = getCanvasCoords(clientX, clientY);

    if (tool === "text") {
      const text = prompt("Enter text:");
      if (text) onStrokeComplete?.({ points: [{ x, y }], color, brushSize, tool, text });
      return;
    }

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentStroke([{ x, y }]);
  };

  const continueDrawing = (clientX: number, clientY: number) => {
    if (!isDrawing || isLocked) return;
    const { x, y } = getCanvasCoords(clientX, clientY);
    const ctx = getCtx();
    if (!ctx) return;

    onCursorMove?.(x, y);

    if (tool === "rectangle" || tool === "circle") {
      redrawCanvas();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      if (startPoint) {
        if (tool === "rectangle") {
          ctx.strokeRect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y);
        } else {
          const radius = Math.hypot(x - startPoint.x, y - startPoint.y);
          ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    } else {
      // Fast live-rendering: Redraw the entire current stroke to get smoothing active instantly
      redrawCanvas();
      ctx.save();
      ctx.beginPath();

      const pts = [...currentStroke, { x, y }];
      if (pts.length < 3) {
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
      } else {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      }

      if (tool === "highlighter") {
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize * 2;
        ctx.globalAlpha = 0.4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      } else if (tool === "eraser") {
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = brushSize * 2;
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.globalAlpha = 1.0;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }

      ctx.stroke();
      ctx.restore();
    }

    setCurrentStroke(prev => [...prev, { x, y }]);
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke.length > 0) {
      if (tool === "magic") {
        const shape = recognizeShape(currentStroke);
        if (shape) {
          if (shape.type === "circle") {
            onStrokeComplete?.({ points: [shape.start, shape.end], color, brushSize, tool: "circle" });
          } else if (shape.type === "rectangle") {
            onStrokeComplete?.({ points: [shape.start, shape.end], color, brushSize, tool: "rectangle" });
          } else if (shape.type === "line") {
            onStrokeComplete?.({ points: [shape.start, shape.end], color, brushSize, tool: "pen" });
          }
        } else {
          // Fallback to regular pen stroke
          onStrokeComplete?.({ points: currentStroke, color, brushSize, tool: "pen" });
        }
      } else {
        onStrokeComplete?.({ points: currentStroke, color, brushSize, tool });
      }
    }
    setIsDrawing(false);
    setCurrentStroke([]);
    setStartPoint(null);
  };

  // ─── Touch events (map to the same pipeline) ──────────────────────────────

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    startDrawing(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    continueDrawing(touch.clientX, touch.clientY);
    onCursorMove?.(...Object.values(getCanvasCoords(touch.clientX, touch.clientY)) as [number, number]);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  // ─── Mouse move (not drawing) → emit cursor ───────────────────────────────

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    onCursorMove?.(x, y);
    continueDrawing(e.clientX, e.clientY);
  };

  // ─── Cursor style ──────────────────────────────────────────────────────────

  const getCursor = () => {
    const mkCursor = (icon: string, hotspotX: number, hotspotY: number, size = 24) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`;
      return `url("data:image/svg+xml;base64,${btoa(svg)}") ${hotspotX} ${hotspotY}, crosshair`;
    };

    if (tool === "eraser") {
      const sz = Math.max(Math.round(brushSize * 2), 12);
      const center = Math.round(sz / 2);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}"><circle cx="${center}" cy="${center}" r="${center - 1}" fill="rgba(255,255,255,0.8)" stroke="black" stroke-width="1.5"/></svg>`;
      return `url("data:image/svg+xml;base64,${btoa(svg)}") ${center} ${center}, crosshair`;
    }
    if (tool === "text") return "text";

    // Explicitly shifted SVG paths so the drawing tip is exactly at 0,0 locally
    if (tool === "magic") return mkCursor('<path d="M0 10l3.09 6.26L10 19.27l-5 4.87 1.18 6.88L0 27.77l-6.18 3.25L-5 24.14-10 19.27l6.91-1.01L0 10z" fill="#facc15" stroke="black" transform="translate(10, -5) scale(0.6)" />', 0, 0);

    if (tool === "pen") return mkCursor('<path d="M0,0 L14,-14 A2,2 0 0,1 17,-14 L20,-11 A2,2 0 0,1 20,-8 L6,6 Z M0,0 L0,6 L6,6 Z" fill="white" transform="translate(1, 17)"/>', 0, 24);

    if (tool === "marker" || tool === "highlighter")
      return mkCursor('<path d="M0,0 L8,8 L16,0 L8,-8 Z M8,8 L14,20 L22,22 L20,14 Z" fill="white" transform="translate(2, 2)"/>', 0, 0);

    return "crosshair";
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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
        className="absolute inset-0 touch-none"
        style={{ cursor: getCursor() }}
        onMouseDown={e => startDrawing(e.clientX, e.clientY)}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}

// ─── Shape Recognition Algorithm ─────────────────────────────────────────────

function recognizeShape(points: { x: number; y: number }[]): {
  type: "line" | "circle" | "rectangle";
  start: { x: number; y: number };
  end: { x: number; y: number };
} | null {
  if (points.length < 10) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let pathLength = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (i > 0) {
      pathLength += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
    }
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const diag = Math.hypot(width, height);
  if (diag < 15) return null;

  const startP = points[0];
  const endP = points[points.length - 1];
  const directDist = Math.hypot(endP.x - startP.x, endP.y - startP.y);

  // 1. Line check (is path mostly straight?)
  if (pathLength > 0 && directDist / pathLength > 0.85) {
    return { type: "line", start: startP, end: endP };
  }

  // Check if closed shape (end is close to start relative to bounding box diameter)
  // And the user has actually moved around a bit 
  const isClosed = directDist < diag * 0.4 && pathLength > diag * 2;

  if (isClosed) {
    const cx = minX + width / 2;
    const cy = minY + height / 2;

    // 2. Circle check - compare average radius vs bounding box proxy
    const expectedR = (width + height) / 4;
    let varianceSq = 0;

    for (const p of points) {
      const d = Math.hypot(p.x - cx, p.y - cy);
      varianceSq += Math.pow(d - expectedR, 2);
    }

    const mse = varianceSq / points.length;
    // Increased tolerance for loosely drawn circles
    if (mse < expectedR * 8) {
      return {
        type: "circle",
        start: { x: cx, y: cy },
        end: { x: cx + expectedR, y: cy },
      };
    }

    // 3. Rectangle check - checks if drawing traces mostly the perimeter of the Box
    const perimeter = 2 * (width + height);
    if (pathLength > perimeter * 0.7 && pathLength < perimeter * 1.5) {
      return {
        type: "rectangle",
        start: { x: minX, y: minY },
        end: { x: maxX, y: maxY },
      };
    }
  }

  return null;
}
