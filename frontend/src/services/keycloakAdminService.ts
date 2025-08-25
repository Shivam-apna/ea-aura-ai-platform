import { config } from '@/config/environment';
import { getApiEndpoint } from '@/config/environment';
import { authService } from './authService';

interface OrganizationData {
  name: string;
  alias: string;
  domain: string;
  redirectUrl: string;
  description: string;
}

interface UserData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  enabled?: boolean; // Added enabled property
  attributes?: { [key: string]: string[] }; // Added attributes for custom fields
}

class KeycloakAdminService {
  private async getAdminToken(): Promise<string> {
    // For now, we'll use the current user's token
    // In production, you might want to use a service account
    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return token;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAdminToken();
    
    // Call API using your specified pattern
    const response = await fetch(getApiEndpoint(`/v1/keycloak${endpoint}`), {
      method: options.method || "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...options.headers,
      },
      body: options.body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Keycloak Admin API Error:', {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        error: errorText
      });
      throw new Error(`Keycloak Admin API Error: ${response.status} ${response.statusText}`);
    }

    // Some endpoints return empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return null;
  }

  // Organization Management (using Keycloak Organizations API with fallback to groups)
  async createOrganization(data: OrganizationData): Promise<any> {
    const organizationData = {
      name: data.name,
      alias: data.alias || data.name,
      redirectUrl: data.redirectUrl || '',
      description: data.description || '',
      domains: [
        {
          name: data.domain,
          verified: false
        }
      ],
      attributes: {}
    };

    try {
      // Try Organizations API first
      const response = await fetch(getApiEndpoint("/v1/keycloak/organizations"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
        body: JSON.stringify(organizationData),
      });

      if (!response.ok) {
        throw new Error(`Organizations API failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Organization created via Organizations API:', result);
      return result;
    } catch (error) {
      console.log('Organizations API not available, falling back to groups');
      // Fallback to groups
      const groupData = {
        name: data.name,
        attributes: {
          alias: [data.alias || ''],
          domain: [data.domain],
          redirectUrl: [data.redirectUrl || ''],
          description: [data.description || ''],
          type: ['organization']
        }
      };

      const response = await fetch(getApiEndpoint("/v1/keycloak/groups"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        throw new Error(`Groups API failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Organization created via Groups API:', result);
      return result;
    }
  }

  async getOrganizations(): Promise<any[]> {
    try {
      // Try Organizations API first
      const response = await fetch(getApiEndpoint("/v1/keycloak/organizations"), {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
      });

      if (!response.ok) {
        throw new Error(`Organizations API failed: ${response.status}`);
      }

      const organizations = await response.json();
      return organizations.map((org: any) => ({
        id: org.id,
        name: org.name,
        alias: org.alias,
        domain: org.domains?.[0]?.name || '',
        redirectUrl: org.redirectUrl,
        description: org.description
      }));
    } catch (error) {
      console.log('Organizations API not available, falling back to groups');
      // Fallback to groups
      const response = await fetch(getApiEndpoint("/v1/keycloak/groups"), {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
      });

      if (!response.ok) {
        throw new Error(`Groups API failed: ${response.status}`);
      }

      const groups = await response.json();
      return groups.filter((group: any) => 
        group.attributes?.type?.[0] === 'organization'
      ).map((group: any) => ({
        id: group.id,
        name: group.name,
        alias: group.attributes?.alias?.[0] || '',
        domain: group.attributes?.domain?.[0] || '',
        redirectUrl: group.attributes?.redirectUrl?.[0] || '',
        description: group.attributes?.description?.[0] || ''
      }));
    }
  }

  async getOrganizationMembers(organizationId: string): Promise<any[]> {
    try {
      console.log('Getting organization members via Organizations API for org:', organizationId);
      // Try Organizations API first
      const response = await fetch(getApiEndpoint(`/v1/keycloak/organizations/${organizationId}/members`), {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
      });

      if (!response.ok) {
        throw new Error(`Organizations API failed: ${response.status}`);
      }

      const members = await response.json();
      console.log('Organization members via Organizations API:', members);
      return members;
    } catch (error) {
      console.log('Organizations API not available, falling back to groups');
      // Fallback to groups
      const response = await fetch(getApiEndpoint(`/v1/keycloak/groups/${organizationId}/members`), {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
      });

      if (!response.ok) {
        throw new Error(`Groups API failed: ${response.status}`);
      }

      const members = await response.json();
      console.log('Organization members via Groups API:', members);
      return members;
    }
  }

  async getOrganizationMembersCount(organizationId: string): Promise<number> {
    try {
      const members = await this.getOrganizationMembers(organizationId);
      return members.length;
    } catch (error) {
      console.error('Failed to get organization members count:', error);
      return 0;
    }
  }

  async getOrganization(id: string): Promise<any> {
    try {
      // Try Organizations API first
      const response = await fetch(getApiEndpoint(`/v1/keycloak/organizations/${id}`), {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
      });

      if (!response.ok) {
        throw new Error(`Organizations API failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.log('Organizations API not available, falling back to groups');
      // Fallback to groups
      const response = await fetch(getApiEndpoint(`/v1/keycloak/groups/${id}`), {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
      });

      if (!response.ok) {
        throw new Error(`Groups API failed: ${response.status}`);
      }

      return await response.json();
    }
  }

  async updateOrganization(id: string, data: OrganizationData): Promise<any> {
    const organizationData = {
      name: data.name,
      alias: data.alias || data.name,
      redirectUrl: data.redirectUrl || '',
      description: data.description || '',
      domains: [
        {
          name: data.domain,
          verified: false
        }
      ],
      attributes: {}
    };

    try {
      // Try Organizations API first
      const response = await fetch(getApiEndpoint(`/v1/keycloak/organizations/${id}`), {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
        body: JSON.stringify(organizationData),
      });

      if (!response.ok) {
        throw new Error(`Organizations API failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.log('Organizations API not available, falling back to groups');
      // Fallback to groups
      const groupData = {
        name: data.name,
        attributes: {
          alias: [data.alias || ''],
          domain: [data.domain],
          redirectUrl: [data.redirectUrl || ''],
          description: [data.description || ''],
          type: ['organization']
        }
      };

      const response = await fetch(getApiEndpoint(`/v1/keycloak/groups/${id}`), {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        throw new Error(`Groups API failed: ${response.status}`);
      }

      return await response.json();
    }
  }

  async deleteOrganization(id: string): Promise<void> {
    try {
      // Try Organizations API first
      const response = await fetch(getApiEndpoint(`/v1/keycloak/organizations/${id}`), {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
      });

      if (!response.ok) {
        throw new Error(`Organizations API failed: ${response.status}`);
      }

      return;
    } catch (error) {
      console.log('Organizations API not available, falling back to groups');
      // Fallback to groups
      const response = await fetch(getApiEndpoint(`/v1/keycloak/groups/${id}`), {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
      });

      if (!response.ok) {
        throw new Error(`Groups API failed: ${response.status}`);
      }

      return;
    }
  }

  // User Management
  async createUser(data: UserData): Promise<any> {
    const userData = {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      enabled: data.enabled !== undefined ? data.enabled : true, // Handle enabled property
      emailVerified: false,
      attributes: data.attributes || {} // Include custom attributes
    };

    console.log('Creating user with data:', userData);

    const response = await fetch(getApiEndpoint("/v1/keycloak/users"), {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await this.getAdminToken()}`
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`User creation failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('User created successfully:', result);

    // If user was created and has an organization, add them to the organization
    if (result && data.organizationId && data.organizationId.trim() !== '') {
      try {
        console.log('Adding user to organization:', { userId: result.id, organizationId: data.organizationId });
        await this.addUserToOrganization(result.id, data.organizationId);
        console.log('User successfully added to organization');
      } catch (error) {
        console.error('Failed to add user to organization:', error);
        // Don't throw error here, just log it
        // The user was created successfully, just not added to organization
      }
    } else {
      console.log('No organization specified for user or organizationId is empty');
    }

    return result;
  }

  async getUsers(): Promise<any[]> {
    const response = await fetch(getApiEndpoint("/v1/keycloak/users"), {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await this.getAdminToken()}`
      },
    });

    if (!response.ok) {
      throw new Error(`Get users failed: ${response.status}`);
    }

    return await response.json();
  }

  async getUser(id: string): Promise<any> {
    const response = await fetch(getApiEndpoint(`/v1/keycloak/users/${id}`), {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await this.getAdminToken()}`
      },
    });

    if (!response.ok) {
      throw new Error(`Get user failed: ${response.status}`);
    }

    return await response.json();
  }

  async updateUser(id: string, data: Partial<UserData>): Promise<any> {
    const userData = {
      ...data,
      // Keep enabled property handling - this is crucial for suspend/activate functionality
      enabled: data.enabled !== undefined ? data.enabled : true
    };

    console.log('Updating user with data:', userData);

    const response = await fetch(getApiEndpoint(`/v1/keycloak/users/${id}`), {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await this.getAdminToken()}`
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Update user failed: ${response.status}`);
    }

    return await response.json();
  }

  async deleteUser(id: string): Promise<void> {
    const response = await fetch(getApiEndpoint(`/v1/keycloak/users/${id}`), {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await this.getAdminToken()}`
      },
    });

    if (!response.ok) {
      throw new Error(`Delete user failed: ${response.status}`);
    }

    return;
  }

  // User enable/disable methods for better control
  async enableUser(userId: string): Promise<void> {
    return await this.updateUser(userId, { enabled: true });
  }

  async disableUser(userId: string): Promise<void> {
    return await this.updateUser(userId, { enabled: false });
  }

  async addUserToOrganization(userId: string, organizationId: string): Promise<void> {
    try {
      console.log('Attempting to add user to organization via Organizations API');
      // Try Organizations API first - Updated to use the special handling in your Python proxy
      const response = await fetch(getApiEndpoint(`/v1/keycloak/organizations/${organizationId}/members`), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
        body: JSON.stringify(userId), // Send as raw JSON string as handled in your Python proxy
      });

      if (!response.ok) {
        throw new Error(`Add user to organization failed: ${response.status}`);
      }

      return;
    } catch (error) {
      console.log('Organizations API not available, falling back to groups');
      // Fallback to groups
      const response = await fetch(getApiEndpoint(`/v1/keycloak/users/${userId}/groups/${organizationId}`), {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
      });

      if (!response.ok) {
        throw new Error(`Add user to group failed: ${response.status}`);
      }

      return;
    }
  }

  async removeUserFromOrganization(userId: string, organizationId: string): Promise<void> {
    try {
      // Try Organizations API first
      const response = await fetch(getApiEndpoint(`/v1/keycloak/organizations/${organizationId}/members/${userId}`), {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
      });

      if (!response.ok) {
        throw new Error(`Remove user from organization failed: ${response.status}`);
      }

      return;
    } catch (error) {
      console.log('Organizations API not available, falling back to groups');
      // Fallback to groups
      const response = await fetch(getApiEndpoint(`/v1/keycloak/users/${userId}/groups/${organizationId}`), {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await this.getAdminToken()}`
        },
      });

      if (!response.ok) {
        throw new Error(`Remove user from group failed: ${response.status}`);
      }

      return;
    }
  }

  // Role Management
  async getRoles(): Promise<any[]> {
    const response = await fetch(getApiEndpoint("/v1/keycloak/roles"), {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await this.getAdminToken()}`
      },
    });

    if (!response.ok) {
      throw new Error(`Get roles failed: ${response.status}`);
    }

    return await response.json();
  }

  async getUserRoles(userId: string): Promise<any[]> {
    const response = await fetch(getApiEndpoint(`/v1/keycloak/users/${userId}/role-mappings/realm`), {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await this.getAdminToken()}`
      },
    });

    if (!response.ok) {
      throw new Error(`Get user roles failed: ${response.status}`);
    }

    return await response.json();
  }

  async getCurrentUserRoles(): Promise<any[]> {
    try {
      const userInfo = await authService.getUserInfo();
      return await this.getUserRoles(userInfo.sub);
    } catch (error) {
      console.error('Failed to get current user roles:', error);
      return [];
    }
  }

  async checkUserPermissions(): Promise<{ canManageOrganizations: boolean; canManageUsers: boolean }> {
    try {
      const roles = await this.getCurrentUserRoles();
      const roleNames = roles.map((role: any) => role.name);
      
      console.log('Current user roles:', roleNames);
      
      return {
        canManageOrganizations: roleNames.includes('admin') || roleNames.includes('organization-admin'),
        canManageUsers: roleNames.includes('admin') || roleNames.includes('user-admin')
      };
    } catch (error) {
      console.error('Failed to check user permissions:', error);
      return {
        canManageOrganizations: false,
        canManageUsers: false
      };
    }
  }

  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    const roles = await this.getRoles();
    const role = roles.find((r: any) => r.name === roleName);
    
    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    const response = await fetch(getApiEndpoint(`/v1/keycloak/users/${userId}/role-mappings/realm`), {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await this.getAdminToken()}`
      },
      body: JSON.stringify([role]),
    });

    if (!response.ok) {
      throw new Error(`Assign role failed: ${response.status}`);
    }

    return;
  }

  async removeRoleFromUser(userId: string, roleName: string): Promise<void> {
    const roles = await this.getRoles();
    const role = roles.find((r: any) => r.name === roleName);
    
    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    const response = await fetch(getApiEndpoint(`/v1/keycloak/users/${userId}/role-mappings/realm`), {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await this.getAdminToken()}`
      },
      body: JSON.stringify([role]),
    });

    if (!response.ok) {
      throw new Error(`Remove role failed: ${response.status}`);
    }

    return;
  }

  // Password management
  async resetUserPassword(userId: string, temporary: boolean = true): Promise<void> {
    // Generate a temporary password or use Keycloak's reset functionality
    const passwordData = {
      type: 'password',
      temporary: temporary,
      value: this.generateTemporaryPassword()
    };

    const response = await fetch(getApiEndpoint(`/v1/keycloak/users/${userId}/reset-password`), {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await this.getAdminToken()}`
      },
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      throw new Error(`Reset password failed: ${response.status}`);
    }

    return;
  }

  private generateTemporaryPassword(): string {
    // Generate a secure temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Execute required actions (like email verification, password reset)
  async executeActionsEmail(userId: string, actions: string[], redirectUri?: string): Promise<void> {
    const requestData = {
      actions: actions,
      ...(redirectUri && { redirect_uri: redirectUri })
    };

    const response = await fetch(getApiEndpoint(`/v1/keycloak/users/${userId}/execute-actions-email`), {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await this.getAdminToken()}`
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Execute actions failed: ${response.status}`);
    }

    return;
  }
}

export const keycloakAdminService = new KeycloakAdminService();
