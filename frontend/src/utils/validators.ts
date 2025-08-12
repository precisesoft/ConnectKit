/**
 * Form validation utility functions
 */

import { REGEX, CONTACT_VALIDATION, USER_VALIDATION } from './constants';

// Generic validation functions
export const isRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value != null && value !== undefined;
};

export const minLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

export const maxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};

export const matchesPattern = (value: string, pattern: RegExp): boolean => {
  return pattern.test(value);
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  return REGEX.EMAIL.test(email.trim().toLowerCase());
};

// Phone validation
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;
  // Remove all non-digit characters except + at the beginning
  const cleaned = phone.replace(/[^\d+]/g, '');
  return REGEX.PHONE.test(cleaned);
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  return REGEX.URL.test(url.trim());
};

// Password validation
export const isValidPassword = (password: string): boolean => {
  if (!password) return false;
  return (
    password.length >= USER_VALIDATION.PASSWORD_MIN_LENGTH &&
    password.length <= USER_VALIDATION.PASSWORD_MAX_LENGTH &&
    REGEX.PASSWORD.test(password)
  );
};

export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One lowercase letter');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character');
  }

  return {
    score,
    feedback,
    isStrong: score >= 4,
  };
};

// Name validation
export const isValidName = (name: string): boolean => {
  if (!name) return false;
  const trimmedName = name.trim();
  return (
    trimmedName.length >= USER_VALIDATION.NAME_MIN_LENGTH &&
    trimmedName.length <= USER_VALIDATION.NAME_MAX_LENGTH &&
    REGEX.NAME.test(trimmedName)
  );
};

