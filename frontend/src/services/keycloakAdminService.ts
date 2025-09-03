import { config } from '@/config/environment';
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
}

class KeycloakAdminService {
  private baseUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}`;

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
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
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
      const result = await this.makeRequest('/organizations', {
        method: 'POST',
        body: JSON.stringify(organizationData)
      });
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

      const result = await this.makeRequest('/groups', {
        method: 'POST',
        body: JSON.stringify(groupData)
      });
      console.log('Organization created via Groups API:', result);
      return result;
    }
  }

  async getOrganizations(): Promise<any[]> {
    try {
      // Try Organizations API first
      const organizations = await this.makeRequest('/organizations');
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
      const groups = await this.makeRequest('/groups');
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
      const members = await this.makeRequest(`/organizations/${organizationId}/members`);
      console.log('Organization members via Organizations API:', members);
      return members;
    } catch (error) {
      console.log('Organizations API not available, falling back to groups');
      // Fallback to groups
      const members = await this.makeRequest(`/groups/${organizationId}/members`);
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
      return await this.makeRequest(`/organizations/${id}`);
    } catch (error) {
      console.log('Organizations API not available, falling back to groups');
      // Fallback to groups
      return await this.makeRequest(`/groups/${id}`);
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
      return await this.makeRequest(`/organizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(organizationData)
      });
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

      return await this.makeRequest(`/groups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(groupData)
      });
    }
  }

  async deleteOrganization(id: string): Promise<void> {
    try {
      // Try Organizations API first
      return await this.makeRequest(`/organizations/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.log('Organizations API not available, falling back to groups');
      // Fallback to groups
      return await this.makeRequest(`/groups/${id}`, {
        method: 'DELETE'
      });
    }
  }

  // User Management
  async createUser(data: UserData): Promise<any> {
    const userData = {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      enabled: true,
      emailVerified: false
    };

    console.log('Creating user with data:', userData);

    await this.makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    // Fetch created user by username to get its id
    const createdUsers = await this.makeRequest(`/users?username=${encodeURIComponent(data.username)}`);
    const createdUser = Array.isArray(createdUsers) && createdUsers.length > 0 ? createdUsers[0] : null;

    console.log('User created successfully:', createdUser);

    // If user was created and has an organization, add them to the organization
    if (createdUser && data.organizationId && data.organizationId.trim() !== '') {
      try {
        console.log('Adding user to organization:', { userId: createdUser.id, organizationId: data.organizationId });
        await this.addUserToOrganization(createdUser.id, data.organizationId);
        console.log('User successfully added to organization');
      } catch (error) {
        console.error('Failed to add user to organization:', error);
        // Don't throw error here, just log it
        // The user was created successfully, just not added to organization
      }
    } else {
      console.log('No organization specified for user or organizationId is empty');
    }

    return createdUser;
  }

  async getUsers(): Promise<any[]> {
    return await this.makeRequest('/users');
  }

  async getUser(id: string): Promise<any> {
    return await this.makeRequest(`/users/${id}`);
  }

  async updateUser(id: string, data: Partial<UserData>): Promise<any> {
    const userData = {
      ...data,
      enabled: true
    };

    return await this.makeRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(id: string): Promise<void> {
    return await this.makeRequest(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  async addUserToOrganization(userId: string, organizationId: string): Promise<void> {
    // Use Organizations API per latest Keycloak: POST /organizations/{org-id}/members
    // Body contains the userId. Different builds accept slight variants; try in order.
    const token = await this.getAdminToken();
    const url = `${this.baseUrl}/organizations/${organizationId}/members`;

    // 1) application/json with raw UUID (matches your successful request)
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: userId
    });

    if (response.status === 415) {
      // 2) application/json with JSON string body
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userId)
      });
    }

    if (response.status === 415) {
      // 3) text/plain with raw UUID
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        },
        body: userId
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Keycloak Organizations API Error (add member):', {
        status: response.status,
        statusText: response.statusText,
        endpoint: `/organizations/${organizationId}/members`,
        error: errorText
      });
      throw new Error(`Keycloak Organizations API Error: ${response.status} ${response.statusText}`);
    }
  }

  async removeUserFromOrganization(userId: string, organizationId: string): Promise<void> {
    try {
      // Try Organizations API first
      return await this.makeRequest(`/organizations/${organizationId}/members/${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.log('Organizations API not available, falling back to groups');
      // Fallback to groups
      return await this.makeRequest(`/users/${userId}/groups/${organizationId}`, {
        method: 'DELETE'
      });
    }
  }

  // Role Management
  async getRoles(): Promise<any[]> {
    return await this.makeRequest('/roles');
  }

  async getUserRoles(userId: string): Promise<any[]> {
    return await this.makeRequest(`/users/${userId}/role-mappings/realm`);
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

    return await this.makeRequest(`/users/${userId}/role-mappings/realm`, {
      method: 'POST',
      body: JSON.stringify([role])
    });
  }

  async removeRoleFromUser(userId: string, roleName: string): Promise<void> {
    const roles = await this.getRoles();
    const role = roles.find((r: any) => r.name === roleName);
    
    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    return await this.makeRequest(`/users/${userId}/role-mappings/realm`, {
      method: 'DELETE',
      body: JSON.stringify([role])
    });
  }

  async resetUserPassword(userId: string, newPassword: string, temporary: boolean = false): Promise<void> {
    const payload = {
      type: 'password',
      value: newPassword,
      temporary
    };
    await this.makeRequest(`/users/${userId}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }
}

export const keycloakAdminService = new KeycloakAdminService(); 