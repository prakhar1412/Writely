import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#000000', '#6B7280', '#EF4444', '#F59E0B',
  '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
  '#FFFFFF', '#D1D5DB', '#FCA5A5', '#FCD34D',
  '#6EE7B7', '#93C5FD', '#C4B5FD', '#F9A8D4',
];

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-testid="button-color-picker"
          className="gap-2"
        >
          <div
            className="w-5 h-5 rounded border border-border"
            style={{ backgroundColor: color }}
          />
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Preset Colors
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  className={cn(
                    'w-7 h-7 rounded border-2 transition-all hover:scale-110',
                    color === presetColor ? 'border-primary' : 'border-transparent'
                  )}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => onChange(presetColor)}
                  data-testid={`color-${presetColor}`}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Custom Color
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-10 rounded border border-border cursor-pointer"
              data-testid="input-custom-color"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
