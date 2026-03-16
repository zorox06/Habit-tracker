import { CircularProgress } from "./CircularProgress";
import { Clock, Zap } from "lucide-react";
import { getDailyQuote } from "@/services/quotesService";

interface DailyProgressProps {
  currentTime: string;
  totalTime: string;
  progress: number;
  activeHabits: number;
}

export const DailyProgress = ({
  currentTime,
  totalTime,
  progress,
  activeHabits
}: DailyProgressProps) => {
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-progress-green';
    if (progress >= 60) return 'bg-chart-blue';
    if (progress >= 40) return 'bg-progress-orange';
    return 'bg-chart-red';
  };

  const getProgressTextColor = (progress: number) => {
    if (progress >= 80) return 'text-chart-green';
    if (progress >= 60) return 'text-chart-blue';
    if (progress >= 40) return 'text-chart-orange';
    return 'text-chart-red';
  };

  const getProgressMessage = (progress: number) => {
    if (progress >= 90) return "Excellent — you're crushing it today.";
    if (progress >= 80) return "Great job. Keep the momentum going.";
    if (progress >= 60) return "Good progress. Stay focused.";
    if (progress >= 40) return "Getting there. Keep pushing.";
    if (progress >= 20) return "Every minute counts. Keep going.";
    return "Ready to begin? Let's go.";
  };

  return (
    <div className="p-6 rounded-lg bg-surface-1 border border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-foreground">Today's Progress</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Daily Overview</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 rounded-md bg-surface-2">
              <div className="text-2xl font-display font-bold text-foreground tabular-nums">{currentTime}</div>
              <div className="text-xs text-muted-foreground mt-1">Time Spent</div>
            </div>
            <div className="p-3 rounded-md bg-surface-2">
              <div className="text-2xl font-display font-bold text-foreground tabular-nums">{totalTime}</div>
              <div className="text-xs text-muted-foreground mt-1">Target Time</div>
            </div>
            <div className="p-3 rounded-md bg-surface-2">
              <div className="text-2xl font-display font-bold text-foreground tabular-nums">{activeHabits}</div>
              <div className="text-xs text-muted-foreground mt-1">Active Now</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">0%</span>
              <span className={`font-medium tabular-nums ${getProgressTextColor(progress)}`}>
                {progress}%
              </span>
              <span className="text-muted-foreground">100%</span>
            </div>

            <div className="w-full h-2 bg-progress-bg rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(progress)} rounded-full transition-all duration-700`}
                style={{
                  width: `${Math.min(100, progress)}%`,
                  transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              />
            </div>
          </div>

          <div className="mt-4 p-3 rounded-md bg-surface-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Daily Thought</span>
            </div>
            <p className="text-sm text-muted-foreground italic">"{getDailyQuote().text}"</p>
            <p className="text-xs text-muted-foreground mt-1">— {getDailyQuote().author}</p>
          </div>
        </div>

        <div className="ml-8">
          <CircularProgress
            progress={progress}
            color="cyan"
            size="lg"
            showText={true}
          />
          <div className="text-center mt-2">
            <div className="text-xs text-muted-foreground">{getProgressMessage(progress)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};