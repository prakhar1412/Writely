import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { storage } from './storage';
import type { Room } from '@shared/schema';
import {
  type Participant,
  type Stroke,
  joinRoomSchema,
  sendMessageSchema,
  drawStrokeSchema,
  setTemplateSchema,
  voiceSignalSchema,
  voiceStateSchema,
  raiseHandSchema,
  cursorMoveSchema,
} from '@shared/schema';
import { EVENTS } from '@shared/events';
import { randomUUID } from 'crypto';

// ─── Simple token-bucket rate limiter ────────────────────────────────────────
// Each socket gets a bucket that refills RATE_REFILL tokens per RATE_WINDOW ms.
// An event costs 1 token. If the bucket is empty the event is silently dropped.
const RATE_WINDOW = 1000; // ms
const RATE_REFILL = 20;   // max events per window

class RateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();

  allow(socketId: string): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(socketId);
    if (!bucket) {
      bucket = { tokens: RATE_REFILL, lastRefill: now };
      this.buckets.set(socketId, bucket);
    }
    // Refill tokens proportional to elapsed time
    const elapsed = now - bucket.lastRefill;
    if (elapsed >= RATE_WINDOW) {
      bucket.tokens = RATE_REFILL;
      bucket.lastRefill = now;
    }
    if (bucket.tokens <= 0) return false;
    bucket.tokens--;
    return true;
  }

  remove(socketId: string) {
    this.buckets.delete(socketId);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export class SocketManager {
  private io: SocketIOServer;
  private participants: Map<string, Participant> = new Map();
  /** In-memory room cache – avoids a DB round-trip on every socket event. */
  private roomCache: Map<string, Room> = new Map();
  private rateLimiter = new RateLimiter();

  constructor(httpServer: HTTPServer) {
    const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '*';
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigin,
        methods: ['GET', 'POST'],
      },
    });

    this.setupSocketHandlers();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Returns the cached room, falling back to storage on a cache miss.
   * Always call this instead of `storage.getRoom` inside socket handlers.
   */
  private async getRoom(code: string): Promise<Room | undefined> {
    const key = code.toUpperCase();
    if (this.roomCache.has(key)) return this.roomCache.get(key);
    const room = await storage.getRoom(key);
    if (room) this.roomCache.set(key, room);
    return room;
  }

  private invalidateRoom(code: string) {
    this.roomCache.delete(code.toUpperCase());
  }

  /**
   * Emits an error to the socket and returns false when the participant is not
   * the host. Returns true when the check passes so callers can early-return.
   * NOTE: hostId is stored as the username string (set in routes.ts).
   */
  private assertIsHost(socket: Socket, room: Room, participant: Participant): boolean {
    if (room.hostId !== participant.username) {
      socket.emit(EVENTS.ERROR, { message: 'Only the host can do this' });
      return false;
    }
    return true;
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      // ── Join room ─────────────────────────────────────────────────────────
      socket.on(EVENTS.JOIN_ROOM, async (data) => {
        try {
          const validated = joinRoomSchema.parse(data);
          const room = await this.getRoom(validated.roomCode);

          if (!room) {
            socket.emit(EVENTS.ERROR, { message: 'Room not found' });
            return;
          }

          const participant: Participant = {
            id: randomUUID(),
            username: validated.username,
            roomCode: validated.roomCode,
            socketId: socket.id,
            isSpeaking: false,
            isMuted: false,
            isHandRaised: false,
            isOnline: true,
          };

          this.participants.set(socket.id, participant);
          socket.join(validated.roomCode);

          const messages = await storage.getMessages(validated.roomCode);
          socket.emit(EVENTS.ROOM_JOINED, {
            room,
            messages,
            participantId: participant.id,
          });

          this.broadcastParticipants(validated.roomCode);
          console.log(`${validated.username} joined room ${validated.roomCode}`);
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit(EVENTS.ERROR, { message: 'Failed to join room' });
        }
      });

      // ── Send message ──────────────────────────────────────────────────────
      socket.on(EVENTS.SEND_MESSAGE, async (data) => {
        if (!this.rateLimiter.allow(socket.id)) return; // rate limit

        try {
          const validated = sendMessageSchema.parse(data);
          const participant = this.participants.get(socket.id);

          if (!participant) {
            socket.emit(EVENTS.ERROR, { message: 'Not in a room' });
            return;
          }

          const message = await storage.createMessage({
            roomCode: participant.roomCode,
            username: participant.username,
            text: validated.text,
          });

          this.io.to(participant.roomCode).emit(EVENTS.NEW_MESSAGE, message);
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit(EVENTS.ERROR, { message: 'Failed to send message' });
        }
      });

      // ── Draw stroke ───────────────────────────────────────────────────────
      socket.on(EVENTS.DRAW_STROKE, async (data) => {
        if (!this.rateLimiter.allow(socket.id)) return; // rate limit

        try {
          const validated = drawStrokeSchema.parse(data);
          const participant = this.participants.get(socket.id);
          if (!participant) return;

          const room = await this.getRoom(participant.roomCode);
          if (!room) return;

          // Check lock (compare by username, hostId is stored as username)
          if (room.isLocked && room.hostId !== participant.username) {
            socket.emit(EVENTS.ERROR, { message: 'Room is locked' });
            return;
          }

          const stroke: Stroke = {
            id: randomUUID(),
            ...validated,
            timestamp: Date.now(),
          };

          await storage.addStrokeToRoom(participant.roomCode, stroke);

          // Keep cache in sync
          const cached = this.roomCache.get(participant.roomCode.toUpperCase());
          if (cached) cached.strokes.push(stroke);

          socket.to(participant.roomCode).emit(EVENTS.NEW_STROKE, stroke);
        } catch (error) {
          console.error('Error drawing stroke:', error);
        }
      });

      // ── Clear board (host only) ───────────────────────────────────────────
      socket.on(EVENTS.CLEAR_BOARD, async () => {
        try {
          const participant = this.participants.get(socket.id);
          if (!participant) return;

          const room = await this.getRoom(participant.roomCode);
          if (!room || !this.assertIsHost(socket, room, participant)) return;

          await storage.clearRoomStrokes(participant.roomCode);
          this.invalidateRoom(participant.roomCode);
          this.io.to(participant.roomCode).emit(EVENTS.BOARD_CLEARED);
        } catch (error) {
          console.error('Error clearing board:', error);
        }
      });

      // ── Set template (host only) ──────────────────────────────────────────
      socket.on(EVENTS.SET_TEMPLATE, async (data) => {
        try {
          const validated = setTemplateSchema.parse(data);
          const participant = this.participants.get(socket.id);
          if (!participant) return;

          const room = await this.getRoom(participant.roomCode);
          if (!room || !this.assertIsHost(socket, room, participant)) return;

          await storage.updateRoomTemplate(participant.roomCode, validated.templateImage);
          this.invalidateRoom(participant.roomCode);
          this.io.to(participant.roomCode).emit(EVENTS.TEMPLATE_CHANGED, {
            templateImage: validated.templateImage,
          });
        } catch (error) {
          console.error('Error setting template:', error);
        }
      });

      // ── Toggle lock (host only) ───────────────────────────────────────────
      socket.on(EVENTS.TOGGLE_LOCK, async () => {
        try {
          const participant = this.participants.get(socket.id);
          if (!participant) return;

          const room = await this.getRoom(participant.roomCode);
          if (!room || !this.assertIsHost(socket, room, participant)) return;

          const newLockState = !room.isLocked;
          await storage.updateRoomLock(participant.roomCode, newLockState);

          const cached = this.roomCache.get(participant.roomCode.toUpperCase());
          if (cached) cached.isLocked = newLockState;

          this.io.to(participant.roomCode).emit(EVENTS.LOCK_CHANGED, {
            isLocked: newLockState,
          });
        } catch (error) {
          console.error('Error toggling lock:', error);
        }
      });

      // ── Cursor presence (throttled by client, no extra rate-limit needed) ─
      socket.on(EVENTS.CURSOR_MOVE, (data) => {
        const participant = this.participants.get(socket.id);
        if (!participant) return;

        try {
          const validated = cursorMoveSchema.parse(data);
          socket.to(participant.roomCode).emit(EVENTS.CURSOR_UPDATE, {
            socketId: socket.id,
            username: participant.username,
            x: validated.x,
            y: validated.y,
          });
        } catch {
          // ignore invalid cursor data
        }
      });

      // ── Voice signaling ───────────────────────────────────────────────────
      socket.on(EVENTS.VOICE_SIGNAL, (data) => {
        try {
          const validated = voiceSignalSchema.parse(data);
          const participant = this.participants.get(socket.id);
          if (!participant) return;

          this.io.to(validated.targetId).emit(EVENTS.VOICE_SIGNAL, {
            userId: socket.id,
            signal: validated.signal,
          });
        } catch (error) {
          console.error('Error signaling voice:', error);
        }
      });

      // ── Voice state change ────────────────────────────────────────────────
      socket.on(EVENTS.VOICE_STATE_CHANGE, (data) => {
        const participant = this.participants.get(socket.id);
        if (!participant) return;

        try {
          const validated = voiceStateSchema.parse(data);
          participant.isMuted = validated.isMuted;
          participant.isSpeaking = validated.isSpeaking;
          this.participants.set(socket.id, participant);
          this.broadcastParticipants(participant.roomCode);
        } catch (error) {
          console.error('Error changing voice state:', error);
        }
      });

      // ── Raise hand ────────────────────────────────────────────────────────
      socket.on(EVENTS.RAISE_HAND, (data) => {
        const participant = this.participants.get(socket.id);
        if (!participant) return;

        try {
          const validated = raiseHandSchema.parse(data);
          participant.isHandRaised = validated.isRaised;
          this.participants.set(socket.id, participant);
          this.broadcastParticipants(participant.roomCode);
        } catch (error) {
          console.error('Error raising hand:', error);
        }
      });

      // ── Disconnect ────────────────────────────────────────────────────────
      socket.on('disconnect', () => {
        this.rateLimiter.remove(socket.id);

        const participant = this.participants.get(socket.id);
        if (participant) {
          console.log(`${participant.username} left room ${participant.roomCode}`);
          this.participants.delete(socket.id);

          // Broadcast that this cursor is gone
          socket.to(participant.roomCode).emit(EVENTS.CURSOR_UPDATE, {
            socketId: socket.id,
            username: participant.username,
            x: -1,  // sentinel: remove cursor
            y: -1,
          });

          // TTL evict cache when room becomes empty
          const roomCode = participant.roomCode.toUpperCase();
          const remaining = Array.from(this.participants.values()).filter(
            p => p.roomCode === participant.roomCode
          );
          if (remaining.length === 0) {
            setTimeout(() => {
              const stillEmpty = !Array.from(this.participants.values()).some(
                p => p.roomCode === participant.roomCode
              );
              if (stillEmpty) {
                this.roomCache.delete(roomCode);
                console.log(`Room ${roomCode} evicted from cache (empty).`);
              }
            }, 60_000);
          }

          this.broadcastParticipants(participant.roomCode);
        }
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private broadcastParticipants(roomCode: string) {
    const roomParticipants = Array.from(this.participants.values())
      .filter(p => p.roomCode === roomCode);

    this.io.to(roomCode).emit(EVENTS.PARTICIPANTS_UPDATED, roomParticipants);
  }

  getIO() {
    return this.io;
  }
}
