-- FORCE CLEANSING OF ALL ROOM-RELATED POLICIES
-- This ensures no lingering broken policies block insertion.

-- 1. Drop EVERYTHING related to RLS on these tables first
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON public.rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can delete rooms" ON public.rooms;

DROP POLICY IF EXISTS "Users can view members of their rooms" ON public.room_members;
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;
DROP POLICY IF EXISTS "Members can update their display name" ON public.room_members;
DROP POLICY IF EXISTS "Members can leave or be kicked" ON public.room_members;

DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.room_messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON public.room_messages;
DROP POLICY IF EXISTS "Users can delete messages" ON public.room_messages;

DROP POLICY IF EXISTS "Users can view shared habits in their rooms" ON public.habits;
DROP POLICY IF EXISTS "Users can view logs for shared habits" ON public.habit_logs;

-- 2. Create the secure helper function
CREATE OR REPLACE FUNCTION public.is_room_member(check_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.room_members 
    WHERE room_id = check_room_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-apply ALL policies cleanly

-- ── ROOMS ──
-- CRITICAL FIX: To allow `.insert().select()`, the inserting user must be able to SELECT the row immediately.
-- Before they are added to `room_members`, they are already the `owner_id`. 
-- So we MUST allow users to view rooms they own OR are members of.
CREATE POLICY "Users can view rooms they are members of" ON public.rooms FOR SELECT USING ( auth.uid() = owner_id OR public.is_room_member(id) );
CREATE POLICY "Users can create rooms" ON public.rooms FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update rooms" ON public.rooms FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete rooms" ON public.rooms FOR DELETE USING (auth.uid() = owner_id);

-- ── ROOM MEMBERS ──
CREATE POLICY "Users can view members of their rooms" ON public.room_members FOR SELECT USING ( public.is_room_member(room_id) );
CREATE POLICY "Users can join rooms" ON public.room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can update their display name" ON public.room_members FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = (SELECT owner_id FROM public.rooms WHERE id = room_id));
CREATE POLICY "Members can leave or be kicked" ON public.room_members FOR DELETE USING (auth.uid() = user_id OR auth.uid() = (SELECT owner_id FROM public.rooms WHERE id = room_id));

-- ── ROOM MESSAGES ──
CREATE POLICY "Users can view messages in their rooms" ON public.room_messages FOR SELECT USING ( public.is_room_member(room_id) );
CREATE POLICY "Users can send messages to their rooms" ON public.room_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_room_member(room_id));
CREATE POLICY "Users can delete messages" ON public.room_messages FOR DELETE USING (auth.uid() = user_id OR auth.uid() = (SELECT owner_id FROM public.rooms WHERE id = room_id));

-- ── HABITS (Shared integration) ──
CREATE POLICY "Users can view shared habits in their rooms" ON public.habits FOR SELECT USING (room_id IS NULL OR public.is_room_member(room_id));
CREATE POLICY "Users can view logs for shared habits" ON public.habit_logs FOR SELECT USING (habit_id IN (SELECT id FROM public.habits WHERE room_id IS NULL OR public.is_room_member(room_id)));
