import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";

interface MobileHeaderProps {
  title: string;
}

export const MobileHeader = ({ title }: MobileHeaderProps) => {
  const { user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getInitial = () => {
    if (!user?.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  // Close menu on outside tap
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  return (
    <header className="flex items-center justify-between px-5 pt-3 pb-2"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}
    >
      {/* Empty left spacer for balance */}
      <div className="w-9" />

      <h1 className="text-lg font-display font-bold text-foreground tracking-tight">
        {title}
      </h1>

      {/* Avatar with logout menu */}
      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-sm font-bold text-foreground border border-border"
        >
          {getInitial()}
        </button>

        {showMenu && (
          <div className="absolute right-0 top-11 bg-surface-1 border border-border rounded-2xl shadow-lg overflow-hidden z-50 min-w-[140px]">
            <button 
              onClick={() => { setShowMenu(false); signOut(); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-surface-2 transition-colors"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
