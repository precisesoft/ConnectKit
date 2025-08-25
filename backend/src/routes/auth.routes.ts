import { Router } from 'express';
import { createAuthController } from '../controllers/auth.controller';

// Lazy controller getter
let authController: any = null;
const getAuthController = () => {
  if (!authController) {
    authController = createAuthController();
  }
  return authController;
};
import { authValidators } from '../validators/auth.validator';
import { validate } from '../middleware/validation.middleware';
import {
  authenticate,
  optionalAuthenticate,
} from '../middleware/auth.middleware';
import {
  authRateLimit,
  passwordResetRateLimit,
  emailVerificationRateLimit,
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
  (req, res, next) => getAuthController().register(req, res, next)
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
  (req, res, next) => getAuthController().login(req, res, next)
);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(authValidators.refreshToken),
  (req, res, next) => getAuthController().refreshToken(req, res, next)
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
  (req, res, next) => getAuthController().logout(req, res, next)
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
  (req, res, next) => getAuthController().logoutAll(req, res, next)
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
  (req, res, next) => getAuthController().forgotPassword(req, res, next)
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
  (req, res, next) => getAuthController().resetPassword(req, res, next)
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
  (req, res, next) => getAuthController().changePassword(req, res, next)
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
  (req, res, next) => getAuthController().verifyEmail(req, res, next)
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
  (req, res, next) =>
    getAuthController().resendEmailVerification(req, res, next)
);

/**
 * @route   GET /auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, (req, res, next) =>
  getAuthController().profile(req, res, next)
);

/**
 * @route   POST /auth/validate
 * @desc    Validate token
 * @access  Public
 */
router.post(
  '/validate',
  validate(authValidators.validateToken),
  (req, res, next) => getAuthController().validateToken(req, res, next)
);

/**
 * @route   GET /auth/status
 * @desc    Get authentication status
 * @access  Public (with optional auth)
 */
router.get('/status', optionalAuthenticate, (req, res, next) =>
  getAuthController().status(req, res, next)
);

/**
 * @route   GET /auth/check-email/:email
 * @desc    Check if email exists
 * @access  Public
 */
router.get(
  '/check-email/:email',
  validate(authValidators.checkEmail),
  (req, res, next) => getAuthController().checkEmail(req, res, next)
);

/**
 * @route   GET /auth/check-username/:username
 * @desc    Check if username exists
 * @access  Public
 */
router.get(
  '/check-username/:username',
  validate(authValidators.checkUsername),
  (req, res, next) => getAuthController().checkUsername(req, res, next)
);

/**
 * @route   GET /auth/password-requirements
 * @desc    Get password strength requirements
 * @access  Public
 */
router.get('/password-requirements', (req, res, next) =>
  getAuthController().passwordRequirements(req, res, next)
);

/**
 * @route   GET /auth/sessions
 * @desc    Get user sessions
 * @access  Private
 */
router.get('/sessions', authenticate, (req, res, next) =>
  getAuthController().sessions(req, res, next)
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
  (req, res, next) => getAuthController().revokeSession(req, res, next)
);

export default router;
