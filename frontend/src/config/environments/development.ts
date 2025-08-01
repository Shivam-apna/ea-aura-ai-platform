// Development environment configuration
export const developmentConfig = {
  apiBaseUrl: 'http://localhost:8081',
  environment: 'development',
  debugMode: true,
  logLevel: 'debug',
  keycloakUrl: 'http://localhost:8080',
  keycloakRealm: 'ea_aura',
  keycloakClientId: 'ea_aura',
  features: {
    enableDebugLogging: true,
    enablePerformanceMonitoring: false,
    enableAnalytics: false,
  },
  timeouts: {
    apiRequest: 30000, // 30 seconds
    sessionTimeout: 3600000, // 1 hour
  }
}; 