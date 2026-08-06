-- Lumen: Calendar subscribe feed tokens
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.calendar_feeds (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.calendar_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar feed"
  ON public.calendar_feeds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar feed"
  ON public.calendar_feeds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar feed"
  ON public.calendar_feeds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar feed"
  ON public.calendar_feeds FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS calendar_feeds_token_idx ON public.calendar_feeds (token);
