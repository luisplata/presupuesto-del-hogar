
// src/contexts/AuthContext.tsx
import type { User } from '@/types/user';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Dispatch, ReactNode, SetStateAction} from 'react';
import { createContext, useContext, useState, useEffect }  from 'react';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  loadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true); // Changed from useLocalStorage

  useEffect(() => {
    // Simulate initial auth check (e.g., validating a token, checking local session)
    // For this app, it's mainly to allow localStorage for currentUser to load and provide a brief loading experience.
    const timer = setTimeout(() => {
      setLoadingAuth(false);
    }, 500); // Short delay to simulate async auth check
    return () => clearTimeout(timer);
  }, []); // Runs once on mount

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

