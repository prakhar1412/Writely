
import mongoose from "mongoose";
import { storage } from "../server/storage";

async function testMongo() {
    console.log("Starting MongoDB test...");

    // Wait for connection (storage connects in constructor but async)
    // We can hack a wait here or rely on Mongoose buffering
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        console.log("Creating room...");
        const room = await storage.createRoom({ hostId: "test-user" });
        console.log("Room created:", room.code);

        console.log("Adding stroke...");
        const stroke = {
            id: "stroke-1",
            points: [{ x: 10, y: 10 }],
            color: "#000000",
            brushSize: 5,
            tool: "pen" as const,
            timestamp: Date.now(),
        };
        await storage.addStrokeToRoom(room.code, stroke);
        console.log("Stroke added.");

        console.log("Fetching room...");
        const fetchedRoom = await storage.getRoom(room.code);

        if (!fetchedRoom) {
            throw new Error("Room not found!");
        }

        if (fetchedRoom.strokes.length !== 1) {
            throw new Error(`Expected 1 stroke, found ${fetchedRoom.strokes.length}`);
        }

        console.log("Verification successful! Room has 1 stroke.");

        // Cleanup
        // await mongoose.connection.db.dropDatabase(); // Optional: clean up

    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
        process.exit(0);
    }
}

testMongo();
