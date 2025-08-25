// Authentication Service for FastAPI Keycloak proxy calls
import { config } from '@/config/environment';
import { getApiEndpoint } from '@/config/environment'; // Import getApiEndpoint

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface UserInfo {
  sub: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  // Add Keycloak specific claims from tokenParsed
  realm_access?: { roles: string[] };
  resource_access?: { [clientId: string]: { roles: string[] } };
  [key: string]: any; // Allow for other dynamic claims
}

interface LoginCredentials {
  username: string;
  password: string;
}

class AuthService {
  // Updated to use FastAPI proxy endpoints with getApiEndpoint
  private keycloakBaseUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect`;
  private clientId = config.keycloakClientId;

  // Login with username and password - using direct Keycloak call for authentication
  async login(username: string, password: string): Promise<AuthTokens> {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('client_id', this.clientId);
    formData.append('username', username);
    formData.append('password', password);

    try {
      // Still use direct Keycloak for login to get initial tokens
      const response = await fetch(`${this.keycloakBaseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error_description || errorData.error || 'Login failed';
        } catch (e) {
          errorMessage = response.statusText || 'Login failed';
        }
        throw new Error(errorMessage);
      }

      const tokens: AuthTokens = await response.json();
      this.storeTokens(tokens);
      localStorage.setItem('last_activity_timestamp', Date.now().toString());
      
      // Log successful authentication
      console.log('Authentication successful via Keycloak');
      
      return tokens;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Get user information using the FastAPI proxy endpoint with getApiEndpoint pattern
  async getUserInfo(): Promise<UserInfo> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    try {
      // Updated to use getApiEndpoint pattern
      const response = await fetch(getApiEndpoint("/v1/keycloak/userinfo"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If userinfo fails, try to extract user info from the token itself
        console.warn('Userinfo endpoint failed, extracting from token');
        const tokenData = this.parseJwt(token);
        return this.createUserInfoFromToken(tokenData);
      }

      const userInfoFromEndpoint: UserInfo = await response.json();
      // Merge with token claims in case userinfo endpoint doesn't return all
      const tokenData = this.parseJwt(token);
      
      return {
        ...tokenData, // Start with all token claims
        ...userInfoFromEndpoint, // Override with userinfo endpoint data
        // Ensure required fields are present
        sub: userInfoFromEndpoint.sub || tokenData.sub || 'unknown',
        email_verified: userInfoFromEndpoint.email_verified || tokenData.email_verified || false,
        name: userInfoFromEndpoint.name || tokenData.name || tokenData.preferred_username || 'Unknown User',
        preferred_username: userInfoFromEndpoint.preferred_username || tokenData.preferred_username || 'unknown',
        given_name: userInfoFromEndpoint.given_name || tokenData.given_name || '',
        family_name: userInfoFromEndpoint.family_name || tokenData.family_name || '',
        email: userInfoFromEndpoint.email || tokenData.email || 'unknown@example.com',
      };
    } catch (error) {
      console.warn('Userinfo request failed, extracting from token:', error);
      // Fallback to extracting user info from the token
      const tokenData = this.parseJwt(token);
      return this.createUserInfoFromToken(tokenData);
    }
  }

  // Test token validity using the FastAPI proxy endpoint with getApiEndpoint pattern
  async testToken(): Promise<{ valid: boolean; user?: UserInfo; message?: string }> {
    const token = this.getAccessToken();
    if (!token) {
      return { valid: false, message: 'No token available' };
    }

    try {
      // Updated to use getApiEndpoint pattern
      const response = await fetch(getApiEndpoint("/v1/test-token"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return { valid: false, message: `Token validation failed: ${response.status}` };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Token test failed:', error);
      return { valid: false, message: 'Token test request failed' };
    }
  }

  // Refresh access token - still using direct Keycloak call
  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('client_id', this.clientId);
    formData.append('refresh_token', refreshToken);

    try {
      // Use direct Keycloak for token refresh
      const response = await fetch(`${this.keycloakBaseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        this.clearTokens();
        throw new Error('Token refresh failed');
      }

      const tokens: AuthTokens = await response.json();
      this.storeTokens(tokens);
      
      console.log('Token refreshed successfully');
      return tokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      throw error;
    }
  }

  // Logout - still using direct Keycloak call
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      const formData = new URLSearchParams();
      formData.append('client_id', this.clientId);
      formData.append('refresh_token', refreshToken);

      try {
        // Use direct Keycloak for logout
        await fetch(`${this.keycloakBaseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
        });
        console.log('Logout successful');
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }

    localStorage.setItem('last_activity_timestamp', Date.now().toString());
    this.clearTokens();
  }

  // Health check endpoint using FastAPI proxy with getApiEndpoint pattern
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      // Updated to use getApiEndpoint pattern
      const response = await fetch(getApiEndpoint("/v1/health"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Debug config endpoint using FastAPI proxy with getApiEndpoint pattern
  async getDebugConfig(): Promise<any> {
    try {
      // Updated to use getApiEndpoint pattern
      const response = await fetch(getApiEndpoint("/v1/debug/config"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Debug config failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Debug config failed:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    // Check if token is expired
    const tokenData = this.parseJwt(token);
    const currentTime = Math.floor(Date.now() / 1000);
    
    return tokenData.exp > currentTime;
  }

  // Check if token needs refresh (expires in less than 5 minutes)
  needsRefresh(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    const tokenData = this.parseJwt(token);
    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutesFromNow = currentTime + (5 * 60); // 5 minutes in seconds
    
    return tokenData.exp <= fiveMinutesFromNow;
  }

  // Auto-refresh token if needed
  async ensureValidToken(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    if (this.needsRefresh()) {
      try {
        await this.refreshToken();
        return true;
      } catch (error) {
        console.error('Auto-refresh failed:', error);
        return false;
      }
    }

    return true;
  }

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Get user roles from token
  getUserRoles(): { realmRoles: string[]; clientRoles: { [clientId: string]: string[] } } {
    const token = this.getAccessToken();
    if (!token) {
      return { realmRoles: [], clientRoles: {} };
    }

    const tokenData = this.parseJwt(token);
    return {
      realmRoles: tokenData.realm_access?.roles || [],
      clientRoles: tokenData.resource_access || {}
    };
  }

  // Check if user has specific realm role
  hasRealmRole(roleName: string): boolean {
    const { realmRoles } = this.getUserRoles();
    return realmRoles.includes(roleName);
  }

  // Check if user has specific client role
  hasClientRole(clientId: string, roleName: string): boolean {
    const { clientRoles } = this.getUserRoles();
    return clientRoles[clientId]?.includes(roleName) || false;
  }

  // Store tokens in localStorage
  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('token_expires', (Date.now() + tokens.expires_in * 1000).toString());
  }

  // Clear all tokens
  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires');
  }

  // Create UserInfo from token data
  private createUserInfoFromToken(tokenData: any): UserInfo {
    return {
      sub: tokenData.sub || 'unknown',
      email_verified: tokenData.email_verified || false,
      name: tokenData.name || tokenData.preferred_username || 'Unknown User',
      preferred_username: tokenData.preferred_username || 'unknown',
      given_name: tokenData.given_name || '',
      family_name: tokenData.family_name || '',
      email: tokenData.email || 'unknown@example.com',
      realm_access: tokenData.realm_access,
      resource_access: tokenData.resource_access,
      ...tokenData // Include all other token claims
    };
  }

  // Parse JWT token (basic implementation)
  private parseJwt(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (e) {
      console.error('Failed to parse JWT token:', e);
      return {};
    }
  }

  // Get token expiration time
  getTokenExpiration(): Date | null {
    const token = this.getAccessToken();
    if (!token) return null;

    const tokenData = this.parseJwt(token);
    if (!tokenData.exp) return null;

    return new Date(tokenData.exp * 1000);
  }

  // Get time until token expires (in minutes)
  getTokenTimeRemaining(): number | null {
    const expiration = this.getTokenExpiration();
    if (!expiration) return null;

    const now = new Date();
    const diffMs = expiration.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
  }
}

// Export singleton instance
export const authService = new AuthService();
export type { AuthTokens, UserInfo, LoginCredentials };
