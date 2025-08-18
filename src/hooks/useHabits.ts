import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitService, Habit, HabitLog } from '@/services/habitService';
import { useToast } from '@/hooks/use-toast';

export const useHabits = () => {
  return useQuery({
    queryKey: ['habits'],
    queryFn: habitService.getHabits,
  });
};

export const useHabitLogs = (date?: string) => {
  return useQuery({
    queryKey: ['habit-logs', date],
    queryFn: () => habitService.getHabitLogs(date),
  });
};

export const useDailyStats = (date?: string) => {
  return useQuery({
    queryKey: ['daily-stats', date],
    queryFn: () => habitService.getDailyStats(date),
    refetchInterval: 30000, // Refresh every 30 seconds
    onSuccess: (data) => {
      console.log('useDailyStats success:', {
        totalTime: data.totalTime,
        completedHabits: data.completedHabits,
        totalHabits: data.totalHabits,
        progress: data.progress,
        habitTimeSpent: data.habitTimeSpent,
        habitStreaks: data.habitStreaks
      });
    },
    onError: (error) => {
      console.error('useDailyStats error:', error);
    }
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
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
    mutationFn: (habitId: string) => habitService.startSession(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['habit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
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