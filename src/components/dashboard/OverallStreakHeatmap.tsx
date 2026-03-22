import React from 'react';
import { ActivityCalendar, ThemeInput } from 'react-activity-calendar';
import { useHabitLogsForHabits } from '@/hooks/useHabits';
import { subYears, format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Habit } from '@/services/habitService';

interface OverallStreakHeatmapProps {
  habits: Habit[];
  colorTheme?: string;
}

export const OverallStreakHeatmap: React.FC<OverallStreakHeatmapProps> = ({ habits, colorTheme = "orange" }) => {
  // Fetch logs for the past year
  const endDate = new Date();
  const startDate = subYears(endDate, 1);
  
  const habitIds = habits.map(h => h.id);
  const { data: logs, isLoading } = useHabitLogsForHabits(
    habitIds, 
    format(startDate, 'yyyy-MM-dd'), 
    format(endDate, 'yyyy-MM-dd')
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 text-muted-foreground bg-background rounded-2xl border border-border">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading overall streak data...</span>
      </div>
    );
  }

  // Calculate combined target time across all habits
  const combinedTargetTime = habits.reduce((sum, h) => sum + (h.target_duration_minutes || 60), 0);
  // Threshold is 75% of combined target time
  const streakThreshold = combinedTargetTime * 0.75;

  // Create a map of dates to total combined duration on that date
  const logMap = new Map<string, number>();
  logs?.forEach(log => {
    const currentDuration = logMap.get(log.date) || 0;
    logMap.set(log.date, currentDuration + log.duration_minutes);
  });

  // Calculate streaks across consecutive days
  const calendarData = [];
  let currentDate = startDate;
  let currentStreak = 0;
  let totalStreakDays = 0;

  while (currentDate <= endDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const duration = logMap.get(dateStr) || 0;
    
    // Check if the total logged duration across all habits meets the 75% combined threshold
    if (combinedTargetTime > 0 && duration >= streakThreshold) {
        currentStreak += 1;
        totalStreakDays += 1;
    } else {
        // Did not meet the combined target, streak breaks or resets to 0. 
        currentStreak = 0; 
    }

    // Use simple 2-color logic: fully shaded if 75% target met, empty otherwise
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (combinedTargetTime > 0 && duration >= streakThreshold) {
        level = 4;
    }
    
    calendarData.push({
      date: dateStr,
      count: currentStreak, // Using current streak length as count
      level: level
    });
    
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
  }

  const baseColor = (colorTheme && colorTheme.startsWith('#')) ? colorTheme : '#f97316';
  
  const explicitTheme: ThemeInput = {
    light: ['#ebedf0', `${baseColor}40`, `${baseColor}80`, `${baseColor}bf`, baseColor],
    dark: ['#1e293b', `${baseColor}40`, `${baseColor}80`, `${baseColor}bf`, baseColor],
  };

  const labels = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    totalCount: `Met 75% target on ${totalStreakDays} days`,
    legend: {
      less: 'Short',
      more: 'Long',
    },
  };

  return (
    <div className="bg-background rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
        <span className="font-semibold text-foreground">Overall Streak Heatmap</span>
        <span className="text-xs text-muted-foreground ml-auto">
          Requires {Math.round(streakThreshold)}m / {combinedTargetTime}m combined daily
        </span>
      </div>
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
    </div>
  );
};
