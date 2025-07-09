import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Keycloak from 'keycloak-js';
import keycloak from '@/keycloak'; // Import the initialized keycloak instance

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
        const auth = await keycloak.init({
          onLoad: 'login-required', // Force login if not authenticated
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html', // Required for silent SSO
          pkceMethod: 'S256', // Recommended PKCE method
        });
        setAuthenticated(auth);
      } catch (error) {
        console.error('Failed to initialize Keycloak:', error);
        setAuthenticated(false); // Treat as not authenticated on error
      } finally {
        setLoading(false);
      }
    };

    initKeycloak();
  }, []);

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