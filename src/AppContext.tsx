import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  points: number;
  setPoints: (points: number) => void;
  userType: string;
  setUserType: (type: string) => void;
}

const AppContext = createContext<AppContextType>({
  points: 0,
  setPoints: () => {},
  userType: '',
  setUserType: () => {}
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState(0);
  const [userType, setUserType] = useState('');

  return (
    <AppContext.Provider value={{ points, setPoints, userType, setUserType }}>
      {children}
    </AppContext.Provider>
  );
}; 