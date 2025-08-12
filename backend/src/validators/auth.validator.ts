import { body, param } from 'express-validator';
import { commonValidations } from '../middleware/validation.middleware';

export const authValidators = {
  // Registration validation
  register: [
    commonValidations.email('email'),
    commonValidations.username('username'),
    commonValidations.password('password'),
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.phone('phone', true),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'user'])
      .withMessage('Role must be one of: admin, manager, user'),
  ],

  // Login validation
  login: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 1 })
      .withMessage('Password cannot be empty'),
  ],

  // Refresh token validation
  refreshToken: [
    body('refreshToken')
      .optional()
      .isString()
      .withMessage('Refresh token must be a string'),
  ],

  // Logout validation
  logout: [
    body('refreshToken')
      .optional()
      .isString()
      .withMessage('Refresh token must be a string'),
  ],

  // Forgot password validation
  forgotPassword: [
    commonValidations.email('email'),
  ],

  // Reset password validation
  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required')
      .isString()
      .withMessage('Token must be a string')
      .isLength({ min: 32, max: 256 })
      .withMessage('Invalid token format'),
    commonValidations.password('newPassword'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
      .withMessage('Password confirmation does not match'),
  ],

  // Change password validation
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required')
      .isString()
      .withMessage('Current password must be a string'),
    commonValidations.password('newPassword'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
      .withMessage('Password confirmation does not match'),
  ],

  // Email verification validation
  verifyEmail: [
    body('token')
      .notEmpty()
      .withMessage('Verification token is required')
      .isString()
      .withMessage('Token must be a string')
      .isLength({ min: 32, max: 256 })
      .withMessage('Invalid token format'),
  ],

  // Resend email verification validation
  resendEmailVerification: [
    commonValidations.email('email'),
  ],

  // Token validation
  validateToken: [
    body('token')
      .notEmpty()
      .withMessage('Token is required')
      .isString()
      .withMessage('Token must be a string')
      .matches(/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/)
      .withMessage('Invalid JWT token format'),
  ],

  // Email check validation
  checkEmail: [
    param('email')
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
  ],

  // Username check validation
  checkUsername: [
    param('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  ],

  // Session revocation validation
  revokeSession: [
    param('sessionId')
      .notEmpty()
      .withMessage('Session ID is required')
      .isString()
      .withMessage('Session ID must be a string')
      .isLength({ min: 1, max: 100 })
      .withMessage('Invalid session ID format'),
  ],
};

export default authValidators;