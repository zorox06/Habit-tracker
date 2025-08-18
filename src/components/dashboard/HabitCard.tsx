import { Clock, TrendingUp, Plus, Play, Square, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "./CircularProgress";
import { useToast } from "@/hooks/use-toast";
import { useStartSession, useLogHabit } from "@/hooks/useHabits";
import { useState, useEffect } from "react";
import { calculateProgress, parseTimeString, formatMinutes } from "@/lib/utils";

interface HabitCardProps {
  title: string;
  category: string;
  progress: number;
  timeSpent: string;
  timeSpentMinutes: number; // Add actual minutes spent
  targetTime: number; // Changed from string to number (minutes)
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
  if (progress >= 100) return 'text-chart-green'; // Over 100% is excellent
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
  const logHabit = useLogHabit();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logDuration, setLogDuration] = useState(30);
  const [logNotes, setLogNotes] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackedTime, setTrackedTime] = useState(0);
  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(null);

  const handleStartTimer = async () => {
    if (!habitId) {
      toast({
        title: "Error",
        description: "Habit ID not found",
        variant: "destructive"
      });
      return;
    }

    try {
      await startSession.mutateAsync(habitId);
      setIsTracking(true);
      setTrackingStartTime(new Date());
      setTrackedTime(0);
      toast({
        title: "Timer started!",
        description: `Started tracking time for ${title}.`,
      });
    } catch (error) {
      toast({
        title: "Error starting timer",
        description: "Failed to start the timer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStopTimer = async () => {
    if (!habitId) return;
    
    try {
      setIsTracking(false);
      setTrackingStartTime(null);
      
      // Log the tracked time (convert seconds to minutes)
      if (trackedTime > 0) {
        const trackedMinutes = Math.floor(trackedTime / 60);
        await logHabit.mutateAsync({
          habitId,
          duration: trackedMinutes,
          notes: `Tracked session: ${Math.floor(trackedTime / 60)}m ${trackedTime % 60}s`
        });
        
        toast({
          title: "Session logged!",
          description: `Logged ${Math.floor(trackedTime / 60)}m ${trackedTime % 60}s for ${title}`,
        });
      }
      
      setTrackedTime(0);
    } catch (error) {
      toast({
        title: "Error stopping timer",
        description: "Failed to stop the timer. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Real-time tracking effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking && trackingStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - trackingStartTime.getTime()) / 1000);
        setTrackedTime(elapsedSeconds);
        
        // Debug progress calculation
        const trackedMinutes = Math.floor(elapsedSeconds / 60);
        const totalTimeSpent = timeSpentMinutes + trackedMinutes;
        const calculatedProgress = calculateProgress(totalTimeSpent, targetTime);
        console.log(`Progress Debug for ${title}:`, {
          timeSpentMinutes,
          trackedMinutes,
          totalTimeSpent,
          targetTime,
          calculatedProgress
        });
      }, 1000); // Update every second
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, trackingStartTime, timeSpentMinutes, targetTime, title]);

  const handleLogTime = () => {
    setIsLogModalOpen(true);
  };

  const handleSubmitLog = async () => {
    if (!habitId) {
      toast({
        title: "Error",
        description: "Habit ID not found",
        variant: "destructive"
      });
      return;
    }

    // Debug logging for progress calculation
    console.log(`Logging time for ${title}:`, {
      habitId,
      logDuration,
      currentTimeSpent: timeSpentMinutes,
      targetTime,
      currentProgress: calculateProgress(timeSpentMinutes, targetTime),
      newTimeSpent: timeSpentMinutes + logDuration,
      newProgress: calculateProgress(timeSpentMinutes + logDuration, targetTime)
    });

    try {
      await logHabit.mutateAsync({
        habitId,
        duration: logDuration,
        notes: logNotes
      });
      
      toast({
        title: "Time logged!",
        description: `Logged ${logDuration} minutes for ${title}`,
      });
      
      // Reset form and close modal
      setLogDuration(30);
      setLogNotes('');
      setIsLogModalOpen(false);
    } catch (error: any) {
      console.error('Error logging habit:', error);
      toast({
        title: "Error logging time",
        description: error.message || "Failed to log time. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="p-6 rounded-xl bg-gradient-card backdrop-blur border border-glass-border shadow-card hover:shadow-glow transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-${colorMap[color]}/20 flex items-center justify-center`}>
              {icon || <div className={`w-4 h-4 rounded-full bg-${colorMap[color]}`} />}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground capitalize">{category}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>{streakCount} day{streakCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4" />
            <span>Target: {formatMinutes(targetTime)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <CircularProgress progress={isTracking ? calculateProgress(timeSpentMinutes + Math.floor(trackedTime / 60), targetTime) : calculateProgress(timeSpentMinutes, targetTime)} color={color} size="lg" />
          
          <div className="text-right">
            <div className={`text-2xl font-bold ${getProgressColor(isTracking ? calculateProgress(timeSpentMinutes + Math.floor(trackedTime / 60), targetTime) : calculateProgress(timeSpentMinutes, targetTime))}`}>{timeSpent}</div>
            <div className="text-sm text-muted-foreground">spent today</div>
            <div className="text-xs text-muted-foreground mt-1">Target: {formatMinutes(targetTime)}</div>
            {calculateProgress(timeSpentMinutes, targetTime) >= 100 && (
              <div className="text-xs text-green-500 mt-1">✓ Target exceeded!</div>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>0%</span>
            <span className={`font-medium ${getProgressColor(isTracking ? calculateProgress(timeSpentMinutes + Math.floor(trackedTime / 60), targetTime) : calculateProgress(timeSpentMinutes, targetTime))}`}>
              {isTracking ? `${calculateProgress(timeSpentMinutes + Math.floor(trackedTime / 60), targetTime)}%` : `${calculateProgress(timeSpentMinutes, targetTime)}%`}
            </span>
            <span>100%</span>
          </div>
          <div className="w-full h-2 bg-progress-bg rounded-full overflow-hidden">
            <div 
              className={`h-full bg-${colorMap[color]} rounded-full transition-all duration-500 ease-out`}
              style={{ 
                width: `${Math.min(100, isTracking ? calculateProgress(timeSpentMinutes + Math.floor(trackedTime / 60), targetTime) : calculateProgress(timeSpentMinutes, targetTime))}%` 
              }}
            />
          </div>
          {isTracking && (
            <div className="mt-2 text-xs text-center text-muted-foreground">
              Live tracking: +{Math.floor(trackedTime / 60)}m {trackedTime % 60}s
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {isTracking ? (
            <Button 
              onClick={handleStopTimer}
              variant="outline" 
              size="sm" 
              className="flex-1 h-9 border-glass-border hover:bg-secondary/50 bg-red-500/20 text-red-500 hover:bg-red-500/30"
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
              className="flex-1 h-9 border-glass-border hover:bg-secondary/50"
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
            className="px-3 h-9 border-glass-border hover:bg-secondary/50"
          >
            <Plus className="w-4 h-4" />
            Log
          </Button>
        </div>
      </div>

      {/* Log Time Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-glass-border rounded-xl shadow-card w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <h2 className="text-xl font-semibold text-foreground">Log Time for {title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLogModalOpen(false)}
                className="h-8 w-8 p-0 hover:bg-secondary/50"
              >
                ×
              </Button>
            </div>

            <div className="p-6 space-y-4">
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
                  className="w-full p-2 rounded-lg bg-secondary/20 border border-glass-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Notes (optional)</label>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="What did you work on?"
                  className="w-full p-2 rounded-lg bg-secondary/20 border border-glass-border text-foreground"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 border-glass-border hover:bg-secondary/50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitLog}
                  disabled={logHabit.isPending}
                  className="flex-1 bg-gradient-primary hover:opacity-90 text-white shadow-glow"
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