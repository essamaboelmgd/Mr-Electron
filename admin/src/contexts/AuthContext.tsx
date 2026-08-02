import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, isAuthenticated, logout as authLogout, getAuthUser } from '@/services/authService';
import { User } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        try {
          // Try to get user from localStorage first
          const storedUser = getAuthUser();
          if (storedUser) {
            if (['admin', 'teacher', 'assistant'].includes(storedUser.role)) {
              setUser(storedUser);
            } else {
              authLogout();
              setUser(null);
            }
          } else {
            // Fallback to API call
            const userData = await getCurrentUser();
            if (['admin', 'teacher', 'assistant'].includes(userData.role)) setUser(userData);
            else authLogout();
          }
        } catch (error) {
          // If token is invalid, remove it
          authLogout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
