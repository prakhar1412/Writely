import mongoose from "mongoose";
import {
  type Room,
  type Message,
  type InsertRoom,
  type InsertMessage,
  type Stroke,
  pointSchema,
  strokeSchema,
  roomSchema,
  messageSchema,
} from "@shared/schema";

const MONGO_URI = process.env.MONGO_URI;

const PointSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
});

const StrokeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  points: [PointSchema],
  color: { type: String, required: true },
  brushSize: { type: Number, required: true },
  tool: { type: String, enum: ["pen", "eraser", "rectangle", "circle", "text", "marker", "highlighter"], required: true },
  text: { type: String },
  timestamp: { type: Number, required: true },
});

const RoomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 6,
  },
  hostId: { type: String, required: true },
  isLocked: { type: Boolean, default: false },
  templateImage: { type: String, default: "" },
  strokes: [StrokeSchema],
  createdAt: { type: Date, default: Date.now },
});

const MessageSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, uppercase: true, length: 6 },
  username: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

MessageSchema.index({ roomCode: 1, timestamp: 1 });

const RoomModel = mongoose.model("Room", RoomSchema);
const MessageModel = mongoose.model("Message", MessageSchema);

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
  private connected = false;

  constructor() {
    this.connect();
  }

  private async connect() {
    if (this.connected || !MONGO_URI) return;
    try {
      await mongoose.connect(MONGO_URI);
      this.connected = true;
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection error:", error);
    }
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room = new RoomModel({
      code,
      hostId: insertRoom.hostId,
      isLocked: false,
      templateImage: "",
      strokes: [],
    });

    const savedRoom = await room.save();
    return savedRoom.toObject() as Room;
  }

  async getRoom(code: string): Promise<Room | undefined> {
    const room = await RoomModel.findOne({ code: code.toUpperCase() });
    return room ? (room.toObject() as Room) : undefined;
  }

  async updateRoomLock(code: string, isLocked: boolean): Promise<void> {
    await RoomModel.findOneAndUpdate(
      { code: code.toUpperCase() },
      { isLocked }
    );
  }

  async updateRoomTemplate(code: string, templateImage: string): Promise<void> {
    await RoomModel.findOneAndUpdate(
      { code: code.toUpperCase() },
      { templateImage }
    );
  }

  async addStrokeToRoom(code: string, stroke: Stroke): Promise<void> {
    await RoomModel.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $push: { strokes: stroke } }
    );
  }

  async clearRoomStrokes(code: string): Promise<void> {
    await RoomModel.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $set: { strokes: [] } }
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message = new MessageModel({
      roomCode: insertMessage.roomCode.toUpperCase(),
      username: insertMessage.username,
      text: insertMessage.text,
    });

    const savedMessage = await message.save();
    const obj = savedMessage.toObject();
    return { ...obj, id: obj._id.toString() } as Message;
  }

  async getMessages(roomCode: string, limit: number = 100): Promise<Message[]> {
    const messages = await MessageModel.find({
      roomCode: roomCode.toUpperCase(),
    })
      .sort({ timestamp: 1 })
      .limit(limit);
    return messages.map((m) => {
      const obj = m.toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        timestamp: new Date(obj.timestamp),
      } as Message;
    });
  }
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>;
  private messages: Map<string, Message[]>;

  constructor() {
    this.rooms = new Map();
    this.messages = new Map();
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
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
    if (room) {
      room.isLocked = isLocked;
      this.rooms.set(code.toUpperCase(), room);
    }
  }

  async updateRoomTemplate(code: string, templateImage: string): Promise<void> {
    const room = this.rooms.get(code.toUpperCase());
    if (room) {
      room.templateImage = templateImage;
      this.rooms.set(code.toUpperCase(), room);
    }
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
    if (room) {
      room.strokes = [];
      this.rooms.set(code.toUpperCase(), room);
    }
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

    const roomMessages = this.messages.get(insertMessage.roomCode.toUpperCase()) || [];
    roomMessages.push(message);
    this.messages.set(insertMessage.roomCode.toUpperCase(), roomMessages);

    return message;
  }

  async getMessages(roomCode: string, limit: number = 100): Promise<Message[]> {
    return (this.messages.get(roomCode.toUpperCase()) || [])
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(0, limit);
  }
}

export const storage = MONGO_URI ? new DbStorage() : new MemStorage();
