import { UserRepository } from '../user.repository';
import { User, UserRole } from '../../models/user.model';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { testDb, TestDatabase } from '../../tests/utils/testDb';
import {
  createUser,
  createUsers,
  createSeedData,
} from '../../tests/utils/fixtures';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../utils/logger');

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeAll(async () => {
    await testDb.initialize();
  });

  beforeEach(async () => {
    repository = new UserRepository();
    await testDb.cleanup();
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // Act
      const result = await repository.createUser(userData);

      // Assert
      expect(result).toMatchObject({
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: UserRole.USER,
        isActive: true,
        isVerified: false,
      });
      expect(result.id).toBeDefined();
      expect(result.passwordHash).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      // Verify in database
      const userExists = await testDb.exists('users', 'id = $1', [result.id]);
      expect(userExists).toBe(true);
    });

    it('should hash password when creating user', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // Act
      const result = await repository.createUser(userData);

      // Assert
      expect(result.passwordHash).toBeDefined();
      expect(result.passwordHash).not.toBe(userData.password);
      expect(result.passwordHash?.startsWith('$2b$')).toBe(true);
    });

    it('should throw ConflictError for duplicate email', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      await repository.createUser(userData);

      const duplicateUserData = {
        ...userData,
        username: 'differentuser',
      };

      // Act & Assert
      await expect(repository.createUser(duplicateUserData)).rejects.toThrow(
        ConflictError
      );
    });

    it('should throw ConflictError for duplicate username', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      await repository.createUser(userData);

      const duplicateUserData = {
        ...userData,
        email: 'different@example.com',
      };

      // Act & Assert
      await expect(repository.createUser(duplicateUserData)).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe('findById', () => {
    it('should find user by id when exists', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      // Act
      const result = await repository.findById(testUser.id);

      // Assert
      expect(result).toMatchObject({
        id: testUser.id,
        username: testUser.username,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
      });
    });

    it('should return null when user not found', async () => {
      // Act
      const result = await repository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should exclude soft-deleted users by default', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      // Soft delete the user
      await testDb.query(
        'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
        [testUser.id]
      );

      // Act
      const result = await repository.findById(testUser.id);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByIdOrFail', () => {
    it('should find user by id when exists', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      // Act
      const result = await repository.findByIdOrFail(testUser.id);

      // Assert
      expect(result.id).toBe(testUser.id);
    });

    it('should throw NotFoundError when user not found', async () => {
      // Act & Assert
      await expect(
        repository.findByIdOrFail('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email when exists', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      // Act
      const result = await repository.findByEmail(testUser.email);

      // Assert
      expect(result?.email).toBe(testUser.email);
    });

    it('should return null when user not found', async () => {
      // Act
      const result = await repository.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });

    it('should be case insensitive', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      // Act
      const result = await repository.findByEmail(testUser.email.toUpperCase());

      // Assert
      expect(result?.email).toBe(testUser.email);
    });
  });

  describe('findByUsername', () => {
    it('should find user by username when exists', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      // Act
      const result = await repository.findByUsername(testUser.username);

      // Assert
      expect(result?.username).toBe(testUser.username);
    });

    it('should return null when user not found', async () => {
      // Act
      const result = await repository.findByUsername('nonexistentuser');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      // Act
      const result = await repository.updateUser(testUser.id, updateData);

      // Assert
      expect(result.firstName).toBe(updateData.firstName);
      expect(result.lastName).toBe(updateData.lastName);
      expect(result.updatedAt).not.toEqual(testUser.updatedAt);

      // Verify in database
      const updatedUser = await testDb.getRecord('users', 'id = $1', [
        testUser.id,
      ]);
      expect(updatedUser?.first_name).toBe(updateData.firstName);
      expect(updatedUser?.last_name).toBe(updateData.lastName);
    });

    it('should not update password directly', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      const updateData = {
        firstName: 'Updated',
        password: 'NewPassword123!', // This should be ignored
      };

      // Act
      const result = await repository.updateUser(testUser.id, updateData);

      // Assert
      expect(result.passwordHash).toBe(testUser.passwordHash);
    });
  });

  describe('findMany', () => {
    it('should return paginated results', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 15, includeAdmin: false });
      await testDb.seed(seedData);

      const options = {
        pagination: { page: 1, limit: 10 },
        sorting: { sort: 'createdAt', order: 'desc' as const },
        filters: {},
      };

      // Act
      const result = await repository.findMany(options);

      // Assert
      expect(result.data).toHaveLength(10);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2,
        hasNext: true,
        hasPrevious: false,
      });
    });

    it('should apply role filter', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 5, includeAdmin: true });
      await testDb.seed(seedData);

      const options = {
        pagination: { page: 1, limit: 10 },
        sorting: { sort: 'createdAt', order: 'desc' as const },
        filters: { role: UserRole.USER },
      };

      // Act
      const result = await repository.findMany(options);

      // Assert
      expect(result.data.every(user => user.role === UserRole.USER)).toBe(true);
      expect(result.data.length).toBe(5); // Exclude admin user
    });

    it('should apply search filter', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 5, includeAdmin: false });
      // Add a user with specific name
      seedData.users.push(
        createUser({
          id: 'search-user',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe',
          passwordHash: seedData.users[0].passwordHash,
        })
      );
      await testDb.seed(seedData);

      const options = {
        pagination: { page: 1, limit: 10 },
        sorting: { sort: 'createdAt', order: 'desc' as const },
        search: 'john',
        filters: {},
      };

      // Act
      const result = await repository.findMany(options);

      // Assert
      expect(result.data.length).toBeGreaterThan(0);
      expect(
        result.data.some(
          user =>
            user.firstName?.toLowerCase().includes('john') ||
            user.lastName?.toLowerCase().includes('john') ||
            user.email.toLowerCase().includes('john') ||
            user.username.toLowerCase().includes('john')
        )
      ).toBe(true);
    });
  });

  describe('updateLoginInfo', () => {
    it('should update login info for successful login', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      // Act
      await repository.updateLoginInfo(testUser.id, true);

      // Assert
      const updatedUser = await testDb.getRecord('users', 'id = $1', [
        testUser.id,
      ]);
      expect(updatedUser?.failed_login_attempts).toBe(0);
      expect(updatedUser?.last_login_at).toBeDefined();
      expect(updatedUser?.locked_until).toBeNull();
    });

    it('should increment failed attempts for failed login', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      // Act
      await repository.updateLoginInfo(testUser.id, false);

      // Assert
      const updatedUser = await testDb.getRecord('users', 'id = $1', [
        testUser.id,
      ]);
      expect(updatedUser?.failed_login_attempts).toBe(1);
      expect(updatedUser?.last_login_at).toBeNull();
    });

    it('should lock account after max failed attempts', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      // Set user to have 4 failed attempts (one less than lock threshold)
      seedData.users[0].failedLoginAttempts = 4;
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      // Act
      await repository.updateLoginInfo(testUser.id, false);

      // Assert
      const updatedUser = await testDb.getRecord('users', 'id = $1', [
        testUser.id,
      ]);
      expect(updatedUser?.failed_login_attempts).toBe(5);
      expect(updatedUser?.locked_until).not.toBeNull();
    });
  });

  describe('getUserStats', () => {
    it('should return correct user statistics', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 10, includeAdmin: true });
      // Modify some users for variety
      seedData.users[0].isActive = false;
      seedData.users[1].isVerified = false;
      seedData.users[2].lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      await testDb.seed(seedData);

      // Act
      const result = await repository.getUserStats();

      // Assert
      expect(result.total).toBe(11); // 10 users + 1 admin
      expect(result.active).toBe(10); // All except one inactive
      expect(result.verified).toBe(10); // All except one unverified
      expect(result.locked).toBe(1); // One locked user
      expect(result.byRole[UserRole.USER]).toBe(10);
      expect(result.byRole[UserRole.ADMIN]).toBe(1);
      expect(result.recentSignups).toBeGreaterThan(0);
    });
  });

  describe('softDelete', () => {
    it('should soft delete user', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      // Act
      await repository.softDelete(testUser.id);

      // Assert
      const deletedUser = await testDb.getRecord('users', 'id = $1', [
        testUser.id,
      ]);
      expect(deletedUser?.deleted_at).not.toBeNull();

      // Verify user is not found by normal queries
      const foundUser = await repository.findById(testUser.id);
      expect(foundUser).toBeNull();
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired password reset tokens', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      // Add expired token
      await testDb.query(
        `
        INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
        VALUES ($1, $2, $3, $4)
      `,
        [
          testUser.id,
          'expired-token',
          new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        ]
      );

      // Act
      await repository.cleanupExpiredTokens();

      // Assert
      const tokenExists = await testDb.exists(
        'password_reset_tokens',
        'token = $1',
        ['expired-token']
      );
      expect(tokenExists).toBe(false);
    });
  });

  describe('unlockExpiredAccounts', () => {
    it('should unlock expired locked accounts', async () => {
      // Arrange
      const seedData = createSeedData({ usersCount: 1, includeAdmin: false });
      seedData.users[0].lockedUntil = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      seedData.users[0].failedLoginAttempts = 5;
      await testDb.seed(seedData);
      const testUser = seedData.users[0];

      // Act
      await repository.unlockExpiredAccounts();

      // Assert
      const unlockedUser = await testDb.getRecord('users', 'id = $1', [
        testUser.id,
      ]);
      expect(unlockedUser?.locked_until).toBeNull();
      expect(unlockedUser?.failed_login_attempts).toBe(0);
    });
  });

  describe('transaction handling', () => {
    it('should rollback transaction on error', async () => {
      // This test verifies that database transactions are properly handled
      await testDb.withTransaction(async client => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPass123!',
          firstName: 'Test',
          lastName: 'User',
        };

        // Create user within transaction
        await repository.createUser(userData);

        // Verify user exists within transaction
        const userCount = await testDb.getCount('users', 'email = $1', [
          'test@example.com',
        ]);
        expect(userCount).toBe(1);

        // Transaction will be rolled back by withTransaction
      });

      // Verify user was rolled back
      const userCount = await testDb.getCount('users', 'email = $1', [
        'test@example.com',
      ]);
      expect(userCount).toBe(0);
    });
  });
});
