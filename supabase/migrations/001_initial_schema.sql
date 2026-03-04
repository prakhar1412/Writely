-- ============================================================
-- Writely – Supabase Schema
-- Run this in your Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- ---------------------------------------------------------------
-- ROOMS
-- ---------------------------------------------------------------
create table if not exists rooms (
  code          text        primary key,          -- 6-char uppercase code
  host_id       text        not null,
  is_locked     boolean     not null default false,
  template_image text       not null default '',
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- STROKES  (stored per room, ordered by timestamp)
-- ---------------------------------------------------------------
create table if not exists strokes (
  id          text        primary key,
  room_code   text        not null references rooms(code) on delete cascade,
  points      jsonb       not null default '[]',
  color       text        not null,
  brush_size  numeric     not null,
  tool        text        not null check (tool in ('pen','eraser','rectangle','circle','text','marker','highlighter')),
  text_content text,
  timestamp   bigint      not null,
  created_at  timestamptz not null default now()
);

create index if not exists strokes_room_code_idx on strokes(room_code);

-- ---------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------
create table if not exists messages (
  id          text        primary key default gen_random_uuid()::text,
  room_code   text        not null references rooms(code) on delete cascade,
  username    text        not null,
  content     text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists messages_room_code_idx on messages(room_code, created_at);
