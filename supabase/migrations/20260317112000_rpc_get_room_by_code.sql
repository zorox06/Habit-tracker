-- Create an RPC function to get a room's ID by its code
-- This bypasses RLS on the rooms table, allowing non-members to look up a room ID to join it.
CREATE OR REPLACE FUNCTION public.get_room_by_code(p_code TEXT)
RETURNS TABLE (id UUID) AS $$
BEGIN
  RETURN QUERY SELECT r.id FROM public.rooms r WHERE r.code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
