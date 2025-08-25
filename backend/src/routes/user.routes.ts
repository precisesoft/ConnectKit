import { Router } from 'express';
import { createUserController } from '../controllers/user.controller';

// Lazy controller getter
let userController: any = null;
const getUserController = () => {
  if (!userController) {
    userController = createUserController();
  }
  return userController;
};
import { userValidators } from '../validators/user.validator';
import { validate } from '../middleware/validation.middleware';
import {
  authenticate,
  authorize,
  adminOnly,
  managerOrAdmin,
} from '../middleware/auth.middleware';
import { auditLogger } from '../middleware/logger.middleware';
import { UserRole } from '../models/user.model';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /users/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me', (req, res, next) =>
  getUserController().getMyProfile(req, res, next)
);

/**
 * @route   PUT /users/me
 * @desc    Update current user's profile
 * @access  Private
 */
router.put(
  '/me',
  validate(userValidators.updateProfile),
  auditLogger('profile_update'),
  (req, res, next) => getUserController().updateMyProfile(req, res, next)
);

/**
 * @route   GET /users
 * @desc    List users with pagination and filters
 * @access  Private (Manager/Admin only)
 */
router.get(
  '/',
  managerOrAdmin,
  validate(userValidators.listUsers),
  (req, res, next) => getUserController().listUsers(req, res, next)
);

/**
 * @route   GET /users/search
 * @desc    Search users
 * @access  Private (Manager/Admin only)
 */
router.get(
  '/search',
  managerOrAdmin,
  validate(userValidators.searchUsers),
  (req, res, next) => getUserController().searchUsers(req, res, next)
);

/**
 * @route   GET /users/stats
 * @desc    Get user statistics
 * @access  Private (Manager/Admin only)
 */
router.get('/stats', managerOrAdmin, (req, res, next) =>
  getUserController().getUserStats(req, res, next)
);

/**
 * @route   GET /users/export
 * @desc    Export users
 * @access  Private (Admin only)
 */
router.get(
  '/export',
  adminOnly,
  validate(userValidators.exportUsers),
  auditLogger('user_export'),
  (req, res, next) => getUserController().exportUsers(req, res, next)
);

/**
 * @route   GET /users/role/:role
 * @desc    Get users by role
 * @access  Private (Manager/Admin only)
 */
router.get(
  '/role/:role',
  managerOrAdmin,
  validate(userValidators.getUsersByRole),
  (req, res, next) => getUserController().getUsersByRole(req, res, next)
);

/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Private (Manager/Admin only)
 */
router.get(
  '/:id',
  managerOrAdmin,
  validate(userValidators.userId),
  (req, res, next) => getUserController().getUserById(req, res, next)
);

/**
 * @route   GET /users/:id/profile
 * @desc    Get user profile (public version)
 * @access  Private (Manager/Admin only)
 */
router.get(
  '/:id/profile',
  managerOrAdmin,
  validate(userValidators.userId),
  (req, res, next) => getUserController().getUserProfile(req, res, next)
);

/**
 * @route   PUT /users/:id
 * @desc    Update user
 * @access  Private (Admin only for role changes, Manager+ for others)
 */
router.put(
  '/:id',
  // Dynamic permission check handled in controller
  validate([...userValidators.userId, ...userValidators.updateUser]),
  auditLogger('user_update'),
  (req, res, next) => getUserController().updateUser(req, res, next)
);

/**
 * @route   POST /users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (Admin only, or self)
 */
router.post(
  '/:id/deactivate',
  validate(userValidators.userId),
  auditLogger('user_deactivation'),
  (req, res, next) => getUserController().deactivateUser(req, res, next)
);

/**
 * @route   POST /users/:id/activate
 * @desc    Activate user
 * @access  Private (Admin only)
 */
router.post(
  '/:id/activate',
  adminOnly,
  validate(userValidators.userId),
  auditLogger('user_activation'),
  (req, res, next) => getUserController().activateUser(req, res, next)
);

/**
 * @route   DELETE /users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only, or self)
 */
router.delete(
  '/:id',
  validate(userValidators.userId),
  auditLogger('user_deletion'),
  (req, res, next) => getUserController().deleteUser(req, res, next)
);

/**
 * @route   POST /users/:id/restore
 * @desc    Restore deleted user
 * @access  Private (Admin only)
 */
router.post(
  '/:id/restore',
  adminOnly,
  validate(userValidators.userId),
  auditLogger('user_restoration'),
  (req, res, next) => getUserController().restoreUser(req, res, next)
);

/**
 * @route   PATCH /users/:id/role
 * @desc    Change user role
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/role',
  adminOnly,
  validate([...userValidators.userId, ...userValidators.changeRole]),
  auditLogger('user_role_change'),
  (req, res, next) => getUserController().changeUserRole(req, res, next)
);

/**
 * @route   POST /users/:id/unlock
 * @desc    Unlock user account
 * @access  Private (Admin only)
 */
router.post(
  '/:id/unlock',
  adminOnly,
  validate(userValidators.userId),
  auditLogger('user_unlock'),
  (req, res, next) => getUserController().unlockUser(req, res, next)
);

/**
 * @route   POST /users/:id/verify-email
 * @desc    Verify user email (admin action)
 * @access  Private (Admin only)
 */
router.post(
  '/:id/verify-email',
  adminOnly,
  validate(userValidators.userId),
  auditLogger('admin_email_verification'),
  (req, res, next) => getUserController().verifyUserEmail(req, res, next)
);

/**
 * @route   PATCH /users/bulk-update
 * @desc    Bulk update users
 * @access  Private (Admin only)
 */
router.patch(
  '/bulk-update',
  adminOnly,
  validate(userValidators.bulkUpdateUsers),
  auditLogger('bulk_user_update'),
  (req, res, next) => getUserController().bulkUpdateUsers(req, res, next)
);

export default router;
