import { Target, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHabits, useUpdateHabit, useDeleteHabit } from "@/hooks/useHabits";
import { AddHabitModal } from "@/components/modals/AddHabitModal";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const HabitsPage = () => {
  const { data: habits = [], isLoading } = useHabits();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const { toast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);

  const handleEditHabit = (habitId: string) => {
    toast({ title: "Edit feature coming soon", description: "Habit editing will be available in the next update." });
  };

  const handleDeleteHabit = (habitId: string) => setHabitToDelete(habitId);

  const confirmDelete = async () => {
    if (!habitToDelete) return;
    try {
      await deleteHabit.mutateAsync(habitToDelete);
      toast({ title: "Habit deleted", description: "Your habit has been removed." });
    } catch (error) {
      toast({ title: "Error deleting habit", description: "Failed to delete. Please try again.", variant: "destructive" });
    } finally {
      setHabitToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">My Habits</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your habits and track your progress</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-primary-foreground hover:opacity-90 text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <div className="bg-surface-1 border border-border rounded-lg p-12 text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">No habits yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Start building better habits by creating your first one.</p>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-primary-foreground hover:opacity-90 text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Habit
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {habits.map((habit) => (
            <div key={habit.id} className="bg-surface-1 border border-border rounded-lg transition-colors duration-150 hover:bg-surface-2">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{habit.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{habit.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditHabit(habit.id)}
                      className="h-8 w-8 p-0 hover:bg-surface-3"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {habit.description && (
                    <p className="text-sm text-muted-foreground">{habit.description}</p>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {Math.floor((habit.target_duration_minutes || 0) / 60)}h {(habit.target_duration_minutes || 0) % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Color</span>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddHabitModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      <AlertDialog open={!!habitToDelete} onOpenChange={() => setHabitToDelete(null)}>
        <AlertDialogContent className="bg-surface-1 border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete Habit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will remove all associated tracking data and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-surface-2">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:opacity-90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HabitsPage;
