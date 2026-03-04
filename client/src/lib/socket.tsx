import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { EVENTS } from '@shared/events';
import type {
  Room,
  Message,
  Participant,
  Stroke,
  JoinRoomEvent,
  DrawStrokeEvent,
  RemoteCursor,
} from '@shared/schema';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  room: Room | null;
  messages: Message[];
  participants: Participant[];
  participantId: string | null;
  /** Strokes from remote users, painted and then consumed by the canvas. */
  remoteStrokes: Stroke[];
  consumeRemoteStrokes: () => void;
  /** Bumps on every board-clear so the canvas can reset. */
  boardClearCount: number;
  /** Live cursor positions for all remote participants. */
  remoteCursors: RemoteCursor[];
  joinRoom: (data: JoinRoomEvent) => void;
  sendMessage: (text: string) => void;
  drawStroke: (stroke: DrawStrokeEvent) => void;
  clearBoard: () => void;
  setTemplate: (templateImage: string) => void;
  toggleLock: () => void;
  toggleVoice: (isSpeaking: boolean) => void;
  /** Emit throttled cursor position (50 ms). */
  emitCursorMove: (x: number, y: number) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [remoteStrokes, setRemoteStrokes] = useState<Stroke[]>([]);
  const [boardClearCount, setBoardClearCount] = useState(0);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);

  // Throttle ref for cursor emit (50 ms)
  const cursorThrottle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = io({ path: '/socket.io' });
    socketRef.current = s;

    s.on('connect', () => { setIsConnected(true); });
    s.on('disconnect', () => { setIsConnected(false); });

    s.on(EVENTS.ROOM_JOINED, (data: { room: Room; messages: Message[]; participantId: string }) => {
      setRoom(data.room);
      setMessages(data.messages);
      setParticipantId(data.participantId);
    });

    s.on(EVENTS.NEW_MESSAGE, (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    s.on(EVENTS.NEW_STROKE, (stroke: Stroke) => {
      setRemoteStrokes(prev => [...prev, stroke]);
    });

    s.on(EVENTS.PARTICIPANTS_UPDATED, (updated: Participant[]) => {
      setParticipants(updated);
    });

    s.on(EVENTS.BOARD_CLEARED, () => {
      setBoardClearCount(c => c + 1);
    });

    s.on(EVENTS.TEMPLATE_CHANGED, (data: { templateImage: string }) => {
      setRoom(prev => prev ? { ...prev, templateImage: data.templateImage } : null);
    });

    s.on(EVENTS.LOCK_CHANGED, (data: { isLocked: boolean }) => {
      setRoom(prev => prev ? { ...prev, isLocked: data.isLocked } : null);
    });

    // ── Cursor presence ──────────────────────────────────────────────────────
    s.on(EVENTS.CURSOR_UPDATE, (cursor: RemoteCursor) => {
      setRemoteCursors(prev => {
        // Sentinel x === -1 means the user disconnected — remove their cursor
        if (cursor.x === -1) return prev.filter(c => c.socketId !== cursor.socketId);
        const idx = prev.findIndex(c => c.socketId === cursor.socketId);
        if (idx === -1) return [...prev, cursor];
        const next = [...prev];
        next[idx] = cursor;
        return next;
      });
    });

    s.on(EVENTS.ERROR, (error: { message: string }) => {
      console.error('Socket error:', error.message);
    });

    setSocket(s);
    return () => { s.close(); };
  }, []);

  const consumeRemoteStrokes = useCallback(() => setRemoteStrokes([]), []);

  // Throttled cursor emitter – max 1 emit per 50 ms
  const emitCursorMove = useCallback((x: number, y: number) => {
    if (cursorThrottle.current) return;
    socketRef.current?.emit(EVENTS.CURSOR_MOVE, { x, y });
    cursorThrottle.current = setTimeout(() => {
      cursorThrottle.current = null;
    }, 50);
  }, []);

  const joinRoom = (data: JoinRoomEvent) => socketRef.current?.emit(EVENTS.JOIN_ROOM, data);
  const sendMessage = (text: string) => socketRef.current?.emit(EVENTS.SEND_MESSAGE, { text });
  const drawStroke = (s: DrawStrokeEvent) => socketRef.current?.emit(EVENTS.DRAW_STROKE, s);
  const clearBoard = () => socketRef.current?.emit(EVENTS.CLEAR_BOARD);
  const setTemplate = (img: string) => socketRef.current?.emit(EVENTS.SET_TEMPLATE, { templateImage: img });
  const toggleLock = () => socketRef.current?.emit(EVENTS.TOGGLE_LOCK);
  const toggleVoice = (isSpeaking: boolean) => socketRef.current?.emit(EVENTS.TOGGLE_VOICE, { isSpeaking });

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        room,
        messages,
        participants,
        participantId,
        remoteStrokes,
        consumeRemoteStrokes,
        boardClearCount,
        remoteCursors,
        joinRoom,
        sendMessage,
        drawStroke,
        clearBoard,
        setTemplate,
        toggleLock,
        toggleVoice,
        emitCursorMove,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
