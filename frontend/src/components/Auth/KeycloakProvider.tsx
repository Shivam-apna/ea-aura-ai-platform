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
      // Guard against re-initialization if Keycloak is already authenticated
      if (keycloak.authenticated) {
        console.log('Keycloak already authenticated. Skipping init().');
        setAuthenticated(true); // It's already authenticated
        setLoading(false);
        return;
      }

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
  }, []); // Empty dependency array ensures it runs once on mount

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading authentication...</p>
      </div>
    );
  }

  // If not authenticated after loading, Keycloak's 'login-required' will handle redirection.
  // We can return null or a simple message here, as the browser will likely redirect quickly.
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Authentication failed or not logged in. Redirecting...</p>
      </div>
    );
  }

  // Render children only when authenticated
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