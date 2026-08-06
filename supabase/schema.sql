-- Lumen v2 Supabase PostgreSQL Database Schema
-- Run this script in the Supabase SQL Editor

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.lists (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  archived BOOLEAN DEFAULT FALSE,
  list_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration helper for existing projects (safe to re-run):
-- ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS duration_minutes INT;
-- ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS start_time TEXT;
-- ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.checklists (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  todo_id TEXT REFERENCES public.todos(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  item_order INT DEFAULT 0
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Lists
CREATE POLICY "Users can view their own lists" ON public.lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lists" ON public.lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" ON public.lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" ON public.lists
  FOR DELETE USING (auth.uid() = user_id);

-- 4. RLS Policies for Todos
CREATE POLICY "Users can view their own todos" ON public.todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos" ON public.todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" ON public.todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" ON public.todos
  FOR DELETE USING (auth.uid() = user_id);

-- 5. RLS Policies for Checklists
CREATE POLICY "Users can view their own checklists" ON public.checklists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checklists" ON public.checklists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklists" ON public.checklists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklists" ON public.checklists
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Enable Realtime Replication for Todos, Lists, Checklists
ALTER PUBLICATION supabase_realtime ADD TABLE public.lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklists;
