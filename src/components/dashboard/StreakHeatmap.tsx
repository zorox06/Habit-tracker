import React from 'react';
import { ActivityCalendar, ThemeInput } from 'react-activity-calendar';
import { useHabitLogsByHabit } from '@/hooks/useHabits';
import { subYears, format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface StreakHeatmapProps {
  habitId: string;
  targetTime: number; // in minutes
  colorTheme?: "cyan" | "green" | "orange" | "purple" | string;
}

export const StreakHeatmap: React.FC<StreakHeatmapProps> = ({ habitId, targetTime, colorTheme = "orange" }) => {
  // Fetch logs for the past year
  const endDate = new Date();
  const startDate = subYears(endDate, 1);
  
  const { data: logs, isLoading } = useHabitLogsByHabit(
    habitId, 
    format(startDate, 'yyyy-MM-dd'), 
    format(endDate, 'yyyy-MM-dd')
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading activity...</span>
      </div>
    );
  }

  // Create a map of dates to duration
  const logMap = new Map<string, number>();
  logs?.forEach(log => {
    logMap.set(log.date, log.duration_minutes);
  });

  // Calculate streaks across consecutive days
  const calendarData = [];
  let currentDate = startDate;
  let currentStreak = 0;

  while (currentDate <= endDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const duration = logMap.get(dateStr) || 0;
    
    // Check if habit target was met on this day
    if (duration > 0 && duration >= (targetTime || 60)) {
        currentStreak += 1;
    } else if (duration > 0) {
        // Logged something but didn't meet target - depends on strictness.
        // Let's say if they didn't meet the target, streak breaks or resets to 0. 
        // For partial days, usually we break the streak in strict tracking.
        currentStreak = 0; 
    } else {
        currentStreak = 0;
    }

    // Determine the level based on streak length to color the heatmap
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (currentStreak >= 15) level = 4;
    else if (currentStreak >= 7) level = 3;
    else if (currentStreak >= 3) level = 2;
    else if (currentStreak >= 1) level = 1;
    
    calendarData.push({
      date: dateStr,
      count: currentStreak, // Using streak length as count
      level: level
    });
    
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
  }

  // We'll calculate opacities automatically for any given hex color.
  // Using orange by default since streaks are often represented with fire/orange.
  const baseColor = (colorTheme && colorTheme.startsWith('#')) ? colorTheme : '#f97316';
  
  const explicitTheme: ThemeInput = {
    light: ['#ebedf0', `${baseColor}40`, `${baseColor}80`, `${baseColor}bf`, baseColor],
    dark: ['#1e293b', `${baseColor}40`, `${baseColor}80`, `${baseColor}bf`, baseColor],
  };

  const labels = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    totalCount: 'Streak of {{count}} days',
    legend: {
      less: 'Short',
      more: 'Long',
    },
  };

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="min-w-max">
        <ActivityCalendar 
          data={calendarData} 
          theme={explicitTheme}
          colorScheme={"dark"}
          labels={labels}
          blockSize={10}
          blockRadius={2}
          blockMargin={4}
          fontSize={12}
          showWeekdayLabels
        />
      </div>
    </div>
  );
};
