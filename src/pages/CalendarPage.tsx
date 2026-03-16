import { Calendar, ChevronLeft, ChevronRight, Trash2, Clock, Target, Plus, CheckCircle, Circle, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useHabits, useClearAllData, useClearTodaysData, useDailyStats } from "@/hooks/useHabits";
import { useToast } from "@/hooks/use-toast";
import { habitService } from "@/services/habitService";
import { formatMinutes, calculateProgress } from "@/lib/utils";

type Task = {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  date: string;
};

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [newTask, setNewTask] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [currentTaskDate, setCurrentTaskDate] = useState(new Date().toISOString().split('T')[0]);

  const { toast } = useToast();
  const clearAllData = useClearAllData();
  const clearTodaysData = useClearTodaysData();
  const { data: dailyStats } = useDailyStats();
  const { data: habits = [] } = useHabits();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('calendarTasks');
      if (saved) setTasks(JSON.parse(saved));
    } catch (error) { console.error('Failed to load tasks', error); }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('calendarTasks', JSON.stringify(tasks)); }
    catch (error) { console.error('Failed to save tasks', error); }
  }, [tasks]);

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let day = 1; day <= daysInMonth; day++) days.push(day);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentMonth + (direction === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const handleDayClick = async (day: number | null) => {
    if (!day) return;
    const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(selectedDateStr);
    setCurrentTaskDate(selectedDateStr);
    setIsLoadingActivity(true);
    try {
      const logs = await habitService.getHabitLogs(selectedDateStr);
      const habits = await habitService.getHabits();
      setDailyActivity(logs.map(log => {
        const habit = habits.find(h => h.id === log.habit_id);
        return { ...log, habitName: habit?.name || 'Unknown', habitColor: habit?.color || '#666', category: habit?.category || 'other' };
      }));
    } catch (error) { setDailyActivity([]); }
    finally { setIsLoadingActivity(false); }
  };

  const handleClearTodaysData = async () => {
    if (confirm("Delete all of today's habit data? This cannot be undone.")) {
      try { await clearTodaysData.mutateAsync(); setDailyActivity([]); setSelectedDate(null); } catch (error) {}
    }
  };

  const handleClearAllData = async () => {
    if (confirm('Delete ALL habit data? This cannot be undone.')) {
      try { await clearAllData.mutateAsync(); setDailyActivity([]); setSelectedDate(null); } catch (error) {}
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTime = (timeString: string) =>
    new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const addTask = () => {
    if (newTask.trim()) {
      const task = { id: Date.now().toString(), text: newTask.trim(), completed: false, priority: newTaskPriority, date: currentTaskDate };
      setTasks(prev => ({ ...prev, [currentTaskDate]: [...(prev[currentTaskDate] || []), task] }));
      setNewTask('');
      setNewTaskPriority('medium');
      toast({ title: "Task added", description: `Task added for ${new Date(currentTaskDate).toLocaleDateString()}` });
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [currentTaskDate]: (prev[currentTaskDate] || []).map(task => task.id === taskId ? { ...task, completed: !task.completed } : task)
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => ({ ...prev, [currentTaskDate]: (prev[currentTaskDate] || []).filter(task => task.id !== taskId) }));
    toast({ title: "Task deleted" });
  };

  const currentTasks = tasks[currentTaskDate] || [];

  const getPriorityColor = (p: 'low' | 'medium' | 'high') => {
    switch (p) { case 'high': return 'text-chart-red'; case 'medium': return 'text-chart-yellow'; case 'low': return 'text-chart-green'; }
  };

  const getPriorityBg = (p: 'low' | 'medium' | 'high') => {
    switch (p) { case 'high': return 'bg-chart-red/15'; case 'medium': return 'bg-chart-yellow/15'; case 'low': return 'bg-chart-green/15'; }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your habit completion across time</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleClearTodaysData} disabled={clearTodaysData.isPending} variant="outline" size="sm"
            className="border-chart-orange/30 text-chart-orange hover:bg-chart-orange/10 text-sm">
            {clearTodaysData.isPending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-chart-orange mr-2" /> : <Clock className="w-4 h-4 mr-1.5" />}
            Clear Today
          </Button>
          <Button onClick={handleClearAllData} disabled={clearAllData.isPending} variant="outline" size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/10 text-sm">
            {clearAllData.isPending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive mr-2" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-surface-1 border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-foreground">{monthNames[currentMonth]} {currentYear}</h3>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')} className="border-border hover:bg-surface-2 h-8 w-8 p-0">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')} className="border-border hover:bg-surface-2 h-8 w-8 p-0">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5 mb-3">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1.5">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDayClick(day)}
                  disabled={!day}
                  className={`
                    aspect-square p-1.5 text-sm rounded-md transition-colors duration-100 relative
                    ${day ? 'hover:bg-surface-2 cursor-pointer' : 'cursor-default'}
                    ${isToday(day) ? 'bg-primary text-primary-foreground font-bold'
                      : selectedDate && day && `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` === selectedDate
                        ? 'bg-surface-3 text-foreground ring-1 ring-primary'
                        : day ? 'text-foreground' : 'text-transparent'
                    }
                  `}
                >
                  {day || ''}
                  {day && (() => {
                    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dateTasks = tasks[dateKey] || [];
                    if (dateTasks.length > 0) {
                      const allCompleted = dateTasks.every(task => task.completed);
                      return <div className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${allCompleted ? 'bg-chart-green' : 'bg-chart-orange'}`} />;
                    }
                    return null;
                  })()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {selectedDate && (
            <div className="bg-surface-1 border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-foreground text-sm">
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
              </div>
              {isLoadingActivity ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Loading...</p>
                </div>
              ) : dailyActivity.length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No activity recorded</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dailyActivity.map((activity, index) => (
                    <div key={index} className="p-3 rounded-md bg-surface-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activity.habitColor }} />
                          <span className="font-medium text-foreground text-sm">{activity.habitName}</span>
                        </div>
                        <span className="text-sm font-medium text-primary tabular-nums">{formatDuration(activity.duration_minutes)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{formatTime(activity.logged_at)} · {activity.category}</div>
                      {activity.notes && (
                        <div className="text-sm text-foreground bg-surface-3 p-2 rounded mt-2 border-l-2 border-primary">{activity.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Today's Summary */}
          <div className="bg-surface-1 border border-border rounded-lg p-5">
            <h3 className="font-display font-semibold text-foreground text-sm mb-3">Today's Summary</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium tabular-nums">{dailyStats?.completedHabits || 0}/{dailyStats?.totalHabits || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time Spent</span>
                <span className="font-medium tabular-nums">{formatMinutes(dailyStats?.totalTime || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium tabular-nums">
                  {habits.length > 0 ? calculateProgress(dailyStats?.totalTime || 0, habits.reduce((sum, habit) => sum + (habit.target_duration_minutes || 0), 0)) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="bg-surface-1 border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-foreground text-sm">Tasks</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(currentTaskDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Add Task */}
            <div className="space-y-2.5 mb-3">
              <div className="flex gap-2">
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a task..."
                  className="flex-1 bg-surface-2 border-border h-9 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <Button onClick={addTask} size="sm" className="bg-primary text-primary-foreground hover:opacity-90 h-9 w-9 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-1.5">
                {(['low', 'medium', 'high'] as const).map((priority) => (
                  <button key={priority} onClick={() => setNewTaskPriority(priority)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-100
                      ${newTaskPriority === priority
                        ? `${getPriorityBg(priority)} ${getPriorityColor(priority)}`
                        : 'bg-surface-2 text-muted-foreground hover:bg-surface-3'
                      }`}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {currentTasks.length === 0 ? (
                <div className="text-center py-5">
                  <Target className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">No tasks for this date.</p>
                </div>
              ) : (
                currentTasks
                  .sort((a, b) => {
                    const order = { high: 3, medium: 2, low: 1 };
                    const diff = order[b.priority] - order[a.priority];
                    if (diff !== 0) return diff;
                    return a.completed ? 1 : -1;
                  })
                  .map((task) => (
                    <div key={task.id}
                      className={`p-2.5 rounded-md border transition-colors duration-100 ${
                        task.completed ? 'bg-surface-2/50 border-chart-green/20' : 'bg-surface-2 border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => toggleTask(task.id)}
                          className={`p-0.5 rounded-full transition-colors ${task.completed ? 'text-chart-green' : 'text-muted-foreground hover:text-foreground'}`}>
                          {task.completed ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm transition-colors ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.text}</p>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-1 ${getPriorityBg(task.priority)} ${getPriorityColor(task.priority)}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                        </div>
                        <button onClick={() => deleteTask(task.id)} className="p-0.5 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {currentTasks.length > 0 && (
              <div className="pt-2.5 border-t border-border mt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium tabular-nums">{currentTasks.filter(t => t.completed).length}/{currentTasks.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;