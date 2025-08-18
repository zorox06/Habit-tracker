import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsData {
  habit: string;
  hours: number;
  color: string;
  percentage: number;
}

export interface DailyStats {
  totalTime: number;
  completedHabits: number;
  totalHabits: number;
  progress: number;
}

export interface WeeklyStats {
  day: string;
  completed: number;
  total: number;
  totalTime: number;
}

export const analyticsService = {
  // Get analytics data for different time periods
  async getAnalyticsData(period: 'this-week' | 'last-week' | 'last-month' | 'all-time'): Promise<AnalyticsData[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let startDate: string;
    let endDate: string;
    const now = new Date();

    switch (period) {
      case 'this-week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'last-week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 1).toISOString().split('T')[0];
        break;
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'all-time':
        startDate = '2020-01-01'; // Reasonable start date
        endDate = now.toISOString().split('T')[0];
        break;
    }

    // Get habits and their logs for the period
    const [habitsResult, logsResult] = await Promise.all([
      supabase
        .from('habits')
        .select('id, name, color, category')
        .eq('user_id', user.id)
        .eq('status', 'active'),
      supabase
        .from('habit_logs')
        .select('habit_id, duration_minutes, date')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
    ]);

    if (habitsResult.error) throw habitsResult.error;
    if (logsResult.error) throw logsResult.error;

    const habits = habitsResult.data || [];
    const logs = logsResult.data || [];

    // Calculate total time for each habit
    const habitStats = habits.map(habit => {
      const habitLogs = logs.filter(log => log.habit_id === habit.id);
      const totalMinutes = habitLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal place

      return {
        habit: habit.name,
        hours: totalHours,
        color: habit.color || '#3B82F6',
        percentage: 0 // Will be calculated below
      };
    });

    // Calculate percentages
    const totalHours = habitStats.reduce((sum, stat) => sum + stat.hours, 0);
    if (totalHours > 0) {
      habitStats.forEach(stat => {
        stat.percentage = Math.round((stat.hours / totalHours) * 100);
      });
    }

    // Sort by hours (descending)
    return habitStats.sort((a, b) => b.hours - a.hours);
  },

  // Get daily statistics
  async getDailyStats(date?: string): Promise<DailyStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const targetDate = date || new Date().toISOString().split('T')[0];

    const [logsResult, habitsResult] = await Promise.all([
      supabase
        .from('habit_logs')
        .select('duration_minutes, is_completed')
        .eq('user_id', user.id)
        .eq('date', targetDate),
      supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
    ]);

    if (logsResult.error) throw logsResult.error;
    if (habitsResult.error) throw habitsResult.error;

    const logs = logsResult.data || [];
    const totalHabits = habitsResult.data?.length || 0;

    const totalTime = logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const completedHabits = logs.filter(log => log.is_completed).length;
    const progress = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

    return {
      totalTime: Math.round((totalTime / 60) * 10) / 10, // Convert to hours
      completedHabits,
      totalHabits,
      progress,
    };
  },

  // Get weekly statistics
  async getWeeklyStats(): Promise<WeeklyStats[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date.toISOString().split('T')[0]);
    }

    const weekStats: WeeklyStats[] = [];

    for (const date of weekDays) {
      const [logsResult, habitsResult] = await Promise.all([
        supabase
          .from('habit_logs')
          .select('duration_minutes, is_completed')
          .eq('user_id', user.id)
          .eq('date', date),
        supabase
          .from('habits')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
      ]);

      if (logsResult.error || habitsResult.error) continue;

      const logs = logsResult.data || [];
      const totalHabits = habitsResult.data?.length || 0;
      const completedHabits = logs.filter(log => log.is_completed).length;
      const totalTime = logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

      weekStats.push({
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        completed: completedHabits,
        total: totalHabits,
        totalTime: Math.round((totalTime / 60) * 10) / 10
      });
    }

    return weekStats;
  },

  // Get total time tracked
  async getTotalTimeTracked(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('habit_logs')
      .select('duration_minutes')
      .eq('user_id', user.id);

    if (error) throw error;

    const totalMinutes = data?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;
    return Math.round((totalMinutes / 60) * 10) / 10; // Convert to hours
  },

  // Get active habits count
  async getActiveHabitsCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { count, error } = await supabase
      .from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error) throw error;
    return count || 0;
  }
};
