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
  enabled?: boolean;
  domain?: string; // Added domain
}

class KeycloakAdminService {
  // FIXED: Include /admin prefix for Keycloak Admin REST API
  private baseUrl = `http://localhost:5001/api/keycloak/admin/realms/${config.keycloakRealm}`;
  
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Try to refresh token if needed
    let userToken = authService.getAccessToken();
    
    if (authService.shouldRefreshToken()) {
      console.log('KeycloakAdminService: Token needs refresh, refreshing...');
      try {
        await authService.refreshToken();
        userToken = authService.getAccessToken();
        console.log('KeycloakAdminService: Token refreshed successfully');
      } catch (error) {
        console.error('KeycloakAdminService: Token refresh failed:', error);
        throw new Error('Please log in again - session expired');
      }
    }
    
    if (!userToken) {
      console.error('KeycloakAdminService: No token available!');
      throw new Error('Please log in to access admin features');
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`KeycloakAdminService: Making request to proxy: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
        ...options.headers,
      },
    });

    console.log(`KeycloakAdminService: Proxy response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw await this.handleErrorResponse(response, endpoint);
    }

    return await this.handleSuccessResponse(response, url);
  }

  private async handleSuccessResponse(response: Response, url: string): Promise<any> {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonResponse = await response.json();
      console.log(`KeycloakAdminService: JSON response for ${url}:`, jsonResponse);
      return jsonResponse;
    }
    
    console.log(`KeycloakAdminService: Non-JSON response for ${url}`);
    return null;
  }

  private async handleErrorResponse(response: Response, endpoint: string): Promise<never> {
    let errorText = await response.text();
    let parsedError = null;
    
    try {
      parsedError = JSON.parse(errorText);
      errorText = parsedError.error || parsedError.errorMessage || parsedError.message || errorText;
    } catch (e) {
      // Not a JSON error, use raw text
    }
    
    console.error('KeycloakAdminService: API Error:', {
      status: response.status,
      statusText: response.statusText,
      endpoint,
      error: errorText,
      parsedError
    });
    
    // Provide user-friendly error messages
    let userFriendlyMessage = '';
    if (response.status === 401) {
      userFriendlyMessage = 'Authentication failed. Please log out and log back in.';
    } else if (response.status === 403) {
      userFriendlyMessage = 'Access denied. You do not have permission to perform this operation.';
    } else if (response.status === 404) {
      userFriendlyMessage = 'Resource not found. The requested item may have been deleted.';
    } else if (response.status >= 500) {
      userFriendlyMessage = 'Server error. Please try again later.';
    } else {
      userFriendlyMessage = `Request failed: ${errorText}`;
    }
    
    throw new Error(userFriendlyMessage);
  }

  // Clear cached tokens (useful for logout)
  public clearTokens(): void {
    console.log('KeycloakAdminService: Cleared cached tokens');
  }

  // Helper method to get user ID by username
  async getUserIdByUsername(username: string): Promise<string> {
    console.log('KeycloakAdminService: Getting user ID by username:', username);
    const users = await this.makeRequest(`/users?username=${encodeURIComponent(username)}&exact=true`);
    if (users.length === 0) {
      throw new Error(`User with username '${username}' not found`);
    }
    return users[0].id;
  }

  // --- ORGANIZATION MANAGEMENT (ORGANIZATIONS API ONLY) ---

  async createOrganization(data: OrganizationData): Promise<any> {
    const payload = {
      name: data.name,
      alias: data.alias || data.name,
      domains: [{ name: data.domain, verified: false }],
      redirectUrl: data.redirectUrl || '',
      description: data.description || '',
      attributes: {}
    };

    console.log('KeycloakAdminService: Creating organization with payload:', payload);
    const result = await this.makeRequest('/organizations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    console.log('KeycloakAdminService: Organization created:', result);
    return result;
  }

  async getOrganizations(): Promise<any[]> {
    console.log('KeycloakAdminService: Fetching organizations...');
    const orgs = await this.makeRequest('/organizations');
    const processedOrgs = orgs.map((org: any) => ({
      id: org.id,
      name: org.name,
      alias: org.alias,
      domain: org.domains?.[0]?.name || '',
      redirectUrl: org.redirectUrl,
      description: org.description
    }));
    console.log('KeycloakAdminService: Processed organizations:', processedOrgs);
    return processedOrgs;
  }

  async getOrganization(id: string): Promise<any> {
    console.log('KeycloakAdminService: Fetching organization:', id);
    return await this.makeRequest(`/organizations/${id}`);
  }

  async getOrganizationMembers(organizationId: string): Promise<any[]> {
    console.log('KeycloakAdminService: Fetching organization members for:', organizationId);
    const members = await this.makeRequest(`/organizations/${organizationId}/members`);
    console.log('KeycloakAdminService: Organization members:', members);
    return members;
  }

  async getOrganizationMembersCount(organizationId: string): Promise<number> {
    try {
      const members = await this.getOrganizationMembers(organizationId);
      return members.length;
    } catch (error) {
      console.error('KeycloakAdminService: Failed to get organization members count:', error);
      return 0;
    }
  }

  // FIXED - Organizations API with CORRECT raw JSON string body format
  async addUserToOrganization(userId: string, organizationId: string): Promise<void> {
    console.log(`KeycloakAdminService: Adding user ${userId} to organization ${organizationId} with CORRECT format`);
    
    if (!userId || !organizationId || organizationId === 'none') {
      throw new Error('Invalid user ID or organization ID provided');
    }
    
    try {
      // STEP 1: Verify user exists
      console.log('KeycloakAdminService: 🔍 Verifying user exists...');
      const user = await this.makeRequest(`/users/${userId}`);
      console.log('KeycloakAdminService: ✅ User found:', user.username, '(' + user.email + ')');
      
      // STEP 2: Verify organization exists  
      console.log('KeycloakAdminService: 🔍 Verifying organization exists...');
      const org = await this.makeRequest(`/organizations/${organizationId}`);
      console.log('KeycloakAdminService: ✅ Organization found:', org.name);
      
      // STEP 3: Check if user is already a member
      console.log('KeycloakAdminService: 🔍 Checking if user is already a member...');
      const members = await this.makeRequest(`/organizations/${organizationId}/members`);
      const existingMember = members.find((member: any) => member.id === userId);
      
      if (existingMember) {
        console.log('KeycloakAdminService: ⚠️ User is already a member of this organization');
        return; // User already in organization, no error needed
      }
      
      // STEP 4: Add user with CORRECT format - raw JSON string (not object)
      console.log('KeycloakAdminService: 🔄 Adding user to organization with raw JSON string format...');
      console.log(JSON.stringify(userId), "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk")
      await this.makeRequest(`/organizations/${organizationId}/members`, {
        method: 'POST',
        body: `"${userId}"` // ✅ CORRECT: Raw JSON string, not {"id": "userId"}
      });
      
      console.log('KeycloakAdminService: ✅ User successfully added to organization');
      
    } catch (error: any) {
      console.error('KeycloakAdminService: Failed to add user to organization:', error);
      
      // Provide specific error messages
      if (error.message?.includes('404')) {
        if (error.message?.includes('users')) {
          throw new Error(`User with ID ${userId} does not exist in Keycloak`);
        } else if (error.message?.includes('organizations')) {
          throw new Error(`Organization with ID ${organizationId} does not exist`);
        }
      }
      
      throw new Error(`Failed to add user to organization: ${error.message}`);
    }
  }

  // Alternative method using username instead of user ID
  async addUserToOrganizationByUsername(username: string, organizationId: string): Promise<void> {
    console.log(`KeycloakAdminService: Adding user by username ${username} to organization ${organizationId}`);
    const userId = await this.getUserIdByUsername(username);
    await this.addUserToOrganization(userId, organizationId);
  }

  async removeUserFromOrganization(userId: string, organizationId: string): Promise<void> {
    console.log(`KeycloakAdminService: Removing user ${userId} from organization ${organizationId}`);
    
    if (!userId || !organizationId || organizationId === 'none') {
      throw new Error('Invalid user ID or organization ID provided');
    }
    
    try {
      // Validate that both user and organization exist
      console.log('KeycloakAdminService: 🔍 Validating user and organization exist...');
      await this.makeRequest(`/users/${userId}`);
      await this.makeRequest(`/organizations/${organizationId}`);
      
      // Use DELETE with userId in URL path (most common approach)
      await this.makeRequest(`/organizations/${organizationId}/members/${userId}`, {
        method: 'DELETE'
      });
      
      console.log('KeycloakAdminService: ✅ User successfully removed from organization');
      
    } catch (error: any) {
      console.error('KeycloakAdminService: Failed to remove user from organization:', error);
      throw new Error(`Failed to remove user from organization: ${error.message}`);
    }
  }

  // --- USER MANAGEMENT ---

  async createUser(data: UserData): Promise<any> {
    const userData: any = {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      enabled: true,
      emailVerified: false
    };

    // Add custom attributes if provided
    if (data.domain) {
      userData.attributes = {
        domain: [data.domain] // Keycloak custom attributes are typically string arrays
      };
    }

    console.log('KeycloakAdminService: Creating user with data:', userData);
    
    await this.makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    console.log('KeycloakAdminService: User creation request sent successfully');

    // Retrieve the newly created user by username
    const users = await this.makeRequest(`/users?username=${encodeURIComponent(data.username)}`);
    const newUser = users[0];
    
    if (!newUser) {
      throw new Error('User created but could not be retrieved.');
    }
    
    console.log('KeycloakAdminService: User retrieved after creation:', newUser.id);
    return newUser;
  }

  async getUsers(): Promise<any[]> {
    console.log('KeycloakAdminService: Fetching all users...');
    const users = await this.makeRequest('/users');
    console.log('KeycloakAdminService: Fetched users count:', users.length);
    return users;
  }

  async getUser(id: string): Promise<any> {
    console.log('KeycloakAdminService: Fetching user:', id);
    return await this.makeRequest(`/users/${id}`);
  }

  async updateUser(id: string, data: Partial<UserData & { enabled?: boolean; attributes?: Record<string, string[]> }>): Promise<any> {
    console.log('KeycloakAdminService: Updating user:', id, data);
    
    // Ensure attributes object is correctly merged or created
    const updatePayload: any = { ...data };
    if (data.domain !== undefined) {
      // If domain is explicitly provided, set it in attributes
      updatePayload.attributes = {
        ...(data.attributes || {}), // Keep existing attributes if any
        domain: [data.domain] // Set or overwrite the domain attribute
      };
      delete updatePayload.domain; // Remove from top-level payload
    } else if (data.attributes) {
      // If attributes object is passed directly, use it
      updatePayload.attributes = data.attributes;
    }

    return await this.makeRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatePayload)
    });
  }

  // ENHANCED: Admin password reset with detailed logging and validation
  async resetUserPassword(userId: string, newPassword: string, temporary: boolean = true): Promise<void> {
    console.log('KeycloakAdminService: Starting password reset process...');
    console.log('KeycloakAdminService: Target user ID:', userId);
    console.log('KeycloakAdminService: Password temporary flag:', temporary);
    
    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required for password reset');
    }
    
    if (!newPassword) {
      throw new Error('New password is required');
    }
    
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    try {
      // Verify user exists before attempting password reset
      console.log('KeycloakAdminService: 🔍 Verifying user exists before password reset...');
      const user = await this.makeRequest(`/users/${userId}`);
      console.log('KeycloakAdminService: ✅ User verified for password reset:', user.username);
      
      const credentialsPayload = {
        type: 'password',
        value: newPassword,
        temporary: temporary,
      };
      
      console.log('KeycloakAdminService: 🔄 Sending password reset request...');
      await this.makeRequest(`/users/${userId}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify(credentialsPayload),
      });
      
      console.log('KeycloakAdminService: ✅ Password reset successful for user:', userId);
      console.log('KeycloakAdminService: Password type:', temporary ? 'Temporary (user must change on next login)' : 'Permanent');
      
    } catch (error: any) {
      console.error('KeycloakAdminService: Password reset failed:', error);
      
      // Provide specific error messages
      if (error.message?.includes('404')) {
        throw new Error(`User with ID ${userId} does not exist`);
      } else if (error.message?.includes('403')) {
        throw new Error('Access denied. You do not have permission to reset passwords.');
      } else if (error.message?.includes('400')) {
        throw new Error('Invalid password format or user data');
      } else {
        throw new Error(`Password reset failed: ${error.message}`);
      }
    }
  }

  async suspendUser(userId: string): Promise<void> {
    console.log('KeycloakAdminService: Suspending user:', userId);
    await this.updateUser(userId, { enabled: false });
  }

  async activateUser(userId: string): Promise<void> {
    console.log('KeycloakAdminService: Activating user:', userId);
    await this.updateUser(userId, { enabled: true });
  }

  async deleteUser(id: string): Promise<void> {
    console.log('KeycloakAdminService: Deleting user:', id);
    await this.makeRequest(`/users/${id}`, { method: 'DELETE' });
  }

  // --- ADMIN PASSWORD MANAGEMENT SECTION ---

  // ADDITIONAL: Admin password reset by username (convenience method)
  async resetUserPasswordByUsername(username: string, newPassword: string, temporary: boolean = true): Promise<void> {
    console.log('KeycloakAdminService: Admin resetting password by username:', username);
    
    try {
      const userId = await this.getUserIdByUsername(username);
      await this.resetUserPassword(userId, newPassword, temporary);
      console.log('KeycloakAdminService: ✅ Admin password reset successful for username:', username);
    } catch (error: any) {
      console.error('KeycloakAdminService: Admin password reset by username failed:', error);
      throw new Error(`Failed to reset password for user '${username}': ${error.message}`);
    }
  }

  // ADDITIONAL: Bulk admin password reset for multiple users
  async resetMultipleUserPasswords(
    userPasswordPairs: Array<{userId: string, password: string, temporary?: boolean}>
  ): Promise<{success: string[], failed: Array<{userId: string, error: string}>}> {
    console.log('KeycloakAdminService: Starting bulk admin password reset...');
    console.log('KeycloakAdminService: Number of users to reset:', userPasswordPairs.length);
    
    const results = {
      success: [] as string[],
      failed: [] as Array<{userId: string, error: string}>
    };
    
    for (const userPassword of userPasswordPairs) {
      try {
        await this.resetUserPassword(
          userPassword.userId, 
          userPassword.password, 
          userPassword.temporary ?? true
        );
        results.success.push(userPassword.userId);
        console.log('KeycloakAdminService: ✅ Bulk reset successful for user:', userPassword.userId);
      } catch (error: any) {
        results.failed.push({
          userId: userPassword.userId,
          error: error.message
        });
        console.error('KeycloakAdminService: ❌ Bulk reset failed for user:', userPassword.userId, error.message);
      }
    }
    
    console.log('KeycloakAdminService: Bulk admin password reset completed.');
    console.log('KeycloakAdminService: Successful resets:', results.success.length);
    console.log('KeycloakAdminService: Failed resets:', results.failed.length);
    
    return results;
  }

  // ADDITIONAL: Generate secure random password for admin use
  generateSecurePassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // ADDITIONAL: Admin reset with auto-generated secure password
  async resetUserPasswordWithGenerated(userId: string, temporary: boolean = true, passwordLength: number = 12): Promise<string> {
    const generatedPassword = this.generateSecurePassword(passwordLength);
    console.log('KeycloakAdminService: Generated secure password for admin reset of user:', userId);
    
    await this.resetUserPassword(userId, generatedPassword, temporary);
    
    return generatedPassword;
  }

  // ADDITIONAL: Reset multiple users with generated passwords
  async resetMultipleUsersWithGeneratedPasswords(
    userIds: string[],
    temporary: boolean = true,
    passwordLength: number = 12
  ): Promise<{success: Array<{userId: string, password: string}>, failed: Array<{userId: string, error: string}>}> {
    console.log('KeycloakAdminService: Starting bulk reset with generated passwords...');
    
    const results = {
      success: [] as Array<{userId: string, password: string}>,
      failed: [] as Array<{userId: string, error: string}>
    };
    
    for (const userId of userIds) {
      try {
        const generatedPassword = await this.resetUserPasswordWithGenerated(userId, temporary, passwordLength);
        results.success.push({ userId, password: generatedPassword });
        console.log('KeycloakAdminService: ✅ Generated password reset successful for user:', userId);
      } catch (error: any) {
        results.failed.push({
          userId,
          error: error.message
        });
        console.error('KeycloakAdminService: ❌ Generated password reset failed for user:', userId);
      }
    }
    
    console.log('KeycloakAdminService: Bulk generated password reset completed.');
    console.log('KeycloakAdminService: Successful resets:', results.success.length);
    console.log('KeycloakAdminService: Failed resets:', results.failed.length);
    
    return results;
  }

  // ADDITIONAL: Force password change on next login (admin action)
  async forcePasswordChangeOnLogin(userId: string): Promise<void> {
    console.log('KeycloakAdminService: Forcing password change on next login for user:', userId);
    
    try {
      // Verify user exists first
      const user = await this.makeRequest(`/users/${userId}`);
      console.log('KeycloakAdminService: ✅ User verified for forced password change:', user.username);
      
      await this.makeRequest(`/users/${userId}/execute-actions-email`, {
        method: 'PUT',
        body: JSON.stringify(['UPDATE_PASSWORD'])
      });
      
      console.log('KeycloakAdminService: ✅ Password change forced for user:', userId);
    } catch (error: any) {
      console.error('KeycloakAdminService: Failed to force password change:', error);
      
      if (error.message?.includes('404')) {
        throw new Error(`User with ID ${userId} does not exist`);
      } else if (error.message?.includes('403')) {
        throw new Error('Access denied. You do not have permission to force password changes.');
      } else {
        throw new Error(`Failed to force password change: ${error.message}`);
      }
    }
  }

  // ADDITIONAL: Check if user needs password update
  async checkUserPasswordStatus(userId: string): Promise<{needsPasswordUpdate: boolean, lastPasswordUpdate?: Date}> {
    console.log('KeycloakAdminService: Checking password status for user:', userId);
    
    try {
      const user = await this.makeRequest(`/users/${userId}`);
      
      // Check if user has required actions including UPDATE_PASSWORD
      const needsPasswordUpdate = user.requiredActions?.includes('UPDATE_PASSWORD') || false;
      
      // Get last password update from credentials (if available)
      let lastPasswordUpdate: Date | undefined;
      try {
        const credentials = await this.makeRequest(`/users/${userId}/credentials`);
        const passwordCredential = credentials.find((cred: any) => cred.type === 'password');
        if (passwordCredential && passwordCredential.createdDate) {
          lastPasswordUpdate = new Date(passwordCredential.createdDate);
        }
      } catch (credError) {
        console.warn('KeycloakAdminService: Could not fetch credential info:', credError);
      }
      
      console.log('KeycloakAdminService: Password status check completed for user:', userId);
      
      return {
        needsPasswordUpdate,
        lastPasswordUpdate
      };
    } catch (error: any) {
      console.error('KeycloakAdminService: Failed to check password status:', error);
      throw new Error(`Failed to check password status: ${error.message}`);
    }
  }

  // ADDITIONAL: Validate password complexity
  validatePasswordComplexity(password: string): {isValid: boolean, errors: string[], strength: 'weak' | 'medium' | 'strong'} {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Calculate strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLongEnough = password.length >= 12;
    
    const score = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar, isLongEnough].filter(Boolean).length;
    
    if (score >= 4) strength = 'strong';
    else if (score >= 2) strength = 'medium';
    
    return {
      isValid: errors.length === 0,
      errors,
      strength
    };
  }

  // --- ROLE MANAGEMENT ---

  async getRoles(): Promise<any[]> {
    console.log('KeycloakAdminService: Fetching roles...');
    return await this.makeRequest('/roles');
  }

  async getUserRoles(userId: string): Promise<any[]> {
    console.log('KeycloakAdminService: Fetching user roles for:', userId);
    return await this.makeRequest(`/users/${userId}/role-mappings/realm`);
  }

  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    console.log(`KeycloakAdminService: Assigning role ${roleName} to user ${userId}`);
    const roles = await this.getRoles();
    const role = roles.find((r: any) => r.name === roleName);
    
    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    await this.makeRequest(`/users/${userId}/role-mappings/realm`, {
      method: 'POST',
      body: JSON.stringify([role])
    });
  }

  async removeRoleFromUser(userId: string, roleName: string): Promise<void> {
    console.log(`KeycloakAdminService: Removing role ${roleName} from user ${userId}`);
    const roles = await this.getRoles();
    const role = roles.find((r: any) => r.name === roleName);
    
    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    await this.makeRequest(`/users/${userId}/role-mappings/realm`, {
      method: 'DELETE',
      body: JSON.stringify([role])
    });
  }
}

export const keycloakAdminService = new KeycloakAdminService();