// Staging environment configuration
export const stagingConfig = {
  apiBaseUrl: 'https://staging.ea-aura.ai/api', // HTTPS for staging
  // apiBaseUrl: 'https://localhost/api', // HTTPS for local development
  environment: 'staging',
  debugMode: true,
  logLevel: 'debug',
  keycloakUrl: 'https://staging.ea-aura.ai/auth', // HTTPS for staging
  // keycloakUrl: 'https://localhost/auth', // HTTPS for local development
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