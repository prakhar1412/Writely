/**
 * Unit tests for MemStorage (the in-memory IStorage implementation).
 *
 * These run fully offline — no Supabase required.
 * Run with: npm test
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../server/storage';

let db: MemStorage;

beforeEach(() => {
    db = new MemStorage();
});

// ─── Rooms ────────────────────────────────────────────────────────────────────

describe('MemStorage — rooms', () => {
    it('creates a room and returns it with a 6-char code', async () => {
        const room = await db.createRoom({ hostId: 'alice' });
        expect(room.code).toHaveLength(6);
        expect(room.hostId).toBe('alice');
        expect(room.isLocked).toBe(false);
        expect(room.strokes).toEqual([]);
    });

    it('retrieves a room by code (case-insensitive)', async () => {
        const room = await db.createRoom({ hostId: 'bob' });
        const found = await db.getRoom(room.code.toLowerCase());
        expect(found).toBeDefined();
        expect(found?.code).toBe(room.code);
    });

    it('returns undefined for an unknown code', async () => {
        const found = await db.getRoom('XXXXXX');
        expect(found).toBeUndefined();
    });

    it('locks and unlocks a room', async () => {
        const room = await db.createRoom({ hostId: 'carol' });
        await db.updateRoomLock(room.code, true);
        expect((await db.getRoom(room.code))?.isLocked).toBe(true);
        await db.updateRoomLock(room.code, false);
        expect((await db.getRoom(room.code))?.isLocked).toBe(false);
    });

    it('updates the template image', async () => {
        const room = await db.createRoom({ hostId: 'dave' });
        await db.updateRoomTemplate(room.code, 'data:image/png;base64,abc');
        expect((await db.getRoom(room.code))?.templateImage).toBe('data:image/png;base64,abc');
    });
});

// ─── Strokes ─────────────────────────────────────────────────────────────────

describe('MemStorage — strokes', () => {
    const mockStroke = (id = 's1') => ({
        id,
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        color: '#ff0000',
        brushSize: 3,
        tool: 'pen' as const,
        timestamp: Date.now(),
    });

    it('adds a stroke to a room', async () => {
        const room = await db.createRoom({ hostId: 'eve' });
        await db.addStrokeToRoom(room.code, mockStroke());
        const fetched = await db.getRoom(room.code);
        expect(fetched?.strokes).toHaveLength(1);
        expect(fetched?.strokes[0].id).toBe('s1');
    });

    it('accumulates multiple strokes', async () => {
        const room = await db.createRoom({ hostId: 'frank' });
        await db.addStrokeToRoom(room.code, mockStroke('a'));
        await db.addStrokeToRoom(room.code, mockStroke('b'));
        await db.addStrokeToRoom(room.code, mockStroke('c'));
        expect((await db.getRoom(room.code))?.strokes).toHaveLength(3);
    });

    it('clears all strokes', async () => {
        const room = await db.createRoom({ hostId: 'grace' });
        await db.addStrokeToRoom(room.code, mockStroke());
        await db.clearRoomStrokes(room.code);
        expect((await db.getRoom(room.code))?.strokes).toHaveLength(0);
    });
});

// ─── Messages ────────────────────────────────────────────────────────────────

describe('MemStorage — messages', () => {
    it('creates a message and retrieves it', async () => {
        const room = await db.createRoom({ hostId: 'henry' });
        const msg = await db.createMessage({
            roomCode: room.code,
            username: 'henry',
            text: 'Hello!',
        });
        expect(msg.id).toBeDefined();
        expect(msg.text).toBe('Hello!');

        const msgs = await db.getMessages(room.code);
        expect(msgs).toHaveLength(1);
        expect(msgs[0].username).toBe('henry');
    });

    it('returns messages in chronological order', async () => {
        const room = await db.createRoom({ hostId: 'iris' });
        await db.createMessage({ roomCode: room.code, username: 'iris', text: 'first' });
        await db.createMessage({ roomCode: room.code, username: 'iris', text: 'second' });
        const msgs = await db.getMessages(room.code);
        expect(msgs[0].text).toBe('first');
        expect(msgs[1].text).toBe('second');
    });

    it('respects the limit parameter', async () => {
        const room = await db.createRoom({ hostId: 'jack' });
        for (let i = 0; i < 10; i++) {
            await db.createMessage({ roomCode: room.code, username: 'jack', text: `msg${i}` });
        }
        const msgs = await db.getMessages(room.code, 5);
        expect(msgs).toHaveLength(5);
    });

    it('returns empty array for a room with no messages', async () => {
        const room = await db.createRoom({ hostId: 'kate' });
        expect(await db.getMessages(room.code)).toEqual([]);
    });
});
