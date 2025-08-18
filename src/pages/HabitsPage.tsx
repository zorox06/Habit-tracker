import { Target, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    console.log('Edit habit:', habitId);
    // TODO: Open edit habit modal
    toast({
      title: "Edit feature coming soon",
      description: "Habit editing will be available in the next update.",
    });
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabitToDelete(habitId);
  };

  const confirmDelete = async () => {
    if (!habitToDelete) return;
    
    try {
      await deleteHabit.mutateAsync(habitToDelete);
      toast({
        title: "Habit deleted",
        description: "Your habit has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error deleting habit",
        description: "Failed to delete the habit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setHabitToDelete(null);
    }
  };

  const handleAddHabit = () => {
    setIsAddModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Habits</h1>
          <p className="text-muted-foreground">Manage your habits and track your progress</p>
        </div>
        <Button onClick={handleAddHabit} className="bg-gradient-primary hover:opacity-90 text-white shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          Add Habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur border-glass-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No habits yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start building better habits by creating your first one
            </p>
            <Button onClick={handleAddHabit} className="bg-gradient-primary hover:opacity-90 text-white shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Habit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit) => (
            <Card key={habit.id} className="bg-gradient-card backdrop-blur border border-glass-border shadow-card hover:shadow-glow transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{habit.name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{habit.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditHabit(habit.id)}
                      className="h-8 w-8 p-0 hover:bg-secondary/50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {habit.description && (
                    <p className="text-sm text-muted-foreground">{habit.description}</p>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target Duration</span>
                    <span className="font-medium">
                      {Math.floor((habit.target_duration_minutes || 0) / 60)}h {(habit.target_duration_minutes || 0) % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Color Theme</span>
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: habit.color }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Habit Modal */}
      <AddHabitModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!habitToDelete} onOpenChange={() => setHabitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this habit? This action cannot be undone and will remove all associated tracking data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
