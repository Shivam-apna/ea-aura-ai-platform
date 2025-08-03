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

  // Organization Management (using Keycloak Groups)
  async createOrganization(data: OrganizationData): Promise<any> {
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

    return await this.makeRequest('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData)
    });
  }

  async getOrganizations(): Promise<any[]> {
    const groups = await this.makeRequest('/groups');
    return groups.filter((group: any) => 
      group.attributes?.type?.[0] === 'organization'
    );
  }

  async getOrganization(id: string): Promise<any> {
    return await this.makeRequest(`/groups/${id}`);
  }

  async updateOrganization(id: string, data: OrganizationData): Promise<any> {
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

  async deleteOrganization(id: string): Promise<void> {
    return await this.makeRequest(`/groups/${id}`, {
      method: 'DELETE'
    });
  }

  // User Management
  async createUser(data: UserData): Promise<any> {
    const userData = {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      enabled: true,
      emailVerified: false,
      groups: data.organizationId ? [data.organizationId] : []
    };

    return await this.makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
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
    return await this.makeRequest(`/users/${userId}/groups/${organizationId}`, {
      method: 'PUT'
    });
  }

  async removeUserFromOrganization(userId: string, organizationId: string): Promise<void> {
    return await this.makeRequest(`/users/${userId}/groups/${organizationId}`, {
      method: 'DELETE'
    });
  }

  // Role Management
  async getRoles(): Promise<any[]> {
    return await this.makeRequest('/roles');
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
}

export const keycloakAdminService = new KeycloakAdminService(); 