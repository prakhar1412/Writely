import { useEffect, useState } from "react";
import { useParams, useSearch, useLocation } from "wouter";
import { useSocket } from "@/lib/socket";
import TopBar from "@/components/TopBar";
import LeftToolbar from "@/components/LeftToolbar";
import RightSidebar from "@/components/RightSidebar";
import WhiteboardCanvas from "@/components/WhiteboardCanvas";
import { VoiceChat } from "@/components/VoiceChat";

import ColorPicker from "@/components/ColorPicker";
import BrushSizeSlider from "@/components/BrushSizeSlider";
import { Loader2 } from "lucide-react";
import type { InsertStroke, Stroke } from "@shared/schema";

export default function Room() {
  const params = useParams();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const roomCode = params.code?.toUpperCase() || "";
  const username = new URLSearchParams(search).get("username") || "";

  const {
    socket,
    room,
    messages,
    participants,
    participantId,
    joinRoom,
    sendMessage,
    drawStroke,
    clearBoard,
    toggleLock,
  } = useSocket();

  const [activeTool, setActiveTool] = useState<"pen" | "eraser" | "rectangle" | "circle" | "text" | "marker" | "highlighter">("pen");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [canvasKey, setCanvasKey] = useState(0);
  const [localStrokes, setLocalStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  useEffect(() => {
    if (!username || !roomCode) {
      setLocation(`/?tab=join&code=${roomCode}`);
      return;
    }

    if (!room) {
      joinRoom({ roomCode, username });
    }
  }, [roomCode, username, joinRoom, setLocation, room]);

  useEffect(() => {
    const handleBoardCleared = () => {
      setCanvasKey((prev) => prev + 1);
      setLocalStrokes([]);
      setRedoStack([]);
    };

    window.addEventListener("board-cleared", handleBoardCleared);
    return () =>
      window.removeEventListener("board-cleared", handleBoardCleared);
  }, []);

  const handleStrokeComplete = (stroke: InsertStroke) => {
    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      ...stroke,
      timestamp: Date.now(),
    };
    setLocalStrokes((prev) => [...prev, newStroke]);
    setRedoStack([]); // clear redo on new stroke
    drawStroke(stroke);
  };

  const handleUndo = () => {
    if (localStrokes.length > 0) {
      const lastStroke = localStrokes[localStrokes.length - 1];
      setRedoStack((prev) => [...prev, lastStroke]);
      setLocalStrokes((prev) => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const stroke = redoStack[redoStack.length - 1];
      setRedoStack((prev) => prev.slice(0, -1));
      setLocalStrokes((prev) => [...prev, stroke]);
    }
  };

  const handleClear = () => {
    clearBoard();
    setLocalStrokes([]);
    setRedoStack([]);
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
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Canvas Layer - Full Screen */}
      <div className="absolute inset-0 z-0">
        <WhiteboardCanvas
          key={canvasKey}
          templateImage=""
          color={color}
          brushSize={brushSize}
          tool={activeTool}
          isLocked={room.isLocked && !isHost}
          onStrokeComplete={handleStrokeComplete}
          existingStrokes={[
            ...(room.strokes as Stroke[]),
            ...localStrokes,
          ]}
        />
      </div>

      {/* UI Layer - Floating on top */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        {/* Top Bar */}
        <div className="pointer-events-auto">
          <TopBar
            roomCode={roomCode}
            userCount={participants.length}
            isHost={isHost}
            isLocked={room.isLocked}
            onToggleLock={toggleLock}
            onLeave={() => setLocation("/")}
          />
        </div>

        <div className="flex-1 relative w-full">
          {/* Left Toolbar - Floating Dock */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto">
            <LeftToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
              onSave={() => window.dispatchEvent(new CustomEvent("save-canvas"))}
              canUndo={localStrokes.length > 0}
              canRedo={redoStack.length > 0}
            />
          </div>

          {/* Top Center - Tools Settings */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
            <div className="flex items-center gap-6 p-3 rounded-full bg-card/90 backdrop-blur shadow-lg border border-border/50">
              <ColorPicker color={color} onChange={setColor} />
              <div className="w-32">
                <BrushSizeSlider size={brushSize} onChange={setBrushSize} />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Floating */}
          <div className="absolute right-4 bottom-4 pointer-events-auto flex flex-col justify-end">
            <RightSidebar
              messages={messages.map((m) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              }))}
              participants={participants}
              currentUsername={username}
              currentUserId={participantId}
              hostId={room?.hostId}
              onSendMessage={sendMessage}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              isHandRaised={isHandRaised}
              onToggleHand={() => setIsHandRaised(!isHandRaised)}
            />
          </div>
        </div>
      </div>

      {socket && participantId && (
        <VoiceChat
          socket={socket}
          roomCode={roomCode}
          userId={participantId}
          participants={participants}
          isMuted={isMuted}
          onMuteChange={setIsMuted}
          isHandRaised={isHandRaised}
          onHandRaiseChange={setIsHandRaised}
        />
      )}
    </div>
  );
}
