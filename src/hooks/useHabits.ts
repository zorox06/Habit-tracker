import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitService, Habit, HabitLog } from '@/services/habitService';
import { useToast } from '@/hooks/use-toast';
import { notificationService } from '@/services/notificationService';

export const useHabits = (roomId?: string, targetUserId?: string) => {
  return useQuery({
    queryKey: ['habits', roomId, targetUserId],
    queryFn: () => habitService.getHabits(roomId, targetUserId),
  });
};

export const useHabitLogs = (date?: string) => {
  return useQuery({
    queryKey: ['habit-logs', date],
    queryFn: () => habitService.getHabitLogs(date),
  });
};

export const useHabitLogsByHabit = (habitId: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['habit-logs', habitId, startDate, endDate],
    queryFn: () => habitService.getHabitLogsByHabit(habitId, startDate, endDate),
    enabled: !!habitId,
    staleTime: 5 * 60 * 1000, // Only refetch heatmaps every 5 mins max
  });
};

export const useHabitLogsForHabits = (habitIds: string[], startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['habit-logs-bulk', habitIds, startDate, endDate],
    queryFn: () => habitService.getHabitLogsForHabits(habitIds, startDate, endDate),
    enabled: habitIds && habitIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDailyStats = (date?: string, targetUserId?: string) => {
  return useQuery({
    queryKey: ['daily-stats', date, targetUserId],
    queryFn: () => habitService.getDailyStats(date, targetUserId),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useActiveSessions = () => {
  return useQuery({
    queryKey: ['active-sessions'],
    queryFn: habitService.getActiveSessions,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      habitService.createHabit(habit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({
        title: "Habit created!",
        description: "Your new habit has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateHabit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Habit> }) =>
      habitService.updateHabit(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
      toast({
        title: "Habit updated!",
        description: "Your habit has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useLogHabit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ habitId, duration, notes }: { habitId: string; duration: number; notes?: string }) =>
      habitService.logHabit(habitId, duration, notes),
    onSuccess: (_, { habitId }) => {
      const localToday = new Date();
      const todayStr = localToday.getFullYear() + '-' + String(localToday.getMonth() + 1).padStart(2, '0') + '-' + String(localToday.getDate()).padStart(2, '0');
      
      // Invalidate specifically the logged habit and today's general logs to avoid refetching 365 days of all habits
      queryClient.invalidateQueries({ queryKey: ['habit-logs', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habit-logs-bulk'] });
      queryClient.invalidateQueries({ queryKey: ['habit-logs', todayStr] });
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
      
      // Update widget non-blocking so the success toast is instant
      habitService.getDailyStats().then(stats => {
        notificationService.updateDailyProgress(stats.progress, stats.completedHabits, stats.totalHabits);
      }).catch(console.error);
      
      toast({
        title: "Progress logged!",
        description: "Your habit progress has been recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error logging progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useStartSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ habitId, habitName, targetMinutes }: { habitId: string; habitName: string; targetMinutes?: number }) => habitService.startSession(habitId),
    onSuccess: (_, { habitName, targetMinutes }) => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      // Show persistent notification + update widget
      notificationService.showTrackingNotification(habitName, targetMinutes || 60);
      toast({
        title: "Session started!",
        description: "Time tracking has begun for this habit.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error starting session",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useEndSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (sessionId: string) => habitService.endSession(sessionId),
    onSuccess: (data) => {
      const localToday = new Date();
      const todayStr = localToday.getFullYear() + '-' + String(localToday.getMonth() + 1).padStart(2, '0') + '-' + String(localToday.getDate()).padStart(2, '0');
      
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      
      // Use specific invalidation if habit_id exists
      if (data?.habit_id) {
        queryClient.invalidateQueries({ queryKey: ['habit-logs', data.habit_id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['habit-logs'] });
      }
      queryClient.invalidateQueries({ queryKey: ['habit-logs-bulk'] });
      queryClient.invalidateQueries({ queryKey: ['habit-logs', todayStr] });
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
      
      // Clear persistent notification
      notificationService.clearTrackingNotification();
      
      // Update widget non-blocking
      habitService.getDailyStats().then(stats => {
        notificationService.updateDailyProgress(stats.progress, stats.completedHabits, stats.totalHabits);
      }).catch(console.error);

      toast({
        title: "Session ended!",
        description: "Your time has been logged successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error ending session",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteHabit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (habitId: string) => habitService.deleteHabit(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
      toast({
        title: "Habit deleted!",
        description: "Your habit has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useClearTodaysData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => habitService.clearTodaysData(),
    onSuccess: () => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['habit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      
      toast({
        title: "Today's data cleared!",
        description: "All of today's habit data has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error clearing today's data",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useClearAllData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => habitService.clearAllUserData(),
    onSuccess: () => {
      // Invalidate all queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      
      toast({
        title: "All data cleared!",
        description: "All your habit data has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error clearing data",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};