import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Rooms table
export const rooms = pgTable("rooms", {
  code: varchar("code", { length: 10 }).primaryKey(),
  hostId: varchar("host_id", { length: 255 }).notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  templateImage: text("template_image").default('').notNull(),
  strokes: jsonb("strokes").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  code: true,
  createdAt: true,
  strokes: true,
  templateImage: true,
  isLocked: true,
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomCode: varchar("room_code", { length: 10 }).notNull().references(() => rooms.code, { onDelete: 'cascade' }),
  username: varchar("username", { length: 255 }).notNull(),
  text: text("text").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

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
  tool: z.enum(['pen', 'eraser']),
  timestamp: z.number(),
});

export const insertStrokeSchema = strokeSchema.omit({ id: true, timestamp: true });

export type Stroke = z.infer<typeof strokeSchema>;
export type InsertStroke = z.infer<typeof insertStrokeSchema>;

// Participant (in-memory only, not persisted)
export const participantSchema = z.object({
  id: z.string(),
  username: z.string(),
  roomCode: z.string(),
  socketId: z.string(),
  isSpeaking: z.boolean().default(false),
  isOnline: z.boolean().default(true),
});

export type Participant = z.infer<typeof participantSchema>;

// Socket event schemas for validation
export const joinRoomSchema = z.object({
  roomCode: z.string().min(1),
  username: z.string().min(1),
});

export const createRoomSchema = z.object({
  username: z.string().min(1),
});

export const sendMessageSchema = z.object({
  text: z.string().min(1),
});

export const drawStrokeSchema = insertStrokeSchema;

export const clearBoardSchema = z.object({});

export const setTemplateSchema = z.object({
  templateImage: z.string(),
});

export const toggleLockSchema = z.object({});

export type JoinRoomEvent = z.infer<typeof joinRoomSchema>;
export type CreateRoomEvent = z.infer<typeof createRoomSchema>;
export type SendMessageEvent = z.infer<typeof sendMessageSchema>;
export type DrawStrokeEvent = z.infer<typeof drawStrokeSchema>;
export type ClearBoardEvent = z.infer<typeof clearBoardSchema>;
export type SetTemplateEvent = z.infer<typeof setTemplateSchema>;
export type ToggleLockEvent = z.infer<typeof toggleLockSchema>;
