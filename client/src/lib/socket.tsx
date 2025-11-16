import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { 
  Room, 
  Message, 
  Participant, 
  Stroke,
  JoinRoomEvent,
  SendMessageEvent,
  DrawStrokeEvent,
} from '@shared/schema';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  room: Room | null;
  messages: Message[];
  participants: Participant[];
  participantId: string | null;
  joinRoom: (data: JoinRoomEvent) => void;
  sendMessage: (text: string) => void;
  drawStroke: (stroke: DrawStrokeEvent) => void;
  clearBoard: () => void;
  setTemplate: (templateImage: string) => void;
  toggleLock: () => void;
  toggleVoice: (isSpeaking: boolean) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantId, setParticipantId] = useState<string | null>(null);

  useEffect(() => {
    const socketInstance = io({
      path: '/socket.io',
    });

    socketInstance.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    socketInstance.on('room-joined', (data: { room: Room; messages: Message[]; participantId: string }) => {
      console.log('Joined room:', data.room);
      setRoom(data.room);
      setMessages(data.messages);
      setParticipantId(data.participantId);
    });

    socketInstance.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socketInstance.on('new-stroke', (stroke: Stroke) => {
      // Handle new stroke from other users
      window.dispatchEvent(new CustomEvent('remote-stroke', { detail: stroke }));
    });

    socketInstance.on('participants-updated', (updatedParticipants: Participant[]) => {
      setParticipants(updatedParticipants);
    });

    socketInstance.on('board-cleared', () => {
      window.dispatchEvent(new CustomEvent('board-cleared'));
    });

    socketInstance.on('template-changed', (data: { templateImage: string }) => {
      setRoom(prev => prev ? { ...prev, templateImage: data.templateImage } : null);
    });

    socketInstance.on('lock-changed', (data: { isLocked: boolean }) => {
      setRoom(prev => prev ? { ...prev, isLocked: data.isLocked } : null);
    });

    socketInstance.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, []);

  const joinRoom = (data: JoinRoomEvent) => {
    if (socket) {
      socket.emit('join-room', data);
    }
  };

  const sendMessage = (text: string) => {
    if (socket) {
      socket.emit('send-message', { text });
    }
  };

  const drawStroke = (stroke: DrawStrokeEvent) => {
    if (socket) {
      socket.emit('draw-stroke', stroke);
    }
  };

  const clearBoard = () => {
    if (socket) {
      socket.emit('clear-board');
    }
  };

  const setTemplate = (templateImage: string) => {
    if (socket) {
      socket.emit('set-template', { templateImage });
    }
  };

  const toggleLock = () => {
    if (socket) {
      socket.emit('toggle-lock');
    }
  };

  const toggleVoice = (isSpeaking: boolean) => {
    if (socket) {
      socket.emit('toggle-voice', { isSpeaking });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
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
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
