

# ✍️ Writely


## 📖 Overview

**Writely** is a full-stack, real-time collaborative whiteboard application. Multiple users can join shared rooms, draw together on an infinite canvas, chat, and even talk via built-in voice — all with changes synced instantly across every participant's screen.

---

## ✨ Features

### 🎨 Whiteboard Canvas
| Feature | Details |
|---------|---------|
| **Freehand Drawing** | Smooth pen tool with configurable brush size |
| **Marker** | Opaque thick strokes for bold annotations |
| **Highlighter** | Semi-transparent overpainting (50% opacity) for emphasis |
| **Eraser** | Square-cap eraser that removes drawn content |
| **Rectangle Tool** | Click-and-drag to draw rectangles |
| **Circle Tool** | Click-and-drag to draw circles by radius |
| **Text Tool** | Click anywhere on the canvas to place custom text |
| **Color Picker** | Full color palette for pen/marker/shape color |
| **Brush Size Slider** | Adjustable stroke thickness in real time |
| **Undo / Redo** | Per-user local undo/redo stack |
| **Clear Canvas** | Host-only action to wipe the entire board |
| **Export / Save** | Download the current whiteboard as a `.png` file |
| **Template Overlay** | Host can set a background image as a drawing template |
| **Custom Cursors** | Tool-aware cursor icons (pen, crosshair, text, eraser) |
| **Responsive Canvas** | Auto-resizes to fill any screen or window size |

### 🔄 Real-time Collaboration
| Feature | Details |
|---------|---------|
| **Room Creation** | Host creates a room and receives a unique 6-character code |
| **Room Joining** | Guests join with username + room code |
| **Live Stroke Sync** | Every stroke is broadcast to all participants via Socket.IO |
| **Remote Stroke Rendering** | Incoming strokes render instantly without full redraws |
| **Participant List** | Live list of who's in the room with online indicators |
| **Host Controls** | Room creator gets a 👑 crown and exclusive admin actions |
| **Room Lock / Unlock** | Host can lock the board so only they can draw |
| **Persistent Strokes** | All strokes saved to Supabase — new joiners see the full board history |

### 💬 Real-time Chat
| Feature | Details |
|---------|---------|
| **In-room Messaging** | Text chat scoped to the current room |
| **Message Persistence** | Chat history stored in Supabase and loaded on join |
| **Scrollable History** | Messages scroll chronologically in the sidebar |

### 🎙️ Voice Chat (WebRTC)
| Feature | Details |
|---------|---------|
| **Peer-to-Peer Audio** | Direct WebRTC mesh connections between participants |
| **Voice Activity Detection** | Automatic speaking indicator using Web Audio API analyser |
| **Mute / Unmute** | Toggle microphone with a single click |
| **Push-to-Talk** | Hold `Space` bar to temporarily unmute |
| **Hand Raise** | Signal to the host you want to speak |
| **Speaking Indicators** | Live speaking state shown in the participant list |
| **STUN Server** | Uses Google's public STUN for NAT traversal |

### 🚪 Room Management
| Feature | Details |
|---------|---------|
| **Create Room** | Generates a unique 6-character room code |
| **Join Room** | Join by code from the landing page or a shared link |
| **Share Link** | Copy the room link pre-filled with the room code |
| **Leave Room** | Gracefully disconnect and return to the landing page |
| **Auto-redirect** | Unauthenticated room visits redirect to the join tab |

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.x | UI component framework |
| **TypeScript** | 5.6 | Type-safe development |
| **Vite** | 5.x | Lightning-fast dev server and bundler |
| **Wouter** | 3.x | Lightweight client-side routing |
| **TailwindCSS** | 3.x | Utility-first styling |
| **Radix UI** | latest | Accessible, headless UI primitives |
| **shadcn/ui** | latest | Pre-built component library on top of Radix |
| **Framer Motion** | 11.x | Animations and page transitions |
| **Lucide React** | 0.45x | Icon library |
| **Socket.IO Client** | 4.x | Real-time WebSocket communication |
| **@tanstack/react-query** | 5.x | Server state management and data fetching |
| **Zod** | 3.x | Runtime schema validation (shared with backend) |
| **React Hook Form** | 7.x | Form state management |
| **Web Audio API** | Native | Voice activity detection (no library) |
| **WebRTC** | Native | Peer-to-peer voice streaming |
| **Canvas API** | Native | Whiteboard rendering engine |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | ≥ 20.11 | Runtime environment |
| **Express** | 4.x | HTTP server and REST API |
| **Socket.IO** | 4.x | Real-time bidirectional event handling |
| **TypeScript** | 5.6 | Type-safe server code |
| **tsx** | 4.x | TypeScript execution for Node (dev mode) |
| **esbuild** | 0.25 | Server bundler for production builds |
| **dotenv** | latest | Environment variable loading |

### Database & Storage
| Technology | Purpose |
|-----------|---------|
| **Supabase** | Hosted PostgreSQL — rooms, strokes, messages |
| **@supabase/supabase-js** | Official Supabase client for Node.js |
| **In-memory Store** | Zero-config fallback when Supabase is not configured |

### Shared
| Technology | Purpose |
|-----------|---------|
| **Zod** | Schema definitions shared between client and server (`/shared/schema.ts`) |

