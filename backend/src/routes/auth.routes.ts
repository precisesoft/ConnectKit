import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authValidators } from '../validators/auth.validator';
import { validate } from '../middleware/validation.middleware';
import { 
  authenticate, 
  optionalAuthenticate 
} from '../middleware/auth.middleware';
import { 
  authRateLimit, 
  passwordResetRateLimit, 
  emailVerificationRateLimit 
} from '../middleware/rateLimiter.middleware';
import { auditLogger } from '../middleware/logger.middleware';

const router = Router();

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimit,
  validate(authValidators.register),
  auditLogger('user_registration'),
  authController.register
);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authRateLimit,
  validate(authValidators.login),
  auditLogger('user_login'),
  authController.login
);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(authValidators.refreshToken),
  authController.refreshToken
);

/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  validate(authValidators.logout),
  auditLogger('user_logout'),
  authController.logout
);

/**
 * @route   POST /auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post(
  '/logout-all',
  authenticate,
  auditLogger('user_logout_all'),
  authController.logoutAll
);

/**
 * @route   POST /auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetRateLimit,
  validate(authValidators.forgotPassword),
  auditLogger('password_reset_request'),
  authController.forgotPassword
);

/**
 * @route   POST /auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post(
  '/reset-password',
  validate(authValidators.resetPassword),
  auditLogger('password_reset'),
  authController.resetPassword
);

/**
 * @route   POST /auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validate(authValidators.changePassword),
  auditLogger('password_change'),
  authController.changePassword
);

/**
 * @route   POST /auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post(
  '/verify-email',
  validate(authValidators.verifyEmail),
  auditLogger('email_verification'),
  authController.verifyEmail
);

/**
 * @route   POST /auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post(
  '/resend-verification',
  emailVerificationRateLimit,
  validate(authValidators.resendEmailVerification),
  authController.resendEmailVerification
);

/**
 * @route   GET /auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  authController.profile
);

/**
 * @route   POST /auth/validate
 * @desc    Validate token
 * @access  Public
 */
router.post(
  '/validate',
  validate(authValidators.validateToken),
  authController.validateToken
);

/**
 * @route   GET /auth/status
 * @desc    Get authentication status
 * @access  Public (with optional auth)
 */
router.get(
  '/status',
  optionalAuthenticate,
  authController.status
);

/**
 * @route   GET /auth/check-email/:email
 * @desc    Check if email exists
 * @access  Public
 */
router.get(
  '/check-email/:email',
  validate(authValidators.checkEmail),
  authController.checkEmail
);

/**
 * @route   GET /auth/check-username/:username
 * @desc    Check if username exists
 * @access  Public
 */
router.get(
  '/check-username/:username',
  validate(authValidators.checkUsername),
  authController.checkUsername
);

/**
 * @route   GET /auth/password-requirements
 * @desc    Get password strength requirements
 * @access  Public
 */
router.get(
  '/password-requirements',
  authController.passwordRequirements
);

/**
 * @route   GET /auth/sessions
 * @desc    Get user sessions
 * @access  Private
 */
router.get(
  '/sessions',
  authenticate,
  authController.sessions
);

/**
 * @route   DELETE /auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete(
  '/sessions/:sessionId',
  authenticate,
  validate(authValidators.revokeSession),
  auditLogger('session_revocation'),
  authController.revokeSession
);

export default router;