import { BottomTabBar } from "./BottomTabBar";
import { MobileHeader } from "./MobileHeader";
import { useNavigation } from "@/contexts/NavigationContext";

const pageTitles: Record<string, string> = {
  dashboard: "Today",
  habits: "Habits",
  analytics: "Analytics",
  calendar: "Calendar",
  rooms: "Rooms",
  room_detail: "Room",
};

interface MobileLayoutProps {
  children: React.ReactNode;
}

export const MobileLayout = ({ children }: MobileLayoutProps) => {
  const { currentPage } = useNavigation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader title={pageTitles[currentPage] || "Today"} />
      
      <main className="flex-1 overflow-y-auto px-4 pb-24"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </main>
      
      <BottomTabBar />
    </div>
  );
};
