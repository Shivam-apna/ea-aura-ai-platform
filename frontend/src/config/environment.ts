// Environment configuration for different environments
interface EnvironmentConfig {
  apiBaseUrl: string;
  environment: string;
  debugMode: boolean;
  logLevel: string;
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  
  switch (environment) {
    case 'production':
      return {
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.ea-aura.ai',
        environment: 'production',
        debugMode: false,
        logLevel: 'error',
        keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL || 'https://auth.ea-aura.ai',
        keycloakRealm: import.meta.env.VITE_KEYCLOAK_REALM || 'ea_aura',
        keycloakClientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'ea_aura',
      };
    
    case 'testing':
      return {
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://test-api.ea-aura.ai',
        environment: 'testing',
        debugMode: true,
        logLevel: 'warn',
        keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL || 'https://test-auth.ea-aura.ai',
        keycloakRealm: import.meta.env.VITE_KEYCLOAK_REALM || 'ea_aura_test',
        keycloakClientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'ea_aura_test',
      };
    
    case 'development':
    default:
      return {
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081',
        environment: 'development',
        debugMode: true,
        logLevel: 'debug',
        keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
        keycloakRealm: import.meta.env.VITE_KEYCLOAK_REALM || 'ea_aura',
        keycloakClientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'ea_aura',
      };
  }
};

export const config = getEnvironmentConfig();

// Helper function to get API endpoint
export const getApiEndpoint = (path: string): string => {
  return `${config.apiBaseUrl}${path}`;
};

// Helper function for logging
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (config.debugMode) {
      console.log(`[${config.environment.toUpperCase()}] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (config.logLevel === 'debug' || config.logLevel === 'warn') {
      console.warn(`[${config.environment.toUpperCase()}] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[${config.environment.toUpperCase()}] ${message}`, ...args);
  }
}; 