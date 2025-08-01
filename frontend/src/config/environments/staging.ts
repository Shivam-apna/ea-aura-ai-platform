// Staging environment configuration
export const stagingConfig = {
  apiBaseUrl: 'https://staging.ea-aura.ai/api', // HTTPS for production
  // apiBaseUrl: 'http://localhost/api', // HTTP for local development
  environment: 'staging',
  debugMode: false,
  logLevel: 'info',
  keycloakUrl: 'https://staging.ea-aura.ai/auth', // HTTPS for production
  // keycloakUrl: 'http://localhost:8080', // HTTP for local development
  keycloakRealm: 'ea_aura',
  keycloakClientId: 'ea_aura',
  features: {
    enableDebugLogging: false,
    enablePerformanceMonitoring: true,
    enableAnalytics: true,
  },
  timeouts: {
    apiRequest: 60000, // 60 seconds
    sessionTimeout: 7200000, // 2 hours
  }
}; 