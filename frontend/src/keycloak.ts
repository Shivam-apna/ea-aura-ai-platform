import Keycloak from 'keycloak-js';

// Environment-specific Keycloak configuration
const getKeycloakConfig = () => {
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  
  switch (environment) {
    case 'staging':
      return {
        url: 'https://staging.ea-aura.ai/auth',
        realm: 'ea_aura',
        clientId: 'ea_aura',
      };
    case 'production':
      return {
        url: import.meta.env.VITE_KEYCLOAK_URL || 'https://ea-aura.ai/auth',
        realm: import.meta.env.VITE_KEYCLOAK_REALM || 'ea_aura',
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'ea_aura',
      };
    default: // development
      return {
        url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080/',
        realm: import.meta.env.VITE_KEYCLOAK_REALM || 'ea_aura',
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'ea_aura',
      };
  }
};

const keycloak = new Keycloak(getKeycloakConfig());

export default keycloak;