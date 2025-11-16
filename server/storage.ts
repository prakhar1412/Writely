import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { 
  rooms, 
  messages,
  type Room, 
  type Message,
  type InsertRoom, 
  type InsertMessage,
  type Stroke,
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

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

export class DbStorage implements IStorage {
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    // Generate a random 6-character room code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const [room] = await db.insert(rooms).values({
      code,
      hostId: insertRoom.hostId,
      isLocked: false,
      templateImage: '',
      strokes: [],
    }).returning();
    
    return room;
  }

  async getRoom(code: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));
    return room;
  }

  async updateRoomLock(code: string, isLocked: boolean): Promise<void> {
    await db.update(rooms)
      .set({ isLocked })
      .where(eq(rooms.code, code));
  }

  async updateRoomTemplate(code: string, templateImage: string): Promise<void> {
    await db.update(rooms)
      .set({ templateImage })
      .where(eq(rooms.code, code));
  }

  async addStrokeToRoom(code: string, stroke: Stroke): Promise<void> {
    const room = await this.getRoom(code);
    if (!room) return;

    const currentStrokes = (room.strokes as Stroke[]) || [];
    const updatedStrokes = [...currentStrokes, stroke];

    await db.update(rooms)
      .set({ strokes: updatedStrokes as any })
      .where(eq(rooms.code, code));
  }

  async clearRoomStrokes(code: string): Promise<void> {
    await db.update(rooms)
      .set({ strokes: [] })
      .where(eq(rooms.code, code));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async getMessages(roomCode: string, limit: number = 100): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.roomCode, roomCode))
      .orderBy(messages.timestamp)
      .limit(limit);
  }
}

export const storage = new DbStorage();
