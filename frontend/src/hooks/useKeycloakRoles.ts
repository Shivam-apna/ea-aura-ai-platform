import { useKeycloak } from '@/components/Auth/KeycloakProvider';
import { useEffect, useState } from 'react';

interface KeycloakRoles {
  clientRoles: string[];
}

export const useKeycloakRoles = (): KeycloakRoles => {
  const { keycloak, authenticated } = useKeycloak();
  const [clientRoles, setClientRoles] = useState<string[]>([]);

  useEffect(() => {
    if (authenticated && keycloak?.tokenParsed) {
      const roles: string[] = [];

      // Log the entire tokenParsed object for full inspection
      console.log("Keycloak Token Parsed (Full Object):", keycloak.tokenParsed);

      // Get realm roles
      const realmAccess = keycloak.tokenParsed.realm_access;
      if (realmAccess && Array.isArray(realmAccess.roles)) {
        roles.push(...realmAccess.roles);
        console.log("Realm Roles Found:", realmAccess.roles);
      } else {
        console.log("No realm roles found or realm_access is not an array.");
      }

      // Get client roles (resource access roles)
      if (keycloak.clientId) {
        const resourceAccess = keycloak.tokenParsed.resource_access as Record<string, { roles: string[] }>;
        console.log("Keycloak Client ID (from instance):", keycloak.clientId);
        console.log("Keycloak Token Parsed Resource Access (Full Object):", resourceAccess); // Log the whole resource_access object

        const appRoles = resourceAccess?.[keycloak.clientId]?.roles;
        if (appRoles && Array.isArray(appRoles)) {
          roles.push(...appRoles);
          console.log(`Client Roles for '${keycloak.clientId}' Found:`, appRoles);
        } else {
          console.log(`No client roles found for client ID '${keycloak.clientId}' or resource_access is not structured as expected.`);
        }
      } else {
        console.warn("Keycloak client ID is not available. Cannot extract client-specific roles.");
      }
      
      // Filter out duplicates and set unique roles, converting all to lowercase
      const uniqueAndLowercasedRoles = Array.from(new Set(roles)).map(role => role.toLowerCase());
      setClientRoles(uniqueAndLowercasedRoles);
      console.log("Extracted Roles (Final List for Sidebar):", uniqueAndLowercasedRoles);

    } else {
      setClientRoles([]);
      console.log("Not authenticated or token not parsed. Clearing roles.");
    }
  }, [authenticated, keycloak?.tokenParsed, keycloak?.clientId]);

  return { clientRoles };
};