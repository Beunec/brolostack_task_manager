import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/AuthService';

interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  createdAt: string;
  lastLogin: string;
}

interface AuthSession {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  sessionId: string;
  createdAt: string;
  expiresAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (firstName: string, lastName: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchAccount: () => void;
  getStoredAccounts: () => Promise<Array<{ username: string; firstName: string; lastName: string }>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    console.log('AuthContext: Initializing...');
    try {
      const currentUser = authService.getCurrentUser();
      console.log('AuthContext: Current user from service:', currentUser);
      
      if (currentUser) {
        console.log('AuthContext: Setting user and session');
        setSession(currentUser);
        setUser({
          id: currentUser.userId,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          username: currentUser.username,
          createdAt: currentUser.createdAt,
          lastLogin: currentUser.createdAt
        });
      } else {
        console.log('AuthContext: No current user found');
      }
    } catch (error) {
      console.error('AuthContext: Error during initialization:', error);
    }
    
    console.log('AuthContext: Setting loading to false');
    setIsLoading(false);

    // Listen for logout events
    const handleLogout = () => {
      setUser(null);
      setSession(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(username, password);
      
      if (result.success && result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (firstName: string, lastName: string, username: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.signup(firstName, lastName, username, password);
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Signup failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setSession(null);
  };

  const switchAccount = () => {
    authService.switchAccount();
  };

  const getStoredAccounts = () => {
    return authService.getStoredAccounts();
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user && !!session,
    isLoading,
    login,
    signup,
    logout,
    switchAccount,
    getStoredAccounts
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