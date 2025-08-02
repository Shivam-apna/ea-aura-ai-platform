import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Keycloak from 'keycloak-js';
import keycloak from '@/keycloak';

interface KeycloakContextType {
  keycloak: Keycloak | null;
  authenticated: boolean | undefined;
  loading: boolean;
}

const KeycloakContext = createContext<KeycloakContextType | undefined>(undefined);

export const KeycloakProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        console.log('Initializing Keycloak...');
        
        const auth = await keycloak.init({
          onLoad: 'check-sso',
          checkLoginIframe: false, // Completely disable iframe checks
          enableLogging: process.env.NODE_ENV === 'development',
          // Remove pkceMethod to avoid Web Crypto API requirement
        });

        console.log('Keycloak initialized. Authenticated:', auth);
        setAuthenticated(auth);

      } catch (error) {
        console.error('Keycloak initialization failed:', error);
        // Instead of setting to false, you might want to retry or handle differently
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initKeycloak();
  }, []);

  const handleLogin = () => {
    keycloak.login({
      redirectUri: window.location.origin
    });
  };

  const handleLogout = () => {
    keycloak.logout({
      redirectUri: window.location.origin
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Initializing authentication...</p>
        </div>
      </div>
    );
  }

  if (authenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="mb-6 text-gray-600">Please log in to access the application.</p>
          <button 
            onClick={handleLogin}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <KeycloakContext.Provider value={{ keycloak, authenticated, loading }}>
      {children}
    </KeycloakContext.Provider>
  );
};

export const useKeycloak = () => {
  const context = useContext(KeycloakContext);
  if (context === undefined) {
    throw new Error('useKeycloak must be used within a KeycloakProvider');
  }
  return context;
};