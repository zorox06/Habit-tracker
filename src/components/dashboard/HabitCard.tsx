import { Clock, TrendingUp, Plus, Play, Square, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "./CircularProgress";
import { useToast } from "@/hooks/use-toast";
import { useStartSession, useLogHabit, useActiveSessions, useEndSession } from "@/hooks/useHabits";
import { useState, useEffect } from "react";
import { calculateProgress, parseTimeString, formatMinutes } from "@/lib/utils";

interface HabitCardProps {
  title: string;
  category: string;
  progress: number;
  timeSpent: string;
  timeSpentMinutes: number;
  targetTime: number;
  streakCount: number;
  color: "cyan" | "green" | "orange" | "purple";
  icon?: React.ReactNode;
  habitId?: string;
}

const colorMap = {
  cyan: "progress-cyan",
  green: "progress-green",
  orange: "progress-orange",
  purple: "progress-purple"
};

const getProgressColor = (progress: number) => {
  if (progress >= 100) return 'text-chart-green';
  if (progress >= 80) return 'text-chart-green';
  if (progress >= 60) return 'text-chart-blue';
  if (progress >= 40) return 'text-chart-orange';
  return 'text-chart-red';
};

export const HabitCard = ({
  title,
  category,
  progress,
  timeSpent,
  timeSpentMinutes,
  targetTime,
  streakCount,
  color,
  icon,
  habitId
}: HabitCardProps) => {
  const { toast } = useToast();
  const startSession = useStartSession();
  const endSession = useEndSession();
  const logHabit = useLogHabit();
  const { data: activeSessions = [] } = useActiveSessions();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logDuration, setLogDuration] = useState(30);
  const [logNotes, setLogNotes] = useState('');
  const [trackedTime, setTrackedTime] = useState(0);

  const activeSession = activeSessions.find(s => s.habit_id === habitId);
  const isTracking = !!activeSession;

  const handleStartTimer = async () => {
    if (!habitId) {
      toast({ title: "Error", description: "Habit ID not found", variant: "destructive" });
      return;
    }
    try {
      await startSession.mutateAsync(habitId);
      toast({ title: "Timer started", description: `Tracking time for ${title}.` });
    } catch (error) {
      toast({ title: "Error starting timer", description: "Failed to start. Please try again.", variant: "destructive" });
    }
  };

  const handleStopTimer = async () => {
    if (!habitId || !activeSession) return;
    try {
      await endSession.mutateAsync(activeSession.id);
      toast({ title: "Session ended", description: `Logged ${Math.floor(trackedTime / 60)}m ${trackedTime % 60}s for ${title}` });
    } catch (error) {
      toast({ title: "Error stopping timer", description: "Failed to stop. Please try again.", variant: "destructive" });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && activeSession?.start_time) {
      const startTimeMs = new Date(activeSession.start_time).getTime();
      const updateTime = () => {
        const now = new Date().getTime();
        setTrackedTime(Math.max(0, Math.floor((now - startTimeMs) / 1000)));
      };
      updateTime();
      interval = setInterval(updateTime, 1000);
    } else {
      setTrackedTime(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTracking, activeSession]);

  const handleLogTime = () => setIsLogModalOpen(true);

  const handleSubmitLog = async () => {
    if (!habitId) {
      toast({ title: "Error", description: "Habit ID not found", variant: "destructive" });
      return;
    }
    try {
      await logHabit.mutateAsync({ habitId, duration: logDuration, notes: logNotes });
      toast({ title: "Time logged", description: `Logged ${logDuration} minutes for ${title}` });
      setLogDuration(30);
      setLogNotes('');
      setIsLogModalOpen(false);
    } catch (error: any) {
      toast({ title: "Error logging time", description: error.message || "Failed to log time.", variant: "destructive" });
    }
  };

  const currentProgress = isTracking
    ? calculateProgress(timeSpentMinutes + Math.floor(trackedTime / 60), targetTime)
    : calculateProgress(timeSpentMinutes, targetTime);

  return (
    <>
      <div className="p-5 rounded-lg bg-surface-1 border border-border transition-colors duration-150 hover:bg-surface-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-md bg-${colorMap[color]}/20 flex items-center justify-center`}>
              {icon || <div className={`w-3.5 h-3.5 rounded-full bg-${colorMap[color]}`} />}
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground text-[0.95rem] leading-tight">{title}</h3>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{category}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span className="tabular-nums">{streakCount}d</span>
          </div>
        </div>

        {/* Target */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Target className="w-3.5 h-3.5" />
          <span>Target: {formatMinutes(targetTime)}</span>
        </div>

        {/* Progress area */}
        <div className="flex items-center justify-between mb-3">
          <CircularProgress progress={currentProgress} color={color} size="lg" />
          <div className="text-right">
            <div className={`text-2xl font-display font-bold tabular-nums ${getProgressColor(currentProgress)}`}>{timeSpent}</div>
            <div className="text-xs text-muted-foreground mt-0.5">spent today</div>
            <div className="text-xs text-muted-foreground mt-1">Target: {formatMinutes(targetTime)}</div>
            {calculateProgress(timeSpentMinutes, targetTime) >= 100 && (
              <div className="text-xs text-success mt-1">Target exceeded</div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>0%</span>
            <span className={`font-medium tabular-nums ${getProgressColor(currentProgress)}`}>
              {currentProgress}%
            </span>
            <span>100%</span>
          </div>
          <div className="w-full h-1.5 bg-progress-bg rounded-full overflow-hidden">
            <div
              className={`h-full bg-${colorMap[color]} rounded-full transition-all duration-500`}
              style={{
                width: `${Math.min(100, currentProgress)}%`,
                transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            />
          </div>
          {isTracking && (
            <div className="mt-1.5 text-xs text-center text-muted-foreground tabular-nums">
              Live: +{Math.floor(trackedTime / 60)}m {trackedTime % 60}s
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isTracking ? (
            <Button
              onClick={handleStopTimer}
              variant="outline"
              size="sm"
              className="flex-1 h-9 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop ({Math.floor(trackedTime / 60)}m {trackedTime % 60}s)
            </Button>
          ) : (
            <Button
              onClick={handleStartTimer}
              disabled={startSession.isPending}
              variant="outline"
              size="sm"
              className="flex-1 h-9 border-border hover:bg-surface-2"
            >
              {startSession.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start
            </Button>
          )}
          <Button
            onClick={handleLogTime}
            variant="outline"
            size="sm"
            className="px-3 h-9 border-border hover:bg-surface-2"
          >
            <Plus className="w-4 h-4" />
            Log
          </Button>
        </div>
      </div>

      {/* Log Time Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-border rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-display font-semibold text-foreground">Log Time — {title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLogModalOpen(false)}
                className="h-8 w-8 p-0 hover:bg-surface-2"
              >
                ×
              </Button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Duration (minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="480"
                  value={logDuration}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setLogDuration(isNaN(value) ? 0 : value);
                  }}
                  className="w-full p-2.5 rounded-md bg-surface-2 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Notes (optional)</label>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="What did you work on?"
                  className="w-full p-2.5 rounded-md bg-surface-2 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 border-border hover:bg-surface-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitLog}
                  disabled={logHabit.isPending}
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
                >
                  {logHabit.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    'Log Time'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};