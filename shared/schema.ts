import { z } from "zod";

// Type definitions for client-server communication
export const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Point = z.infer<typeof pointSchema>;

export const strokeSchema = z.object({
  id: z.string(),
  points: z.array(pointSchema),
  color: z.string(),
  brushSize: z.number(),
  tool: z.enum(["pen", "eraser", "rectangle", "circle", "text", "marker", "highlighter", "magic"]),
  text: z.string().optional(),
  timestamp: z.number(),
});

export const insertStrokeSchema = strokeSchema.omit({
  id: true,
  timestamp: true,
});

export type Stroke = z.infer<typeof strokeSchema>;
export type InsertStroke = z.infer<typeof insertStrokeSchema>;

// Room schema (Zod for validation)
export const roomSchema = z.object({
  code: z.string().length(6),
  hostId: z.string(),
  isLocked: z.boolean().default(false),
  templateImage: z.string().default(""),
  strokes: z.array(strokeSchema).default([]),
  createdAt: z.date(),
});

export const insertRoomSchema = z.object({
  hostId: z.string(),
});

export type Room = z.infer<typeof roomSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

// Message schema
export const messageSchema = z.object({
  id: z.string(),
  roomCode: z.string().length(6),
  username: z.string(),
  text: z.string(),
  timestamp: z.date(),
});

export const insertMessageSchema = z.object({
  roomCode: z.string().length(6),
  username: z.string(),
  text: z.string(),
});

export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Participant (in-memory only, not persisted)
export const participantSchema = z.object({
  id: z.string(),
  username: z.string(),
  roomCode: z.string(),
  socketId: z.string(),
  isSpeaking: z.boolean().default(false),
  isMuted: z.boolean().default(false),
  isHandRaised: z.boolean().default(false),
  isOnline: z.boolean().default(true),
});

export type Participant = z.infer<typeof participantSchema>;

// Socket event schemas for validation
export const joinRoomSchema = z.object({
  roomCode: z.string().regex(/^[A-Z0-9]{6}$/, 'Room code must be 6 alphanumeric characters'),
  username: z
    .string()
    .min(1)
    .max(32)
    .transform(s => s.trim().replace(/<[^>]*>/g, '')),  // strip HTML
});

export const createRoomSchema = z.object({
  username: z
    .string()
    .min(1)
    .max(32)
    .transform(s => s.trim().replace(/<[^>]*>/g, '')),
});

export const sendMessageSchema = z.object({
  text: z.string().min(1).max(1000),
});

// Cursor presence
export const cursorMoveSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type CursorMoveEvent = z.infer<typeof cursorMoveSchema>;
export type RemoteCursor = { socketId: string; username: string; x: number; y: number };

export const drawStrokeSchema = insertStrokeSchema;

export const clearBoardSchema = z.object({});

export const setTemplateSchema = z.object({
  templateImage: z.string(),
});

export const toggleLockSchema = z.object({});

// Voice chat schemas
export const voiceSignalSchema = z.object({
  targetId: z.string(),
  signal: z.any(), // WebRTC signal (offer, answer, candidate)
});

export const voiceStateSchema = z.object({
  isMuted: z.boolean(),
  isSpeaking: z.boolean(),
});

export const raiseHandSchema = z.object({
  isRaised: z.boolean(),
});

export type JoinRoomEvent = z.infer<typeof joinRoomSchema>;
export type CreateRoomEvent = z.infer<typeof createRoomSchema>;
export type SendMessageEvent = z.infer<typeof sendMessageSchema>;
export type DrawStrokeEvent = z.infer<typeof drawStrokeSchema>;
export type ClearBoardEvent = z.infer<typeof clearBoardSchema>;
export type SetTemplateEvent = z.infer<typeof setTemplateSchema>;
export type ToggleLockEvent = z.infer<typeof toggleLockSchema>;
export type VoiceSignalEvent = z.infer<typeof voiceSignalSchema>;
export type VoiceStateEvent = z.infer<typeof voiceStateSchema>;
export type RaiseHandEvent = z.infer<typeof raiseHandSchema>;
