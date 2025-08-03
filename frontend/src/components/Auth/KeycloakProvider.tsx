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
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // Disable Keycloak iframe-based authentication
  // We'll use our custom login page instead
  useEffect(() => {
    console.log('Keycloak iframe authentication disabled. Using custom login page.');
    setLoading(false);
    setAuthenticated(false);
  }, []);

  // Render children directly - authentication will be handled by our custom login
  return (
    <KeycloakContext.Provider value={{ keycloak: null, authenticated, loading }}>
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