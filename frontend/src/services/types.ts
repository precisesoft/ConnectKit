// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class ApiException extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status = 500, code?: string, details?: any) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// Contact types
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  notes?: string;
  tags?: string[];
  avatar?: string;
  isFavorite: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  notes?: string;
  tags?: string[];
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {
  isFavorite?: boolean;
}

export interface ContactFilters {
  search?: string;
  tags?: string[];
  isFavorite?: boolean;
  company?: string;
  sortBy?:
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'company'
    | 'createdAt'
    | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// User profile types
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  website?: string;
  timezone?: string;
  language?: string;
  emailNotifications: boolean;
  marketingEmails: boolean;
  twoFactorEnabled: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  website?: string;
  timezone?: string;
  language?: string;
  emailNotifications?: boolean;
  marketingEmails?: boolean;
}

export interface UploadAvatarRequest {
  file: File;
}

// File upload types
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

// Export/Import types
export interface ExportContactsRequest {
  format: 'csv' | 'json' | 'xlsx';
  filters?: ContactFilters;
}

export interface ImportContactsRequest {
  file: File;
  format: 'csv' | 'json' | 'xlsx';
  options?: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
  };
}

export interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

// Analytics types
export interface ContactStats {
  total: number;
  favorites: number;
  recentlyAdded: number;
  companies: number;
  topTags: Array<{
    name: string;
    count: number;
  }>;
  topCompanies: Array<{
    name: string;
    count: number;
  }>;
}

// Search types
export interface SearchRequest {
  query: string;
  filters?: {
    type?: 'contacts' | 'companies' | 'all';
    tags?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
  page?: number;
  limit?: number;
}

export interface SearchResult {
  contacts: Contact[];
  companies: Array<{
    name: string;
    contactCount: number;
  }>;
  tags: Array<{
    name: string;
    contactCount: number;
  }>;
  total: number;
}

// Notification types
export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  contactUpdates: boolean;
  securityAlerts: boolean;
}

// Backup types
export interface BackupRequest {
  includeContacts: boolean;
  includeProfile: boolean;
  format: 'json' | 'zip';
}

export interface BackupResponse {
  downloadUrl: string;
  filename: string;
  size: number;
  expiresAt: string;
}
