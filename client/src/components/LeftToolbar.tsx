import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Pen, Eraser, Undo2, Redo2, Trash2, Square, Circle, Type, Download, Highlighter, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LeftToolbarProps {
  activeTool: "pen" | "eraser" | "rectangle" | "circle" | "text" | "marker" | "highlighter" | "magic";
  onToolChange: (tool: "pen" | "eraser" | "rectangle" | "circle" | "text" | "marker" | "highlighter" | "magic") => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClear?: () => void;
  onTemplateClick?: () => void;
  onPlaybackClick?: () => void;
  onSave?: () => void;
  isVoiceActive?: boolean;
  onVoiceToggle?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function LeftToolbar({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
  onTemplateClick,
  onPlaybackClick,
  onSave,
  isVoiceActive = false,
  onVoiceToggle,
  canUndo = false,
  canRedo = false,
}: LeftToolbarProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-card/90 backdrop-blur shadow-2xl rounded-2xl border border-border/50">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant={["pen", "marker", "highlighter"].includes(activeTool) ? "default" : "ghost"}
            data-testid="button-tool-brush"
            className={cn(
              "toggle-elevate",
              ["pen", "marker", "highlighter"].includes(activeTool) && "toggle-elevated"
            )}
          >
            <Pen className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" className="w-40 p-2" align="start">
          <div className="flex flex-col gap-1">
            <Button
              variant={activeTool === "pen" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => onToolChange("pen")}
            >
              <Pen className="h-4 w-4 mr-2" />
              Pen
            </Button>
            <Button
              variant={activeTool === "marker" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => onToolChange("marker")}
            >
              <Highlighter className="h-4 w-4 mr-2" />
              Marker
            </Button>
            <Button
              variant={activeTool === "highlighter" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => onToolChange("highlighter")}
            >
              <Highlighter className="h-4 w-4 mr-2 opacity-50" />
              Highlighter
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        size="icon"
        variant={activeTool === "magic" ? "default" : "ghost"}
        onClick={() => onToolChange("magic")}
        data-testid="button-tool-magic"
        className={cn(
          "toggle-elevate",
          activeTool === "magic" && "toggle-elevated"
        )}
        title="Magic Pen (Auto-shapes)"
      >
        <Wand2 className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant={activeTool === "eraser" ? "default" : "ghost"}
            data-testid="button-tool-eraser"
            className={cn(
              "toggle-elevate",
              activeTool === "eraser" && "toggle-elevated"
            )}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" className="w-40 p-2" align="start">
          <div className="flex flex-col gap-1">
            <Button
              variant={activeTool === "eraser" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => onToolChange("eraser")}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Eraser
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-destructive hover:text-destructive"
              onClick={onClear}
              data-testid="button-clear"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Canvas
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Separator className="my-2" />

      <Button
        size="icon"
        variant={activeTool === "rectangle" ? "default" : "ghost"}
        onClick={() => onToolChange("rectangle")}
        data-testid="button-tool-rectangle"
        className={cn(
          "toggle-elevate",
          activeTool === "rectangle" && "toggle-elevated"
        )}
      >
        <Square className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant={activeTool === "circle" ? "default" : "ghost"}
        onClick={() => onToolChange("circle")}
        data-testid="button-tool-circle"
        className={cn(
          "toggle-elevate",
          activeTool === "circle" && "toggle-elevated"
        )}
      >
        <Circle className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant={activeTool === "text" ? "default" : "ghost"}
        onClick={() => onToolChange("text")}
        data-testid="button-tool-text"
        className={cn(
          "toggle-elevate",
          activeTool === "text" && "toggle-elevated"
        )}
      >
        <Type className="h-4 w-4" />
      </Button>

      <Separator className="my-2" />

      <Button
        size="icon"
        variant="ghost"
        onClick={onUndo}
        disabled={!canUndo}
        data-testid="button-undo"
      >
        <Undo2 className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={onRedo}
        disabled={!canRedo}
        data-testid="button-redo"
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      <Separator className="my-2" />

      <Button
        size="icon"
        variant="ghost"
        onClick={onSave}
        data-testid="button-save"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
