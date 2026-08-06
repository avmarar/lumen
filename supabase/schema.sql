-- Lumen Supabase PostgreSQL Database Schema (cumulative)
-- Prefer running incremental migrations for existing projects:
--   migration_time_blocking.sql
--   migration_calendar_feed.sql
--   migration_sync_oplog.sql
--   migration_shared_lists.sql

CREATE TABLE IF NOT EXISTS public.lists (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  archived BOOLEAN DEFAULT FALSE,
  list_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.todos (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  list_id TEXT REFERENCES public.lists(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  priority TEXT CHECK (priority IN ('none', 'low', 'medium', 'high')) DEFAULT 'none',
  remind_at TIMESTAMPTZ,
  pinned BOOLEAN DEFAULT FALSE,
  recurrence JSONB,
  parent_recurring_id TEXT,
  duration_minutes INT,
  start_time TEXT,
  tags TEXT[] DEFAULT '{}',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.checklists (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  todo_id TEXT REFERENCES public.todos(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  item_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.list_members (
  list_id TEXT REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'editor', 'viewer')) NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (list_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.list_invites (
  id TEXT PRIMARY KEY,
  list_id TEXT REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  email TEXT,
  role TEXT CHECK (role IN ('editor', 'viewer')) NOT NULL DEFAULT 'editor',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.todo_comments (
  id TEXT PRIMARY KEY,
  todo_id TEXT REFERENCES public.todos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- See migration_shared_lists.sql for RLS policies and helpers.
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_comments ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE public.lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.todo_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_members;
