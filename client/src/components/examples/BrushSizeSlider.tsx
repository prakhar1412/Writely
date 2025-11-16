import { useState } from 'react';
import BrushSizeSlider from '../BrushSizeSlider';

export default function BrushSizeSliderExample() {
  const [size, setSize] = useState(5);

  return (
    <div className="p-4 w-64 bg-background">
      <BrushSizeSlider size={size} onChange={setSize} />
    </div>
  );
}
