import { Router, Request, Response, NextFunction } from 'express';
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
  (req: Request, res: Response, next: NextFunction) => getAuthController().register(req, res, next)
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
  (req: Request, res: Response, next: NextFunction) => getAuthController().login(req, res, next)
);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(authValidators.refreshToken),
  (req: Request, res: Response, next: NextFunction) => getAuthController().refreshToken(req, res, next)
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
  (req: Request, res: Response, next: NextFunction) => getAuthController().logout(req, res, next)
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
  (req: Request, res: Response, next: NextFunction) => getAuthController().logoutAll(req, res, next)
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
  (req: Request, res: Response, next: NextFunction) => getAuthController().forgotPassword(req, res, next)
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
  (req: Request, res: Response, next: NextFunction) => getAuthController().resetPassword(req, res, next)
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
  (req: Request, res: Response, next: NextFunction) => getAuthController().changePassword(req, res, next)
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
  (req: Request, res: Response, next: NextFunction) => getAuthController().verifyEmail(req, res, next)
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
  (req: Request, res: Response, next: NextFunction) => getAuthController().resendEmailVerification(req, res, next)
);

/**
 * @route   GET /auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => getAuthController().profile(req, res, next)
);

/**
 * @route   POST /auth/validate
 * @desc    Validate token
 * @access  Public
 */
router.post(
  '/validate',
  validate(authValidators.validateToken),
  (req: Request, res: Response, next: NextFunction) => getAuthController().validateToken(req, res, next)
);

/**
 * @route   GET /auth/status
 * @desc    Get authentication status
 * @access  Public (with optional auth)
 */
router.get(
  '/status',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) => getAuthController().status(req, res, next)
);

/**
 * @route   GET /auth/check-email/:email
 * @desc    Check if email exists
 * @access  Public
 */
router.get(
  '/check-email/:email',
  validate(authValidators.checkEmail),
  (req: Request, res: Response, next: NextFunction) => getAuthController().checkEmail(req, res, next)
);

/**
 * @route   GET /auth/check-username/:username
 * @desc    Check if username exists
 * @access  Public
 */
router.get(
  '/check-username/:username',
  validate(authValidators.checkUsername),
  (req: Request, res: Response, next: NextFunction) => getAuthController().checkUsername(req, res, next)
);

/**
 * @route   GET /auth/password-requirements
 * @desc    Get password strength requirements
 * @access  Public
 */
router.get(
  '/password-requirements',
  (req: Request, res: Response, next: NextFunction) => getAuthController().passwordRequirements(req, res, next)
);

/**
 * @route   GET /auth/sessions
 * @desc    Get user sessions
 * @access  Private
 */
router.get(
  '/sessions',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => getAuthController().sessions(req, res, next)
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
  (req: Request, res: Response, next: NextFunction) => getAuthController().revokeSession(req, res, next)
);

export default router;