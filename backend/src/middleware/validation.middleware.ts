import { Request, Response, NextFunction } from 'express';
import { body, param, query, ValidationChain, validationResult } from 'express-validator';
import { 
  ValidationError, 
  BadRequestError 
} from '../utils/errors';
import { 
  VALIDATION_PATTERNS,
  USER_CONSTANTS,
  CONTACT_CONSTANTS,
  API_CONSTANTS 
} from '../utils/constants';
import { logger } from '../utils/logger';

/**
 * Handle validation errors from express-validator
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));
    
    logger.warn('Validation failed', {
      url: req.originalUrl,
      method: req.method,
      errors: formattedErrors,
      userId: (req as any).user?.id,
    });
    
    throw new ValidationError('Request validation failed', formattedErrors);
  }
  
  next();
};

/**
 * Common validation rules
 */
export const commonValidations = {
  // UUID validation
  uuid: (field: string, optional = false) => {
    const validator = param(field).matches(VALIDATION_PATTERNS.UUID);
    return optional ? validator.optional() : validator;
  },

  // Email validation
  email: (field: string = 'email', optional = false) => {
    let validator = body(field)
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage('Email must not exceed 255 characters');
    
    return optional ? validator.optional() : validator;
  },

  // Password validation
  password: (field: string = 'password') => {
    return body(field)
      .isLength({ min: USER_CONSTANTS.MIN_PASSWORD_LENGTH, max: USER_CONSTANTS.MAX_PASSWORD_LENGTH })
      .withMessage(`Password must be between ${USER_CONSTANTS.MIN_PASSWORD_LENGTH} and ${USER_CONSTANTS.MAX_PASSWORD_LENGTH} characters`)
      .matches(VALIDATION_PATTERNS.PASSWORD)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  },

  // Username validation
  username: (field: string = 'username', optional = false) => {
    let validator = body(field)
      .isLength({ min: USER_CONSTANTS.MIN_USERNAME_LENGTH, max: USER_CONSTANTS.MAX_USERNAME_LENGTH })
      .withMessage(`Username must be between ${USER_CONSTANTS.MIN_USERNAME_LENGTH} and ${USER_CONSTANTS.MAX_USERNAME_LENGTH} characters`)
      .matches(VALIDATION_PATTERNS.USERNAME)
      .withMessage('Username can only contain letters, numbers, underscores, and hyphens');
    
    return optional ? validator.optional() : validator;
  },

  // Name validation
  name: (field: string, optional = false) => {
    let validator = body(field)
      .trim()
      .isLength({ min: 1, max: USER_CONSTANTS.MAX_NAME_LENGTH })
      .withMessage(`${field} must be between 1 and ${USER_CONSTANTS.MAX_NAME_LENGTH} characters`)
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage(`${field} can only contain letters, spaces, hyphens, and apostrophes`);
    
    return optional ? validator.optional() : validator;
  },

  // Phone validation
  phone: (field: string = 'phone', optional = true) => {
    let validator = body(field)
      .matches(VALIDATION_PATTERNS.PHONE)
      .withMessage('Phone number must be in international format')
      .isLength({ max: CONTACT_CONSTANTS.MAX_PHONE_LENGTH })
      .withMessage(`Phone number must not exceed ${CONTACT_CONSTANTS.MAX_PHONE_LENGTH} characters`);
    
    return optional ? validator.optional() : validator;
  },

  // Text field validation
  text: (field: string, maxLength: number, optional = true) => {
    let validator = body(field)
      .trim()
      .isLength({ max: maxLength })
      .withMessage(`${field} must not exceed ${maxLength} characters`);
    
    return optional ? validator.optional() : validator;
  },

  // Boolean validation
  boolean: (field: string, optional = true) => {
    let validator = body(field)
      .isBoolean()
      .withMessage(`${field} must be a boolean value`);
    
    return optional ? validator.optional() : validator;
  },

  // Array validation
  array: (field: string, maxItems: number, optional = true) => {
    let validator = body(field)
      .isArray({ max: maxItems })
      .withMessage(`${field} must be an array with at most ${maxItems} items`);
    
    return optional ? validator.optional() : validator;
  },

  // Pagination validation
  page: (field: string = 'page') => {
    return query(field)
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt();
  },

  limit: (field: string = 'limit') => {
    return query(field)
      .optional()
      .isInt({ min: API_CONSTANTS.MIN_PAGE_SIZE, max: API_CONSTANTS.MAX_PAGE_SIZE })
      .withMessage(`Limit must be between ${API_CONSTANTS.MIN_PAGE_SIZE} and ${API_CONSTANTS.MAX_PAGE_SIZE}`)
      .toInt();
  },

  // Sort validation
  sort: (field: string = 'sort', allowedFields: string[]) => {
    return query(field)
      .optional()
      .isIn(allowedFields)
      .withMessage(`Sort field must be one of: ${allowedFields.join(', ')}`);
  },

  order: (field: string = 'order') => {
    return query(field)
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be either "asc" or "desc"');
  },

  // Search validation
  search: (field: string = 'search') => {
    return query(field)
      .optional()
      .trim()
      .isLength({ max: API_CONSTANTS.MAX_SEARCH_LENGTH })
      .withMessage(`Search query must not exceed ${API_CONSTANTS.MAX_SEARCH_LENGTH} characters`);
  },
};

