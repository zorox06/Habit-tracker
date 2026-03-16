-- Add room_id to habits table
ALTER TABLE public.habits ADD COLUMN room_id UUID NULL;

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_members table
CREATE TYPE public.room_role AS ENUM ('owner', 'member');

CREATE TABLE public.room_members (
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role room_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- Create room_messages table (strictly text only)
CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500), -- Max 500 chars to save space
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint to habits
ALTER TABLE public.habits ADD CONSTRAINT fk_habit_room FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies for rooms ──
-- Users can view rooms they are members of
CREATE POLICY "Users can view rooms they are members of" 
ON public.rooms FOR SELECT 
USING (
  id IN (SELECT room_id FROM public.room_members WHERE user_id = auth.uid())
);

-- Users can create rooms
CREATE POLICY "Users can create rooms" 
ON public.rooms FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Only owners can update their rooms
CREATE POLICY "Owners can update rooms" 
ON public.rooms FOR UPDATE 
USING (auth.uid() = owner_id);

-- Only owners can delete their rooms
CREATE POLICY "Owners can delete rooms" 
ON public.rooms FOR DELETE 
USING (auth.uid() = owner_id);


-- ── RLS Policies for room_members ──
-- Users can view members of rooms they are part of
CREATE POLICY "Users can view members of their rooms" 
ON public.room_members FOR SELECT 
USING (
  room_id IN (SELECT room_id FROM public.room_members WHERE user_id = auth.uid())
);

-- Users can insert themselves as a member
CREATE POLICY "Users can join rooms" 
ON public.room_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own display name, or owners can update any member role
CREATE POLICY "Members can update their display name" 
ON public.room_members FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR auth.uid() = (SELECT owner_id FROM public.rooms WHERE id = room_id)
);

-- Users can leave rooms, or owners can kick members
CREATE POLICY "Members can leave or be kicked" 
ON public.room_members FOR DELETE 
USING (
  auth.uid() = user_id 
  OR auth.uid() = (SELECT owner_id FROM public.rooms WHERE id = room_id)
);


-- ── RLS Policies for room_messages ──
-- Users can view messages in rooms they are part of
CREATE POLICY "Users can view messages in their rooms" 
ON public.room_messages FOR SELECT 
USING (
  room_id IN (SELECT room_id FROM public.room_members WHERE user_id = auth.uid())
);

-- Users can send messages to rooms they are part of
CREATE POLICY "Users can send messages to their rooms" 
ON public.room_messages FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  room_id IN (SELECT room_id FROM public.room_members WHERE user_id = auth.uid())
);

-- Users can delete their own messages, or owners can delete any
CREATE POLICY "Users can delete messages" 
ON public.room_messages FOR DELETE 
USING (
  auth.uid() = user_id 
  OR auth.uid() = (SELECT owner_id FROM public.rooms WHERE id = room_id)
);

-- ── Updated Habit Policies to Support Shared Habits ──
-- Allow room members to view shared habits
CREATE POLICY "Users can view shared habits in their rooms"
ON public.habits FOR SELECT
USING (
  room_id IS NOT NULL AND
  room_id IN (SELECT room_id FROM public.room_members WHERE user_id = auth.uid())
);

-- Update existing habit_logs policy so members can see logs of shared habits
CREATE POLICY "Users can view logs for shared habits"
ON public.habit_logs FOR SELECT
USING (
  habit_id IN (
    SELECT id FROM public.habits WHERE room_id IN (
      SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
    )
  )
);


-- ── Triggers ──
-- Trigger to update 'updated_at' on rooms
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ── 30-Day Message Cleanup Function (pg_cron or external call) ──
-- Function to delete old messages automatically to save space
CREATE OR REPLACE FUNCTION public.delete_old_room_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM public.room_messages
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
