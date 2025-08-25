import {
  User,
  CreateUserDTO,
  UpdateUserDTO,
  UserRole,
} from '../models/user.model';
import {
  UserRepository,
  UserFilters,
  UserSearchOptions,
} from '../repositories/user.repository';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { redisConnection } from '../config/redis.config';
import { PaginationResult } from '../repositories/base.repository';
import { SUCCESS_MESSAGES, CACHE_KEYS } from '../utils/constants';

export interface UserServiceOptions {
  includeDeleted?: boolean;
  useCache?: boolean;
}

export interface UserUpdateRequest extends UpdateUserDTO {
  // Additional fields that can be updated by admin
  role?: UserRole;
  isVerified?: boolean;
}

export interface UserListRequest {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: UserFilters;
}

export interface UserStatsResponse {
  total: number;
  active: number;
  verified: number;
  locked: number;
  byRole: Record<UserRole, number>;
  recentSignups: number;
}

export class UserService {
  private userRepository: UserRepository;
  private redis: any;
  private cacheTimeout = 300; // 5 minutes

  constructor() {
    this.userRepository = new UserRepository();
    this.redis = redisConnection.getClient();
  }

  /**
   * Get user by ID
   */
  async getUserById(
    id: string,
    options: UserServiceOptions = {}
  ): Promise<User> {
    const { useCache = true } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = CACHE_KEYS.USER(id);
        const cachedUser = await this.redis.get(cacheKey);

        if (cachedUser) {
          logger.debug('User retrieved from cache', { userId: id });
          return JSON.parse(cachedUser);
        }
      }

      const user = await this.userRepository.findByIdOrFail(id);

      // Cache the result
      if (useCache) {
        const cacheKey = CACHE_KEYS.USER(id);
        await this.redis.setex(
          cacheKey,
          this.cacheTimeout,
          JSON.stringify(user.toJSON())
        );
      }

