import { useState } from 'react';
import LeftToolbar from '../LeftToolbar';

export default function LeftToolbarExample() {
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  return (
    <div className="h-screen">
      <LeftToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onUndo={() => console.log('Undo clicked')}
        onRedo={() => console.log('Redo clicked')}
        onClear={() => console.log('Clear clicked')}
        onTemplateClick={() => console.log('Template clicked')}
        onPlaybackClick={() => console.log('Playback clicked')}
        onSave={() => console.log('Save clicked')}
        isVoiceActive={isVoiceActive}
        onVoiceToggle={() => setIsVoiceActive(!isVoiceActive)}
        canUndo={true}
        canRedo={true}
      />
    </div>
  );
}
