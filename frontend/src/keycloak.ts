import Keycloak from 'keycloak-js';

// Ensure these environment variables are set in your .env file
// VITE_KEYCLOAK_URL=http://localhost:8080/auth
// VITE_KEYCLOAK_REALM=myrealm
// VITE_KEYCLOAK_CLIENT_ID=react-app

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL|| "http://localhost:8080/",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "ea_aura",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "ea_aura",
});

export default keycloak;