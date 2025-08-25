// Authentication Service for direct Keycloak API calls
import { config } from '@/config/environment';

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

class AuthService {
  private baseUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect`;
  private clientId = config.keycloakClientId;
  private clientSecret = ''; // For confidential client, if needed

  // Login with username and password
  async login(username: string, password: string): Promise<AuthTokens> { // Changed return type
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('client_id', this.clientId);
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${this.baseUrl}/token`, {
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
        // If we can't parse the error response, use the status text
        errorMessage = response.statusText || 'Login failed';
      }
      // No special handling for "Account is not fully set up" - it's now a regular login failure
      throw new Error(errorMessage);
    }

    const tokens: AuthTokens = await response.json();
    this.storeTokens(tokens);
    localStorage.setItem('last_activity_timestamp', Date.now().toString()); // Store login timestamp
    return tokens;
  }

  // Get user information
  async getUserInfo(): Promise<UserInfo> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/userinfo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If userinfo fails, try to extract user info from the token itself
        console.warn('Userinfo endpoint failed, extracting from token');
        const tokenData = this.parseJwt(token);
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
  }

  // Refresh access token
  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('client_id', this.clientId);
    formData.append('refresh_token', refreshToken);

    const response = await fetch(`${this.baseUrl}/token`, {
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
    return tokens;
  }

  // Logout
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      const formData = new URLSearchParams();
      formData.append('client_id', this.clientId);
      formData.append('refresh_token', refreshToken);

      try {
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
        });
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }

    localStorage.setItem('last_activity_timestamp', Date.now().toString()); // Store logout timestamp
    this.clearTokens();
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

  // Get access token (synchronous)
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Alias method for compatibility (same as getAccessToken)
  getToken(): string | null {
    return this.getAccessToken();
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Check if token needs refresh (expires within 5 minutes)
  shouldRefreshToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    const tokenData = this.parseJwt(token);
    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutesFromNow = currentTime + (5 * 60); // 5 minutes in seconds

    return tokenData.exp < fiveMinutesFromNow;
  }

  // Get token with automatic refresh if needed
  async getTokenWithRefresh(): Promise<string | null> {
    if (this.shouldRefreshToken()) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
      }
    }
    return this.getAccessToken();
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

  // Parse JWT token (robust Base64Url decoding)
  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      // Convert Base64Url to standard Base64
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if necessary
      while (base64.length % 4) {
        base64 += '=';
      }

      // Decode Base64 string to a binary string, then map to URL-encoded characters
      // and finally decode the URI component to get the original string.
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
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

  // Get user roles from token
  getUserRoles(): string[] {
    const token = this.getAccessToken();
    if (!token) return [];

    const tokenData = this.parseJwt(token);
    return tokenData.realm_access?.roles || [];
  }

  // Check if user has specific role
  hasRole(roleName: string): boolean {
    return this.getUserRoles().includes(roleName);
  }

  // Check if user has admin role
  isAdmin(): boolean {
    return this.hasRole('admin') || this.hasRole('realm-admin');
  }

  // Method to update password for the currently authenticated user (if needed for other flows)
  async updatePassword(newPassword: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available for password update. Please log in again.');
    }

    const userInfo = this.parseJwt(token);
    const userId = userInfo.sub;

    if (!userId) {
      throw new Error('Could not determine user ID from token.');
    }

    const response = await fetch(`${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}/reset-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'password',
        value: newPassword,
        temporary: false, // Always set to false for permanent password
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update password';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error_description || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    // Password updated successfully, clear old tokens and force re-login
    this.clearTokens();
  }
}

// Export singleton instance
export const authService = new AuthService();
export type { AuthTokens, UserInfo };