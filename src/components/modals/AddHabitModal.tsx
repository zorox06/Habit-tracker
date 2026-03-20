import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateHabit } from "@/hooks/useHabits";
import { useToast } from "@/hooks/use-toast";

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string; // If provided, the habit belongs to this room
}

const habitCategories = [
  { value: 'development', label: 'Development' },
  { value: 'learning', label: 'Learning' },
  { value: 'health', label: 'Health' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'creative', label: 'Creative' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' }
];

const habitColors = [
  { value: '#F72585', label: 'Neon Pink' },
  { value: '#7209B7', label: 'Deep Purple' },
  { value: '#3A0CA3', label: 'Indigo' },
  { value: '#4361EE', label: 'Royal Blue' },
  { value: '#4CC9F0', label: 'Cyan' },
  { value: '#489FB5', label: 'Ocean Blue' },
  { value: '#16697A', label: 'Dark Teal' },
  { value: '#82C0CC', label: 'Pale Teal' },
  { value: '#2F4F4F', label: 'Dark Slate' },
  { value: '#778899', label: 'Slate Gray' },
  { value: '#884AB2', label: 'Soft Violet' },
  { value: '#D1105A', label: 'Crimson' },
  { value: '#F24B04', label: 'Red Orange' },
  { value: '#FF930A', label: 'Bright Orange' },
  { value: '#FFA62B', label: 'Golden Yellow' }
];

export const AddHabitModal = ({ isOpen, onClose, roomId }: AddHabitModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'development' as const,
    target_duration_minutes: 60,
    color: '#4361EE'
  });

  const createHabit = useCreateHabit();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Name required", description: "Please enter a habit name.", variant: "destructive" });
      return;
    }
    try {
      await createHabit.mutateAsync({
        name: formData.name,
        description: formData.description,
        category: formData.category as any,
        status: 'active',
        color: formData.color,
        icon: 'default', // Assuming a default icon if not selected
        target_duration_minutes: formData.target_duration_minutes,
        room_id: roomId || null,
      } as any);
      toast({ title: "Habit created", description: "Your new habit has been added." });
      onClose();
      setFormData({ name: '', description: '', category: 'development', target_duration_minutes: 60, color: '#4361EE' });
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-1 border border-border rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-display font-semibold text-foreground">Add New Habit</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-surface-2">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm">Habit Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Daily Coding, Morning Exercise"
              className="bg-surface-2 border-border h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your habit..."
              className="bg-surface-2 border-border text-sm"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-sm">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="bg-surface-2 border-border h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-1 border-border">
                {habitCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Daily Target</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min="0"
                value={Math.floor(formData.target_duration_minutes / 60)}
                onChange={(e) => {
                  const hours = parseInt(e.target.value) || 0;
                  const minutes = formData.target_duration_minutes % 60;
                  setFormData(prev => ({ ...prev, target_duration_minutes: hours * 60 + minutes }));
                }}
                className="bg-surface-2 border-border h-10 text-sm w-20"
              />
              <span className="text-sm text-muted-foreground">h</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={formData.target_duration_minutes % 60}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value) || 0;
                  const hours = Math.floor(formData.target_duration_minutes / 60);
                  setFormData(prev => ({ ...prev, target_duration_minutes: hours * 60 + minutes }));
                }}
                className="bg-surface-2 border-border h-10 text-sm w-20"
              />
              <span className="text-sm text-muted-foreground">m</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Color</Label>
            <div className="grid grid-cols-5 gap-2.5">
              {habitColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  className={`w-9 h-9 rounded-md transition-all duration-100 ${
                    formData.color === color.value
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-1 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border hover:bg-surface-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createHabit.isPending}
              className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
            >
              {createHabit.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Habit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
