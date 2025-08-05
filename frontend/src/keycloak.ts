import Keycloak from 'keycloak-js';

// Environment-specific Keycloak configuration
const getKeycloakConfig = () => {
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  
  switch (environment) {
    case 'staging':
      return {
        url: 'https://staging.ea-aura.ai/auth',
        realm: 'myrealm', // Updated
        clientId: 'myclient', // Updated
      };
    case 'production':
      return {
        url: import.meta.env.VITE_KEYCLOAK_URL || 'https://ea-aura.ai/auth',
        realm: import.meta.env.VITE_KEYCLOAK_REALM || 'myrealm', // Updated
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'myclient', // Updated
      };
    default: // development
      return {
        url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
        realm: import.meta.env.VITE_KEYCLOAK_REALM || 'myrealm', // Updated
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'myclient', // Updated
      };
  }
};

// Create Keycloak instance
const keycloak = new Keycloak(getKeycloakConfig());

// Add some debugging
console.log('Keycloak configuration:', getKeycloakConfig());
console.log('Web Crypto API available:', !!(window.crypto && window.crypto.subtle));
console.log('Protocol:', window.location.protocol);

export default keycloak;