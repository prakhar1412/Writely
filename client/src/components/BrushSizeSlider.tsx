import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface BrushSizeSliderProps {
  size: number;
  onChange: (size: number) => void;
  min?: number;
  max?: number;
}

export default function BrushSizeSlider({
  size,
  onChange,
  min = 1,
  max = 20,
}: BrushSizeSliderProps) {
  return (
    <div className="space-y-3 px-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">Brush Size</Label>
        <span className="text-xs font-medium text-foreground" data-testid="text-brush-size">
          {size}px
        </span>
      </div>
      <Slider
        value={[size]}
        onValueChange={([value]) => onChange(value)}
        min={min}
        max={max}
        step={1}
        data-testid="slider-brush-size"
      />
      <div className="flex justify-center">
        <div
          className="rounded-full bg-foreground"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      </div>
    </div>
  );
}
