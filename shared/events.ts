/**
 * Centralised socket event name constants.
 * Import from both client and server to eliminate string typos.
 */
export const EVENTS = {
    // Room lifecycle
    JOIN_ROOM: 'join-room',
    ROOM_JOINED: 'room-joined',

    // Drawing
    DRAW_STROKE: 'draw-stroke',
    NEW_STROKE: 'new-stroke',
    CLEAR_BOARD: 'clear-board',
    BOARD_CLEARED: 'board-cleared',

    // Template
    SET_TEMPLATE: 'set-template',
    TEMPLATE_CHANGED: 'template-changed',

    // Lock
    TOGGLE_LOCK: 'toggle-lock',
    LOCK_CHANGED: 'lock-changed',

    // Chat
    SEND_MESSAGE: 'send-message',
    NEW_MESSAGE: 'new-message',

    // Participants
    PARTICIPANTS_UPDATED: 'participants-updated',

    // Voice / WebRTC
    VOICE_SIGNAL: 'voice-signal',
    VOICE_STATE_CHANGE: 'voice-state-change',
    TOGGLE_VOICE: 'toggle-voice',

    // Hand raise
    RAISE_HAND: 'raise-hand',

    // Cursor presence
    CURSOR_MOVE: 'cursor-move',
    CURSOR_UPDATE: 'cursor-update',

    // General
    ERROR: 'error',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
