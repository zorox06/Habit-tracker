import { Calendar, ChevronLeft, ChevronRight, Trash2, Clock, Target, Plus, CheckCircle, Circle, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useHabits, useClearAllData, useClearTodaysData, useDailyStats } from "@/hooks/useHabits";
import { useToast } from "@/hooks/use-toast";
import { habitService } from "@/services/habitService";
import { formatMinutes, calculateProgress } from "@/lib/utils";

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [tasks, setTasks] = useState<Record<string, Array<{ id: string; text: string; completed: boolean; priority: 'low' | 'medium' | 'high'; date: string }>>>({});
  const [newTask, setNewTask] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [currentTaskDate, setCurrentTaskDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { toast } = useToast();
  const clearAllData = useClearAllData();
  const clearTodaysData = useClearTodaysData();
  const { data: dailyStats } = useDailyStats();
  const { data: habits = [] } = useHabits();
  
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentMonth - 1);
    } else {
      newDate.setMonth(currentMonth + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const handleDayClick = async (day: number | null) => {
    if (!day) return;
    
    const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(selectedDateStr);
    setCurrentTaskDate(selectedDateStr); // Update current task date
    setIsLoadingActivity(true);
    
    try {
      // Get activity for the selected date
      const logs = await habitService.getHabitLogs(selectedDateStr);
      const habits = await habitService.getHabits();
      
      // Combine logs with habit names
      const activityWithDetails = logs.map(log => {
        const habit = habits.find(h => h.id === log.habit_id);
        return {
          ...log,
          habitName: habit?.name || 'Unknown Habit',
          habitColor: habit?.color || '#666',
          category: habit?.category || 'other'
        };
      });
      
      setDailyActivity(activityWithDetails);
    } catch (error) {
      console.error('Error fetching daily activity:', error);
      setDailyActivity([]);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const handleClearTodaysData = async () => {
    if (confirm('Are you sure you want to delete all of today\'s habit data? This cannot be undone!')) {
      try {
        await clearTodaysData.mutateAsync();
        setDailyActivity([]);
        setSelectedDate(null);
      } catch (error) {
        console.error('Error clearing today\'s data:', error);
      }
    }
  };

  const handleClearAllData = async () => {
    if (confirm('Are you sure you want to delete ALL your habit data? This cannot be undone!')) {
      try {
        await clearAllData.mutateAsync();
        setDailyActivity([]);
        setSelectedDate(null);
      } catch (error) {
        console.error('Error clearing data:', error);
      }
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Task management functions
  const addTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now().toString(),
        text: newTask.trim(),
        completed: false,
        priority: newTaskPriority,
        date: currentTaskDate
      };
      
      setTasks(prev => ({
        ...prev,
        [currentTaskDate]: [...(prev[currentTaskDate] || []), task]
      }));
      
      setNewTask('');
      setNewTaskPriority('medium');
      toast({
        title: "Task added!",
        description: `Task added for ${new Date(currentTaskDate).toLocaleDateString()}`,
      });
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [currentTaskDate]: (prev[currentTaskDate] || []).map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [currentTaskDate]: (prev[currentTaskDate] || []).filter(task => task.id !== taskId)
    }));
    toast({
      title: "Task deleted!",
      description: "Task has been removed from the list.",
    });
  };

  // Get current date tasks
  const currentTasks = tasks[currentTaskDate] || [];

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityBg = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'bg-red-500/20';
      case 'medium': return 'bg-yellow-500/20';
      case 'low': return 'bg-green-500/20';
      default: return 'bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">Track your habit completion across time</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleClearTodaysData}
            disabled={clearTodaysData.isPending}
            variant="outline"
            className="border-orange-500/20 text-orange-500 hover:bg-orange-500/20"
          >
            {clearTodaysData.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
            ) : (
              <Clock className="w-4 h-4 mr-2" />
            )}
            Clear Today
          </Button>
          <Button 
            onClick={handleClearAllData}
            disabled={clearAllData.isPending}
            variant="outline"
            className="border-red-500/20 text-red-500 hover:bg-red-500/20"
          >
            {clearAllData.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Clear All Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-card backdrop-blur border border-glass-border shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {monthNames[currentMonth]} {currentYear}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                    className="border-glass-border hover:bg-secondary/50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    className="border-glass-border hover:bg-secondary/50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => handleDayClick(day)}
                    disabled={!day}
                    className={`
                      aspect-square p-2 text-sm rounded-lg transition-all relative
                      ${day ? 'hover:bg-secondary/50 cursor-pointer' : 'cursor-default'}
                      ${isToday(day) 
                        ? 'bg-gradient-primary text-white font-bold shadow-glow' 
                        : selectedDate && day && `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` === selectedDate
                          ? 'bg-blue-500/20 text-blue-500 border-2 border-blue-500'
                          : day 
                            ? 'text-foreground hover:text-foreground' 
                            : 'text-transparent'
                      }
                    `}
                  >
                    {day || ''}
                    {day && (() => {
                      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dateTasks = tasks[dateKey] || [];
                      
                      // Only show dot if there are tasks for this date
                      if (dateTasks.length > 0) {
                        const allCompleted = dateTasks.every(task => task.completed);
                        return (
                          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${allCompleted ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        );
                      }
                      return null;
                    })()}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Selected Date Activity */}
          {selectedDate && (
            <Card className="bg-card/50 backdrop-blur border border-glass-border shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingActivity ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground text-sm">Loading activity...</p>
                  </div>
                ) : dailyActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No activity recorded for this date</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dailyActivity.map((activity, index) => (
                      <div key={index} className="p-3 rounded-lg bg-secondary/20 border border-glass-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: activity.habitColor }}
                            />
                            <span className="font-medium text-foreground">{activity.habitName}</span>
                          </div>
                          <span className="text-sm font-medium text-chart-blue">
                            {formatDuration(activity.duration_minutes)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {formatTime(activity.logged_at)} • {activity.category}
                        </div>
                        {activity.notes && (
                          <div className="text-sm text-foreground bg-secondary/30 p-2 rounded border-l-2 border-primary">
                            "{activity.notes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Today's Summary */}
          <Card className="bg-card/50 backdrop-blur border border-glass-border shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">{dailyStats?.completedHabits || 0}/{dailyStats?.totalHabits || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Spent</span>
                  <span className="font-medium">{formatMinutes(dailyStats?.totalTime || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {habits.length > 0 ? calculateProgress(dailyStats?.totalTime || 0, habits.reduce((sum, habit) => sum + (habit.target_duration_minutes || 0), 0)) : 0}%
                  </span>
                </div>
                <div className="pt-2 border-t border-glass-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Habits</span>
                    <span className="font-medium">{habits.filter(habit => dailyStats?.habitTimeSpent?.[habit.id] > 0).length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          <Card className="bg-card/50 backdrop-blur border border-glass-border shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-4 h-4" />
                Task List
                <span className="text-sm font-normal text-muted-foreground ml-auto">
                  {new Date(currentTaskDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add Task Form */}
              <div className="space-y-3 mb-4">
                <div className="flex gap-2">
                  <Input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1 bg-secondary/20 border-glass-border"
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  />
                  <Button
                    onClick={addTask}
                    size="sm"
                    className="bg-gradient-primary hover:opacity-90 text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setNewTaskPriority(priority)}
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium transition-all
                        ${newTaskPriority === priority 
                          ? `${getPriorityBg(priority)} ${getPriorityColor(priority)} border-2 border-current` 
                          : 'bg-secondary/20 text-muted-foreground hover:bg-secondary/30'
                        }
                      `}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {currentTasks.length === 0 ? (
                  <div className="text-center py-6">
                    <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No tasks for this date. Add one above!</p>
                  </div>
                ) : (
                  // Sort tasks by priority: high -> medium -> low, then by completion status
                  currentTasks
                    .sort((a, b) => {
                      const priorityOrder = { high: 3, medium: 2, low: 1 };
                      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                      if (priorityDiff !== 0) return priorityDiff;
                      return a.completed ? 1 : -1; // Incomplete tasks first
                    })
                    .map((task) => (
                    <div
                      key={task.id}
                      className={`
                        p-3 rounded-lg border transition-all duration-200 hover:bg-secondary/20
                        ${task.completed 
                          ? 'bg-secondary/10 border-green-500/30' 
                          : 'bg-secondary/20 border-glass-border'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`
                            p-1 rounded-full transition-all hover:scale-110
                            ${task.completed ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}
                          `}
                        >
                          {task.completed ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`
                            text-sm font-medium transition-all
                            ${task.completed 
                              ? 'text-muted-foreground line-through' 
                              : 'text-foreground'
                            }
                          `}>
                            {task.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`
                              px-2 py-0.5 rounded-full text-xs font-medium
                              ${getPriorityBg(task.priority)} ${getPriorityColor(task.priority)}
                            `}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Task Stats */}
              {currentTasks.length > 0 && (
                <div className="pt-3 border-t border-glass-border mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">
                      {currentTasks.filter(t => t.completed).length}/{currentTasks.length}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
