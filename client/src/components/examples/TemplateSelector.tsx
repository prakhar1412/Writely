import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TemplateSelector from '../TemplateSelector';

export default function TemplateSelectorExample() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('');

  return (
    <div className="p-4 bg-background">
      <Button onClick={() => setOpen(true)} data-testid="button-open-template">
        Open Template Selector
      </Button>
      <TemplateSelector
        open={open}
        onOpenChange={setOpen}
        onSelect={setSelected}
        selectedTemplate={selected}
      />
      {selected && (
        <p className="mt-4 text-sm text-muted-foreground">
          Selected template: {selected.split('/').pop()}
        </p>
      )}
    </div>
  );
}