### DevOps & Tooling
| Tool | Purpose |
|------|---------|
| **Render** | Cloud deployment (`render.yaml`) |
| **Vitest** | Unit testing framework |
| **Playwright** | End-to-end testing |
| **@testing-library/react** | Component testing utilities |
| **ESBuild** | Production server bundling |

---

## 🗂️ Project Structure

```
Writely/
├── client/                        # React frontend
│   └── src/
│       ├── components/
│       │   ├── WhiteboardCanvas.tsx   # Canvas drawing engine
│       │   ├── LeftToolbar.tsx        # Drawing tools panel
│       │   ├── RightSidebar.tsx       # Chat + participants panel
│       │   ├── TopBar.tsx             # Room header (code, share, leave)
│       │   ├── VoiceChat.tsx          # WebRTC voice engine
│       │   ├── ColorPicker.tsx        # Color selector
│       │   ├── BrushSizeSlider.tsx    # Brush size control
│       │   ├── ChatMessage.tsx        # Individual chat message
│       │   ├── ParticipantItem.tsx    # Participant row in sidebar
│       │   └── ui/                    # shadcn/ui components (47 files)
│       ├── pages/
│       │   ├── landing.tsx            # Create / Join room page
│       │   ├── room.tsx               # Main whiteboard page
│       │   └── not-found.tsx          # 404 page
│       ├── lib/
│       │   ├── socket.tsx             # Socket.IO context + provider
│       │   ├── queryClient.ts         # React Query config + apiRequest()
│       │   └── utils.ts               # Utility helpers
│       ├── hooks/                     # Custom React hooks
│       ├── App.tsx                    # Router root
│       ├── main.tsx                   # React entry point
│       └── index.css                  # Global styles + design tokens
│
├── server/                        # Express + Socket.IO backend
│   ├── index.ts                   # Server entry point
│   ├── routes.ts                  # REST API  (POST /api/rooms, GET /api/rooms/:code)
│   ├── socketManager.ts           # All Socket.IO event handlers
│   ├── storage.ts                 # SupabaseStorage + MemStorage implementations
│   └── vite.ts                    # Vite dev-server middleware integration
│
├── shared/
│   └── schema.ts                  # Zod schemas shared by client & server
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # Supabase table definitions
│
├── scripts/
│   └── migrate.mjs                # Supabase connection test script
│
├── .env                           # Local env vars (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── render.yaml                    # Render.com deployment config
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) ≥ 20.11
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/writely.git
cd writely
npm install --legacy-peer-deps
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/migrations/001_initial_schema.sql`
3. Go to **Settings → API** and copy your **Project URL** and **anon key**

### 3. Configure Environment

Create a `.env` file in the project root:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) 🎉

---

## 📡 API Reference

### REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/rooms/create` | Create a new room |
| `GET`  | `/api/rooms/:code`  | Get room by 6-char code |

### Socket.IO Events

| Event (Client → Server) | Payload | Description |
|------------------------|---------|-------------|
| `join-room` | `{ roomCode, username }` | Join an existing room |
| `send-message` | `{ text }` | Send a chat message |
| `draw-stroke` | `InsertStroke` | Broadcast a completed stroke |
| `clear-board` | — | Clear all strokes (host only) |
| `set-template` | `{ templateImage }` | Set background template (host only) |
| `toggle-lock` | — | Lock/unlock drawing (host only) |
| `voice-signal` | `{ targetId, signal }` | WebRTC signalling relay |
| `voice-state-change` | `{ isMuted, isSpeaking }` | Update mute/speaking state |
| `raise-hand` | `{ isRaised }` | Toggle hand-raise state |

| Event (Server → Client) | Payload | Description |
|------------------------|---------|-------------|
| `room-joined` | `{ room, messages, participantId }` | Sent on successful room join |
| `new-message` | `Message` | A new chat message was sent |
| `new-stroke` | `Stroke` | A remote user drew a stroke |
| `participants-updated` | `Participant[]` | Participant list changed |
| `board-cleared` | — | Board was wiped |
| `template-changed` | `{ templateImage }` | Template was updated |
| `lock-changed` | `{ isLocked }` | Board lock state changed |
| `voice-signal` | `{ userId, signal }` | Inbound WebRTC signal |
| `error` | `{ message }` | Server-side error |

---

## 🗄️ Database Schema

```sql
rooms       -- code (PK), host_id, is_locked, template_image, created_at
strokes     -- id (PK), room_code (FK), points (jsonb), color, brush_size, tool, text_content, timestamp
messages    -- id (PK), room_code (FK), username, content, created_at
```

---

## 🌐 Deployment (Render)

The project includes a `render.yaml` for one-click deployment on [Render](https://render.com):

1. Push to GitHub
2. Connect your repo on Render
3. Add environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
4. Deploy — Render runs `npm install && npm run build` then `npm start`

---

## 🧪 Testing

```bash
npm run test          # Unit tests (Vitest)
npm run test:ui       # Vitest UI dashboard
npm run test:e2e      # End-to-end tests (Playwright)
npm run test:e2e:ui   # Playwright UI mode
```

---

## 📄 License

MIT © Writely Contributors
