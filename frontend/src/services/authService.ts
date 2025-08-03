// Authentication Service for direct Keycloak API calls
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
}

class AuthService {
  private baseUrl = 'https://staging.ea-aura.ai/auth/realms/ea_aura/protocol/openid-connect';
  private clientId = 'ea_aura';
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
      const errorData = await response.json();
      throw new Error(errorData.error_description || 'Login failed');
    }

    const tokens: AuthTokens = await response.json();
    this.storeTokens(tokens);
    return tokens;
  }

  // Get user information
  async getUserInfo(): Promise<UserInfo> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${this.baseUrl}/userinfo`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
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
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return {};
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export type { AuthTokens, UserInfo }; 