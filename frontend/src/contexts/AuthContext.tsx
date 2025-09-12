import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserInfo } from '@/services/authService'; // Import UserInfo type

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null; // Use UserInfo type
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isLoggingOut: boolean; // New state for logout loading
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to clear user-specific session data
const clearUserSessionData = () => {
  localStorage.removeItem('last_active_agent_user_role');
  // Add any other user-specific session data to clear here
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null); // Use UserInfo type
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Initialize new state

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = authService.isAuthenticated();
        if (authenticated) {
          const userInfo = await authService.getUserInfo();
          setUser(userInfo);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          clearUserSessionData(); // Clear session data if not authenticated
        }
      } catch (error) {
        console.error('AuthContext: Auth check failed:', error);
        // Clear any invalid tokens
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
        clearUserSessionData(); // Clear session data on auth failure
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      await authService.login(username, password);
      const userInfo = await authService.getUserInfo();
      setUser(userInfo);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      clearUserSessionData(); // Clear session data on login failure
      throw error;
    } finally {
      setLoading(false);
      setIsLoggingOut(false); // Ensure this is false after login attempt
    }
  };

  const logout = async () => {
    setIsLoggingOut(true); // Set logging out state to true
    setLoading(true); // Also set general loading to true
    try {
      await authService.logout();
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      setIsLoggingOut(false); // Reset logging out state to false
      clearUserSessionData(); // Clear session data on logout
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading, isLoggingOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};