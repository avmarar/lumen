-- Lumen migration: Time-blocking & tagging columns
-- Run in Supabase SQL Editor if tables already exist from v2 schema

ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS duration_minutes INT;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
