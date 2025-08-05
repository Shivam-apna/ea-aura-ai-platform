import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserInfo } from '@/services/authService'; // Import UserInfo type

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null; // Use UserInfo type
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null); // Use UserInfo type
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext: Initializing authentication check...");
    const checkAuth = async () => {
      try {
        const authenticated = authService.isAuthenticated();
        console.log("AuthContext: authService.isAuthenticated() returned:", authenticated);
        if (authenticated) {
          const userInfo = await authService.getUserInfo();
          console.log("AuthContext: User info fetched:", userInfo);
          setUser(userInfo);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext: Auth check failed:', error);
        // Clear any invalid tokens
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
        console.log("AuthContext: Finished initial auth check. isAuthenticated:", isAuthenticated);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      console.log("AuthContext: Attempting login...");
      await authService.login(username, password);
      const userInfo = await authService.getUserInfo();
      setUser(userInfo);
      setIsAuthenticated(true);
      console.log("AuthContext: Login successful. isAuthenticated:", true);
    } catch (error) {
      console.error("AuthContext: Login failed:", error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      console.log("AuthContext: Attempting logout...");
      await authService.logout();
      console.log("AuthContext: Logout successful.");
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      console.log("AuthContext: Finished logout. isAuthenticated:", false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
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