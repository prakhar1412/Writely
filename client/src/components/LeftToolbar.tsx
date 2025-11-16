import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Pen, Eraser, Undo2, Redo2, Shapes, Trash2, Image, Mic, MicOff, Play, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeftToolbarProps {
  activeTool: 'pen' | 'eraser';
  onToolChange: (tool: 'pen' | 'eraser') => void;
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
    <div className="flex flex-col items-center gap-2 p-3 bg-card border-r border-card-border h-full">
      <Button
        size="icon"
        variant={activeTool === 'pen' ? 'default' : 'ghost'}
        onClick={() => onToolChange('pen')}
        data-testid="button-tool-pen"
        className={cn(
          'toggle-elevate',
          activeTool === 'pen' && 'toggle-elevated'
        )}
      >
        <Pen className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant={activeTool === 'eraser' ? 'default' : 'ghost'}
        onClick={() => onToolChange('eraser')}
        data-testid="button-tool-eraser"
        className={cn(
          'toggle-elevate',
          activeTool === 'eraser' && 'toggle-elevated'
        )}
      >
        <Eraser className="h-4 w-4" />
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
        data-testid="button-shapes"
      >
        <Shapes className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={onClear}
        data-testid="button-clear"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={onTemplateClick}
        data-testid="button-templates"
      >
        <Image className="h-4 w-4" />
      </Button>

      <Separator className="my-2" />

      <Button
        size="icon"
        variant={isVoiceActive ? 'default' : 'ghost'}
        onClick={onVoiceToggle}
        data-testid="button-voice-toggle"
        className={cn(
          'toggle-elevate',
          isVoiceActive && 'toggle-elevated'
        )}
      >
        {isVoiceActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={onPlaybackClick}
        data-testid="button-playback"
      >
        <Play className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={onSave}
        data-testid="button-save"
      >
        <Save className="h-4 w-4" />
      </Button>
    </div>
  );
}
