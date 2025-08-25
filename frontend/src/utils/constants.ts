/**
 * Application constants
 */

// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Application Information
export const APP_NAME = 'ConnectKit';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Modern contact management for professionals';

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH: 'connectkit-auth',
  UI: 'connectkit-ui',
  RECENT_SEARCHES: 'connectkit-recent-searches',
  USER_PREFERENCES: 'connectkit-user-preferences',
  THEME: 'connectkit-theme',
  SIDEBAR: 'connectkit-sidebar',
} as const;

// Query Keys (React Query)
export const QUERY_KEYS = {
  CONTACTS: 'contacts',
  CONTACT_STATS: 'contact-stats',
  CONTACT_TAGS: 'contact-tags',
  CONTACT_COMPANIES: 'contact-companies',
  USER_PROFILE: 'user-profile',
  AUTH_USER: 'auth-user',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  CONTACTS: '/contacts',
  CONTACT_DETAIL: '/contacts/:id',
  CONTACT_EDIT: '/contacts/:id/edit',
  CONTACT_NEW: '/contacts/new',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOT_FOUND: '*',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [12, 24, 48, 96],
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENT: ['application/pdf', 'text/plain'],
    IMPORT: [
      'text/csv',
      'application/json',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  MAX_IMPORT_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// Contact Validation
export const CONTACT_VALIDATION = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 100,
  PHONE_MAX_LENGTH: 20,
  COMPANY_MAX_LENGTH: 100,
  JOB_TITLE_MAX_LENGTH: 100,
  NOTES_MAX_LENGTH: 1000,
  MAX_TAGS: 20,
  TAG_MAX_LENGTH: 30,
  ADDRESS_MAX_LENGTH: 200,
} as const;

// User Validation
export const USER_VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  BIO_MAX_LENGTH: 500,
  COMPANY_MAX_LENGTH: 100,
  JOB_TITLE_MAX_LENGTH: 100,
  LOCATION_MAX_LENGTH: 100,
  WEBSITE_MAX_LENGTH: 200,
} as const;

// Regular Expressions
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[1-9][\d]{0,15}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  NAME: /^[a-zA-Z\s'-]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

// Date/Time Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
  TIME: 'HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Theme Configuration
export const THEME = {
  BREAKPOINTS: {
    XS: 0,
    SM: 600,
    MD: 900,
    LG: 1200,
    XL: 1536,
  },
  COLORS: {
    PRIMARY: '#1976d2',
    SECONDARY: '#dc004e',
    SUCCESS: '#2e7d32',
    WARNING: '#ed6c02',
    ERROR: '#d32f2f',
    INFO: '#0288d1',
  },
  SPACING: 8,
  BORDER_RADIUS: 8,
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 60,
} as const;

// Animation Durations (in milliseconds)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

// Debounce Delays (in milliseconds)
export const DEBOUNCE = {
  SEARCH: 300,
  AUTO_SAVE: 1000,
  RESIZE: 150,
  SCROLL: 100,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CONTACT_CREATED: 'Contact created successfully!',
  CONTACT_UPDATED: 'Contact updated successfully!',
  CONTACT_DELETED: 'Contact deleted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  EMAIL_VERIFIED: 'Email verified successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  IMPORT_COMPLETED: 'Import completed successfully!',
  EXPORT_COMPLETED: 'Export completed successfully!',
} as const;

// Feature Flags
export const FEATURES = {
  DARK_MODE: true,
  EXPORT_IMPORT: true,
  BULK_OPERATIONS: true,
  ADVANCED_SEARCH: true,
  CONTACT_RELATIONSHIPS: false,
  ANALYTICS: false,
  INTEGRATIONS: false,
  API_ACCESS: false,
} as const;

// Limits
export const LIMITS = {
  MAX_CONTACTS: 10000,
  MAX_CONTACTS_FREE: 1000,
  MAX_TAGS_PER_CONTACT: 10,
  MAX_IMPORT_ROWS: 5000,
  MAX_EXPORT_ROWS: 10000,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
} as const;

// Contact Categories
export const CONTACT_CATEGORIES = [
  'personal',
  'business',
  'family',
  'friend',
  'colleague',
  'client',
  'vendor',
  'other',
] as const;

// Contact Importance Levels
export const IMPORTANCE_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

// Contact Frequencies
export const CONTACT_FREQUENCIES = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'rarely',
] as const;

// Sort Options
export const SORT_OPTIONS = {
  CONTACTS: [
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'company', label: 'Company' },
    { value: 'createdAt', label: 'Date Created' },
    { value: 'updatedAt', label: 'Date Updated' },
    { value: 'lastContactedAt', label: 'Last Contacted' },
  ],
} as const;

// Default Values
export const DEFAULTS = {
  CONTACT: {
    category: 'personal' as const,
    importance: 'medium' as const,
    contactFrequency: 'monthly' as const,
    isFavorite: false,
    isPrivate: false,
    tags: [],
  },
  USER: {
    theme: 'light' as const,
    language: 'en' as const,
    timezone: 'UTC',
    emailNotifications: true,
    marketingEmails: false,
    twoFactorEnabled: false,
  },
  UI: {
    sidebarOpen: true,
    sidebarWidth: THEME.SIDEBAR_WIDTH,
    themeMode: 'light' as const,
    densityMode: 'standard' as const,
  },
} as const;

// Environment
export const ENV = {
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE || APP_NAME,
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || APP_VERSION,
} as const;

export default {
  API_BASE_URL,
  APP_NAME,
  APP_VERSION,
  STORAGE_KEYS,
  QUERY_KEYS,
  ROUTES,
  PAGINATION,
  FILE_UPLOAD,
  CONTACT_VALIDATION,
  USER_VALIDATION,
  REGEX,
  DATE_FORMATS,
  THEME,
  ANIMATION,
  DEBOUNCE,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FEATURES,
  LIMITS,
  CONTACT_CATEGORIES,
  IMPORTANCE_LEVELS,
  CONTACT_FREQUENCIES,
  SORT_OPTIONS,
  DEFAULTS,
  ENV,
};
