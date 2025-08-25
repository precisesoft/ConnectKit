import {
  BaseRepository,
  QueryOptions,
  PaginationResult,
} from './base.repository';
import { User, CreateUserDTO, UserRole } from '../models/user.model';
import { ConflictError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  isVerified?: boolean;
  email?: string;
  username?: string;
}

export interface UserSearchOptions extends QueryOptions {
  filters?: UserFilters;
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users', 'id');
  }

  protected getAllowedSortFields(): string[] {
    return [
      'id',
      'email',
      'username',
      'first_name',
      'last_name',
      'role',
      'is_active',
      'is_verified',
      'created_at',
      'updated_at',
      'last_login_at',
    ];
  }

  protected mapRowToEntity(row: any): User {
    const userData: CreateUserDTO = {
      email: row.email,
      username: row.username,
      password: 'dummy', // This will be overridden by the constructor
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      role: row.role as UserRole,
    };

    const user = new User(userData, true); // Skip validation when mapping from DB

    // Override properties with database values
    user.id = row.id;
    user.passwordHash = row.password_hash;
    user.isActive = row.is_active;
    user.isVerified = row.is_verified;
    user.verificationToken = row.verification_token;
    user.resetPasswordToken = row.reset_password_token;
    user.resetPasswordExpires = row.reset_password_expires
      ? new Date(row.reset_password_expires)
      : null;
    user.mfaEnabled = row.mfa_enabled;
    user.mfaSecret = row.mfa_secret;
    user.failedLoginAttempts = row.failed_login_attempts;
    user.lockedUntil = row.locked_until ? new Date(row.locked_until) : null;
    user.lastLoginAt = row.last_login_at ? new Date(row.last_login_at) : null;
    user.createdAt = new Date(row.created_at);
    user.updatedAt = new Date(row.updated_at);
    user.deletedAt = row.deleted_at ? new Date(row.deleted_at) : null;

    return user;
  }

  protected mapEntityToRow(entity: User | Partial<User>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.email !== undefined) row.email = entity.email;
    if (entity.username !== undefined) row.username = entity.username;
    if (entity.passwordHash !== undefined)
      row.password_hash = entity.passwordHash;
    if (entity.role !== undefined) row.role = entity.role;
    if (entity.firstName !== undefined) row.first_name = entity.firstName;
    if (entity.lastName !== undefined) row.last_name = entity.lastName;
    if (entity.phone !== undefined) row.phone = entity.phone;
    if (entity.isActive !== undefined) row.is_active = entity.isActive;
    if (entity.isVerified !== undefined) row.is_verified = entity.isVerified;
    if (entity.verificationToken !== undefined)
      row.verification_token = entity.verificationToken;
    if (entity.resetPasswordToken !== undefined)
      row.reset_password_token = entity.resetPasswordToken;
    if (entity.resetPasswordExpires !== undefined)
      row.reset_password_expires = entity.resetPasswordExpires;
    if (entity.mfaEnabled !== undefined) row.mfa_enabled = entity.mfaEnabled;
    if (entity.mfaSecret !== undefined) row.mfa_secret = entity.mfaSecret;
    if (entity.failedLoginAttempts !== undefined)
      row.failed_login_attempts = entity.failedLoginAttempts;
    if (entity.lockedUntil !== undefined) row.locked_until = entity.lockedUntil;
    if (entity.lastLoginAt !== undefined)
      row.last_login_at = entity.lastLoginAt;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.deletedAt !== undefined) row.deleted_at = entity.deletedAt;

    return row;
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserDTO): Promise<User> {
    // Check for existing email
    const existingEmail = await this.findByEmail(userData.email);
    if (existingEmail) {
      throw new ConflictError(
        `User with email ${userData.email} already exists`
      );
    }

    // Check for existing username
    const existingUsername = await this.findByUsername(userData.username);
    if (existingUsername) {
      throw new ConflictError(
        `User with username ${userData.username} already exists`
      );
    }

    const user = new User(userData);
    await user.hashPassword();

    const createdUser = await this.create(user);

    logger.info('User created', {
      userId: createdUser.id,
      email: createdUser.email,
      username: createdUser.username,
      role: createdUser.role,
    });

    return createdUser;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return await this.findOne({ username: username.toLowerCase() });
  }

  /**
   * Find user by email or username
   */
  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    const lowerIdentifier = identifier.toLowerCase();

    const query = `
      SELECT * FROM ${this.tableName}
      WHERE (email = $1 OR username = $1) AND deleted_at IS NULL
      LIMIT 1
    `;

    const result = await this.executeQuery(query, [lowerIdentifier]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Find user by verification token
   */
  async findByVerificationToken(token: string): Promise<User | null> {
    return await this.findOne({ verification_token: token });
  }

  /**
   * Find user by password reset token
   */
  async findByPasswordResetToken(token: string): Promise<User | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE reset_password_token = $1 
        AND reset_password_expires > NOW() 
        AND deleted_at IS NULL
      LIMIT 1
    `;

    const result = await this.executeQuery(query, [token]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Update user login info
   */
  async updateLoginInfo(userId: string, success: boolean): Promise<void> {
    if (success) {
      const query = `
        UPDATE ${this.tableName}
        SET failed_login_attempts = 0,
            locked_until = NULL,
            last_login_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
      `;
      await this.executeQuery(query, [userId]);
    } else {
      const query = `
        UPDATE ${this.tableName}
        SET failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE 
              WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '30 minutes'
              ELSE locked_until
            END,
            updated_at = NOW()
        WHERE id = $1
      `;
      await this.executeQuery(query, [userId]);
    }
  }

  /**
   * Set verification token
   */
  async setVerificationToken(userId: string, token: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET verification_token = $2, updated_at = NOW()
      WHERE id = $1
    `;
    await this.executeQuery(query, [userId, token]);
  }

  /**
   * Verify user email
   */
  async verifyEmail(token: string): Promise<User> {
    const user = await this.findByVerificationToken(token);

    if (!user) {
      throw new NotFoundError('Invalid or expired verification token');
    }

    const query = `
      UPDATE ${this.tableName}
      SET is_verified = true,
          verification_token = NULL,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.executeQuery(query, [user.id]);

    logger.info('User email verified', {
      userId: user.id,
      email: user.email,
    });

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Set password reset token
   */
  async setPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET reset_password_token = $2,
          reset_password_expires = $3,
          updated_at = NOW()
      WHERE id = $1
    `;
    await this.executeQuery(query, [userId, token, expiresAt]);
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPasswordHash: string): Promise<User> {
    const user = await this.findByPasswordResetToken(token);

    if (!user) {
      throw new NotFoundError('Invalid or expired reset token');
    }

    const query = `
      UPDATE ${this.tableName}
      SET password_hash = $2,
          reset_password_token = NULL,
          reset_password_expires = NULL,
          failed_login_attempts = 0,
          locked_until = NULL,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.executeQuery(query, [user.id, newPasswordHash]);

    logger.info('User password reset', {
      userId: user.id,
      email: user.email,
    });

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Change password
   */
  async changePassword(userId: string, newPasswordHash: string): Promise<User> {
    const query = `
      UPDATE ${this.tableName}
      SET password_hash = $2, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.executeQuery(query, [userId, newPasswordHash]);

    if (result.rows.length === 0) {
      throw new NotFoundError(`User with id ${userId} not found`);
    }

    logger.info('User password changed', {
      userId,
    });

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Update MFA settings
   */
  async updateMfaSettings(
    userId: string,
    enabled: boolean,
    secret?: string
  ): Promise<User> {
    const query = `
      UPDATE ${this.tableName}
      SET mfa_enabled = $2,
          mfa_secret = $3,
          updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.executeQuery(query, [
      userId,
      enabled,
      secret || null,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundError(`User with id ${userId} not found`);
    }

    logger.info('User MFA settings updated', {
      userId,
      mfaEnabled: enabled,
    });

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Get users by role
   */
  async findByRole(
    role: UserRole,
    options: QueryOptions = {}
  ): Promise<PaginationResult<User>> {
    return await this.findAll({
      ...options,
      filters: { ...options.filters, role },
    });
  }

  /**
   * Get active users
   */
  async findActive(
    options: QueryOptions = {}
  ): Promise<PaginationResult<User>> {
    return await this.findAll({
      ...options,
      filters: { ...options.filters, is_active: true },
    });
  }

  /**
   * Get verified users
   */
  async findVerified(
    options: QueryOptions = {}
  ): Promise<PaginationResult<User>> {
    return await this.findAll({
      ...options,
      filters: { ...options.filters, is_verified: true },
    });
  }

  /**
   * Get locked users
   */
  async findLocked(
    options: QueryOptions = {}
  ): Promise<PaginationResult<User>> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE locked_until > NOW() AND deleted_at IS NULL
      ORDER BY locked_until DESC
      LIMIT $1 OFFSET $2
    `;

    const { limit = 10, offset = 0 } = options;
    const result = await this.executeQuery(query, [limit, offset]);

    const items = result.rows.map((row: any) => this.mapRowToEntity(row));

    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM ${this.tableName}
      WHERE locked_until > NOW() AND deleted_at IS NULL
    `;
    const countResult = await this.executeQuery(countQuery);
    const total = parseInt(countResult.rows[0].count, 10);

    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Search users
   */
  async searchUsers(
    searchTerm: string,
    options: UserSearchOptions = {}
  ): Promise<PaginationResult<User>> {
    const searchFields = ['first_name', 'last_name', 'email', 'username'];
    return await this.search(searchTerm, searchFields, options);
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    verified: number;
    locked: number;
    byRole: Record<UserRole, number>;
    recentSignups: number;
  }> {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_verified = true) as verified,
        COUNT(*) FILTER (WHERE locked_until > NOW()) as locked,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
        COUNT(*) FILTER (WHERE role = 'manager') as manager_count,
        COUNT(*) FILTER (WHERE role = 'user') as user_count,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_signups
      FROM ${this.tableName}
      WHERE deleted_at IS NULL
    `;

    const result = await this.executeQuery(statsQuery);
    const stats = result.rows[0];

    return {
      total: parseInt(stats.total, 10),
      active: parseInt(stats.active, 10),
      verified: parseInt(stats.verified, 10),
      locked: parseInt(stats.locked, 10),
      byRole: {
        [UserRole.ADMIN]: parseInt(stats.admin_count, 10),
        [UserRole.MANAGER]: parseInt(stats.manager_count, 10),
        [UserRole.USER]: parseInt(stats.user_count, 10),
      },
      recentSignups: parseInt(stats.recent_signups, 10),
    };
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const query = `
      UPDATE ${this.tableName}
      SET reset_password_token = NULL,
          reset_password_expires = NULL,
          updated_at = NOW()
      WHERE reset_password_expires < NOW()
        AND reset_password_token IS NOT NULL
    `;

    const result = await this.executeQuery(query);

    logger.info('Cleaned up expired password reset tokens', {
      count: result.rowCount,
    });

    return result.rowCount;
  }

  /**
   * Unlock expired user accounts
   */
  async unlockExpiredAccounts(): Promise<number> {
    const query = `
      UPDATE ${this.tableName}
      SET locked_until = NULL,
          failed_login_attempts = 0,
          updated_at = NOW()
      WHERE locked_until < NOW()
        AND locked_until IS NOT NULL
    `;

    const result = await this.executeQuery(query);

    logger.info('Unlocked expired user accounts', {
      count: result.rowCount,
    });

    return result.rowCount;
  }
}
