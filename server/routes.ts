import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SocketManager } from "./socketManager";
import { createRoomSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize Socket.io
  const socketManager = new SocketManager(httpServer);

  // API Routes
  app.post('/api/rooms/create', async (req, res) => {
    try {
      const validated = createRoomSchema.parse(req.body);
      const room = await storage.createRoom({
        hostId: validated.username, // Using username as hostId for simplicity
      });

      res.json({ room });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(400).json({ error: 'Failed to create room' });
    }
  });

  app.get('/api/rooms/:code', async (req, res) => {
    try {
      const room = await storage.getRoom(req.params.code);
      if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
      }
      res.json({ room });
    } catch (error) {
      console.error('Error fetching room:', error);
      res.status(500).json({ error: 'Failed to fetch room' });
    }
  });

  return httpServer;
}
