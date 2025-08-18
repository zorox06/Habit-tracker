import { Calendar, Target, Clock, TrendingUp, Code2, BookOpen, Dumbbell, Brain, LogOut, User, Plus } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DailyProgress } from "@/components/dashboard/DailyProgress";
import { HabitCard } from "@/components/dashboard/HabitCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationProvider, useNavigation } from "@/contexts/NavigationContext";
import { useHabits, useDailyStats, useActiveSessions } from "@/hooks/useHabits";
import { useToast } from "@/hooks/use-toast";
import { AddHabitModal } from "@/components/modals/AddHabitModal";
import { useState } from "react";
import HabitsPage from "./HabitsPage";
import AnalyticsPage from "./AnalyticsPage";
import CalendarPage from "./CalendarPage";
import { formatMinutes, calculateProgress } from "@/lib/utils";

const iconMap = {
  code2: <Code2 className="w-5 h-5" />,
  book: <BookOpen className="w-5 h-5" />,
  dumbbell: <Dumbbell className="w-5 h-5" />,
  brain: <Brain className="w-5 h-5" />,
};

const DashboardContent = () => {
  const { signOut, user } = useAuth();
  const { currentPage, setCurrentPage } = useNavigation();
  const { toast } = useToast();
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: dailyStats } = useDailyStats() as { data: {
    totalTime: number;
    completedHabits: number;
    totalHabits: number;
    progress: number;
    habitTimeSpent: Record<string, number>;
    habitStreaks: Record<string, number>;
  } | undefined };
  const { data: activeSessions = [] } = useActiveSessions();
  
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleUserProfile = () => {
    console.log('User profile clicked');
    // TODO: Open user profile modal or page
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "See you next time!"
      });
    }
  };

  const handleAddNewHabit = () => {
    setIsAddHabitModalOpen(true);
  };

  const handleGoToHabits = () => {
    setCurrentPage('habits');
  };



  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'habits':
        return <HabitsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'calendar':
        return <CalendarPage />;
      default:
        return renderDashboardHome();
    }
  };

  const renderDashboardHome = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Today</h1>
          <p className="text-muted-foreground">{todayStr}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <span className="text-4xl font-bold">{dailyStats?.completedHabits || 0}</span>
            <span className="text-sm text-muted-foreground">completed</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUserProfile}
              className="border-glass-border hover:bg-secondary/50"
            >
              <User className="w-4 h-4 mr-2" />
              {user?.email}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-glass-border hover:bg-secondary/50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>



      {/* Add New Habit Button */}
      <div className="flex justify-center mb-8">
        <Button 
          onClick={handleAddNewHabit}
          className="bg-gradient-primary hover:opacity-90 text-white shadow-glow px-8 py-3 text-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Habit
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            gradient={stat.gradient}
          />
        ))}
      </div>

      {/* Daily Progress */}
      <div className="mb-8">
        {(() => {
          const totalTimeSpent = dailyStats?.totalTime || 0;
          const totalTargetTime = habits.reduce((sum, habit) => sum + (habit.target_duration_minutes || 0), 0);
          const calculatedProgress = habits.length > 0 ? calculateProgress(totalTimeSpent, totalTargetTime) : 0;
          
          console.log('Daily Progress Debug:', {
            totalTimeSpent,
            totalTargetTime,
            calculatedProgress,
            habitsCount: habits.length,
            calculation: `${totalTimeSpent} / ${totalTargetTime} = ${calculatedProgress}%`
          });
          
          return (
            <DailyProgress
              currentTime={formatMinutes(totalTimeSpent)}
              totalTime={formatMinutes(totalTargetTime)}
              progress={calculatedProgress}
              activeHabits={activeSessions.length}
            />
          );
        })()}
      </div>

            {/* Today's Habits */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Today's Habits</h2>
          {habits.length > 0 && (
            <Button
              variant="outline"
              onClick={handleGoToHabits}
              className="border-glass-border hover:bg-secondary/50"
            >
              Manage All Habits
            </Button>
          )}
        </div>
        
        {habitsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading habits...</p>
            </div>
          </div>
        ) : habits.length === 0 ? (
          <div className="mb-4 p-8 rounded-lg bg-secondary/30 border border-glass-border text-center">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No habits created yet</h3>
            <p className="text-muted-foreground mb-6">
              Start building better habits by creating your first one
            </p>
            <Button 
              onClick={handleAddNewHabit}
              className="bg-gradient-primary hover:opacity-90 text-white shadow-glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Habit
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {habits.slice(0, 4).map((habit, index) => {
              // Calculate real progress for this habit
              const targetMinutes = habit.target_duration_minutes || 60;
              const timeSpentMinutes = dailyStats?.habitTimeSpent?.[habit.id] || 0;
              
              // Use utility function to calculate progress (capped at 100%)
              const progress = calculateProgress(timeSpentMinutes, targetMinutes);
              const timeSpentFormatted = formatMinutes(timeSpentMinutes);
              
              // Debug logging
              console.log(`Habit ${habit.name}:`, {
                id: habit.id,
                targetMinutes,
                timeSpentMinutes,
                progress,
                habitTimeSpent: dailyStats?.habitTimeSpent?.[habit.id],
                allHabitTimeSpent: dailyStats?.habitTimeSpent,
                calculation: `${timeSpentMinutes} / ${targetMinutes} = ${progress}%`
              });
              
              return (
                <HabitCard
                  key={habit.id}
                  habitId={habit.id}
                  title={habit.name}
                  category={habit.category}
                  progress={progress}
                  timeSpent={timeSpentFormatted}
                  timeSpentMinutes={timeSpentMinutes}
                  targetTime={targetMinutes}
                  streakCount={dailyStats?.habitStreaks?.[habit.id] || 0}
                  color={habit.color as "cyan" | "green" | "orange" | "purple"}
                  icon={iconMap[habit.icon as keyof typeof iconMap] || iconMap.code2}
                />
              );
            })}
            {habits.length > 4 && (
              <div className="lg:col-span-2 flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleGoToHabits}
                  className="border-glass-border hover:bg-secondary/50"
                >
                  View All {habits.length} Habits
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Calculate completed habits based on 100% target completion
  const completedHabits = habits.filter(habit => {
    const timeSpent = dailyStats?.habitTimeSpent?.[habit.id] || 0;
    const targetTime = habit.target_duration_minutes || 60;
    return timeSpent >= targetTime;
  }).length;

  const stats = [
    { 
      title: "Habits", 
      value: `${completedHabits}/${habits.length}`, 
      subtitle: "completed", 
      icon: Target 
    },
    { 
      title: "Time Today", 
      value: formatMinutes(dailyStats?.totalTime || 0), 
      subtitle: "", 
      icon: Clock 
    },
    { 
      title: "Progress", 
      value: `${habits.length > 0 ? calculateProgress(dailyStats?.totalTime || 0, habits.reduce((sum, habit) => sum + (habit.target_duration_minutes || 0), 0)) : 0}%`, 
      subtitle: "", 
      icon: TrendingUp 
    },
    { 
      title: "Active", 
      value: activeSessions.length.toString(), 
      subtitle: activeSessions.length === 1 ? "session" : "sessions", 
      icon: Calendar, 
      gradient: true 
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {renderCurrentPage()}
        </div>
      </main>

      {/* Add Habit Modal */}
      <AddHabitModal 
        isOpen={isAddHabitModalOpen} 
        onClose={() => setIsAddHabitModalOpen(false)} 
      />
    </div>
  );
};

const Dashboard = () => {
  return (
    <NavigationProvider>
      <DashboardContent />
    </NavigationProvider>
  );
};

export default Dashboard;