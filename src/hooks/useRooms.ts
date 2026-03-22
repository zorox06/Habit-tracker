import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomService, RoomDetails, RoomMessage } from '@/services/roomService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useRef } from 'react';
import { notificationService } from '@/services/notificationService';

export const useMyRooms = () => {
  return useQuery({
    queryKey: ['my-rooms'],
    queryFn: () => roomService.getMyRooms(),
  });
};

export const useRoomActivity = (roomId: string) => {
  const queryResult = useQuery({
    queryKey: ['room-activity', roomId],
    queryFn: () => roomService.getRecentActivity(roomId),
    enabled: !!roomId,
    refetchInterval: 60000,
  });

  // Realtime listener for new habit_log inserts — fire notification
  const lastSeenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!roomId) return;

    // Initialize seen IDs from current data
    if (queryResult.data) {
      queryResult.data.forEach(a => lastSeenRef.current.add(a.id));
    }

    const checkNewActivity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Re-fetch and compare
      const fresh = await roomService.getRecentActivity(roomId);
      fresh.forEach(activity => {
        if (!lastSeenRef.current.has(activity.id) && activity.user_id !== user.id) {
          notificationService.notifyRoomActivity(
            activity.display_name,
            activity.habit_name,
            activity.duration_minutes
          );
        }
        lastSeenRef.current.add(activity.id);
      });
    };

    // Poll every 30s for new activity (lighter than full realtime subscription on habit_logs)
    const interval = setInterval(checkNewActivity, 30000);
    return () => clearInterval(interval);
  }, [roomId, queryResult.data]);

  return queryResult;
};

export const useRoom = (roomId: string) => {
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomService.getRoom(roomId),
    enabled: !!roomId,
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ name, displayName }: { name: string; displayName: string }) => 
      roomService.createRoom(name, displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rooms'] });
      toast({ title: 'Room created', description: 'Your new room is ready to go!' });
    },
    onError: (error: any) => {
      toast({ title: 'Error creating room', description: error.message, variant: 'destructive' });
    }
  });
};

export const useJoinRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ code, displayName }: { code: string; displayName: string }) => 
      roomService.joinRoom(code, displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rooms'] });
      toast({ title: 'Joined room!', description: 'You are now a member.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error joining room', description: error.message, variant: 'destructive' });
    }
  });
};

export const useLeaveRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (roomId: string) => roomService.leaveRoom(roomId),
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ['my-rooms'] });
      queryClient.removeQueries({ queryKey: ['room', roomId] });
      toast({ title: 'Left room', description: 'You have left the room.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error leaving room', description: error.message, variant: 'destructive' });
    }
  });
};

// Real-time Chat Hook
export const useRoomChat = (roomId: string) => {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = async () => {
    if (!roomId) return;
    const { data, error } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      setMessages(data as any as RoomMessage[]);
    }
  };

  useEffect(() => {
    if (!roomId) return;

    // Load initial messages
    const loadInitial = async () => {
      setIsLoading(true);
      await fetchMessages();
      setIsLoading(false);
    };
    loadInitial();

    // Subscribe to new messages (works only if Realtime is enabled on the table)
    const channel = supabase
      .channel(`room_${roomId}_chat`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages(prev => {
            // Avoid duplicates (in case refetch already added it)
            if (prev.some(m => m.id === (payload.new as RoomMessage).id)) return prev;
            return [...prev, payload.new as RoomMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const { toast } = useToast();
  
  const sendMessage = useMutation({
    mutationFn: (content: string) => roomService.sendMessage(roomId, content),
    onSuccess: () => {
      // Refetch messages as fallback in case Realtime is not delivering
      fetchMessages();
    },
    onError: (error: any) => {
      toast({ title: 'Error sending message', description: error.message, variant: 'destructive' });
    }
  });

  return { messages, isLoading, sendMessage };
};
