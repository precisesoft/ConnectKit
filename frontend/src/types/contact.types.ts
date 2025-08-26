/**
 * Contact-related TypeScript type definitions
 */

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;

  // Address information
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  // Additional information
  notes?: string;
  tags?: string[];
  avatar?: string;
  website?: string;

  // Social media
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    github?: string;
  };

  // Relationship data
  isFavorite: boolean;
  category?:
    | 'personal'
    | 'business'
    | 'family'
    | 'friend'
    | 'colleague'
    | 'client'
    | 'vendor'
    | 'other';
  source?: 'manual' | 'import' | 'api' | 'referral';

  // Custom fields
  customFields?: Record<string, any>;

  // Metadata
  userId: string;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;

  // Contact frequency and importance
  contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'rarely';
  importance?: 'low' | 'medium' | 'high' | 'critical';

  // Privacy and permissions
  isPrivate?: boolean;
  sharePermissions?: string[];
}

// Contact creation and update types
export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: Contact['address'];
  notes?: string;
  tags?: string[];
  website?: string;
  socialMedia?: Contact['socialMedia'];
  category?: Contact['category'];
  customFields?: Record<string, any>;
  contactFrequency?: Contact['contactFrequency'];
  importance?: Contact['importance'];
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {
  isFavorite?: boolean;
  lastContactedAt?: string;
  isPrivate?: boolean;
}

// Contact list and filtering
export interface ContactFilters {
  search?: string;
  tags?: string[];
  isFavorite?: boolean;
  company?: string;
  category?: Contact['category'];
  importance?: Contact['importance'];
  contactFrequency?: Contact['contactFrequency'];
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasAddress?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  lastContactedAfter?: string;
  lastContactedBefore?: string;
  sortBy?: ContactSortField;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export type ContactSortField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'company'
  | 'jobTitle'
  | 'createdAt'
  | 'updatedAt'
  | 'lastContactedAt'
  | 'importance';

export interface ContactListOptions {
  view?: 'grid' | 'list' | 'table';
  groupBy?: 'none' | 'company' | 'category' | 'firstLetter' | 'tags';
  showAvatars?: boolean;
  showCompany?: boolean;
  showTags?: boolean;
  showNotes?: boolean;
  density?: 'compact' | 'standard' | 'comfortable';
}

// Contact statistics and analytics
export interface ContactStats {
  total: number;
  favorites: number;
  recentlyAdded: number;
  companies: number;

  // Category breakdown
  byCategory: Record<
    NonNullable<Contact['category']> | 'uncategorized',
    number
  >;

  // Tag statistics
  topTags: Array<{
    name: string;
    count: number;
  }>;

  // Company statistics
  topCompanies: Array<{
    name: string;
    count: number;
  }>;

  // Contact frequency
  byFrequency: Record<
    NonNullable<Contact['contactFrequency']> | 'unset',
    number
  >;

  // Importance levels
  byImportance: Record<NonNullable<Contact['importance']> | 'unset', number>;

  // Growth statistics
  growthStats: {
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
    lastYear: number;
    percentageChange: number;
  };

  // Contact patterns
  mostContactedDay: string;
  averageContactsPerMonth: number;

  // Data quality
  dataQuality: {
    withEmail: number;
    withPhone: number;
    withAddress: number;
    withCompany: number;
    withNotes: number;
    complete: number; // Contacts with all main fields filled
  };
}

// Import/Export types
export interface ContactImportOptions {
  format: 'csv' | 'json' | 'xlsx' | 'vcard';
  mapping?: Record<string, string>; // field mapping for CSV
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  defaultCategory?: Contact['category'];
  defaultTags?: string[];
}

export interface ContactExportOptions {
  format: 'csv' | 'json' | 'xlsx' | 'vcard';
  fields?: (keyof Contact)[];
  filters?: ContactFilters;
  includeNotes?: boolean;
  includeTags?: boolean;
  includeCustomFields?: boolean;
}

export interface ContactImportResult {
  success: number;
  failed: number;
  updated: number;
  duplicates: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data?: any;
  }>;
  importedContacts: Contact[];
}

// Bulk operations
export interface BulkContactOperation {
  contactIds: string[];
  operation:
    | 'delete'
    | 'favorite'
    | 'unfavorite'
    | 'tag'
    | 'untag'
    | 'category'
    | 'export';
  data?: {
    tags?: string[];
    category?: Contact['category'];
    customFields?: Record<string, any>;
  };
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    contactId: string;
    error: string;
  }>;
}

// Contact search and suggestions
export interface ContactSearchRequest {
  query: string;
  filters?: Partial<ContactFilters>;
  includeHighlights?: boolean;
  fuzzyMatch?: boolean;
  page?: number;
  limit?: number;
}

export interface ContactSearchResult {
  contacts: (Contact & {
    highlights?: Record<string, string[]>;
    score?: number;
  })[];
  total: number;
  suggestions: string[];
  facets: {
    companies: Array<{ name: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
    categories: Array<{ name: string; count: number }>;
  };
}

// Contact relationships and networking
export interface ContactRelationship {
  id: string;
  sourceContactId: string;
  targetContactId: string;
  relationship:
    | 'colleague'
    | 'friend'
    | 'family'
    | 'client'
    | 'vendor'
    | 'referred_by'
    | 'referred_to'
    | 'manager'
    | 'direct_report'
    | 'other';
  description?: string;
  strength: 'weak' | 'medium' | 'strong';
  createdAt: string;
}

export interface ContactNetwork {
  contact: Contact;
  connections: Array<{
    contact: Contact;
    relationship: ContactRelationship;
    mutualConnections?: number;
  }>;
  networkStats: {
    directConnections: number;
    mutualConnections: number;
    networkReach: number;
  };
}

// Contact interaction tracking
export interface ContactInteraction {
  id: string;
  contactId: string;
  type: 'email' | 'phone' | 'meeting' | 'message' | 'note' | 'task' | 'event';
  description: string;
  direction?: 'incoming' | 'outgoing';
  outcome?: 'successful' | 'failed' | 'pending';
  metadata?: Record<string, any>;
  createdAt: string;
  scheduledAt?: string;
  completedAt?: string;
}

// Contact validation and suggestions
export interface ContactValidation {
  isValid: boolean;
  errors: Array<{
    field: keyof Contact;
    message: string;
    severity: 'error' | 'warning';
  }>;
  suggestions: Array<{
    field: keyof Contact;
    suggestion: string;
    confidence: number;
  }>;
}

export interface ContactDuplicate {
  contactId: string;
  duplicateId: string;
  similarity: number;
  matchedFields: (keyof Contact)[];
  suggestedAction: 'merge' | 'keep_both' | 'review';
}

// Contact sharing and permissions
export interface ContactSharingSettings {
  isPublic: boolean;
  allowedUsers: string[];
  permissions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    share: boolean;
  };
  expiresAt?: string;
}

// API response types
export interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: ContactFilters;
  stats?: Partial<ContactStats>;
}

// Form and validation types
export interface ContactFormData extends CreateContactRequest {
  // Additional form-specific fields
  _isSubmitting?: boolean;
  _isDirty?: boolean;
  _errors?: Record<string, string>;
}

export interface ContactValidationRules {
  firstName: { required: true; minLength: 1; maxLength: 50 };
  lastName: { required: true; minLength: 1; maxLength: 50 };
  email: { format: 'email'; unique?: boolean };
  phone: { format: 'phone' };
  website: { format: 'url' };
  notes: { maxLength: 1000 };
  tags: { maxItems: 20; itemMaxLength: 30 };
}
