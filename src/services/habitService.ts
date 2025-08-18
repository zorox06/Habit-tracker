import { supabase } from '@/integrations/supabase/client';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: 'development' | 'learning' | 'health' | 'wellness' | 'productivity' | 'creative' | 'social' | 'other';
  target_duration_minutes?: number;
  status: 'active' | 'paused' | 'completed' | 'archived';
  color: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  duration_minutes: number;
  notes?: string;
  is_completed: boolean;
  logged_at: string;
}

export interface HabitSession {
  id: string;
  habit_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export const habitService = {
  // Habits CRUD
  async getHabits(): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createHabit(habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Habit> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('habits')
      .insert({
        ...habit,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteHabit(id: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Habit Logs
  async getHabitLogs(date?: string): Promise<HabitLog[]> {
    let query = supabase
      .from('habit_logs')
      .select('*')
      .order('logged_at', { ascending: false });

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async logHabit(habitId: string, duration: number, notes?: string): Promise<HabitLog> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const today = new Date().toISOString().split('T')[0];

    try {
      // First try to insert a new log
      const { data, error } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habitId,
          user_id: user.id,
          date: today,
          duration_minutes: duration,
          notes: notes || '',
          is_completed: duration > 0,
          logged_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // If insert fails, try to update existing log for today (add to existing time)
        if (error.code === '23505') { // Unique constraint violation
          // First get the existing log to add to it
          const { data: existingLog, error: fetchError } = await supabase
            .from('habit_logs')
            .select('duration_minutes, notes')
            .eq('habit_id', habitId)
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

          if (fetchError) throw fetchError;

          const newTotalDuration = (existingLog?.duration_minutes || 0) + duration;
          const combinedNotes = existingLog?.notes 
            ? `${existingLog.notes}; ${notes || ''}`.trim()
            : notes || '';

          const { data: updateData, error: updateError } = await supabase
            .from('habit_logs')
            .update({
              duration_minutes: newTotalDuration,
              notes: combinedNotes,
              is_completed: newTotalDuration > 0,
              logged_at: new Date().toISOString(),
            })
            .eq('habit_id', habitId)
            .eq('user_id', user.id)
            .eq('date', today)
            .select()
            .single();

          if (updateError) throw updateError;
          return updateData;
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error logging habit:', error);
      throw new Error(`Failed to log habit: ${error.message || 'Unknown error'}`);
    }
  },

  // Habit Sessions (for time tracking)
  async startSession(habitId: string): Promise<HabitSession> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // End any active sessions for this habit first
    await supabase
      .from('habit_sessions')
      .update({ 
        is_active: false,
        end_time: new Date().toISOString(),
      })
      .eq('habit_id', habitId)
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('habit_sessions')
      .insert({
        habit_id: habitId,
        user_id: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async endSession(sessionId: string): Promise<HabitSession> {
    const endTime = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('habit_sessions')
      .update({
        is_active: false,
        end_time: endTime,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    // Calculate duration and update
    if (data) {
      const startTime = new Date(data.start_time);
      const endTimeDate = new Date(endTime);
      const durationMinutes = Math.round((endTimeDate.getTime() - startTime.getTime()) / (1000 * 60));

      const { data: updatedData, error: updateError } = await supabase
        .from('habit_sessions')
        .update({ duration_minutes: durationMinutes })
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedData;
    }

    return data;
  },

  async getActiveSessions(): Promise<HabitSession[]> {
    const { data, error } = await supabase
      .from('habit_sessions')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  // Analytics
  async getDailyStats(date?: string): Promise<{
    totalTime: number;
    completedHabits: number;
    totalHabits: number;
    progress: number;
    habitTimeSpent: Record<string, number>;
    habitStreaks: Record<string, number>;
  }> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      const [logsResult, habitsResult, sessionsResult] = await Promise.all([
        supabase
          .from('habit_logs')
          .select('habit_id, duration_minutes, is_completed, date')
          .eq('date', targetDate),
        supabase
          .from('habits')
          .select('id')
          .eq('status', 'active'),
        supabase
          .from('habit_sessions')
          .select('habit_id, duration_minutes, start_time')
          .gte('start_time', `${targetDate}T00:00:00`)
          .lt('start_time', `${targetDate}T23:59:59`)
      ]);

      if (logsResult.error) throw logsResult.error;
      if (habitsResult.error) throw habitsResult.error;
      if (sessionsResult.error) throw sessionsResult.error;

      const logs = logsResult.data || [];
      const sessions = sessionsResult.data || [];
      const totalHabits = habitsResult.data?.length || 0;

      console.log('Daily Stats Debug:', {
        targetDate,
        logsCount: logs.length,
        sessionsCount: sessions.length,
        totalHabits,
        logs: logs.map(l => ({ habit_id: l.habit_id, duration: l.duration_minutes })),
        sessions: sessions.map(s => ({ habit_id: s.habit_id, duration: s.duration_minutes }))
      });

      // Calculate total time from both logs and sessions
      const totalTime = logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) +
                       sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
      
      const completedHabits = logs.filter(log => log.is_completed).length;
      const progress = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

      // Calculate time spent per habit
      const habitTimeSpent: Record<string, number> = {};
      const habitStreaks: Record<string, number> = {};

      // Combine logs and sessions for total time per habit
      [...logs, ...sessions].forEach(item => {
        const habitId = item.habit_id;
        if (!habitTimeSpent[habitId]) {
          habitTimeSpent[habitId] = 0;
        }
        habitTimeSpent[habitId] += item.duration_minutes || 0;
      });

      console.log('Habit Time Spent:', habitTimeSpent);
      console.log('Total time calculation:', {
        logsTime: logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0),
        sessionsTime: sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0),
        totalTime
      });

      // Calculate streaks (simplified - just count consecutive days with activity)
      for (const habit of habitsResult.data || []) {
        const habitId = habit.id;
        if (!habitStreaks[habitId]) {
          habitStreaks[habitId] = 0;
        }
        
        // For now, set a default streak. In a real app, you'd calculate this from historical data
        habitStreaks[habitId] = Math.floor(Math.random() * 7) + 1; // Temporary random streak
      }

      return {
        totalTime,
        completedHabits,
        totalHabits,
        progress,
        habitTimeSpent,
        habitStreaks,
      };
    } catch (error) {
      console.error('Error in getDailyStats:', error);
      throw error;
    }
  },

  // Clear today's data only
  async clearTodaysData(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const today = new Date().toISOString().split('T')[0];

    try {
      // Delete today's sessions and logs
      await supabase
        .from('habit_sessions')
        .delete()
        .eq('user_id', user.id)
        .gte('start_time', `${today}T00:00:00`)
        .lt('start_time', `${today}T23:59:59`);

      await supabase
        .from('habit_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('date', today);

      console.log('Today\'s data cleared successfully');
    } catch (error) {
      console.error('Error clearing today\'s data:', error);
      throw error;
    }
  },

  // Clear all user data
  async clearAllUserData(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // Delete in order to respect foreign key constraints
      await supabase
        .from('habit_sessions')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('habit_logs')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('habits')
        .delete()
        .eq('user_id', user.id);

      console.log('All user data cleared successfully');
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  },
};