// Contact-specific validations
export const validateContactData = (data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  tags?: string[];
  website?: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // First name validation
  if (!isRequired(data.firstName)) {
    errors.firstName = 'First name is required';
  } else if (!minLength(data.firstName.trim(), CONTACT_VALIDATION.NAME_MIN_LENGTH)) {
    errors.firstName = `First name must be at least ${CONTACT_VALIDATION.NAME_MIN_LENGTH} character`;
  } else if (!maxLength(data.firstName.trim(), CONTACT_VALIDATION.NAME_MAX_LENGTH)) {
    errors.firstName = `First name must be less than ${CONTACT_VALIDATION.NAME_MAX_LENGTH} characters`;
  }

  // Last name validation
  if (!isRequired(data.lastName)) {
    errors.lastName = 'Last name is required';
  } else if (!minLength(data.lastName.trim(), CONTACT_VALIDATION.NAME_MIN_LENGTH)) {
    errors.lastName = `Last name must be at least ${CONTACT_VALIDATION.NAME_MIN_LENGTH} character`;
  } else if (!maxLength(data.lastName.trim(), CONTACT_VALIDATION.NAME_MAX_LENGTH)) {
    errors.lastName = `Last name must be less than ${CONTACT_VALIDATION.NAME_MAX_LENGTH} characters`;
  }

  // Email validation (optional)
  if (data.email && data.email.trim()) {
    if (!isValidEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (!maxLength(data.email.trim(), CONTACT_VALIDATION.EMAIL_MAX_LENGTH)) {
      errors.email = `Email must be less than ${CONTACT_VALIDATION.EMAIL_MAX_LENGTH} characters`;
    }
  }

  // Phone validation (optional)
  if (data.phone && data.phone.trim()) {
    if (!isValidPhone(data.phone)) {
      errors.phone = 'Please enter a valid phone number';
    } else if (!maxLength(data.phone.trim(), CONTACT_VALIDATION.PHONE_MAX_LENGTH)) {
      errors.phone = `Phone number must be less than ${CONTACT_VALIDATION.PHONE_MAX_LENGTH} characters`;
    }
  }

  // Company validation (optional)
  if (data.company && data.company.trim()) {
    if (!maxLength(data.company.trim(), CONTACT_VALIDATION.COMPANY_MAX_LENGTH)) {
      errors.company = `Company name must be less than ${CONTACT_VALIDATION.COMPANY_MAX_LENGTH} characters`;
    }
  }

  // Job title validation (optional)
  if (data.jobTitle && data.jobTitle.trim()) {
    if (!maxLength(data.jobTitle.trim(), CONTACT_VALIDATION.JOB_TITLE_MAX_LENGTH)) {
      errors.jobTitle = `Job title must be less than ${CONTACT_VALIDATION.JOB_TITLE_MAX_LENGTH} characters`;
    }
  }

  // Website validation (optional)
  if (data.website && data.website.trim()) {
    if (!isValidUrl(data.website)) {
      errors.website = 'Please enter a valid website URL';
    }
  }

  // Notes validation (optional)
  if (data.notes && data.notes.trim()) {
    if (!maxLength(data.notes.trim(), CONTACT_VALIDATION.NOTES_MAX_LENGTH)) {
      errors.notes = `Notes must be less than ${CONTACT_VALIDATION.NOTES_MAX_LENGTH} characters`;
    }
  }

  // Tags validation (optional)
  if (data.tags && data.tags.length > 0) {
    if (data.tags.length > CONTACT_VALIDATION.MAX_TAGS) {
      errors.tags = `Maximum ${CONTACT_VALIDATION.MAX_TAGS} tags allowed`;
    } else {
      const invalidTag = data.tags.find(tag => 
        !tag.trim() || tag.trim().length > CONTACT_VALIDATION.TAG_MAX_LENGTH
      );
      if (invalidTag) {
        errors.tags = `Each tag must be 1-${CONTACT_VALIDATION.TAG_MAX_LENGTH} characters`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// User profile validation
export const validateUserProfile = (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  website?: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // First name validation
  if (!isValidName(data.firstName)) {
    errors.firstName = `First name must be ${USER_VALIDATION.NAME_MIN_LENGTH}-${USER_VALIDATION.NAME_MAX_LENGTH} characters and contain only letters, spaces, hyphens, and apostrophes`;
  }

  // Last name validation
  if (!isValidName(data.lastName)) {
    errors.lastName = `Last name must be ${USER_VALIDATION.NAME_MIN_LENGTH}-${USER_VALIDATION.NAME_MAX_LENGTH} characters and contain only letters, spaces, hyphens, and apostrophes`;
  }

  // Email validation
  if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation (optional)
  if (data.phone && data.phone.trim() && !isValidPhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  // Bio validation (optional)
  if (data.bio && data.bio.trim() && !maxLength(data.bio.trim(), USER_VALIDATION.BIO_MAX_LENGTH)) {
    errors.bio = `Bio must be less than ${USER_VALIDATION.BIO_MAX_LENGTH} characters`;
  }

  // Company validation (optional)
  if (data.company && data.company.trim() && !maxLength(data.company.trim(), USER_VALIDATION.COMPANY_MAX_LENGTH)) {
    errors.company = `Company name must be less than ${USER_VALIDATION.COMPANY_MAX_LENGTH} characters`;
  }

  // Job title validation (optional)
  if (data.jobTitle && data.jobTitle.trim() && !maxLength(data.jobTitle.trim(), USER_VALIDATION.JOB_TITLE_MAX_LENGTH)) {
    errors.jobTitle = `Job title must be less than ${USER_VALIDATION.JOB_TITLE_MAX_LENGTH} characters`;
  }

  // Location validation (optional)
  if (data.location && data.location.trim() && !maxLength(data.location.trim(), USER_VALIDATION.LOCATION_MAX_LENGTH)) {
    errors.location = `Location must be less than ${USER_VALIDATION.LOCATION_MAX_LENGTH} characters`;
  }

  // Website validation (optional)
  if (data.website && data.website.trim()) {
    if (!isValidUrl(data.website)) {
      errors.website = 'Please enter a valid website URL';
    } else if (!maxLength(data.website.trim(), USER_VALIDATION.WEBSITE_MAX_LENGTH)) {
      errors.website = `Website URL must be less than ${USER_VALIDATION.WEBSITE_MAX_LENGTH} characters`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Registration validation
export const validateRegistration = (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Basic profile validation
  const profileValidation = validateUserProfile({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
  });

  Object.assign(errors, profileValidation.errors);

  // Password validation
  if (!isValidPassword(data.password)) {
    errors.password = 'Password must be at least 8 characters and contain uppercase, lowercase, and number';
  }

  // Confirm password validation
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Login validation
export const validateLogin = (data: {
  email: string;
  password: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Email validation
  if (!isRequired(data.email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!isRequired(data.password)) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Password change validation
export const validatePasswordChange = (data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Current password validation
  if (!isRequired(data.currentPassword)) {
    errors.currentPassword = 'Current password is required';
  }

  // New password validation
  if (!isValidPassword(data.newPassword)) {
    errors.newPassword = 'New password must be at least 8 characters and contain uppercase, lowercase, and number';
  }

  // Confirm password validation
  if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Check if new password is different from current
  if (data.currentPassword === data.newPassword) {
    errors.newPassword = 'New password must be different from current password';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// File validation
export const validateFile = (
  file: File,
  allowedTypes: string[],
  maxSize: number
): { isValid: boolean; error?: string } => {
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
    };
  }

  return { isValid: true };
};

// Helper function to sanitize input
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

// Helper function to format phone number
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except + at the beginning
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Basic US phone number formatting
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
  }
  
  // Return as-is if doesn't match common patterns
  return cleaned;
};

export default {
  isRequired,
  minLength,
  maxLength,
  matchesPattern,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidPassword,
  getPasswordStrength,
  isValidName,
  validateContactData,
  validateUserProfile,
  validateRegistration,
  validateLogin,
  validatePasswordChange,
  validateFile,
  sanitizeInput,
  formatPhoneNumber,
};