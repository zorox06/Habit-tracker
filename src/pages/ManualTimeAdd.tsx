import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Target, Plus, Loader2 } from "lucide-react";
import { useHabits, useLogHabit } from "@/hooks/useHabits";
import { useToast } from "@/hooks/use-toast";

const ManualTimeAdd = () => {
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const logHabit = useLogHabit();
  const { toast } = useToast();
  
  const [selectedHabit, setSelectedHabit] = useState<string>("");
  const [duration, setDuration] = useState<number>(30);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedHabit) {
      toast({
        title: "Error",
        description: "Please select a habit",
        variant: "destructive"
      });
      return;
    }

    if (duration <= 0) {
      toast({
        title: "Error",
        description: "Duration must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await logHabit.mutateAsync({
        habitId: selectedHabit,
        duration,
        notes
      });

      toast({
        title: "Success!",
        description: `Logged ${duration} minutes for your habit`,
      });

      // Reset form
      setSelectedHabit("");
      setDuration(30);
      setNotes("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log time. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Manual Time Add</h1>
        <p className="text-muted-foreground">
          Manually log time spent on your habits
        </p>
      </div>

      <Card className="shadow-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Log Time Manually
          </CardTitle>
          <CardDescription>
            Add time you've already spent on a habit outside of the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select Habit</label>
              <Select value={selectedHabit} onValueChange={setSelectedHabit}>
                <SelectTrigger className="border-glass-border">
                  <SelectValue placeholder="Choose a habit to log time for" />
                </SelectTrigger>
                <SelectContent>
                  {habitsLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading habits...
                      </div>
                    </SelectItem>
                  ) : habits.length === 0 ? (
                    <SelectItem value="no-habits" disabled>
                      No habits created yet
                    </SelectItem>
                  ) : (
                    habits.map((habit) => (
                      <SelectItem key={habit.id} value={habit.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: habit.color }}
                          />
                          {habit.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Duration (minutes)</label>
              <Input
                type="number"
                min="1"
                max="480"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                className="border-glass-border"
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">
                {formatMinutes(duration)} • Max: 8 hours (480 minutes)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you work on? Any specific details?"
                className="border-glass-border"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !selectedHabit || habitsLoading}
              className="w-full bg-gradient-primary hover:opacity-90 text-white shadow-glow"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging Time...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Log {formatMinutes(duration)}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {habits.length === 0 && !habitsLoading && (
        <Card className="mt-6 shadow-card border-glass-border">
          <CardContent className="p-6 text-center">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No habits created yet</h3>
            <p className="text-muted-foreground mb-4">
              You need to create habits first before you can log time for them
            </p>
            <Button 
              onClick={() => window.location.href = '/habits'}
              className="bg-gradient-primary hover:opacity-90 text-white shadow-glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Habit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManualTimeAdd;
