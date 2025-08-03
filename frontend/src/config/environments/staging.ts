// Staging environment configuration
export const stagingConfig = {
  apiBaseUrl: 'http://staging.ea-aura.ai/api', // HTTP for staging
  // apiBaseUrl: 'http://localhost/api', // HTTP for local development
  environment: 'staging',
  debugMode: true,
  logLevel: 'debug',
  keycloakUrl: 'http://staging.ea-aura.ai/auth', // HTTP for staging
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