/**
 * User validation rules
 */
export const userValidations = {
  create: [
    commonValidations.email(),
    commonValidations.username(),
    commonValidations.password(),
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.phone('phone', true),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'user'])
      .withMessage('Role must be one of: admin, manager, user'),
  ],

  update: [
    commonValidations.name('firstName', true),
    commonValidations.name('lastName', true),
    commonValidations.phone('phone', true),
    commonValidations.boolean('isActive', true),
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidations.password('newPassword'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
  ],

  login: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  forgotPassword: [
    commonValidations.email(),
  ],

  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    commonValidations.password('newPassword'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
  ],

  verifyEmail: [
    body('token')
      .notEmpty()
      .withMessage('Verification token is required'),
  ],

  list: [
    commonValidations.page(),
    commonValidations.limit(),
    commonValidations.sort('sort', ['firstName', 'lastName', 'email', 'createdAt', 'updatedAt']),
    commonValidations.order(),
    commonValidations.search(),
    query('role')
      .optional()
      .isIn(['admin', 'manager', 'user'])
      .withMessage('Role filter must be one of: admin, manager, user'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive filter must be a boolean'),
  ],
};

/**
 * Contact validation rules
 */
export const contactValidations = {
  create: [
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.email('email', true),
    commonValidations.phone('phone', true),
    commonValidations.text('company', CONTACT_CONSTANTS.MAX_COMPANY_LENGTH, true),
    commonValidations.text('jobTitle', CONTACT_CONSTANTS.MAX_JOB_TITLE_LENGTH, true),
    commonValidations.text('addressLine1', CONTACT_CONSTANTS.MAX_ADDRESS_LENGTH, true),
    commonValidations.text('addressLine2', CONTACT_CONSTANTS.MAX_ADDRESS_LENGTH, true),
    commonValidations.text('city', CONTACT_CONSTANTS.MAX_CITY_LENGTH, true),
    commonValidations.text('state', CONTACT_CONSTANTS.MAX_STATE_LENGTH, true),
    commonValidations.text('postalCode', CONTACT_CONSTANTS.MAX_POSTAL_CODE_LENGTH, true),
    commonValidations.text('country', CONTACT_CONSTANTS.MAX_COUNTRY_LENGTH, true),
    commonValidations.text('notes', CONTACT_CONSTANTS.MAX_NOTES_LENGTH, true),
    commonValidations.array('tags', CONTACT_CONSTANTS.MAX_TAGS_COUNT, true)
      .custom((tags) => {
        if (tags && tags.some((tag: string) => tag.length > CONTACT_CONSTANTS.MAX_TAG_LENGTH)) {
          throw new Error(`Each tag must not exceed ${CONTACT_CONSTANTS.MAX_TAG_LENGTH} characters`);
        }
        return true;
      }),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'archived'])
      .withMessage('Status must be one of: active, inactive, archived'),
    commonValidations.boolean('isFavorite', true),
  ],

  update: [
    commonValidations.name('firstName', true),
    commonValidations.name('lastName', true),
    commonValidations.email('email', true),
    commonValidations.phone('phone', true),
    commonValidations.text('company', CONTACT_CONSTANTS.MAX_COMPANY_LENGTH, true),
    commonValidations.text('jobTitle', CONTACT_CONSTANTS.MAX_JOB_TITLE_LENGTH, true),
    commonValidations.text('addressLine1', CONTACT_CONSTANTS.MAX_ADDRESS_LENGTH, true),
    commonValidations.text('addressLine2', CONTACT_CONSTANTS.MAX_ADDRESS_LENGTH, true),
    commonValidations.text('city', CONTACT_CONSTANTS.MAX_CITY_LENGTH, true),
    commonValidations.text('state', CONTACT_CONSTANTS.MAX_STATE_LENGTH, true),
    commonValidations.text('postalCode', CONTACT_CONSTANTS.MAX_POSTAL_CODE_LENGTH, true),
    commonValidations.text('country', CONTACT_CONSTANTS.MAX_COUNTRY_LENGTH, true),
    commonValidations.text('notes', CONTACT_CONSTANTS.MAX_NOTES_LENGTH, true),
    commonValidations.array('tags', CONTACT_CONSTANTS.MAX_TAGS_COUNT, true)
      .custom((tags) => {
        if (tags && tags.some((tag: string) => tag.length > CONTACT_CONSTANTS.MAX_TAG_LENGTH)) {
          throw new Error(`Each tag must not exceed ${CONTACT_CONSTANTS.MAX_TAG_LENGTH} characters`);
        }
        return true;
      }),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'archived'])
      .withMessage('Status must be one of: active, inactive, archived'),
    commonValidations.boolean('isFavorite', true),
  ],

  list: [
    commonValidations.page(),
    commonValidations.limit(),
    commonValidations.sort('sort', ['firstName', 'lastName', 'email', 'company', 'createdAt', 'updatedAt']),
    commonValidations.order(),
    commonValidations.search(),
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'archived'])
      .withMessage('Status filter must be one of: active, inactive, archived'),
    query('isFavorite')
      .optional()
      .isBoolean()
      .withMessage('isFavorite filter must be a boolean'),
    query('tags')
      .optional()
      .isString()
      .withMessage('Tags filter must be a comma-separated string'),
  ],

  bulkUpdate: [
    body('contactIds')
      .isArray({ min: 1 })
      .withMessage('At least one contact ID is required')
      .custom((ids) => {
        if (ids.some((id: string) => !VALIDATION_PATTERNS.UUID.test(id))) {
          throw new Error('All contact IDs must be valid UUIDs');
        }
        return true;
      }),
    body('updates')
      .isObject()
      .withMessage('Updates must be an object'),
  ],

  export: [
    query('format')
      .optional()
      .isIn(['csv', 'json', 'excel'])
      .withMessage('Export format must be one of: csv, json, excel'),
    query('fields')
      .optional()
      .isString()
      .withMessage('Fields must be a comma-separated string'),
  ],
};

/**
 * ID parameter validation
 */
export const validateId = [
  commonValidations.uuid('id'),
];

export const validateUserId = [
  commonValidations.uuid('userId'),
];

/**
 * Custom validation middleware factory
 */
export const validate = (validations: ValidationChain[]) => {
  return [
    ...validations,
    handleValidationErrors,
  ];
};

/**
 * Sanitization middleware
 */
export const sanitize = (req: Request, res: Response, next: NextFunction): void => {
  // Remove null prototype objects and functions
  const sanitizeObject = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'function') {
          continue; // Skip functions
        }
        sanitized[key] = sanitizeObject(value);
      }
    }

    return sanitized;
  };

  // Sanitize request body, query, and params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};