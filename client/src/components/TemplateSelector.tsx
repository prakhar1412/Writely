import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import graphPaperImg from '@assets/generated_images/Graph_paper_template_14c60521.png';
import dottedGridImg from '@assets/generated_images/Dotted_grid_template_f51bf41f.png';
import ruledLinesImg from '@assets/generated_images/Ruled_lines_template_e7f824f4.png';
import mindMapImg from '@assets/generated_images/Mind_map_template_079fc2d9.png';
import flowchartImg from '@assets/generated_images/Flowchart_template_40678641.png';
import wireframeImg from '@assets/generated_images/UI_wireframe_template_cba0e5f4.png';

interface Template {
  id: string;
  name: string;
  image: string;
}

const TEMPLATES: Template[] = [
  { id: 'blank', name: 'Blank', image: '' },
  { id: 'graph', name: 'Graph Paper', image: graphPaperImg },
  { id: 'dotted', name: 'Dotted Grid', image: dottedGridImg },
  { id: 'ruled', name: 'Ruled Lines', image: ruledLinesImg },
  { id: 'mindmap', name: 'Mind Map', image: mindMapImg },
  { id: 'flowchart', name: 'Flowchart', image: flowchartImg },
  { id: 'wireframe', name: 'UI Wireframe', image: wireframeImg },
];

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (templateImage: string) => void;
  selectedTemplate?: string;
}

export default function TemplateSelector({
  open,
  onOpenChange,
  onSelect,
  selectedTemplate = '',
}: TemplateSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Template</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className={cn(
                'cursor-pointer transition-all hover-elevate overflow-hidden',
                selectedTemplate === template.image && 'ring-2 ring-primary'
              )}
              onClick={() => {
                onSelect(template.image);
                onOpenChange(false);
              }}
              data-testid={`template-${template.id}`}
            >
              <div className="aspect-video bg-muted flex items-center justify-center">
                {template.image ? (
                  <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-center text-foreground">
                  {template.name}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
