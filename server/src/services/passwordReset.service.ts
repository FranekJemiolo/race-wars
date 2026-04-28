/**
 * Password Reset Service
 * 
 * Handles password reset functionality including:
 * - Generating reset tokens
 * - Sending reset emails
 * - Validating reset tokens
 * - Resetting passwords
 */

import { pool } from '../database';
import crypto from 'crypto';

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface PasswordResetConfig {
  tokenExpirationMinutes: number;
  tokenLength: number;
  fromEmail: string;
  fromName: string;
}

const DEFAULT_CONFIG: PasswordResetConfig = {
  tokenExpirationMinutes: 60,
  tokenLength: 32,
  fromEmail: 'noreply@racewars.com',
  fromName: 'Race Wars',
};

export class PasswordResetService {
  private config: PasswordResetConfig;

  constructor(config?: Partial<PasswordResetConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a password reset token for a user
   */
  async generateResetToken(userId: string): Promise<PasswordResetToken> {
    // Delete any existing unused tokens for this user
    await pool.query(
      `DELETE FROM password_reset_tokens 
       WHERE user_id = $1 AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
      [userId]
    );

    // Generate new token
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + this.config.tokenExpirationMinutes * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [`reset_${Date.now()}_${userId}`, userId, token, expiresAt]
    );

    const resetToken = this.mapRowToPasswordResetToken(result.rows[0]);

    // Send reset email
    await this.sendResetEmail(userId, token);

    return resetToken;
  }

  /**
   * Validate a reset token
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    const result = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE token = $1 AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
      [token]
    );

    if (result.rows.length === 0) {
      return { valid: false };
    }

    return { valid: true, userId: result.rows[0].user_id };
  }

  /**
   * Reset password using a valid token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // Validate token
    const validation = await this.validateResetToken(token);
    if (!validation.valid || !validation.userId) {
      return false;
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update user password
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [hashedPassword, validation.userId]
    );

    // Mark token as used
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = $1`,
      [token]
    );

    return true;
  }

  /**
   * Send password reset email
   */
  private async sendResetEmail(userId: string, token: string): Promise<void> {
    // Get user email
    const userResult = await pool.query(
      `SELECT email, name FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].email) {
      throw new Error('User not found or no email address');
    }

    const user = userResult.rows[0];
    const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    // In production, use a real email service like SendGrid, AWS SES, etc.
    // For now, just log the email
    console.log('Password Reset Email:', {
      to: user.email,
      subject: 'Reset Your Password',
      body: `
        Hello ${user.name || 'User'},
        
        You requested a password reset for your Race Wars account.
        
        Click the link below to reset your password:
        ${resetLink}
        
        This link will expire in ${this.config.tokenExpirationMinutes} minutes.
        
        If you did not request this password reset, please ignore this email.
        
        Best regards,
        The Race Wars Team
      `,
    });
  }

  /**
   * Generate a secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(this.config.tokenLength).toString('hex');
  }

  /**
   * Hash a password (simplified - use bcrypt in production)
   */
  private async hashPassword(password: string): Promise<string> {
    // In production, use bcrypt or argon2
    // For now, use a simple hash
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await pool.query(
      `DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP`
    );

    return result.rowCount || 0;
  }

  /**
   * Get user's reset token history
   */
  async getUserResetHistory(userId: string, limit = 10): Promise<PasswordResetToken[]> {
    const result = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => this.mapRowToPasswordResetToken(row));
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PasswordResetConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): PasswordResetConfig {
    return { ...this.config };
  }

  private mapRowToPasswordResetToken(row: any): PasswordResetToken {
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      createdAt: row.created_at,
    };
  }
}

// Singleton instance
let passwordResetService: PasswordResetService | null = null;

export function getPasswordResetService(config?: Partial<PasswordResetConfig>): PasswordResetService {
  if (!passwordResetService) {
    passwordResetService = new PasswordResetService(config);
  }
  return passwordResetService;
}

export function resetPasswordResetService(): void {
  if (passwordResetService) {
    passwordResetService = null;
  }
}
