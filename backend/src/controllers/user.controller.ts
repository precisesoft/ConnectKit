import { Request, Response } from 'express';
import '../types/express'; // Import extended types
import { StatusCodes } from 'http-status-codes';
import { UserService, UserListRequest, UserUpdateRequest } from '../services/user.service';
import { UserRole } from '../models/user.model';
import { ValidationError } from '../utils/errors';
// import { logger } from '../utils/logger';  // Remove unused import
import { asyncHandler } from '../middleware/error.middleware';
import { SUCCESS_MESSAGES } from '../utils/constants';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get user by ID
   */
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const user = await this.userService.getUserById(id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: { user: user.toJSON() },
    });
  });

  /**
   * Get user profile (public version)
   */
  getUserProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const profile = await this.userService.getUserProfile(id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: { profile },
    });
  });

  /**
   * Get current user's profile
   */
  getMyProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }
    const user = await this.userService.getUserById(currentUser.id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: { user: user.toJSON() },
    });
  });

  /**
   * List users with pagination and filters
   */
  listUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }
    const request: UserListRequest = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort: req.query.sort as string,
      order: req.query.order as 'asc' | 'desc',
      search: req.query.search as string,
      filters: {
        role: req.query.role as UserRole,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        isVerified: req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined,
      },
    };

    const result = await this.userService.listUsers(request, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  });

  /**
   * Update user
   */
  updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }
    const updates: UserUpdateRequest = req.body;

    const updatedUser = await this.userService.updateUser(id, updates, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_UPDATED,
      data: { user: updatedUser.toJSON() },
    });
  });

  /**
   * Update current user's profile
   */
  updateMyProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }
    const updates: UserUpdateRequest = req.body;
    
    // Users can only update certain fields on their own profile
    const allowedUpdates = {
      firstName: updates.firstName,
      lastName: updates.lastName,
      phone: updates.phone,
    };

    const updatedUser = await this.userService.updateUser(currentUser.id, allowedUpdates, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_UPDATED,
      data: { user: updatedUser.toJSON() },
    });
  });

  /**
   * Deactivate user
   */
  deactivateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }

    await this.userService.deactivateUser(id, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User deactivated successfully',
    });
  });

  /**
   * Activate user
   */
  activateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }

    await this.userService.activateUser(id, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User activated successfully',
    });
  });

  /**
   * Delete user
   */
  deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }

    await this.userService.deleteUser(id, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_DELETED,
    });
  });

  /**
   * Restore deleted user
   */
  restoreUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }

    const restoredUser = await this.userService.restoreUser(id, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User restored successfully',
      data: { user: restoredUser.toJSON() },
    });
  });

  /**
   * Change user role
   */
  changeUserRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { role } = req.body;
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }

    if (!role || !Object.values(UserRole).includes(role)) {
      throw new ValidationError('Valid role is required');
    }

    const updatedUser = await this.userService.changeUserRole(id, role, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User role changed successfully',
      data: { user: updatedUser.toJSON() },
    });
  });

  /**
   * Get user statistics
   */
  getUserStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }
    const stats = await this.userService.getUserStats(currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: { stats },
    });
  });

  /**
   * Search users
   */
  searchUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }
    const { search } = req.query;
    
    if (!search) {
      throw new ValidationError('Search term is required');
    }

    const options = {
      limit: parseInt(req.query.limit as string) || 10,
      offset: ((parseInt(req.query.page as string) || 1) - 1) * (parseInt(req.query.limit as string) || 10),
    };

    const result = await this.userService.searchUsers(search as string, options, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get users by role
   */
  getUsersByRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }
    const { role } = req.params;

    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new ValidationError('Invalid role');
    }

    const options = {
      limit: parseInt(req.query.limit as string) || 10,
      offset: ((parseInt(req.query.page as string) || 1) - 1) * (parseInt(req.query.limit as string) || 10),
    };

    const result = await this.userService.getUsersByRole(role as UserRole, options, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  });

  /**
   * Unlock user account
   */
  unlockUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }

    await this.userService.unlockUser(id, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User account unlocked successfully',
    });
  });

  /**
   * Verify user email (admin action)
   */
  verifyUserEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }

    await this.userService.verifyUserEmail(id, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User email verified successfully',
    });
  });

  /**
   * Bulk update users
   */
  bulkUpdateUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new ValidationError('Updates array is required');
    }

    const results = await this.userService.bulkUpdateUsers(updates, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: `${results.length} users updated successfully`,
      data: { users: results.map(user => user.toJSON()) },
    });
  });

  /**
   * Export users
   */
  exportUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = req.user;
    if (!currentUser?.id) {
      throw new ValidationError('User authentication required');
    }
    const filters = {
      role: req.query.role as UserRole,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      isVerified: req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined,
    };

    const exportData = await this.userService.exportUsers(filters, currentUser);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: { users: exportData },
    });
  });
}

// Factory function for lazy instantiation
export const createUserController = (): UserController => {
  return new UserController();
};