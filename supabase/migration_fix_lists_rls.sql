-- Fix lists RLS so owner upserts (INSERT / ON CONFLICT UPDATE) succeed.
-- Symptom: 42501 "new row violates row-level security policy for table lists"

DROP POLICY IF EXISTS "Members can view lists" ON public.lists;
DROP POLICY IF EXISTS "Users can insert their own lists" ON public.lists;
DROP POLICY IF EXISTS "Owners and editors can update lists" ON public.lists;
DROP POLICY IF EXISTS "Owners can delete lists" ON public.lists;
DROP POLICY IF EXISTS "lists_select" ON public.lists;
DROP POLICY IF EXISTS "lists_insert" ON public.lists;
DROP POLICY IF EXISTS "lists_update" ON public.lists;
DROP POLICY IF EXISTS "lists_delete" ON public.lists;

-- Direct ownership checks first so upsert WITH CHECK works before membership helpers see the row
CREATE POLICY "lists_select" ON public.lists
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = owner_id
    OR public.is_list_member(id)
  );

CREATE POLICY "lists_insert" ON public.lists
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (owner_id IS NULL OR owner_id = auth.uid())
  );

CREATE POLICY "lists_update" ON public.lists
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

CREATE POLICY "lists_delete" ON public.lists
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = owner_id);
