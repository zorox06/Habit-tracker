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
  { value: '#3B82F6', label: 'Blue', preview: '#3B82F6' },
  { value: '#10B981', label: 'Green', preview: '#10B981' },
  { value: '#6B7280', label: 'Gray', preview: '#6B7280' },
  { value: '#8B5CF6', label: 'Violet', preview: '#8B5CF6' },
  { value: '#F43F5E', label: 'Rose', preview: '#F43F5E' },
  { value: '#06B6D4', label: 'Cyan', preview: '#06B6D4' },
  { value: '#F97316', label: 'Orange', preview: '#F97316' },
  { value: '#EC4899', label: 'Pink', preview: '#EC4899' },
  { value: '#84CC16', label: 'Lime', preview: '#84CC16' },
  { value: '#6366F1', label: 'Indigo', preview: '#6366F1' },
  { value: '#EF4444', label: 'Red', preview: '#EF4444' },
  { value: '#22D3EE', label: 'Sky', preview: '#22D3EE' },
  { value: '#FBBF24', label: 'Yellow', preview: '#FBBF24' },
  { value: '#FB7185', label: 'Coral', preview: '#FB7185' },
  { value: '#8B5A2B', label: 'Brown', preview: '#8B5A2B' }
];

export const AddHabitModal = ({ isOpen, onClose }: AddHabitModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'development' as const,
    target_duration_minutes: 60,
    color: '#3B82F6'
  });

  const createHabit = useCreateHabit();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a habit name",
        variant: "destructive"
      });
      return;
    }

    try {
      await createHabit.mutateAsync(formData);
      toast({
        title: "Habit created!",
        description: "Your new habit has been added successfully.",
      });
      onClose();
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'development',
        target_duration_minutes: 60,
        color: '#3B82F6'
      });
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-glass-border rounded-xl shadow-card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-glass-border">
          <h2 className="text-xl font-semibold text-foreground">Add New Habit</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-secondary/50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Daily Coding, Morning Exercise"
              className="bg-secondary/20 border-glass-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your habit..."
              className="bg-secondary/20 border-glass-border"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="bg-secondary/20 border-glass-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {habitCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Daily Target Duration</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                value={Math.floor(formData.target_duration_minutes / 60)}
                onChange={(e) => {
                  const hours = parseInt(e.target.value) || 0;
                  const minutes = formData.target_duration_minutes % 60;
                  setFormData(prev => ({ ...prev, target_duration_minutes: hours * 60 + minutes }));
                }}
                className="bg-secondary/20 border-glass-border"
                placeholder="0"
              />
              <span className="text-muted-foreground self-center">hours</span>
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
                className="bg-secondary/20 border-glass-border"
                placeholder="0"
              />
              <span className="text-muted-foreground self-center">minutes</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color Theme</Label>
            <div className="grid grid-cols-5 gap-3">
              {habitColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  className={`
                    w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-105
                    ${formData.color === color.value 
                      ? 'border-primary scale-110 shadow-lg' 
                      : 'border-glass-border hover:border-primary/50 hover:shadow-md'
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-glass-border hover:bg-secondary/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createHabit.isPending}
              className="flex-1 bg-gradient-primary hover:opacity-90 text-white shadow-glow"
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
