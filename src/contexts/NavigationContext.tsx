import React, { createContext, useContext, useState } from 'react';

export type NavigationPage = 'dashboard' | 'habits' | 'analytics' | 'calendar' | 'rooms' | 'room_detail';

interface NavigationContextType {
  currentPage: NavigationPage;
  setCurrentPage: (page: NavigationPage) => void;
  currentRoomId: string | null;
  setCurrentRoomId: (id: string | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  return (
    <NavigationContext.Provider value={{ currentPage, setCurrentPage, currentRoomId, setCurrentRoomId }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