      return user;
    } catch (error) {
      logger.error('Error retrieving user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Get user profile (sanitized version for public access)
   */
  async getUserProfile(id: string): Promise<any> {
    const user = await this.getUserById(id);

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }

  /**
   * List users with pagination and filters
   */
  async listUsers(
    request: UserListRequest,
    requestingUser: { id: string; role: UserRole }
  ): Promise<PaginationResult<User>> {
    try {
      // Check permissions - only admins and managers can list users
      if (requestingUser.role === UserRole.USER) {
        throw new ForbiddenError('Insufficient permissions to list users');
      }

      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        search,
        filters = {},
      } = request;

      const offset = (page - 1) * limit;
      const searchOptions: UserSearchOptions = {
        limit,
        offset,
        sort,
        order: order.toUpperCase() as 'ASC' | 'DESC',
        filters,
      };

      let result: PaginationResult<User>;

      if (search) {
        result = await this.userRepository.searchUsers(search, searchOptions);
      } else {
        result = await this.userRepository.findAll(searchOptions);
      }

      // Sanitize user data
      const sanitizedItems = result.items.map(user => user.toJSON());

      return {
        ...result,
        items: sanitizedItems,
      };
    } catch (error) {
      logger.error('Error listing users', { error, request });
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    updates: UserUpdateRequest,
    requestingUser: { id: string; role: UserRole }
  ): Promise<User> {
    try {
      const user = await this.getUserById(id, { useCache: false });

      // Permission checks
      const canUpdate = this.canUpdateUser(user, requestingUser);
      if (!canUpdate.allowed) {
        throw new ForbiddenError(
          canUpdate.reason || 'Insufficient permissions'
        );
      }

      // Validate admin-only fields
      if (updates.role && requestingUser.role !== UserRole.ADMIN) {
        throw new ForbiddenError('Only admins can change user roles');
      }

      if (
        updates.isVerified !== undefined &&
        requestingUser.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenError('Only admins can change verification status');
      }

      // Update user
      const updatedUser = await this.userRepository.update(id, updates);

      // Clear cache
      await this.clearUserCache(id);

      logger.info('User updated', {
        userId: id,
        updatedBy: requestingUser.id,
        updates: Object.keys(updates),
      });

      return updatedUser;
    } catch (error) {
      logger.error('Error updating user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(
    id: string,
    requestingUser: { id: string; role: UserRole }
  ): Promise<void> {
    try {
      const user = await this.getUserById(id, { useCache: false });

      // Permission checks
      if (requestingUser.role !== UserRole.ADMIN && requestingUser.id !== id) {
        throw new ForbiddenError('Insufficient permissions to deactivate user');
      }

      // Prevent deactivating the last admin
      if (user.role === UserRole.ADMIN) {
        const adminCount = await this.userRepository.count({
          role: UserRole.ADMIN,
          is_active: true,
        });
        if (adminCount <= 1) {
          throw new ValidationError('Cannot deactivate the last active admin');
        }
      }

      await this.userRepository.update(id, { isActive: false });
      await this.clearUserCache(id);

      logger.info('User deactivated', {
        userId: id,
        deactivatedBy: requestingUser.id,
      });
    } catch (error) {
      logger.error('Error deactivating user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Activate user
   */
  async activateUser(
    id: string,
    requestingUser: { id: string; role: UserRole }
  ): Promise<void> {
    try {
      // Only admins can activate users
      if (requestingUser.role !== UserRole.ADMIN) {
        throw new ForbiddenError('Only admins can activate users');
      }

      await this.userRepository.update(id, { isActive: true });
      await this.clearUserCache(id);

      logger.info('User activated', {
        userId: id,
        activatedBy: requestingUser.id,
      });
    } catch (error) {
      logger.error('Error activating user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(
    id: string,
    requestingUser: { id: string; role: UserRole }
  ): Promise<void> {
    try {
      const user = await this.getUserById(id, { useCache: false });

      // Permission checks
      if (requestingUser.role !== UserRole.ADMIN && requestingUser.id !== id) {
        throw new ForbiddenError('Insufficient permissions to delete user');
      }

      // Prevent deleting the last admin
      if (user.role === UserRole.ADMIN) {
        const adminCount = await this.userRepository.count({
          role: UserRole.ADMIN,
        });
        if (adminCount <= 1) {
          throw new ValidationError('Cannot delete the last admin');
        }
      }

      await this.userRepository.softDelete(id);
      await this.clearUserCache(id);

      logger.info('User deleted', {
        userId: id,
        deletedBy: requestingUser.id,
      });
    } catch (error) {
      logger.error('Error deleting user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Restore deleted user
   */
  async restoreUser(
    id: string,
    requestingUser: { id: string; role: UserRole }
  ): Promise<User> {
    try {
      // Only admins can restore users
      if (requestingUser.role !== UserRole.ADMIN) {
        throw new ForbiddenError('Only admins can restore users');
      }

      const user = await this.userRepository.restore(id);
      await this.clearUserCache(id);

      logger.info('User restored', {
        userId: id,
        restoredBy: requestingUser.id,
      });

      return user;
    } catch (error) {
      logger.error('Error restoring user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Change user role
   */
  async changeUserRole(
    id: string,
    newRole: UserRole,
    requestingUser: { id: string; role: UserRole }
  ): Promise<User> {
    try {
      // Only admins can change roles
      if (requestingUser.role !== UserRole.ADMIN) {
        throw new ForbiddenError('Only admins can change user roles');
      }

      const user = await this.getUserById(id, { useCache: false });

      // Prevent changing the last admin's role
      if (user.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
        const adminCount = await this.userRepository.count({
          role: UserRole.ADMIN,
        });
        if (adminCount <= 1) {
          throw new ValidationError('Cannot change the role of the last admin');
        }
      }

      const updatedUser = await this.userRepository.update(id, {
        role: newRole,
      });
      await this.clearUserCache(id);

      logger.info('User role changed', {
        userId: id,
        oldRole: user.role,
        newRole,
        changedBy: requestingUser.id,
      });

      return updatedUser;
    } catch (error) {
      logger.error('Error changing user role', { error, userId: id });
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(requestingUser: {
    id: string;
    role: UserRole;
  }): Promise<UserStatsResponse> {
    try {
      // Only admins and managers can view stats
      if (requestingUser.role === UserRole.USER) {
        throw new ForbiddenError(
          'Insufficient permissions to view user statistics'
        );
      }

      const stats = await this.userRepository.getUserStats();

      return stats;
    } catch (error) {
      logger.error('Error retrieving user stats', { error });
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(
    searchTerm: string,
    options: UserSearchOptions = {},
    requestingUser: { id: string; role: UserRole }
  ): Promise<PaginationResult<User>> {
    try {
      // Check permissions
      if (requestingUser.role === UserRole.USER) {
        throw new ForbiddenError('Insufficient permissions to search users');
      }

      const result = await this.userRepository.searchUsers(searchTerm, options);

      // Sanitize results
      const sanitizedItems = result.items.map(user => user.toJSON());

      return {
        ...result,
        items: sanitizedItems,
      };
    } catch (error) {
      logger.error('Error searching users', { error, searchTerm });
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(
    role: UserRole,
    options: UserSearchOptions = {},
    requestingUser: { id: string; role: UserRole }
  ): Promise<PaginationResult<User>> {
    try {
      // Check permissions
      if (requestingUser.role === UserRole.USER) {
        throw new ForbiddenError(
          'Insufficient permissions to filter users by role'
        );
      }

      const result = await this.userRepository.findByRole(role, options);

      // Sanitize results
      const sanitizedItems = result.items.map(user => user.toJSON());

      return {
        ...result,
        items: sanitizedItems,
      };
    } catch (error) {
      logger.error('Error retrieving users by role', { error, role });
      throw error;
    }
  }

  /**
   * Unlock user account
   */
  async unlockUser(
    id: string,
    requestingUser: { id: string; role: UserRole }
  ): Promise<void> {
    try {
      // Only admins can unlock accounts
      if (requestingUser.role !== UserRole.ADMIN) {
        throw new ForbiddenError('Only admins can unlock user accounts');
      }

      await this.userRepository.update(id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
      } as any);

      await this.clearUserCache(id);

      logger.info('User account unlocked', {
        userId: id,
        unlockedBy: requestingUser.id,
      });
    } catch (error) {
      logger.error('Error unlocking user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Verify user email (admin action)
   */
  async verifyUserEmail(
    id: string,
    requestingUser: { id: string; role: UserRole }
  ): Promise<void> {
    try {
      // Only admins can manually verify emails
      if (requestingUser.role !== UserRole.ADMIN) {
        throw new ForbiddenError('Only admins can manually verify user emails');
      }

      await this.userRepository.update(id, {
        isVerified: true,
        verificationToken: null,
      } as any);

      await this.clearUserCache(id);

      logger.info('User email verified by admin', {
        userId: id,
        verifiedBy: requestingUser.id,
      });
    } catch (error) {
      logger.error('Error verifying user email', { error, userId: id });
      throw error;
    }
  }

  /**
   * Check if requesting user can update target user
   */
  private canUpdateUser(
    targetUser: User,
    requestingUser: { id: string; role: UserRole }
  ): { allowed: boolean; reason?: string } {
    // Users can update their own profile
    if (requestingUser.id === targetUser.id) {
      return { allowed: true };
    }

    // Admins can update anyone
    if (requestingUser.role === UserRole.ADMIN) {
      return { allowed: true };
    }

    // Managers can update regular users
    if (
      requestingUser.role === UserRole.MANAGER &&
      targetUser.role === UserRole.USER
    ) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Insufficient permissions to update this user',
    };
  }

  /**
   * Clear user cache
   */
  private async clearUserCache(userId: string): Promise<void> {
    try {
      const cacheKey = CACHE_KEYS.USER(userId);
      await this.redis.del(cacheKey);
    } catch (error) {
      logger.warn('Failed to clear user cache', { error, userId });
    }
  }

  /**
   * Bulk update users (admin only)
   */
  async bulkUpdateUsers(
    updates: Array<{ id: string; data: UserUpdateRequest }>,
    requestingUser: { id: string; role: UserRole }
  ): Promise<User[]> {
    try {
      // Only admins can perform bulk operations
      if (requestingUser.role !== UserRole.ADMIN) {
        throw new ForbiddenError('Only admins can perform bulk user updates');
      }

      const results = await this.userRepository.bulkUpdate(updates);

      // Clear cache for all updated users
      await Promise.all(updates.map(update => this.clearUserCache(update.id)));

      logger.info('Bulk user update completed', {
        updateCount: results.length,
        updatedBy: requestingUser.id,
      });

      return results;
    } catch (error) {
      logger.error('Error in bulk user update', { error });
      throw error;
    }
  }

  /**
   * Export users (admin only)
   */
  async exportUsers(
    filters: UserFilters = {},
    requestingUser: { id: string; role: UserRole }
  ): Promise<any[]> {
    try {
      // Only admins can export user data
      if (requestingUser.role !== UserRole.ADMIN) {
        throw new ForbiddenError('Only admins can export user data');
      }

      // Get all users without pagination
      const result = await this.userRepository.findAll({
        filters,
        limit: 10000, // Reasonable limit for export
      });

      // Sanitize export data (remove sensitive fields)
      const exportData = result.items.map(user => {
        const userData = user.toJSON();
        // Remove sensitive fields for export
        delete userData.passwordHash;
        delete userData.mfaSecret;
        delete userData.verificationToken;
        delete userData.resetPasswordToken;
        return userData;
      });

      logger.info('User export completed', {
        exportCount: exportData.length,
        exportedBy: requestingUser.id,
      });

      return exportData;
    } catch (error) {
      logger.error('Error exporting users', { error });
      throw error;
    }
  }
}
