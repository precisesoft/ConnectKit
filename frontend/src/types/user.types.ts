/**
 * User-related TypeScript type definitions
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  emailVerified: boolean;
  phone?: string;
  bio?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  website?: string;
  timezone?: string;
  language?: string;

  // Notification preferences
  emailNotifications: boolean;
  marketingEmails: boolean;

  // Security
  twoFactorEnabled: boolean;
  lastLogin?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  // Extended profile information
  contactCount?: number;
  favoriteCount?: number;
  recentActivity?: UserActivity[];
}

export interface UserActivity {
  id: string;
  type:
    | 'contact_created'
    | 'contact_updated'
    | 'contact_deleted'
    | 'login'
    | 'password_changed';
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface UserSettings {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  density: 'compact' | 'standard' | 'comfortable';

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  contactUpdates: boolean;
  securityAlerts: boolean;

  // Privacy
  profileVisibility: 'public' | 'private';
  showEmail: boolean;
  showPhone: boolean;

  // Data & Storage
  autoBackup: boolean;
  dataRetention: number; // days

  // Advanced
  apiAccess: boolean;
  developerMode: boolean;
}

export interface UserSession {
  id: string;
  deviceInfo: string;
  location?: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
  current: boolean;
  createdAt: string;
}

export interface UserStats {
  totalContacts: number;
  favoriteContacts: number;
  recentlyAddedContacts: number;
  companiesCount: number;
  tagsCount: number;
  averageContactsPerMonth: number;

  // Activity stats
  lastLoginAt?: string;
  loginCount: number;
  profileCompleteness: number; // percentage

  // Usage patterns
  mostUsedFeatures: Array<{
    feature: string;
    count: number;
  }>;

  // Time-based stats
  dailyActivity: Array<{
    date: string;
    actions: number;
  }>;

  weeklyActivity: Array<{
    week: string;
    actions: number;
  }>;
}

// Form types for user operations
export interface UpdateUserProfileRequest {
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
}

export interface UpdateUserSettingsRequest extends Partial<UserSettings> {}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateEmailRequest {
  newEmail: string;
  password: string;
}

export interface DeleteAccountRequest {
  password: string;
  confirmation: string; // Must be "DELETE"
  reason?: string;
}

// Account verification
export interface EmailVerification {
  token: string;
  email: string;
  expiresAt: string;
}

export interface PhoneVerification {
  phoneNumber: string;
  verificationCode: string;
}

// Two-factor authentication
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  token: string;
  backupCode?: string;
}

// Account export/import
export interface AccountExport {
  user: User;
  contacts: any[]; // Contact type from contact.types.ts
  settings: UserSettings;
  exportedAt: string;
  version: string;
}

export interface AccountImport {
  file: File;
  options: {
    importContacts: boolean;
    importSettings: boolean;
    mergeStrategy: 'replace' | 'merge' | 'skip';
  };
}

// Role and permissions
export type Permission =
  | 'contacts:read'
  | 'contacts:write'
  | 'contacts:delete'
  | 'profile:read'
  | 'profile:write'
  | 'settings:read'
  | 'settings:write'
  | 'admin:users'
  | 'admin:system';

export interface UserRole {
  id: string;
  name: string;
  displayName: string;
  permissions: Permission[];
  isSystem: boolean;
}

// API response types
export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserStatsResponse {
  stats: UserStats;
  period: {
    start: string;
    end: string;
  };
}

// Validation types
export interface UserValidationErrors {
  firstName?: string[];
  lastName?: string[];
  email?: string[];
  password?: string[];
  phone?: string[];
  bio?: string[];
  company?: string[];
  jobTitle?: string[];
  location?: string[];
  website?: string[];
}
