import type { RemoteCursor } from "@shared/schema";

/**
 * Renders floating name-tagged cursors for all remote participants.
 * Sits in a transparent absolute layer on top of the canvas.
 */

// A small palette of distinct cursor colours (cycling by socketId)
const COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
];

function colorForId(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return COLORS[hash % COLORS.length];
}

interface CursorOverlayProps {
    cursors: RemoteCursor[];
}

export default function CursorOverlay({ cursors }: CursorOverlayProps) {
    return (
        <div className="absolute inset-0 pointer-events-none z-10" aria-hidden>
            {cursors.map(cursor => {
                const col = colorForId(cursor.socketId);
                return (
                    <div
                        key={cursor.socketId}
                        className="absolute transition-[left,top] duration-75 ease-linear"
                        style={{ left: cursor.x, top: cursor.y }}
                    >
                        {/* Cursor arrow */}
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill={col}
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.4))" }}
                        >
                            <path d="M0 0 L0 12 L3.5 8.5 L6 14 L8 13 L5.5 7.5 L10 7.5 Z" />
                        </svg>

                        {/* Name tag */}
                        <span
                            className="absolute left-4 top-0 text-[11px] font-semibold whitespace-nowrap rounded px-1.5 py-0.5 shadow-md"
                            style={{
                                backgroundColor: col,
                                color: "#fff",
                                userSelect: "none",
                            }}
                        >
                            {cursor.username}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
