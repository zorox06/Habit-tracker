import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitName: string;
  habitId?: string;
}

export const LogTimeModal = ({ isOpen, onClose, habitName, habitId }: LogTimeModalProps) => {
  const { toast } = useToast();
  const [duration, setDuration] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const durationMinutes = parseInt(duration);
    if (!duration || isNaN(durationMinutes) || durationMinutes <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid duration in minutes",
        variant: "destructive"
      });
      return;
    }

    // TODO: Save to database
    console.log('Logging time:', {
      habitId,
      habitName,
      duration: durationMinutes,
      notes,
      date
    });

    toast({
      title: "Time Logged",
      description: `Logged ${durationMinutes} minutes for ${habitName}`,
    });

    // Reset form
    setDuration("");
    setNotes("");
    setDate(new Date().toISOString().split('T')[0]);
    
    onClose();
  };

  const formatDuration = (minutes: number) => {
    if (isNaN(minutes) || minutes <= 0) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const quickDurations = [15, 30, 45, 60, 90, 120];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-card/95 backdrop-blur border-glass-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Log Time - {habitName}
          </DialogTitle>
          <DialogDescription>
            Record the time you spent on this habit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-secondary/50 border-glass-border"
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="480"
              placeholder="Enter minutes"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="bg-secondary/50 border-glass-border"
              required
            />
            
            {duration && (
              <div className="text-sm text-muted-foreground">
                Duration: {formatDuration(parseInt(duration))}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm">Quick Select</Label>
              <div className="grid grid-cols-3 gap-2">
                {quickDurations.map((mins) => (
                  <Button
                    key={mins}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDuration(mins.toString())}
                    className="border-glass-border hover:bg-secondary/50"
                  >
                    {formatDuration(mins)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="How did it go? Any observations or reflections..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary/50 border-glass-border min-h-[80px]"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-glass-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary hover:opacity-90 text-white shadow-glow"
            >
              <Save className="w-4 h-4 mr-2" />
              Log Time
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
