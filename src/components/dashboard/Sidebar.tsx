import { Home, Target, BarChart3, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigation, NavigationPage } from "@/contexts/NavigationContext";

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const { currentPage, setCurrentPage, setCurrentRoomId } = useNavigation();

  const handleNav = (page: NavigationPage) => {
    setCurrentPage(page);
    if (page !== 'room_detail') setCurrentRoomId(null);
  };

  const navItems = [
    { icon: Home, label: "Dashboard", id: "dashboard" as const },
    { icon: Target, label: "My Habits", id: "habits" as const },
    { icon: BarChart3, label: "Analytics", id: "analytics" as const },
    { icon: Calendar, label: "Calendar", id: "calendar" as const },
    { icon: Users, label: "Rooms", id: "rooms" as const },
  ];

  return (
    <div className={cn("w-64 min-h-screen bg-surface-1 border-r border-border", className)}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Target className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-foreground tracking-tight">Stay Focused</h1>
            <p className="text-xs text-muted-foreground">Build better habits</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 h-11 px-3 rounded-md text-sm font-medium transition-colors duration-150 relative",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />
                )}
                <Icon className="w-[18px] h-[18px]" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};