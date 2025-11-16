import { useState } from 'react';
import ColorPicker from '../ColorPicker';

export default function ColorPickerExample() {
  const [color, setColor] = useState('#3B82F6');

  return (
    <div className="p-4 bg-background">
      <ColorPicker color={color} onChange={setColor} />
      <p className="mt-4 text-sm text-muted-foreground">Selected: {color}</p>
    </div>
  );
}
