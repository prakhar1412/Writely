import { useEffect, useState } from 'react';
import { useParams, useSearch, useLocation } from 'wouter';
import { useSocket } from '@/lib/socket';
import TopBar from '@/components/TopBar';
import LeftToolbar from '@/components/LeftToolbar';
import RightSidebar from '@/components/RightSidebar';
import WhiteboardCanvas from '@/components/WhiteboardCanvas';
import TemplateSelector from '@/components/TemplateSelector';
import PlaybackControls from '@/components/PlaybackControls';
import ColorPicker from '@/components/ColorPicker';
import BrushSizeSlider from '@/components/BrushSizeSlider';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { InsertStroke } from '@shared/schema';

export default function Room() {
  const params = useParams();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const roomCode = params.code?.toUpperCase() || '';
  const username = new URLSearchParams(search).get('username') || '';

  const {
    room,
    messages,
    participants,
    participantId,
    joinRoom,
    sendMessage,
    drawStroke,
    clearBoard,
    setTemplate,
    toggleLock,
    toggleVoice,
  } = useSocket();

  const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showPlayback, setShowPlayback] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    if (!username || !roomCode) {
      setLocation('/');
      return;
    }

    joinRoom({ roomCode, username });
  }, [roomCode, username, joinRoom, setLocation]);

  useEffect(() => {
    const handleBoardCleared = () => {
      setCanvasKey(prev => prev + 1);
    };

    window.addEventListener('board-cleared', handleBoardCleared);
    return () => window.removeEventListener('board-cleared', handleBoardCleared);
  }, []);

  const handleStrokeComplete = (stroke: InsertStroke) => {
    drawStroke(stroke);
  };

  const handleVoiceToggle = () => {
    const newState = !isVoiceActive;
    setIsVoiceActive(newState);
    toggleVoice(newState);
  };

  const handleTemplateSelect = (templateImage: string) => {
    setTemplate(templateImage);
  };

  const isHost = room?.hostId === username;

  if (!room) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Joining room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar
        roomCode={roomCode}
        userCount={participants.length}
        isHost={isHost}
        isLocked={room.isLocked}
        onToggleLock={toggleLock}
        onLeave={() => setLocation('/')}
      />

      <div className="flex flex-1 min-h-0">
        <LeftToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onUndo={() => console.log('Undo')}
          onRedo={() => console.log('Redo')}
          onClear={clearBoard}
          onTemplateClick={() => setShowTemplateSelector(true)}
          onPlaybackClick={() => setShowPlayback(true)}
          onSave={() => console.log('Save canvas')}
          isVoiceActive={isVoiceActive}
          onVoiceToggle={handleVoiceToggle}
          canUndo={false}
          canRedo={false}
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
                key={canvasKey}
                templateImage={room.templateImage}
                color={color}
                brushSize={brushSize}
                tool={activeTool}
                isLocked={room.isLocked && !isHost}
                onStrokeComplete={handleStrokeComplete}
                existingStrokes={room.strokes as any[]}
              />
            </Card>
          </div>
        </div>

        <RightSidebar
          messages={messages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))}
          participants={participants}
          currentUsername={username}
          onSendMessage={sendMessage}
        />
      </div>

      <TemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onSelect={handleTemplateSelect}
        selectedTemplate={room.templateImage}
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
