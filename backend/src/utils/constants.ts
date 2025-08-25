// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// User-related constants
export const USER_CONSTANTS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  MAX_NAME_LENGTH: 100,
  MAX_PHONE_LENGTH: 20,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 30 * 60 * 1000, // 30 minutes
  PASSWORD_RESET_EXPIRY_MS: 60 * 60 * 1000, // 1 hour
  EMAIL_VERIFICATION_EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Contact-related constants
export const CONTACT_CONSTANTS = {
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
  MAX_PHONE_LENGTH: 20,
  MAX_COMPANY_LENGTH: 200,
  MAX_JOB_TITLE_LENGTH: 200,
  MAX_ADDRESS_LENGTH: 500,
  MAX_CITY_LENGTH: 100,
  MAX_STATE_LENGTH: 100,
  MAX_POSTAL_CODE_LENGTH: 20,
  MAX_COUNTRY_LENGTH: 100,
  MAX_NOTES_LENGTH: 2000,
  MAX_TAG_LENGTH: 50,
  MAX_TAGS_COUNT: 20,
  MAX_METADATA_SIZE: 10240, // 10KB in bytes
} as const;

// JWT-related constants
export const JWT_CONSTANTS = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  RESET_TOKEN_EXPIRY: '1h',
  VERIFICATION_TOKEN_EXPIRY: '24h',
  ALGORITHM: 'HS256' as const,
  ISSUER: 'connectkit-api',
  AUDIENCE: 'connectkit-app',
} as const;

// Rate limiting constants
export const RATE_LIMIT_CONSTANTS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 10,
  },
  PASSWORD_RESET: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 3,
  },
  EMAIL_VERIFICATION: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 5,
  },
} as const;

// Database constants
export const DATABASE_CONSTANTS = {
  MAX_CONNECTION_POOL: 20,
  CONNECTION_TIMEOUT_MS: 2000,
  IDLE_TIMEOUT_MS: 10000,
  QUERY_TIMEOUT_MS: 30000,
  MAX_QUERY_LENGTH: 10000,
} as const;

// Redis constants
export const REDIS_CONSTANTS = {
  KEY_PREFIX: 'connectkit:',
  DEFAULT_TTL: 3600, // 1 hour in seconds
  SESSION_TTL: 86400, // 24 hours in seconds
  CACHE_TTL: 1800, // 30 minutes in seconds
  RATE_LIMIT_TTL: 900, // 15 minutes in seconds
} as const;

// Security constants
export const SECURITY_CONSTANTS = {
  BCRYPT_ROUNDS: 12,
  TOKEN_LENGTH: 32,
  SALT_LENGTH: 16,
  IV_LENGTH: 16,
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  HASH_ALGORITHM: 'sha256',
  MFA_SECRET_LENGTH: 32,
  MFA_TOKEN_LENGTH: 6,
  MFA_WINDOW: 1, // TOTP window tolerance
} as const;

// Email constants
export const EMAIL_CONSTANTS = {
  FROM_ADDRESS: process.env.EMAIL_FROM || 'noreply@connectkit.app',
  MAX_SUBJECT_LENGTH: 200,
  MAX_BODY_LENGTH: 100000,
  TEMPLATES: {
    WELCOME: 'welcome',
    EMAIL_VERIFICATION: 'email-verification',
    PASSWORD_RESET: 'password-reset',
    PASSWORD_CHANGED: 'password-changed',
    ACCOUNT_LOCKED: 'account-locked',
    LOGIN_ALERT: 'login-alert',
  },
} as const;

// API constants
export const API_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
  DEFAULT_SORT_FIELD: 'createdAt',
  DEFAULT_SORT_ORDER: 'desc' as const,
  MAX_SEARCH_LENGTH: 500,
  MAX_FILTER_VALUES: 50,
} as const;

// File upload constants
export const UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/csv', 'application/json'],
  MAX_FILES_PER_REQUEST: 5,
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/,
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  POSTAL_CODE: /^[A-Za-z0-9\s-]{3,20}$/,
  HEX_COLOR: /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

// Date/Time constants
export const DATE_CONSTANTS = {
  ISO_DATE_FORMAT: 'YYYY-MM-DD',
  ISO_DATETIME_FORMAT: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DISPLAY_DATE_FORMAT: 'MMM DD, YYYY',
  DISPLAY_DATETIME_FORMAT: 'MMM DD, YYYY HH:mm:ss',
  TIMEZONE_UTC: 'UTC',
  MS_PER_SECOND: 1000,
  MS_PER_MINUTE: 60 * 1000,
  MS_PER_HOUR: 60 * 60 * 1000,
  MS_PER_DAY: 24 * 60 * 60 * 1000,
} as const;

// Environment constants
export const ENV_CONSTANTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  STAGING: 'staging',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account is temporarily locked',
  EMAIL_NOT_VERIFIED: 'Email address is not verified',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',

  // Validation
  VALIDATION_FAILED: 'Validation failed',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PASSWORD:
    'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  INVALID_PHONE: 'Invalid phone number format',
  PASSWORD_MISMATCH: 'Passwords do not match',

  // User
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  USER_INACTIVE: 'User account is inactive',

  // Contact
  CONTACT_NOT_FOUND: 'Contact not found',
  CONTACT_ALREADY_EXISTS: 'Contact already exists',

  // Database
  DATABASE_ERROR: 'Database error occurred',
  CONNECTION_FAILED: 'Database connection failed',
  TRANSACTION_FAILED: 'Database transaction failed',

  // General
  INTERNAL_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Bad request',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  CONTACT_CREATED: 'Contact created successfully',
  CONTACT_UPDATED: 'Contact updated successfully',
  CONTACT_DELETED: 'Contact deleted successfully',
  EMAIL_SENT: 'Email sent successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  PASSWORD_RESET: 'Password reset successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  LOGIN_SUCCESS: 'Logged in successfully',
} as const;

// Cache keys
export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  CONTACT: (id: string) => `contact:${id}`,
  USER_CONTACTS: (userId: string, page: number, limit: number) =>
    `user:${userId}:contacts:${page}:${limit}`,
  RATE_LIMIT: (identifier: string, action: string) =>
    `ratelimit:${action}:${identifier}`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
  EMAIL_VERIFICATION: (token: string) => `email_verification:${token}`,
  PASSWORD_RESET: (token: string) => `password_reset:${token}`,
} as const;

// Event names
export const EVENTS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',
  USER_EMAIL_VERIFIED: 'user.email_verified',
  USER_PASSWORD_RESET: 'user.password_reset',
  CONTACT_CREATED: 'contact.created',
  CONTACT_UPDATED: 'contact.updated',
  CONTACT_DELETED: 'contact.deleted',
  SECURITY_BREACH: 'security.breach',
  RATE_LIMIT_EXCEEDED: 'rate_limit.exceeded',
} as const;

// Feature flags
export const FEATURES = {
  MFA: process.env.FEATURE_MFA !== 'false',
  OAUTH: process.env.FEATURE_OAUTH !== 'false',
  EMAIL: process.env.FEATURE_EMAIL !== 'false',
  ANALYTICS: process.env.FEATURE_ANALYTICS !== 'false',
  FILE_UPLOAD: process.env.FEATURE_FILE_UPLOAD !== 'false',
  AUDIT_LOG: process.env.FEATURE_AUDIT_LOG !== 'false',
} as const;
