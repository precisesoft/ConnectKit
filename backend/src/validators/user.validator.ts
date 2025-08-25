import { body, param, query } from 'express-validator';
import { commonValidations } from '../middleware/validation.middleware';

export const userValidators = {
  // User ID parameter validation
  userId: [commonValidations.uuid('id')],

  // Update user profile validation
  updateProfile: [
    commonValidations.name('firstName', true),
    commonValidations.name('lastName', true),
    commonValidations.phone('phone', true),
  ],

  // Update user validation (admin)
  updateUser: [
    commonValidations.name('firstName', true),
    commonValidations.name('lastName', true),
    commonValidations.phone('phone', true),
    commonValidations.boolean('isActive', true),
    commonValidations.boolean('isVerified', true),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'user'])
      .withMessage('Role must be one of: admin, manager, user'),
  ],

  // Change user role validation
  changeRole: [
    body('role')
      .notEmpty()
      .withMessage('Role is required')
      .isIn(['admin', 'manager', 'user'])
      .withMessage('Role must be one of: admin, manager, user'),
  ],

  // List users validation
  listUsers: [
    commonValidations.page(),
    commonValidations.limit(),
    commonValidations.sort('sort', [
      'firstName',
      'lastName',
      'email',
      'username',
      'role',
      'isActive',
      'isVerified',
      'createdAt',
      'updatedAt',
      'lastLoginAt',
    ]),
    commonValidations.order(),
    commonValidations.search(),
    query('role')
      .optional()
      .isIn(['admin', 'manager', 'user'])
      .withMessage('Role filter must be one of: admin, manager, user'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive filter must be a boolean')
      .toBoolean(),
    query('isVerified')
      .optional()
      .isBoolean()
      .withMessage('isVerified filter must be a boolean')
      .toBoolean(),
  ],

  // Search users validation
  searchUsers: [
    query('search')
      .notEmpty()
      .withMessage('Search term is required')
      .trim()
      .isLength({ min: 2, max: 500 })
      .withMessage('Search term must be between 2 and 500 characters'),
    commonValidations.page(),
    commonValidations.limit(),
  ],

  // Get users by role validation
  getUsersByRole: [
    param('role')
      .notEmpty()
      .withMessage('Role is required')
      .isIn(['admin', 'manager', 'user'])
      .withMessage('Role must be one of: admin, manager, user'),
    commonValidations.page(),
    commonValidations.limit(),
  ],

  // Bulk update users validation
  bulkUpdateUsers: [
    body('updates')
      .isArray({ min: 1 })
      .withMessage('Updates array is required and must not be empty'),
    body('updates.*.id')
      .isUUID()
      .withMessage('Each update must have a valid user ID'),
    body('updates.*.data')
      .isObject()
      .withMessage('Each update must have a data object'),
    body('updates.*.data.firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('First name must be between 1 and 100 characters'),
    body('updates.*.data.lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Last name must be between 1 and 100 characters'),
    body('updates.*.data.phone')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    body('updates.*.data.isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('updates.*.data.isVerified')
      .optional()
      .isBoolean()
      .withMessage('isVerified must be a boolean'),
    body('updates.*.data.role')
      .optional()
      .isIn(['admin', 'manager', 'user'])
      .withMessage('Role must be one of: admin, manager, user'),
  ],

  // Export users validation
  exportUsers: [
    query('role')
      .optional()
      .isIn(['admin', 'manager', 'user'])
      .withMessage('Role filter must be one of: admin, manager, user'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive filter must be a boolean')
      .toBoolean(),
    query('isVerified')
      .optional()
      .isBoolean()
      .withMessage('isVerified filter must be a boolean')
      .toBoolean(),
    query('format')
      .optional()
      .isIn(['json', 'csv', 'excel'])
      .withMessage('Export format must be one of: json, csv, excel'),
  ],
};

export default userValidators;
