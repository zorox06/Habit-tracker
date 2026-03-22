import { Target, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HabitCard } from "@/components/dashboard/HabitCard";
import { CircularProgress } from "@/components/dashboard/CircularProgress";
import { useHabits, useDailyStats, useActiveSessions } from "@/hooks/useHabits";
import { formatMinutes, calculateProgress } from "@/lib/utils";
import { iconMap } from "@/pages/Dashboard";
import { getDailyQuote } from "@/services/quotesService";

interface MobileDashboardProps {
  onAddHabit: () => void;
}

export const MobileDashboard = ({ onAddHabit }: MobileDashboardProps) => {
  const { data: habits = [], isLoading } = useHabits();
  const { data: dailyStats } = useDailyStats() as { data: {
    totalTime: number;
    completedHabits: number;
    totalHabits: number;
    progress: number;
    habitTimeSpent: Record<string, number>;
    habitStreaks: Record<string, number>;
  } | undefined };
  const { data: activeSessions = [] } = useActiveSessions();

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  const totalTimeSpent = dailyStats?.totalTime || 0;
  const totalTargetTime = habits.reduce((sum, h) => sum + (h.target_duration_minutes || 0), 0);
  const overallProgress = habits.length > 0 ? calculateProgress(totalTimeSpent, totalTargetTime) : 0;

  const completedHabits = habits.filter(h => {
    const spent = dailyStats?.habitTimeSpent?.[h.id] || 0;
    return spent >= (h.target_duration_minutes || 60);
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-2 animate-fade-up">

      {/* Date subtitle */}
      <p className="text-sm text-muted-foreground">{todayStr}</p>

      {/* Total Focus Time — hero card */}
      <div className="bg-surface-1 border border-border rounded-2xl p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Total Focus Time</p>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-5xl font-display font-bold text-foreground tabular-nums">
              {formatMinutes(totalTimeSpent)}
            </span>
          </div>
          <CircularProgress progress={overallProgress} color="cyan" size="lg" showText />
        </div>
      </div>

      {/* Two stat boxes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-1 border border-border rounded-2xl p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Active Habits</p>
          <p className="text-3xl font-display font-bold text-foreground tabular-nums">{habits.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {completedHabits > 0 ? `✓ ${completedHabits} complete` : 'None completed yet'}
          </p>
        </div>
        <div className="bg-surface-1 border border-border rounded-2xl p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Sessions</p>
          <p className="text-3xl font-display font-bold text-foreground tabular-nums">{activeSessions.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {activeSessions.length > 0 ? 'tracking now' : 'none active'}
          </p>
        </div>
      </div>

      {/* Daily quote */}
      <div className="bg-surface-1 border border-border rounded-2xl p-4">
        <p className="text-sm text-muted-foreground italic">"{getDailyQuote().text}"</p>
        <p className="text-xs text-muted-foreground mt-1.5">— {getDailyQuote().author}</p>
      </div>

      {/* Habits list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-display font-semibold text-foreground">Today's Habits</h2>
          <span className="text-xs text-muted-foreground tabular-nums">{completedHabits}/{habits.length}</span>
        </div>

        {habits.length === 0 ? (
          <div className="bg-surface-1 border border-border rounded-2xl p-8 text-center">
            <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No habits yet. Start tracking!</p>
            <Button onClick={onAddHabit} className="bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium">
              <Plus className="w-4 h-4 mr-2" /> Create Habit
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => {
              const targetMinutes = habit.target_duration_minutes || 60;
              const timeSpentMinutes = dailyStats?.habitTimeSpent?.[habit.id] || 0;
              const progress = calculateProgress(timeSpentMinutes, targetMinutes);
              return (
                <HabitCard
                  key={habit.id}
                  habitId={habit.id}
                  title={habit.name}
                  category={habit.category}
                  progress={progress}
                  timeSpent={formatMinutes(timeSpentMinutes)}
                  timeSpentMinutes={timeSpentMinutes}
                  targetTime={targetMinutes}
                  streakCount={dailyStats?.habitStreaks?.[habit.id] || 0}
                  color={habit.color}
                  icon={iconMap[habit.icon as keyof typeof iconMap] || iconMap.code2}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      {habits.length > 0 && (
        <div
          className="fixed bottom-20 right-4 z-40"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <Button
            onClick={onAddHabit}
            className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 p-0"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
};
