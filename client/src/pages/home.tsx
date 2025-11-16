import { useState } from 'react';
import TopBar from '@/components/TopBar';
import LeftToolbar from '@/components/LeftToolbar';
import RightSidebar from '@/components/RightSidebar';
import WhiteboardCanvas from '@/components/WhiteboardCanvas';
import TemplateSelector from '@/components/TemplateSelector';
import PlaybackControls from '@/components/PlaybackControls';
import ColorPicker from '@/components/ColorPicker';
import BrushSizeSlider from '@/components/BrushSizeSlider';
import { Card } from '@/components/ui/card';

export default function Home() {
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [templateImage, setTemplateImage] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showPlayback, setShowPlayback] = useState(false);

  const mockMessages = [
    { id: '1', username: 'Alice', text: 'Hey everyone! Ready to brainstorm?', timestamp: new Date(Date.now() - 300000) },
    { id: '2', username: 'You', text: 'Yes! Let me draw the main concept.', timestamp: new Date(Date.now() - 240000) },
    { id: '3', username: 'Bob', text: 'Great, I will add some notes on the side.', timestamp: new Date(Date.now() - 180000) },
  ];

  const mockParticipants = [
    { id: '1', username: 'You', isSpeaking: false, isOnline: true },
    { id: '2', username: 'Alice', isSpeaking: true, isOnline: true },
    { id: '3', username: 'Bob', isSpeaking: false, isOnline: true },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar
        roomCode="ABC123"
        userCount={3}
        isHost={true}
        isLocked={isLocked}
        onToggleLock={() => setIsLocked(!isLocked)}
        onLeave={() => console.log('Leave room')}
      />

      <div className="flex flex-1 min-h-0">
        <LeftToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onUndo={() => console.log('Undo')}
          onRedo={() => console.log('Redo')}
          onClear={() => console.log('Clear canvas')}
          onTemplateClick={() => setShowTemplateSelector(true)}
          onPlaybackClick={() => setShowPlayback(true)}
          onSave={() => console.log('Save canvas')}
          isVoiceActive={isVoiceActive}
          onVoiceToggle={() => setIsVoiceActive(!isVoiceActive)}
          canUndo={true}
          canRedo={true}
        />

        <div className="flex flex-col flex-1 min-w-0">
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center gap-4">
              <ColorPicker color={color} onChange={setColor} />
              <div className="w-64">
                <BrushSizeSlider size={brushSize} onChange={setBrushSize} />
              </div>
            </div>
          </div>

          <div className="flex-1 p-4">
            <Card className="w-full h-full overflow-hidden">
              <WhiteboardCanvas
                templateImage={templateImage}
                color={color}
                brushSize={brushSize}
                tool={activeTool}
                isLocked={isLocked}
                onStrokeComplete={(stroke) => console.log('Stroke:', stroke)}
              />
            </Card>
          </div>
        </div>

        <RightSidebar
          messages={mockMessages}
          participants={mockParticipants}
          currentUsername="You"
          onSendMessage={(msg) => console.log('Send:', msg)}
        />
      </div>

      <TemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onSelect={setTemplateImage}
        selectedTemplate={templateImage}
      />

      <PlaybackControls
        open={showPlayback}
        onOpenChange={setShowPlayback}
        isPlaying={false}
        progress={0}
        speed={1}
        onPlayPause={() => console.log('Play/Pause')}
        onRestart={() => console.log('Restart')}
        onProgressChange={(p) => console.log('Progress:', p)}
        onSpeedChange={(s) => console.log('Speed:', s)}
      />
    </div>
  );
}
