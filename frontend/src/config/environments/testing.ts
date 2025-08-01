// Testing environment configuration
export const testingConfig = {
  apiBaseUrl: 'https://test-api.ea-aura.ai',
  environment: 'testing',
  debugMode: true,
  logLevel: 'warn',
  keycloakUrl: 'https://test-auth.ea-aura.ai',
  keycloakRealm: 'ea_aura_test',
  keycloakClientId: 'ea_aura_test',
  features: {
    enableDebugLogging: true,
    enablePerformanceMonitoring: true,
    enableAnalytics: false,
  },
  timeouts: {
    apiRequest: 15000, // 15 seconds for faster testing
    sessionTimeout: 1800000, // 30 minutes
  }
}; 