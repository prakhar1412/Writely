import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, SkipBack } from 'lucide-react';

interface PlaybackControlsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPlaying?: boolean;
  progress?: number;
  speed?: number;
  onPlayPause?: () => void;
  onRestart?: () => void;
  onProgressChange?: (progress: number) => void;
  onSpeedChange?: (speed: number) => void;
}

export default function PlaybackControls({
  open,
  onOpenChange,
  isPlaying = false,
  progress = 0,
  speed = 1,
  onPlayPause,
  onRestart,
  onProgressChange,
  onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Playback Controls</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium" data-testid="text-progress">{Math.round(progress)}%</span>
            </div>
            <Slider
              value={[progress]}
              onValueChange={([value]) => onProgressChange?.(value)}
              min={0}
              max={100}
              step={1}
              data-testid="slider-playback-progress"
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              size="icon"
              variant="outline"
              onClick={onRestart}
              data-testid="button-restart"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={onPlayPause}
              data-testid="button-play-pause"
              className="h-12 w-12"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
          </div>

          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">Playback Speed</label>
            <Select
              value={speed.toString()}
              onValueChange={(value) => onSpeedChange?.(parseFloat(value))}
            >
              <SelectTrigger data-testid="select-speed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
                <SelectItem value="3">3x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
