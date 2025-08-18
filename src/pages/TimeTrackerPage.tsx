import { Clock, Play, Pause, Square, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useHabits, useStartSession, useEndSession, useActiveSessions } from "@/hooks/useHabits";
import { useLogHabit } from "@/hooks/useHabits";

const TimeTrackerPage = () => {
  const { toast } = useToast();
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: activeSessions = [] } = useActiveSessions();
  const startSession = useStartSession();
  const endSession = useEndSession();
  const logHabit = useLogHabit();

  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<{ [key: string]: number }>({});
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Initialize active timer from existing sessions
  useEffect(() => {
    if (activeSessions.length > 0 && !activeTimer) {
      const session = activeSessions[0];
      setActiveTimer(session.habit_id);
      
      // Calculate elapsed time from session start
      const startTime = new Date(session.start_time).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setTimeElapsed(prev => ({ ...prev, [session.habit_id]: elapsed }));
      
      // Start the timer
      startTimerInterval(session.habit_id);
    }
  }, [activeSessions, activeTimer]);

  const startTimerInterval = (habitId: string) => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => ({
        ...prev,
        [habitId]: (prev[habitId] || 0) + 1
      }));
    }, 1000);
    setIntervalId(timer);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = async (habitId: string) => {
    if (activeTimer && activeTimer !== habitId) {
      toast({
        title: "Timer already running",
        description: "Stop the current timer before starting a new one.",
        variant: "destructive"
      });
      return;
    }

    try {
      await startSession.mutateAsync(habitId);
      setActiveTimer(habitId);
      setTimeElapsed(prev => ({ ...prev, [habitId]: 0 }));
      startTimerInterval(habitId);

      const habit = habits.find(h => h.id === habitId);
      toast({
        title: "Timer started",
        description: `Started tracking time for ${habit?.name}`,
      });
    } catch (error) {
      toast({
        title: "Error starting timer",
        description: "Failed to start the timer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const pauseTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setActiveTimer(null);

    toast({
      title: "Timer paused",
      description: "You can resume or save your session.",
    });
  };

  const stopTimer = async (habitId: string) => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setActiveTimer(null);

    const elapsed = timeElapsed[habitId] || 0;
    if (elapsed > 0) {
      try {
        // End the session
        const session = activeSessions.find(s => s.habit_id === habitId);
        if (session) {
          await endSession.mutateAsync(session.id);
        }

        // Log the habit time
        const durationMinutes = Math.floor(elapsed / 60);
        if (durationMinutes > 0) {
          await logHabit.mutateAsync({
            habitId,
            duration: durationMinutes,
            notes: `Session completed: ${formatTime(elapsed)}`
          });
        }

        const habit = habits.find(h => h.id === habitId);
        toast({
          title: "Session saved",
          description: `Logged ${formatTime(elapsed)} for ${habit?.name}`,
        });

        // Reset elapsed time
        setTimeElapsed(prev => ({ ...prev, [habitId]: 0 }));
      } catch (error) {
        toast({
          title: "Error saving session",
          description: "Failed to save your session. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const resetTimer = (habitId: string) => {
    if (activeTimer === habitId) {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      setActiveTimer(null);
    }
    
    setTimeElapsed(prev => ({
      ...prev,
      [habitId]: 0
    }));

    const habit = habits.find(h => h.id === habitId);
    toast({
      title: "Timer reset",
      description: `Reset timer for ${habit?.name}`,
    });
  };

  if (habitsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading habits...</p>
        </div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Time Tracker</h1>
          <p className="text-muted-foreground">Track time spent on your habits in real-time</p>
        </div>
        
        <Card className="bg-card/50 backdrop-blur border-glass-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No habits to track</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create some habits first to start tracking your time
            </p>
            <Button 
              onClick={() => window.location.href = '/habits'} 
              className="bg-gradient-primary hover:opacity-90 text-white shadow-glow"
            >
              Create Habits
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Time Tracker</h1>
        <p className="text-muted-foreground">Track time spent on your habits in real-time</p>
      </div>

      {/* Active Timer Display */}
      {activeTimer && (
        <Card className="bg-gradient-card backdrop-blur border border-glass-border shadow-glow">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-foreground mb-4">
                {formatTime(timeElapsed[activeTimer] || 0)}
              </div>
              <div className="text-xl text-muted-foreground mb-6">
                {habits.find(h => h.id === activeTimer)?.name}
              </div>
              <div className="flex justify-center gap-4">
                <Button
                  onClick={pauseTimer}
                  variant="outline"
                  size="lg"
                  className="border-glass-border hover:bg-secondary/50"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={() => stopTimer(activeTimer)}
                  variant="outline"
                  size="lg"
                  className="border-glass-border hover:bg-secondary/50"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop & Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Habit Timers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {habits.map((habit) => {
          const isActive = activeTimer === habit.id;
          const elapsed = timeElapsed[habit.id] || 0;
          
          return (
            <Card key={habit.id} className={`
              backdrop-blur border shadow-card transition-all duration-300
              ${isActive 
                ? 'bg-gradient-card border-primary shadow-glow' 
                : 'bg-card/50 border-glass-border hover:shadow-glow'
              }
            `}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: habit.color }}
                    />
                    {habit.name}
                  </CardTitle>
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-3xl font-mono font-bold text-foreground mb-2">
                    {formatTime(elapsed)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isActive ? 'Running...' : 'Stopped'}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {!isActive ? (
                    <Button
                      onClick={() => startTimer(habit.id)}
                      disabled={startSession.isPending}
                      className="flex-1 bg-gradient-primary hover:opacity-90 text-white shadow-glow"
                    >
                      {startSession.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Start
                    </Button>
                  ) : (
                    <Button
                      onClick={pauseTimer}
                      variant="outline"
                      className="flex-1 border-glass-border hover:bg-secondary/50"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => resetTimer(habit.id)}
                    variant="outline"
                    size="sm"
                    className="px-3 border-glass-border hover:bg-secondary/50"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Today's Sessions */}
      <Card className="bg-card/50 backdrop-blur border border-glass-border shadow-card">
        <CardHeader>
          <CardTitle>Today's Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No sessions recorded today</h3>
            <p className="text-muted-foreground">
              Start a timer above to begin tracking your habits
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeTrackerPage;
