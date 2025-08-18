import { supabase } from '@/integrations/supabase/client';
import { habitService } from './habitService';

export const seedDataService = {
  // Seed sample habits for a user
  async seedSampleHabits(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user already has habits
    const { data: existingHabits } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', user.id);

    if (existingHabits && existingHabits.length > 0) {
      console.log('User already has habits, skipping seed');
      return;
    }

    const sampleHabits = [
      {
        name: 'Coding',
        description: 'Daily programming and development work',
        category: 'development' as const,
        target_duration_minutes: 120,
        color: '#F59E0B', // amber
        icon: 'code2'
      },
      {
        name: 'Reading',
        description: 'Reading books and articles',
        category: 'learning' as const,
        target_duration_minutes: 60,
        color: '#10B981', // emerald
        icon: 'book'
      },
      {
        name: 'Exercise',
        description: 'Physical fitness and workouts',
        category: 'health' as const,
        target_duration_minutes: 45,
        color: '#3B82F6', // deep-blue
        icon: 'dumbbell'
      },
      {
        name: 'Meditation',
        description: 'Mindfulness and meditation practice',
        category: 'wellness' as const,
        target_duration_minutes: 20,
        color: '#8B5CF6', // violet
        icon: 'brain'
      },
      {
        name: 'Writing',
        description: 'Blog posts, journaling, and creative writing',
        category: 'creative' as const,
        target_duration_minutes: 30,
        color: '#F43F5E', // rose
        icon: 'book'
      },
      {
        name: 'Learning',
        description: 'Online courses and skill development',
        category: 'learning' as const,
        target_duration_minutes: 90,
        color: '#14B8A6', // teal
        icon: 'book'
      }
    ];

    // Create habits
    for (const habit of sampleHabits) {
      await habitService.createHabit(habit);
    }

    console.log('Sample habits created successfully');
  },

  // Seed sample habit logs for the past week
  async seedSampleLogs(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get user's habits
    const { data: habits } = await supabase
      .from('habits')
      .select('id, name')
      .eq('user_id', user.id);

    if (!habits || habits.length === 0) {
      console.log('No habits found, create habits first');
      return;
    }

    // Check if logs already exist
    const { data: existingLogs } = await supabase
      .from('habit_logs')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (existingLogs && existingLogs.length > 0) {
      console.log('User already has logs, skipping seed');
      return;
    }

    const now = new Date();
    const sampleLogs = [];

    // Generate logs for the past 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Generate random logs for each habit
      for (const habit of habits) {
        // Random completion (70% chance)
        const isCompleted = Math.random() > 0.3;
        
        if (isCompleted) {
          // Random duration between 15 minutes and 2 hours
          const durationMinutes = Math.floor(Math.random() * 105) + 15;
          
          sampleLogs.push({
            habit_id: habit.id,
            user_id: user.id,
            date: dateStr,
            duration_minutes: durationMinutes,
            is_completed: true,
            notes: `Sample log for ${habit.name}`
          });
        }
      }
    }

    // Insert logs
    if (sampleLogs.length > 0) {
      const { error } = await supabase
        .from('habit_logs')
        .insert(sampleLogs);

      if (error) {
        console.error('Error seeding logs:', error);
        throw error;
      }

      console.log(`${sampleLogs.length} sample logs created successfully`);
    }
  },

  // Seed all sample data
  async seedAllData(): Promise<void> {
    try {
      await this.seedSampleHabits();
      await this.seedSampleLogs();
      console.log('All sample data seeded successfully');
    } catch (error) {
      console.error('Error seeding data:', error);
      throw error;
    }
  },

  // Clear all user data (for testing)
  async clearUserData(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Delete in order due to foreign key constraints
    await supabase
      .from('habit_logs')
      .delete()
      .eq('user_id', user.id);

    await supabase
      .from('habit_sessions')
      .delete()
      .eq('user_id', user.id);

    await supabase
      .from('habits')
      .delete()
      .eq('user_id', user.id);

    console.log('User data cleared successfully');
  }
};
