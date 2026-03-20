import React from 'react';
import { ActivityCalendar, ThemeInput } from 'react-activity-calendar';
import { useHabitLogsByHabit } from '@/hooks/useHabits';
import { subYears, format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface HabitHeatmapProps {
  habitId: string;
  targetTime: number; // in minutes
  colorTheme?: "cyan" | "green" | "orange" | "purple" | string;
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ habitId, targetTime, colorTheme = "green" }) => {
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
    // Note: there might be multiple logs per day if logs aren't consolidated, 
    // but habitService.logHabit consolidates them per day per user per habit.
    logMap.set(log.date, log.duration_minutes);
  });

  // Calculate the level (0-4) based on duration and targetTime
  const getLevel = (duration: number): 0 | 1 | 2 | 3 | 4 => {
    if (duration <= 0) return 0;
    const percentage = duration / (targetTime || 60); // Use 60m as fallback
    if (percentage >= 1) return 4;
    if (percentage >= 0.6) return 3;
    if (percentage >= 0.3) return 2;
    return 1;
  };

  // ActivityCalendar requires data in a specific format for the past year
  // Let's generate data for the past 365 days
  const calendarData = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const duration = logMap.get(dateStr) || 0;
    
    calendarData.push({
      date: dateStr,
      count: duration,
      level: getLevel(duration)
    });
    
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
  }

  // Define themes
  // We'll use CSS custom properties or valid color strings. 
  // Let's use a standard green theme as default or map the habit color
  const colorSchemes = {
    cyan: ['#1e293b', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9'],
    green: ['#1e293b', '#059669', '#10b981', '#34d399', '#6ee7b7'],
    orange: ['#1e293b', '#d97706', '#f59e0b', '#fbbf24', '#fcd34d'],
    purple: ['#1e293b', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'],
    default: ['#1e293b', '#059669', '#10b981', '#34d399', '#6ee7b7']
  };

  // For dark mode aesthetics, Activity Calendar provides light/dark themes
  const explicitTheme: ThemeInput = {
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  };

  // Adjust theme if we have specific colors, or just use default github-like
  if (colorSchemes[colorTheme as keyof typeof colorSchemes]) {
    explicitTheme.dark = colorSchemes[colorTheme as keyof typeof colorSchemes] as any;
    // Just using the same for light theme for simplicity, or we could customize
  }

  // Determine current theme from html class
  const isDarkMode = document.documentElement.classList.contains('dark') || true;

  const labels = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    totalCount: '{{count}} minutes logged in the last year',
    legend: {
      less: 'Less',
      more: 'More',
    },
  };

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="min-w-max">
        <ActivityCalendar 
          data={calendarData} 
          theme={explicitTheme}
          colorScheme={isDarkMode ? "dark" : "light"}
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
