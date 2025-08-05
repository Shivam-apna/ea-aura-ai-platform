import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { config } from '@/config/environment'; // Import config

interface KeycloakRoles {
  clientRoles: string[];
}

export const useKeycloakRoles = (): KeycloakRoles => {
  const { user, isAuthenticated } = useAuth(); // Use useAuth
  const [clientRoles, setClientRoles] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthenticated && user) { // Check user object directly
      const roles: string[] = [];

      // Log the entire user object for full inspection
      console.log("User Object (Full Object):", user);

      // Get realm roles
      const realmAccess = user.realm_access; // Access directly from user
      if (realmAccess && Array.isArray(realmAccess.roles)) {
        roles.push(...realmAccess.roles);
        console.log("Realm Roles Found:", realmAccess.roles);
      } else {
        console.log("No realm roles found or realm_access is not an array.");
      }

      // Get client roles (resource access roles)
      const clientId = config.keycloakClientId; // Use config.keycloakClientId
      if (clientId) {
        const resourceAccess = user.resource_access as Record<string, { roles: string[] }>; // Access directly from user
        console.log("Keycloak Client ID (from config):", clientId);
        console.log("User Resource Access (Full Object):", resourceAccess); // Log the whole resource_access object

        const appRoles = resourceAccess?.[clientId]?.roles;
        if (appRoles && Array.isArray(appRoles)) {
          roles.push(...appRoles);
          console.log(`Client Roles for '${clientId}' Found:`, appRoles);
        } else {
          console.log(`No client roles found for client ID '${clientId}' or resource_access is not structured as expected.`);
        }
      } else {
        console.warn("Keycloak client ID is not available in config. Cannot extract client-specific roles.");
      }
      
      // Filter out duplicates and set unique roles, converting all to lowercase
      const uniqueAndLowercasedRoles = Array.from(new Set(roles)).map(role => role.toLowerCase());
      setClientRoles(uniqueAndLowercasedRoles);
      console.log("Extracted Roles (Final List for Sidebar):", uniqueAndLowercasedRoles);

    } else {
      setClientRoles([]);
      console.log("Not authenticated or user object not available. Clearing roles.");
    }
  }, [isAuthenticated, user]); // Depend on isAuthenticated and user

  return { clientRoles };
};