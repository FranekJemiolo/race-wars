/**
 * OAuth Service
 * 
 * Handles OAuth authentication with Google and Apple
 */

import { pool } from '../database';

export interface OAuthProfile {
  id: string;
  provider: 'google' | 'apple';
  providerId: string;
  email?: string;
  name?: string;
  picture?: string;
}

export interface OAuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  apple: {
    clientId: string;
    teamId: string;
    keyId: string;
    privateKey: string;
    redirectUri: string;
  };
}

export class OAuthService {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * Verify Google OAuth token
   */
  async verifyGoogleToken(idToken: string): Promise<OAuthProfile> {
    // In production, use Google's token verification API
    // For now, this is a simplified implementation
    
    try {
      // Decode JWT (simplified - in production use proper JWT verification)
      const payload = this.decodeJWT(idToken);
      
      return {
        id: `google_${payload.sub}`,
        provider: 'google',
        providerId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    } catch (error) {
      throw new Error('Invalid Google token');
    }
  }

  /**
   * Verify Apple OAuth token
   */
  async verifyAppleToken(idToken: string): Promise<OAuthProfile> {
    // In production, use Apple's token verification API
    // For now, this is a simplified implementation
    
    try {
      const payload = this.decodeJWT(idToken);
      
      return {
        id: `apple_${payload.sub}`,
        provider: 'apple',
        providerId: payload.sub,
        email: payload.email,
        name: payload.name ? JSON.parse(payload.name) : undefined,
      };
    } catch (error) {
      throw new Error('Invalid Apple token');
    }
  }

  /**
   * Find or create user from OAuth profile
   */
  async findOrCreateUser(profile: OAuthProfile): Promise<{ userId: string; isNewUser: boolean }> {
    // Check if user exists with this OAuth provider
    const result = await pool.query(
      `SELECT user_id FROM user_oauth_providers 
       WHERE provider = $1 AND provider_id = $2`,
      [profile.provider, profile.providerId]
    );

    if (result.rows.length > 0) {
      return { userId: result.rows[0].user_id, isNewUser: false };
    }

    // Create new user
    const userResult = await pool.query(
      `INSERT INTO users (id, email, name, created_at, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [
        `user_${Date.now()}_${profile.provider}`,
        profile.email || null,
        profile.name || null,
      ]
    );

    const userId = userResult.rows[0].id;

    // Link OAuth provider
    await pool.query(
      `INSERT INTO user_oauth_providers (id, user_id, provider, provider_id, email, name, picture)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `oauth_${Date.now()}_${userId}`,
        userId,
        profile.provider,
        profile.providerId,
        profile.email || null,
        profile.name || null,
        profile.picture || null,
      ]
    );

    return { userId, isNewUser: true };
  }

  /**
   * Link OAuth provider to existing user
   */
  async linkOAuthProvider(userId: string, profile: OAuthProfile): Promise<boolean> {
    try {
      await pool.query(
        `INSERT INTO user_oauth_providers (id, user_id, provider, provider_id, email, name, picture)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          `oauth_${Date.now()}_${userId}`,
          userId,
          profile.provider,
          profile.providerId,
          profile.email || null,
          profile.name || null,
          profile.picture || null,
        ]
      );

      return true;
    } catch (error) {
      console.error('Failed to link OAuth provider:', error);
      return false;
    }
  }

  /**
   * Unlink OAuth provider from user
   */
  async unlinkOAuthProvider(userId: string, provider: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM user_oauth_providers 
       WHERE user_id = $1 AND provider = $2`,
      [userId, provider]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Get user's linked OAuth providers
   */
  async getUserOAuthProviders(userId: string): Promise<OAuthProfile[]> {
    const result = await pool.query(
      `SELECT provider, provider_id, email, name, picture 
       FROM user_oauth_providers 
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows.map(row => ({
      id: `${row.provider}_${row.provider_id}`,
      provider: row.provider as 'google' | 'apple',
      providerId: row.provider_id,
      email: row.email,
      name: row.name,
      picture: row.picture,
    }));
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(provider: 'google' | 'apple', state: string): string {
    if (provider === 'google') {
      const params = new URLSearchParams({
        client_id: this.config.google.clientId,
        redirect_uri: this.config.google.redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    if (provider === 'apple') {
      const params = new URLSearchParams({
        client_id: this.config.apple.clientId,
        redirect_uri: this.config.apple.redirectUri,
        response_type: 'code',
        scope: 'openid email name',
        state,
        response_mode: 'form_post',
      });
      return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
    }

    throw new Error('Unsupported OAuth provider');
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(provider: 'google' | 'apple', code: string): Promise<{ idToken: string; accessToken?: string }> {
    if (provider === 'google') {
      // In production, call Google's token endpoint
      // For now, return mock data
      return {
        idToken: 'mock_id_token',
        accessToken: 'mock_access_token',
      };
    }

    if (provider === 'apple') {
      // In production, call Apple's token endpoint
      // For now, return mock data
      return {
        idToken: 'mock_id_token',
      };
    }

    throw new Error('Unsupported OAuth provider');
  }

  /**
   * Decode JWT (simplified - for production use proper JWT library)
   */
  private decodeJWT(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString();
    return JSON.parse(decoded);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OAuthConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): OAuthConfig {
    return { ...this.config };
  }
}

// Singleton instance
let oauthService: OAuthService | null = null;

export function getOAuthService(config?: OAuthConfig): OAuthService {
  if (!oauthService) {
    if (!config) {
      throw new Error('OAuth service requires configuration on first initialization');
    }
    oauthService = new OAuthService(config);
  }
  return oauthService;
}

export function resetOAuthService(): void {
  if (oauthService) {
    oauthService = null;
  }
}
