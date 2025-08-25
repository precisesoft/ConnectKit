import { UserService } from '../user.service';
import { UserRepository } from '../../repositories/user.repository';
import { User, UserRole } from '../../models/user.model';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../../utils/errors';
import {
  createMockUserRepository,
  createMockRedis,
} from '../../tests/utils/mocks';
import {
  createUser,
  createUsers,
  createAdminUser,
} from '../../tests/utils/fixtures';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../repositories/user.repository');
jest.mock('../../config/redis.config');
jest.mock('../../utils/logger');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockRedis: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances
    mockUserRepository =
      createMockUserRepository() as jest.Mocked<UserRepository>;
    mockRedis = createMockRedis();

    // Mock the constructor dependencies
    (
      UserRepository as jest.MockedClass<typeof UserRepository>
    ).mockImplementation(() => mockUserRepository);

    // Mock Redis connection
    jest.mock('../../config/redis.config', () => ({
      redisConnection: {
        getClient: () => mockRedis,
      },
    }));

    userService = new UserService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUserById', () => {
    it('should return user by id when found', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUser = createUser({ id: userId });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Mock cache miss
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `user:${userId}`,
        300,
        JSON.stringify(mockUser)
      );
    });

    it('should return cached user when available', async () => {
      // Arrange
      const userId = 'user-123';
      const cachedUser = createUser({ id: userId });
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedUser));

      // Act
      const result = await userService.getUserById(userId, { useCache: true });

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(cachedUser);
    });

    it('should throw NotFoundError when user not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockUserRepository.findById.mockResolvedValue(null);
      mockRedis.get.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById(userId)).rejects.toThrow(
        NotFoundError
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users list', async () => {
      // Arrange
      const users = createUsers(10);
      const paginationResult = {
        data: users.slice(0, 5),
        pagination: {
          page: 1,
          limit: 5,
          total: 10,
          totalPages: 2,
          hasNext: true,
          hasPrevious: false,
        },
      };

      mockUserRepository.findMany.mockResolvedValue(paginationResult);

      const request = {
        page: 1,
        limit: 5,
        sort: 'createdAt',
        order: 'desc' as const,
      };

      // Act
      const result = await userService.getUsers(request);

      // Assert
      expect(mockUserRepository.findMany).toHaveBeenCalledWith({
        pagination: { page: 1, limit: 5 },
        sorting: { sort: 'createdAt', order: 'desc' },
        filters: {},
      });
      expect(result).toEqual(paginationResult);
    });

    it('should apply search and filters', async () => {
      // Arrange
      const users = createUsers(5);
      const paginationResult = {
        data: users,
        pagination: {
          page: 1,
          limit: 10,
          total: 5,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      mockUserRepository.findMany.mockResolvedValue(paginationResult);

      const request = {
        search: 'john',
        filters: {
          role: UserRole.USER,
          isActive: true,
        },
      };

      // Act
      const result = await userService.getUsers(request);

      // Assert
      expect(mockUserRepository.findMany).toHaveBeenCalledWith({
        pagination: { page: 1, limit: 10 },
        sorting: { sort: 'createdAt', order: 'desc' },
        search: 'john',
        filters: {
          role: UserRole.USER,
          isActive: true,
        },
      });
      expect(result).toEqual(paginationResult);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const existingUser = createUser({ id: userId });
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };
      const updatedUser = { ...existingUser, ...updateData };

      mockUserRepository.findByIdOrFail.mockResolvedValue(existingUser);
      mockUserRepository.updateUser.mockResolvedValue(updatedUser);
      mockRedis.del.mockResolvedValue(1);

      // Act
      const result = await userService.updateUser(userId, updateData, userId);

      // Assert
      expect(mockUserRepository.findByIdOrFail).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        userId,
        updateData
      );
      expect(mockRedis.del).toHaveBeenCalledWith(`user:${userId}`);
      expect(result).toEqual(updatedUser);
    });

    it('should allow admin to update user role', async () => {
      // Arrange
      const userId = 'user-123';
      const adminId = 'admin-123';
      const existingUser = createUser({ id: userId });
      const adminUser = createAdminUser({ id: adminId });
      const updateData = {
        role: UserRole.ADMIN,
        isVerified: true,
      };
      const updatedUser = { ...existingUser, ...updateData };

      mockUserRepository.findByIdOrFail
        .mockResolvedValueOnce(existingUser) // Target user
        .mockResolvedValueOnce(adminUser); // Current user
      mockUserRepository.updateUser.mockResolvedValue(updatedUser);
      mockRedis.del.mockResolvedValue(1);

      // Act
      const result = await userService.updateUser(userId, updateData, adminId);

      // Assert
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        userId,
        updateData
      );
      expect(result).toEqual(updatedUser);
    });

    it('should prevent regular user from updating role', async () => {
      // Arrange
      const userId = 'user-123';
      const currentUserId = 'other-user-456';
      const existingUser = createUser({ id: userId });
      const currentUser = createUser({
        id: currentUserId,
        role: UserRole.USER,
      });
      const updateData = {
        role: UserRole.ADMIN,
      };

      mockUserRepository.findByIdOrFail
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(currentUser);

      // Act & Assert
      await expect(
        userService.updateUser(userId, updateData, currentUserId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent user from updating other users', async () => {
      // Arrange
      const userId = 'user-123';
      const currentUserId = 'other-user-456';
      const existingUser = createUser({ id: userId });
      const currentUser = createUser({
        id: currentUserId,
        role: UserRole.USER,
      });
      const updateData = {
        firstName: 'Hacker',
      };

      mockUserRepository.findByIdOrFail
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(currentUser);

      // Act & Assert
      await expect(
        userService.updateUser(userId, updateData, currentUserId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should validate email uniqueness', async () => {
      // Arrange
      const userId = 'user-123';
      const existingUser = createUser({ id: userId });
      const updateData = {
        email: 'existing@example.com',
      };
      const conflictingUser = createUser({
        id: 'other-user-456',
        email: 'existing@example.com',
      });

      mockUserRepository.findByIdOrFail.mockResolvedValue(existingUser);
      mockUserRepository.findByEmail.mockResolvedValue(conflictingUser);

      // Act & Assert
      await expect(
        userService.updateUser(userId, updateData, userId)
      ).rejects.toThrow(ConflictError);
    });

    it('should validate username uniqueness', async () => {
      // Arrange
      const userId = 'user-123';
      const existingUser = createUser({ id: userId });
      const updateData = {
        username: 'existinguser',
      };
      const conflictingUser = createUser({
        id: 'other-user-456',
        username: 'existinguser',
      });

      mockUserRepository.findByIdOrFail.mockResolvedValue(existingUser);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(conflictingUser);

      // Act & Assert
      await expect(
        userService.updateUser(userId, updateData, userId)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const adminId = 'admin-456';
      const existingUser = createUser({ id: userId });
      const adminUser = createAdminUser({ id: adminId });

      mockUserRepository.findByIdOrFail
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(adminUser);
      mockUserRepository.softDelete.mockResolvedValue(undefined);
      mockRedis.del.mockResolvedValue(1);

      // Act
      await userService.deleteUser(userId, adminId);

      // Assert
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(userId);
      expect(mockRedis.del).toHaveBeenCalledWith(`user:${userId}`);
    });

    it('should prevent non-admin from deleting users', async () => {
      // Arrange
      const userId = 'user-123';
      const currentUserId = 'other-user-456';
      const existingUser = createUser({ id: userId });
      const currentUser = createUser({
        id: currentUserId,
        role: UserRole.USER,
      });

      mockUserRepository.findByIdOrFail
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(currentUser);

      // Act & Assert
      await expect(
        userService.deleteUser(userId, currentUserId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent admin from deleting themselves', async () => {
      // Arrange
      const adminId = 'admin-123';
      const adminUser = createAdminUser({ id: adminId });

      mockUserRepository.findByIdOrFail
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(adminUser);

      // Act & Assert
      await expect(userService.deleteUser(adminId, adminId)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      // Arrange
      const mockStats = {
        total: 100,
        active: 85,
        verified: 80,
        locked: 5,
        byRole: {
          [UserRole.USER]: 90,
          [UserRole.ADMIN]: 8,
          [UserRole.MODERATOR]: 2,
        },
        recentSignups: 15,
      };

      mockUserRepository.getUserStats.mockResolvedValue(mockStats);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const result = await userService.getUserStats();

      // Assert
      expect(mockUserRepository.getUserStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'user_stats',
        300,
        JSON.stringify(mockStats)
      );
    });

    it('should return cached stats when available', async () => {
      // Arrange
      const cachedStats = {
        total: 100,
        active: 85,
        verified: 80,
        locked: 5,
        byRole: {
          [UserRole.USER]: 90,
          [UserRole.ADMIN]: 8,
          [UserRole.MODERATOR]: 2,
        },
        recentSignups: 15,
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedStats));

      // Act
      const result = await userService.getUserStats();

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith('user_stats');
      expect(mockUserRepository.getUserStats).not.toHaveBeenCalled();
      expect(result).toEqual(cachedStats);
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      // Arrange
      const query = 'john doe';
      const searchOptions = {
        fields: ['firstName', 'lastName', 'email'],
        limit: 10,
      };
      const searchResults = createUsers(5);

      mockUserRepository.searchUsers.mockResolvedValue(searchResults);

      // Act
      const result = await userService.searchUsers(query, searchOptions);

      // Assert
      expect(mockUserRepository.searchUsers).toHaveBeenCalledWith(
        query,
        searchOptions
      );
      expect(result).toEqual(searchResults);
    });

    it('should return empty array for empty query', async () => {
      // Act
      const result = await userService.searchUsers('');

      // Assert
      expect(result).toEqual([]);
      expect(mockUserRepository.searchUsers).not.toHaveBeenCalled();
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const adminId = 'admin-456';
      const inactiveUser = createUser({ id: userId, isActive: false });
      const adminUser = createAdminUser({ id: adminId });
      const activatedUser = { ...inactiveUser, isActive: true };

      mockUserRepository.findByIdOrFail
        .mockResolvedValueOnce(inactiveUser)
        .mockResolvedValueOnce(adminUser);
      mockUserRepository.updateUser.mockResolvedValue(activatedUser);
      mockRedis.del.mockResolvedValue(1);

      // Act
      const result = await userService.activateUser(userId, adminId);

      // Assert
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(userId, {
        isActive: true,
      });
      expect(result).toEqual(activatedUser);
    });

    it('should prevent non-admin from activating users', async () => {
      // Arrange
      const userId = 'user-123';
      const currentUserId = 'other-user-456';
      const inactiveUser = createUser({ id: userId, isActive: false });
      const currentUser = createUser({
        id: currentUserId,
        role: UserRole.USER,
      });

      mockUserRepository.findByIdOrFail
        .mockResolvedValueOnce(inactiveUser)
        .mockResolvedValueOnce(currentUser);

      // Act & Assert
      await expect(
        userService.activateUser(userId, currentUserId)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const adminId = 'admin-456';
      const activeUser = createUser({ id: userId, isActive: true });
      const adminUser = createAdminUser({ id: adminId });
      const deactivatedUser = { ...activeUser, isActive: false };

      mockUserRepository.findByIdOrFail
        .mockResolvedValueOnce(activeUser)
        .mockResolvedValueOnce(adminUser);
      mockUserRepository.updateUser.mockResolvedValue(deactivatedUser);
      mockRedis.del.mockResolvedValue(1);

      // Act
      const result = await userService.deactivateUser(userId, adminId);

      // Assert
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(userId, {
        isActive: false,
      });
      expect(result).toEqual(deactivatedUser);
    });

    it('should prevent admin from deactivating themselves', async () => {
      // Arrange
      const adminId = 'admin-123';
      const adminUser = createAdminUser({ id: adminId });

      mockUserRepository.findByIdOrFail
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(adminUser);

      // Act & Assert
      await expect(
        userService.deactivateUser(adminId, adminId)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('bulkUpdateUsers', () => {
    it('should bulk update users successfully', async () => {
      // Arrange
      const userIds = ['user-1', 'user-2', 'user-3'];
      const updates = { isActive: false };
      const adminId = 'admin-456';
      const adminUser = createAdminUser({ id: adminId });
      const updatedCount = 3;

      mockUserRepository.findByIdOrFail.mockResolvedValue(adminUser);
      mockUserRepository.bulkUpdate.mockResolvedValue(updatedCount);

      // Act
      const result = await userService.bulkUpdateUsers(
        userIds,
        updates,
        adminId
      );

      // Assert
      expect(mockUserRepository.bulkUpdate).toHaveBeenCalledWith(
        userIds,
        updates
      );
      expect(result).toEqual({
        updated: updatedCount,
        message: `Successfully updated ${updatedCount} users`,
      });
    });

    it('should prevent non-admin from bulk updating users', async () => {
      // Arrange
      const userIds = ['user-1', 'user-2'];
      const updates = { isActive: false };
      const userId = 'user-123';
      const regularUser = createUser({ id: userId, role: UserRole.USER });

      mockUserRepository.findByIdOrFail.mockResolvedValue(regularUser);

      // Act & Assert
      await expect(
        userService.bulkUpdateUsers(userIds, updates, userId)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      const userId = 'user-123';
      const dbError = new Error('Database connection failed');
      mockUserRepository.findById.mockRejectedValue(dbError);
      mockRedis.get.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById(userId)).rejects.toThrow(dbError);
    });

    it('should handle Redis errors gracefully and still return data', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUser = createUser({ id: userId });
      const redisError = new Error('Redis connection failed');

      mockRedis.get.mockRejectedValue(redisError);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRedis.setex.mockRejectedValue(redisError);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });
  });
});
