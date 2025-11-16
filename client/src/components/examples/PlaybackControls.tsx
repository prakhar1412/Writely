import { useState } from 'react';
import { Button } from '@/components/ui/button';
import PlaybackControls from '../PlaybackControls';

export default function PlaybackControlsExample() {
  const [open, setOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);
  const [speed, setSpeed] = useState(1);

  return (
    <div className="p-4 bg-background">
      <Button onClick={() => setOpen(true)} data-testid="button-open-playback">
        Open Playback Controls
      </Button>
      <PlaybackControls
        open={open}
        onOpenChange={setOpen}
        isPlaying={isPlaying}
        progress={progress}
        speed={speed}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onRestart={() => setProgress(0)}
        onProgressChange={setProgress}
        onSpeedChange={setSpeed}
      />
    </div>
  );
}
