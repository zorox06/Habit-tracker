import { supabase } from '@/integrations/supabase/client';

export interface Room {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  display_name: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { display_name: string }; // joined from public.profiles
}

export interface RoomDetails extends Room {
  members: (RoomMember & { profiles?: { avatar_url?: string } })[];
}

export const roomService = {
  // Fetch all rooms the user is a member of
  async getMyRooms(): Promise<RoomDetails[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Subquery to get rooms user is in
    const { data: memberOf, error: memberError } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', user.id);

    if (memberError) throw memberError;
    if (!memberOf || memberOf.length === 0) return [];

    const roomIds = memberOf.map(m => m.room_id);

    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        members:room_members(*)
      `)
      .in('id', roomIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as RoomDetails[];
  },

  // Create a new room
  async createRoom(name: string, displayName: string): Promise<RoomDetails> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate random 6-char code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Insert Room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({ name, code, owner_id: user.id })
      .select()
      .single();

    if (roomError) throw roomError;

    // 2. Insert member as owner
    const { error: memberError } = await supabase
      .from('room_members')
      .insert({
        room_id: room.id,
        user_id: user.id,
        display_name: displayName,
        role: 'owner'
      });

    if (memberError) {
      // rollback
      await supabase.from('rooms').delete().eq('id', room.id);
      throw memberError;
    }

    return await this.getRoom(room.id);
  },

  // Join a room by code
  async joinRoom(code: string, displayName: string): Promise<RoomDetails> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Find room by code (using RPC to bypass RLS as non-member)
    const { data: rooms, error: findError } = await (supabase.rpc as any)('get_room_by_code', { p_code: code.toUpperCase() });

    if (findError || !rooms || (rooms as any).length === 0) throw new Error('Room not found or invalid code');
    const room = (rooms as any)[0];

    // 2. Insert into members
    const { error: joinError } = await supabase
      .from('room_members')
      .insert({
        room_id: room.id,
        user_id: user.id,
        display_name: displayName,
        role: 'member'
      });

    if (joinError) throw joinError;

    return await this.getRoom(room.id);
  },

  // Get single room details
  async getRoom(roomId: string): Promise<RoomDetails> {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        members:room_members(*)
      `)
      .eq('id', roomId)
      .single();

    if (error) throw error;
    return data as RoomDetails;
  },

  async leaveRoom(roomId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async deleteRoom(roomId: string): Promise<void> {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);
    if (error) throw error;
  },

  // Messages
  async getMessages(roomId: string): Promise<RoomMessage[]> {
    const { data, error } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true }); // older first for chat view

    if (error) throw error;
    
    return data as RoomMessage[];
  },

  // Simple insert message
  async sendMessage(roomId: string, content: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('room_messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        content: content.trim()
      });

    if (error) throw error;
  }
};
