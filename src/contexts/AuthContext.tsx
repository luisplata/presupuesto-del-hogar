
// src/contexts/AuthContext.tsx
import type { User } from '@/types/user';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Dispatch, ReactNode, SetStateAction} from 'react';
import { createContext, useContext }  from 'react';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  loadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [loadingAuth, setLoadingAuth] = useLocalStorage<boolean>('loadingAuth', true); // Simulates loading

  // Simulate loading delay, in a real app this would be checking session
  if (typeof window !== 'undefined' && loadingAuth) {
    setTimeout(() => setLoadingAuth(false), 500);
  }

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
