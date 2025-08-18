import { Home, Target, BarChart3, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigation, NavigationPage } from "@/contexts/NavigationContext";

interface SidebarProps {
  className?: string;
}

const menuItems = [
  { icon: Home, label: "Dashboard", page: "dashboard" as NavigationPage },
  { icon: Target, label: "My Habits", page: "habits" as NavigationPage },
  { icon: BarChart3, label: "Analytics", page: "analytics" as NavigationPage },
  { icon: Calendar, label: "Calendar", page: "calendar" as NavigationPage },
];

export const Sidebar = ({ className }: SidebarProps) => {
  const { currentPage, setCurrentPage } = useNavigation();

  return (
    <div className={cn("w-64 min-h-screen bg-card/50 backdrop-blur border-r border-glass-border", className)}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">Habit Tracker</h1>
            <p className="text-xs text-muted-foreground">Build better habits</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <Button
                key={item.label}
                variant={isActive ? "secondary" : "ghost"}
                onClick={() => setCurrentPage(item.page)}
                className={cn(
                  "w-full justify-start gap-3 h-12 text-left font-medium transition-all",
                  isActive 
                    ? "bg-secondary/80 text-secondary-foreground shadow-sm" 
                    : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>


      </div>
    </div>
  );
};