import { Home, Target, BarChart3, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigation, NavigationPage } from "@/contexts/NavigationContext";

export const BottomTabBar = () => {
  const { currentPage, setCurrentPage, setCurrentRoomId } = useNavigation();

  const handleNav = (page: NavigationPage) => {
    setCurrentPage(page);
    if (page !== 'room_detail') setCurrentRoomId(null);
  };

  const tabs = [
    { icon: Home, label: "Today", id: "dashboard" as const },
    { icon: Target, label: "Habits", id: "habits" as const },
    { icon: BarChart3, label: "Analytics", id: "analytics" as const },
    { icon: Calendar, label: "Calendar", id: "calendar" as const },
    { icon: Users, label: "Rooms", id: "rooms" as const },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-1 border-t border-border rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPage === tab.id || 
            (tab.id === 'rooms' && currentPage === 'room_detail');
          return (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 py-1",
                "transition-colors duration-150 active:scale-95"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] font-medium uppercase tracking-wider",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
