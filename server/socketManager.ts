import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { storage } from './storage';
import {
  type Participant,
  type Stroke,
  joinRoomSchema,
  sendMessageSchema,
  drawStrokeSchema,
  setTemplateSchema,
  toggleLockSchema,
  clearBoardSchema,
} from '@shared/schema';
import { randomUUID } from 'crypto';

export class SocketManager {
  private io: SocketIOServer;
  private participants: Map<string, Participant> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      // Join room
      socket.on('join-room', async (data) => {
        try {
          const validated = joinRoomSchema.parse(data);
          const room = await storage.getRoom(validated.roomCode);

          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          // Create participant
          const participant: Participant = {
            id: randomUUID(),
            username: validated.username,
            roomCode: validated.roomCode,
            socketId: socket.id,
            isSpeaking: false,
            isOnline: true,
          };

          this.participants.set(socket.id, participant);
          socket.join(validated.roomCode);

          // Send room data to the joining user
          const messages = await storage.getMessages(validated.roomCode);
          socket.emit('room-joined', {
            room,
            messages,
            participantId: participant.id,
          });

          // Broadcast updated participant list
          this.broadcastParticipants(validated.roomCode);

          console.log(`${validated.username} joined room ${validated.roomCode}`);
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Send message
      socket.on('send-message', async (data) => {
        try {
          const validated = sendMessageSchema.parse(data);
          const participant = this.participants.get(socket.id);

          if (!participant) {
            socket.emit('error', { message: 'Not in a room' });
            return;
          }

          const message = await storage.createMessage({
            roomCode: participant.roomCode,
            username: participant.username,
            text: validated.text,
          });

          // Broadcast message to all participants in the room
          this.io.to(participant.roomCode).emit('new-message', message);
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Draw stroke
      socket.on('draw-stroke', async (data) => {
        try {
          const validated = drawStrokeSchema.parse(data);
          const participant = this.participants.get(socket.id);

          if (!participant) return;

          const room = await storage.getRoom(participant.roomCode);
          if (!room) return;

          // Check if room is locked and user is not host
          if (room.isLocked && room.hostId !== participant.id) {
            socket.emit('error', { message: 'Room is locked' });
            return;
          }

          const stroke: Stroke = {
            id: randomUUID(),
            ...validated,
            timestamp: Date.now(),
          };

          // Save stroke to database
          await storage.addStrokeToRoom(participant.roomCode, stroke);

          // Broadcast stroke to all other participants
          socket.to(participant.roomCode).emit('new-stroke', stroke);
        } catch (error) {
          console.error('Error drawing stroke:', error);
        }
      });

      // Clear board (host only)
      socket.on('clear-board', async () => {
        try {
          const participant = this.participants.get(socket.id);
          if (!participant) return;

          const room = await storage.getRoom(participant.roomCode);
          if (!room || room.hostId !== participant.id) {
            socket.emit('error', { message: 'Only host can clear the board' });
            return;
          }

          await storage.clearRoomStrokes(participant.roomCode);
          this.io.to(participant.roomCode).emit('board-cleared');
        } catch (error) {
          console.error('Error clearing board:', error);
        }
      });

      // Set template (host only)
      socket.on('set-template', async (data) => {
        try {
          const validated = setTemplateSchema.parse(data);
          const participant = this.participants.get(socket.id);
          if (!participant) return;

          const room = await storage.getRoom(participant.roomCode);
          if (!room || room.hostId !== participant.id) {
            socket.emit('error', { message: 'Only host can set template' });
            return;
          }

          await storage.updateRoomTemplate(participant.roomCode, validated.templateImage);
          this.io.to(participant.roomCode).emit('template-changed', { templateImage: validated.templateImage });
        } catch (error) {
          console.error('Error setting template:', error);
        }
      });

      // Toggle lock (host only)
      socket.on('toggle-lock', async () => {
        try {
          const participant = this.participants.get(socket.id);
          if (!participant) return;

          const room = await storage.getRoom(participant.roomCode);
          if (!room || room.hostId !== participant.id) {
            socket.emit('error', { message: 'Only host can toggle lock' });
            return;
          }

          const newLockState = !room.isLocked;
          await storage.updateRoomLock(participant.roomCode, newLockState);
          this.io.to(participant.roomCode).emit('lock-changed', { isLocked: newLockState });
        } catch (error) {
          console.error('Error toggling lock:', error);
        }
      });

      // Toggle voice (just broadcasting state, no actual WebRTC here)
      socket.on('toggle-voice', (data: { isSpeaking: boolean }) => {
        const participant = this.participants.get(socket.id);
        if (!participant) return;

        participant.isSpeaking = data.isSpeaking;
        this.participants.set(socket.id, participant);
        this.broadcastParticipants(participant.roomCode);
      });

      // Disconnect
      socket.on('disconnect', () => {
        const participant = this.participants.get(socket.id);
        if (participant) {
          console.log(`${participant.username} left room ${participant.roomCode}`);
          this.participants.delete(socket.id);
          this.broadcastParticipants(participant.roomCode);
        }
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private broadcastParticipants(roomCode: string) {
    const roomParticipants = Array.from(this.participants.values())
      .filter(p => p.roomCode === roomCode);

    this.io.to(roomCode).emit('participants-updated', roomParticipants);
  }

  getIO() {
    return this.io;
  }
}
