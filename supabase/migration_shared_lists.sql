-- Phase 2: Shared lists, assignees, comments

-- Owner column (backfill from user_id)
ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE public.lists SET owner_id = user_id WHERE owner_id IS NULL;

ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

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

CREATE INDEX IF NOT EXISTS idx_list_members_user ON public.list_members(user_id);
CREATE INDEX IF NOT EXISTS idx_list_invites_token ON public.list_invites(token);
CREATE INDEX IF NOT EXISTS idx_todo_comments_todo ON public.todo_comments(todo_id);
CREATE INDEX IF NOT EXISTS idx_todos_assignee ON public.todos(assignee_id);

ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_comments ENABLE ROW LEVEL SECURITY;

-- Helper: is member of list
CREATE OR REPLACE FUNCTION public.is_list_member(p_list_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lists l
    WHERE l.id = p_list_id AND (l.user_id = auth.uid() OR l.owner_id = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.list_members m
    WHERE m.list_id = p_list_id AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.list_member_role(p_list_id TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.lists l
      WHERE l.id = p_list_id AND (l.user_id = auth.uid() OR l.owner_id = auth.uid())
    ) THEN 'owner'
    ELSE (
      SELECT m.role FROM public.list_members m
      WHERE m.list_id = p_list_id AND m.user_id = auth.uid()
      LIMIT 1
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.can_edit_list(p_list_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.list_member_role(p_list_id) IN ('owner', 'editor');
$$;

-- Drop old owner-only policies and recreate
DROP POLICY IF EXISTS "Users can view their own lists" ON public.lists;
DROP POLICY IF EXISTS "Users can insert their own lists" ON public.lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON public.lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON public.lists;

CREATE POLICY "Members can view lists" ON public.lists
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = owner_id
    OR public.is_list_member(id)
  );

CREATE POLICY "Users can insert their own lists" ON public.lists
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (owner_id IS NULL OR owner_id = auth.uid())
  );

CREATE POLICY "Owners and editors can update lists" ON public.lists
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() = owner_id
    OR public.can_edit_list(id)
  )
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() = owner_id
    OR public.can_edit_list(id)
  );

CREATE POLICY "Owners can delete lists" ON public.lists
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can view their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can insert their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON public.todos;

CREATE POLICY "Members can view todos" ON public.todos
  FOR SELECT USING (
    user_id = auth.uid()
    OR (list_id IS NOT NULL AND public.is_list_member(list_id))
  );

CREATE POLICY "Editors can insert todos" ON public.todos
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (list_id IS NULL OR public.can_edit_list(list_id))
  );

CREATE POLICY "Editors can update todos" ON public.todos
  FOR UPDATE USING (
    user_id = auth.uid()
    OR (list_id IS NOT NULL AND public.can_edit_list(list_id))
  );

CREATE POLICY "Editors can delete todos" ON public.todos
  FOR DELETE USING (
    user_id = auth.uid()
    OR (list_id IS NOT NULL AND public.can_edit_list(list_id))
  );

DROP POLICY IF EXISTS "Users can view their own checklists" ON public.checklists;
DROP POLICY IF EXISTS "Users can insert their own checklists" ON public.checklists;
DROP POLICY IF EXISTS "Users can update their own checklists" ON public.checklists;
DROP POLICY IF EXISTS "Users can delete their own checklists" ON public.checklists;

CREATE POLICY "Members can view checklists" ON public.checklists
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.todos t
      WHERE t.id = todo_id
        AND (t.user_id = auth.uid() OR (t.list_id IS NOT NULL AND public.is_list_member(t.list_id)))
    )
  );

CREATE POLICY "Editors can insert checklists" ON public.checklists
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.todos t
      WHERE t.id = todo_id
        AND (t.user_id = auth.uid() OR (t.list_id IS NOT NULL AND public.can_edit_list(t.list_id)))
    )
  );

CREATE POLICY "Editors can update checklists" ON public.checklists
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.todos t
      WHERE t.id = todo_id
        AND (t.list_id IS NOT NULL AND public.can_edit_list(t.list_id))
    )
  );

CREATE POLICY "Editors can delete checklists" ON public.checklists
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.todos t
      WHERE t.id = todo_id
        AND (t.list_id IS NOT NULL AND public.can_edit_list(t.list_id))
    )
  );

-- list_members policies
CREATE POLICY "Members can view members" ON public.list_members
  FOR SELECT USING (public.is_list_member(list_id));

CREATE POLICY "Owners can insert members" ON public.list_members
  FOR INSERT WITH CHECK (public.list_member_role(list_id) = 'owner');

CREATE POLICY "Owners can update members" ON public.list_members
  FOR UPDATE USING (public.list_member_role(list_id) = 'owner');

CREATE POLICY "Owners can delete members" ON public.list_members
  FOR DELETE USING (
    public.list_member_role(list_id) = 'owner'
    OR user_id = auth.uid()
  );

-- invites
CREATE POLICY "Owners can manage invites" ON public.list_invites
  FOR ALL USING (public.list_member_role(list_id) = 'owner')
  WITH CHECK (public.list_member_role(list_id) = 'owner');

CREATE POLICY "Anyone authenticated can read invite by token" ON public.list_invites
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- comments
CREATE POLICY "Members can view comments" ON public.todo_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.todos t
      WHERE t.id = todo_id
        AND (t.user_id = auth.uid() OR (t.list_id IS NOT NULL AND public.is_list_member(t.list_id)))
    )
  );

CREATE POLICY "Editors can insert comments" ON public.todo_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.todos t
      WHERE t.id = todo_id
        AND (t.user_id = auth.uid() OR (t.list_id IS NOT NULL AND public.can_edit_list(t.list_id)))
    )
  );

CREATE POLICY "Authors can delete own comments" ON public.todo_comments
  FOR DELETE USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.todo_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_members;
