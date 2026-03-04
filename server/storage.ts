import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  type Room,
  type Message,
  type InsertRoom,
  type InsertMessage,
  type Stroke,
} from "@shared/schema";

// ─────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────

export interface IStorage {
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRoom(code: string): Promise<Room | undefined>;
  updateRoomLock(code: string, isLocked: boolean): Promise<void>;
  updateRoomTemplate(code: string, templateImage: string): Promise<void>;
  addStrokeToRoom(code: string, stroke: Stroke): Promise<void>;
  clearRoomStrokes(code: string): Promise<void>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(roomCode: string, limit?: number): Promise<Message[]>;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// Supabase Storage
// ─────────────────────────────────────────────────────────────

export class SupabaseStorage implements IStorage {
  private client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
    console.log("Using Supabase storage");
  }

  // ── Rooms ──────────────────────────────────────────────────

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const code = generateCode();

    const { data, error } = await this.client
      .from("rooms")
      .insert({
        code,
        host_id: insertRoom.hostId,
        is_locked: false,
        template_image: "",
      })
      .select()
      .single();

    if (error) throw new Error(`createRoom: ${error.message}`);

    return this.mapRoom(data, []);
  }

  async getRoom(code: string): Promise<Room | undefined> {
    const { data: roomRow, error: rErr } = await this.client
      .from("rooms")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (rErr || !roomRow) return undefined;

    const { data: strokeRows } = await this.client
      .from("strokes")
      .select("*")
      .eq("room_code", code.toUpperCase())
      .order("timestamp", { ascending: true });

    return this.mapRoom(roomRow, strokeRows ?? []);
  }

  async updateRoomLock(code: string, isLocked: boolean): Promise<void> {
    const { error } = await this.client
      .from("rooms")
      .update({ is_locked: isLocked })
      .eq("code", code.toUpperCase());
    if (error) throw new Error(`updateRoomLock: ${error.message}`);
  }

  async updateRoomTemplate(code: string, templateImage: string): Promise<void> {
    const { error } = await this.client
      .from("rooms")
      .update({ template_image: templateImage })
      .eq("code", code.toUpperCase());
    if (error) throw new Error(`updateRoomTemplate: ${error.message}`);
  }

  async addStrokeToRoom(code: string, stroke: Stroke): Promise<void> {
    const { error } = await this.client.from("strokes").insert({
      id: stroke.id,
      room_code: code.toUpperCase(),
      points: stroke.points,
      color: stroke.color,
      brush_size: stroke.brushSize,
      tool: stroke.tool,
      text_content: stroke.text ?? null,
      timestamp: stroke.timestamp,
    });
    if (error) throw new Error(`addStrokeToRoom: ${error.message}`);
  }

  async clearRoomStrokes(code: string): Promise<void> {
    const { error } = await this.client
      .from("strokes")
      .delete()
      .eq("room_code", code.toUpperCase());
    if (error) throw new Error(`clearRoomStrokes: ${error.message}`);
  }

  // ── Messages ───────────────────────────────────────────────

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const { data, error } = await this.client
      .from("messages")
      .insert({
        room_code: insertMessage.roomCode.toUpperCase(),
        username: insertMessage.username,
        content: insertMessage.text,
      })
      .select()
      .single();

    if (error) throw new Error(`createMessage: ${error.message}`);

    return this.mapMessage(data);
  }

  async getMessages(roomCode: string, limit: number = 100): Promise<Message[]> {
    const { data, error } = await this.client
      .from("messages")
      .select("*")
      .eq("room_code", roomCode.toUpperCase())
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw new Error(`getMessages: ${error.message}`);
    return (data ?? []).map(this.mapMessage);
  }

  // ── Mappers ────────────────────────────────────────────────

  private mapRoom(row: Record<string, unknown>, strokeRows: Record<string, unknown>[]): Room {
    return {
      code: row.code as string,
      hostId: row.host_id as string,
      isLocked: row.is_locked as boolean,
      templateImage: (row.template_image as string) ?? "",
      createdAt: new Date(row.created_at as string),
      strokes: strokeRows.map(this.mapStroke),
    };
  }

  private mapStroke(row: Record<string, unknown>): Stroke {
    return {
      id: row.id as string,
      points: row.points as { x: number; y: number }[],
      color: row.color as string,
      brushSize: Number(row.brush_size),
      tool: row.tool as Stroke["tool"],
      text: (row.text_content as string) ?? undefined,
      timestamp: Number(row.timestamp),
    };
  }

  private mapMessage(row: Record<string, unknown>): Message {
    return {
      id: row.id as string,
      roomCode: row.room_code as string,
      username: row.username as string,
      text: row.content as string,
      timestamp: new Date(row.created_at as string),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// In-Memory Fallback (for local dev without Supabase)
// ─────────────────────────────────────────────────────────────

export class MemStorage implements IStorage {
  private rooms: Map<string, Room> = new Map();
  private messages: Map<string, Message[]> = new Map();

  constructor() {
    console.log("Using in-memory storage (no SUPABASE_URL set)");
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const code = generateCode();
    const room: Room = {
      code,
      hostId: insertRoom.hostId,
      isLocked: false,
      templateImage: "",
      strokes: [],
      createdAt: new Date(),
    };
    this.rooms.set(code, room);
    return room;
  }

  async getRoom(code: string): Promise<Room | undefined> {
    return this.rooms.get(code.toUpperCase());
  }

  async updateRoomLock(code: string, isLocked: boolean): Promise<void> {
    const room = this.rooms.get(code.toUpperCase());
    if (room) this.rooms.set(code.toUpperCase(), { ...room, isLocked });
  }

  async updateRoomTemplate(code: string, templateImage: string): Promise<void> {
    const room = this.rooms.get(code.toUpperCase());
    if (room) this.rooms.set(code.toUpperCase(), { ...room, templateImage });
  }

  async addStrokeToRoom(code: string, stroke: Stroke): Promise<void> {
    const room = this.rooms.get(code.toUpperCase());
    if (room) {
      room.strokes.push(stroke);
      this.rooms.set(code.toUpperCase(), room);
    }
  }

  async clearRoomStrokes(code: string): Promise<void> {
    const room = this.rooms.get(code.toUpperCase());
    if (room) this.rooms.set(code.toUpperCase(), { ...room, strokes: [] });
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = Math.random().toString(36).substring(7);
    const message: Message = {
      id,
      roomCode: insertMessage.roomCode.toUpperCase(),
      username: insertMessage.username,
      text: insertMessage.text,
      timestamp: new Date(),
    };
    const list = this.messages.get(insertMessage.roomCode.toUpperCase()) ?? [];
    list.push(message);
    this.messages.set(insertMessage.roomCode.toUpperCase(), list);
    return message;
  }

  async getMessages(roomCode: string, limit: number = 100): Promise<Message[]> {
    return (this.messages.get(roomCode.toUpperCase()) ?? [])
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(0, limit);
  }
}

// ─────────────────────────────────────────────────────────────
// Export singleton – prefers Supabase if env vars are present
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export const storage: IStorage =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? new SupabaseStorage(SUPABASE_URL, SUPABASE_ANON_KEY)
    : new MemStorage();
