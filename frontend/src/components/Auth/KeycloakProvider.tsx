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
        console.log('Environment:', process.env.NODE_ENV);
        console.log('Protocol:', window.location.protocol);
        
        const auth = await keycloak.init({
          onLoad: 'check-sso',
          checkLoginIframe: false,
          enableLogging: true,
          // Force standard flow without PKCE
          flow: 'standard',
          responseMode: 'fragment',
        });

        console.log('Keycloak initialized successfully. Authenticated:', auth);
        setAuthenticated(auth);

      } catch (error) {
        console.error('Keycloak initialization failed:', error);
        console.error('Error details:', error.message);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initKeycloak();
  }, []);

  const handleLogin = async () => {
    try {
      console.log('Attempting login...');
      await keycloak.login({
        redirectUri: window.location.origin,
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await keycloak.logout({
        redirectUri: window.location.origin
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  if (authenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome</h2>
          <p className="text-gray-600 mb-6">Please log in to access the application.</p>
          <button 
            onClick={handleLogin}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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

// Export the useKeycloak hook
export const useKeycloak = () => {
  const context = useContext(KeycloakContext);
  if (context === undefined) {
    throw new Error('useKeycloak must be used within a KeycloakProvider');
  }
  return context;
};