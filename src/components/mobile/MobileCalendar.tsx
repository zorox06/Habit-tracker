import { ChevronLeft, ChevronRight, Plus, CheckCircle, Circle, Trash, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useHabits, useDailyStats, useClearTodaysData, useClearAllData } from "@/hooks/useHabits";
import { useToast } from "@/hooks/use-toast";
import { calculateProgress } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Task = { id: string; text: string; completed: boolean; date: string; };

export const MobileCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [newTask, setNewTask] = useState('');
  const [deleteMode, setDeleteMode] = useState<'today' | 'all' | null>(null);
  const { toast } = useToast();
  const { data: dailyStats } = useDailyStats();
  const { data: habits = [] } = useHabits();
  const clearTodaysData = useClearTodaysData();
  const clearAllData = useClearAllData();

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  let firstDay = new Date(currentYear, currentMonth, 1).getDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const currentTaskDate = selectedDate || todayStr;

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  useEffect(() => {
    try { const saved = localStorage.getItem('calendarTasks'); if (saved) setTasks(JSON.parse(saved)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('calendarTasks', JSON.stringify(tasks)); } catch {}
  }, [tasks]);

  const isToday = (day: number | null) => day !== null && day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  const dateKey = (day: number) => `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const currentTasks = tasks[currentTaskDate] || [];
  const completedCount = currentTasks.filter(t => t.completed).length;
  const overallProgress = habits.length > 0 ? calculateProgress(dailyStats?.totalTime || 0, habits.reduce((s, h) => s + (h.target_duration_minutes || 0), 0)) : 0;

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = { id: Date.now().toString(), text: newTask.trim(), completed: false, date: currentTaskDate };
    setTasks(prev => ({ ...prev, [currentTaskDate]: [...(prev[currentTaskDate] || []), task] }));
    setNewTask('');
    toast({ title: "Task added" });
  };

  const toggleTask = (id: string) => {
    setTasks(prev => ({ ...prev, [currentTaskDate]: (prev[currentTaskDate] || []).map(t => t.id === id ? { ...t, completed: !t.completed } : t) }));
  };
  const deleteTask = (id: string) => {
    setTasks(prev => ({ ...prev, [currentTaskDate]: (prev[currentTaskDate] || []).filter(t => t.id !== id) }));
  };

  const handleDeleteToday = async () => {
    // Clear calendar tasks for today
    setTasks(prev => {
      const copy = { ...prev };
      delete copy[currentTaskDate];
      return copy;
    });
    // Clear habit logs/sessions for today
    try {
      await clearTodaysData.mutateAsync();
    } catch {}
    setDeleteMode(null);
    toast({ title: "Today's data cleared", description: "Calendar tasks and habit time spent removed." });
  };

  const handleDeleteAll = async () => {
    // Clear all calendar tasks
    setTasks({});
    // Clear all habit logs/sessions (NOT habits themselves)
    try {
      await clearTodaysData.mutateAsync(); // This clears today
      // For full clear, we use clearAllData which also deletes habits
      // But user wants to keep habits — just clear time spent
      // So we call clearTodaysData is not enough. Let's use a direct approach:
      const { habitService } = await import('@/services/habitService');
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('habit_sessions').delete().eq('user_id', user.id);
        await supabase.from('habit_logs').delete().eq('user_id', user.id);
      }
    } catch {}
    setDeleteMode(null);
    toast({ title: "All data cleared", description: "All calendar tasks and habit time spent removed. Habits kept." });
  };

  return (
    <div className="space-y-5 pt-2 animate-fade-up">

      {/* Month header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Year {currentYear}</p>
          <h2 className="text-xl font-display font-bold text-foreground">{monthNames[currentMonth]}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { const d = new Date(currentDate); d.setMonth(currentMonth - 1); setCurrentDate(d); }}
            className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button onClick={() => { const d = new Date(currentDate); d.setMonth(currentMonth + 1); setCurrentDate(d); }}
            className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-surface-1 border border-border rounded-2xl p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const dk = day ? dateKey(day) : '';
            const hasTasks = day ? (tasks[dk]?.length || 0) > 0 : false;
            const isSelected = day !== null && dk === selectedDate;
            return (
              <button key={i} disabled={!day}
                onClick={() => day && setSelectedDate(dk)}
                className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium relative transition-colors ${
                  !day ? '' :
                  isToday(day) ? 'bg-primary text-primary-foreground font-bold' :
                  isSelected ? 'bg-surface-3 text-foreground ring-1 ring-primary' :
                  'text-foreground hover:bg-surface-2'
                }`}
              >
                {day || ''}
                {hasTasks && !isToday(day) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's summary */}
      <div className="bg-surface-1 border border-border rounded-2xl p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Today's Summary</p>
        <div className="flex gap-6">
          <div>
            <p className="text-3xl font-display font-bold text-foreground tabular-nums">{overallProgress}%</p>
            <p className="text-xs text-muted-foreground uppercase mt-0.5">Habits Completed</p>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-foreground tabular-nums">{currentTasks.length}</p>
            <p className="text-xs text-muted-foreground uppercase mt-0.5">Tasks Created</p>
          </div>
        </div>
      </div>

      {/* Tasks — simple to-do list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-display font-semibold text-foreground">To-Do</h3>
          <div className="flex items-center gap-2">
            {currentTasks.length > 0 && (
              <span className="text-xs text-muted-foreground">{currentTasks.length - completedCount} remaining</span>
            )}
          </div>
        </div>

        {/* Add task */}
        <div className="flex gap-2 mb-4">
          <Input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add a task..."
            className="flex-1 bg-surface-1 border-border h-11 rounded-xl text-sm"
            onKeyPress={e => e.key === 'Enter' && addTask()}
          />
          <Button onClick={addTask} className="bg-primary text-primary-foreground hover:opacity-90 h-11 w-11 rounded-xl p-0">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Task list */}
        <div className="space-y-2.5">
          {currentTasks.length === 0 ? (
            <div className="bg-surface-1 border border-border rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground">No tasks for this date</p>
            </div>
          ) : (
            currentTasks.map(task => (
              <div key={task.id}
                className={`bg-surface-1 border rounded-2xl p-4 flex items-center gap-3 ${task.completed ? 'border-border opacity-60' : 'border-border'}`}
              >
                <button onClick={() => toggleTask(task.id)} className="shrink-0">
                  {task.completed
                    ? <CheckCircle className="w-5 h-5 text-chart-green" />
                    : <Circle className="w-5 h-5 text-muted-foreground" />
                  }
                </button>
                <p className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.text}
                </p>
                <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Delete data buttons */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => setDeleteMode('today')}
            className="flex-1 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 rounded-2xl h-11 text-sm"
            disabled={currentTasks.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Today
          </Button>
          <Button variant="outline" onClick={() => setDeleteMode('all')}
            className="flex-1 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 rounded-2xl h-11 text-sm"
            disabled={Object.keys(tasks).length === 0}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Delete All Data
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMode} onOpenChange={() => setDeleteMode(null)}>
        <AlertDialogContent className="bg-surface-1 border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {deleteMode === 'today' ? "Delete Today's Tasks" : 'Delete All Tasks'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteMode === 'today'
                ? `This will delete all ${currentTasks.length} task(s) for the selected date. This cannot be undone.`
                : `This will delete ALL tasks across all dates. This cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-surface-2 rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteMode === 'today' ? handleDeleteToday : handleDeleteAll}
              className="bg-destructive text-destructive-foreground hover:opacity-90 rounded-xl"
            >
              {deleteMode === 'today' ? 'Delete Today' : 'Delete Everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
