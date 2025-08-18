import { CircularProgress } from "./CircularProgress";
import { Clock, Target, TrendingUp, Zap } from "lucide-react";
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
    if (progress >= 80) return 'bg-chart-green';
    if (progress >= 60) return 'bg-chart-blue';
    if (progress >= 40) return 'bg-chart-orange';
    return 'bg-chart-red';
  };

  const getProgressTextColor = (progress: number) => {
    if (progress >= 80) return 'text-chart-green';
    if (progress >= 60) return 'text-chart-blue';
    if (progress >= 40) return 'text-chart-orange';
    return 'text-chart-red';
  };

  const getProgressMessage = (progress: number) => {
    if (progress >= 90) return "Excellent! You're crushing it today! 🚀";
    if (progress >= 80) return "Great job! You're on fire! 🔥";
    if (progress >= 60) return "Good progress! Keep it up! 💪";
    if (progress >= 40) return "You're getting there! Stay focused! 🎯";
    if (progress >= 20) return "Getting started! Every step counts! 🌱";
    return "Ready to begin your day? Let's go! ⭐";
  };

  const getProgressEmoji = (progress: number) => {
    if (progress >= 90) return "🚀";
    if (progress >= 80) return "🔥";
    if (progress >= 60) return "💪";
    if (progress >= 40) return "🎯";
    if (progress >= 20) return "🌱";
    return "⭐";
  };

  return (
    <div className="p-6 rounded-xl bg-gradient-card backdrop-blur border border-glass-border shadow-card hover:shadow-glow transition-all duration-300 motion-safe:hover:translate-y-[-2px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Today's Progress</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Daily Overview</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-secondary/20 border border-glass-border transition-all duration-300 motion-safe:hover:scale-[1.02]">
              <div className="text-2xl font-bold text-foreground">{currentTime}</div>
              <div className="text-xs text-muted-foreground">Time Spent</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/20 border border-glass-border transition-all duration-300 motion-safe:hover:scale-[1.02]">
              <div className="text-2xl font-bold text-foreground">{totalTime}</div>
              <div className="text-xs text-muted-foreground">Target Time</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/20 border border-glass-border transition-all duration-300 motion-safe:hover:scale-[1.02]">
              <div className="text-2xl font-bold text-foreground">{activeHabits}</div>
              <div className="text-xs text-muted-foreground">Active Habits</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">0%</span>
              <span className={`font-medium ${getProgressTextColor(progress)} flex items-center gap-1`}>
                {progress}% {getProgressEmoji(progress)}
              </span>
              <span className="text-muted-foreground">100%</span>
            </div>
            
            <div className="w-full h-3 bg-progress-bg rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(progress)} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
          
          <div className="mt-4 p-3 rounded-lg bg-secondary/20 border border-glass-border">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-chart-blue" />
              <span className="text-sm font-medium text-foreground">Today's Stoic Quote</span>
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
            <div className="text-xs text-muted-foreground">complete</div>
          </div>
        </div>
      </div>
    </div>
  );
};