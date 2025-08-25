import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserController, userController } from '../user.controller';
import { UserService } from '../../services/user.service';
import { UserRole } from '../../models/user.model';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../utils/errors';
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockUserService,
} from '../../tests/utils/mocks';
import {
  createUser,
  createUsers,
  createAdminUser,
} from '../../tests/utils/fixtures';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../services/user.service');
jest.mock('../../utils/logger');

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockRequest: Request;
  let mockResponse: Response;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserService = createMockUserService() as jest.Mocked<UserService>;
    mockRequest = createMockRequest() as Request;
    mockResponse = createMockResponse() as Response;

    (UserService as jest.MockedClass<typeof UserService>).mockImplementation(
      () => mockUserService
    );
    controller = new UserController();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUserById', () => {
    it('should return user by id successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUser = createUser({ id: userId });

      mockRequest.params = { id: userId };
      (mockRequest as any).user = mockUser;
      mockUserService.getUserById.mockResolvedValue(mockUser);

      // Act
      await controller.getUserById(mockRequest, mockResponse);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith(userId, {
        useCache: true,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { user: mockUser },
      });
    });

    it('should handle user not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      const error = new NotFoundError('User not found');

      mockRequest.params = { id: userId };
      (mockRequest as any).user = createUser();
      mockUserService.getUserById.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.getUserById(mockRequest, mockResponse)
      ).rejects.toThrow(error);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users list', async () => {
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

      const adminUser = createAdminUser();
      mockRequest.query = { page: '1', limit: '10' };
      (mockRequest as any).user = adminUser;
      mockUserService.getUsers.mockResolvedValue(paginationResult);

      // Act
      await controller.getUsers(mockRequest, mockResponse);

      // Assert
      expect(mockUserService.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: paginationResult,
      });
    });

    it('should prevent non-admin from listing users', async () => {
      // Arrange
      const regularUser = createUser({ role: UserRole.USER });
      mockRequest.query = {};
      (mockRequest as any).user = regularUser;

      // Act & Assert
      await expect(
        controller.getUsers(mockRequest, mockResponse)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const mockUser = createUser({ id: userId });
      const updatedUser = { ...mockUser, ...updateData };

      mockRequest.params = { id: userId };
      mockRequest.body = updateData;
      (mockRequest as any).user = mockUser;
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      // Act
      await controller.updateUser(mockRequest, mockResponse);

      // Assert
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        userId,
        updateData,
        mockUser.id
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser },
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const adminUser = createAdminUser();

      mockRequest.params = { id: userId };
      (mockRequest as any).user = adminUser;
      mockUserService.deleteUser.mockResolvedValue(undefined);

      // Act
      await controller.deleteUser(mockRequest, mockResponse);

      // Assert
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(
        userId,
        adminUser.id
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully',
      });
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

      const adminUser = createAdminUser();
      (mockRequest as any).user = adminUser;
      mockUserService.getUserStats.mockResolvedValue(mockStats);

      // Act
      await controller.getUserStats(mockRequest, mockResponse);

      // Assert
      expect(mockUserService.getUserStats).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { stats: mockStats },
      });
    });
  });
});
