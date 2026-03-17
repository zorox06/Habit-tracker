-- Fix Habit Privacy and Implement Member Profiles

-- 1. Create a helper function to determine if the auth user shares a room with a specific user
CREATE OR REPLACE FUNCTION public.shares_room_with(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.room_members rm1
    JOIN public.room_members rm2 ON rm1.room_id = rm2.room_id
    WHERE rm1.user_id = auth.uid()
    AND rm2.user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the overly permissive policies created in the previous migration
DROP POLICY IF EXISTS "Users can view shared habits in their rooms" ON public.habits;
DROP POLICY IF EXISTS "Users can view logs for shared habits" ON public.habit_logs;

-- 3. Create stricter policies

-- 3a. Shared habits: Only if it belongs to a room you are in
CREATE POLICY "Users can view shared habits in their rooms" 
ON public.habits FOR SELECT 
USING (room_id IS NOT NULL AND public.is_room_member(room_id));

-- 3b. Personal habits of room members: If user_id shares a room with you
CREATE POLICY "Users can view personal habits of room members" 
ON public.habits FOR SELECT 
USING (room_id IS NULL AND public.shares_room_with(user_id));

-- 3c. Logs for shared habits
CREATE POLICY "Users can view logs for shared habits" 
ON public.habit_logs FOR SELECT 
USING (
  habit_id IN (
    SELECT id FROM public.habits 
    WHERE room_id IS NOT NULL AND public.is_room_member(room_id)
  )
);

-- 3d. Logs for personal habits of room members
CREATE POLICY "Users can view logs for personal habits of room members" 
ON public.habit_logs FOR SELECT 
USING (
  habit_id IN (
    SELECT id FROM public.habits 
    WHERE room_id IS NULL AND public.shares_room_with(user_id)
  )
);
