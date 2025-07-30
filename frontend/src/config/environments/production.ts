// Production environment configuration
export const productionConfig = {
  apiBaseUrl: 'https://api.ea-aura.ai',
  environment: 'production',
  debugMode: false,
  logLevel: 'error',
  keycloakUrl: 'https://auth.ea-aura.ai',
  keycloakRealm: 'ea_aura',
  keycloakClientId: 'ea_aura',
  features: {
    enableDebugLogging: false,
    enablePerformanceMonitoring: true,
    enableAnalytics: true,
  },
  timeouts: {
    apiRequest: 30000, // 30 seconds
    sessionTimeout: 7200000, // 2 hours
  }
}; 