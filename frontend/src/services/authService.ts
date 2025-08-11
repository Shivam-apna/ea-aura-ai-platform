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
  async login(username: string, password: string): Promise<AuthTokens> {
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

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
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

  // Parse JWT token (basic implementation)
  private parseJwt(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', payload);
      return payload;
    } catch (e) {
      console.error('Failed to parse JWT token:', e);
      return {};
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export type { AuthTokens, UserInfo };