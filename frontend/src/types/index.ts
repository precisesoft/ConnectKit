/**
 * Main TypeScript type definitions export file
 */

// Export all user types
export * from './user.types';

// Export all contact types
export * from './contact.types';

// Common/shared types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  timestamp?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface FormError {
  field: string;
  message: string;
}

// File upload types
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Search and filter types
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  suggestions?: string[];
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  error?: ApiError | Error | null;
  errorId?: string;
}

export interface FormState<T = any> {
  data: T;
  isDirty: boolean;
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// Theme and styling types
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: number;
  spacing: number;
}

export interface LayoutConfig {
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  headerHeight: number;
  footerHeight: number;
  contentPadding: number;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
  timestamp: number;
  read?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
  }>;
}

// Modal and dialog types
export interface ModalConfig {
  id: string;
  title: string;
  content: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
  }>;
}

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  danger?: boolean;
}

// Data export/import types
export interface ExportConfig {
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  fields?: string[];
  filename?: string;
  filters?: Record<string, any>;
}

export interface ImportConfig {
  format: 'csv' | 'json' | 'xlsx';
  mapping?: Record<string, string>;
  options?: Record<string, any>;
}

// Audit and logging types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// Analytics and metrics types
export interface Metric {
  name: string;
  value: number;
  unit?: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Component prop types
export interface BaseComponentProps {
  className?: string;
  id?: string;
  testId?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: (event: React.MouseEvent) => void;
}

export interface InputProps extends BaseComponentProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

// Hook return types
export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T>;
  loading: boolean;
  error: ApiError | null;
  reset: () => void;
}

export interface UseFormResult<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  reset: (values?: Partial<T>) => void;
  submit: () => Promise<void>;
}

// Environment and configuration types
export interface AppConfig {
  apiBaseUrl: string;
  appName: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';
  features: Record<string, boolean>;
  limits: {
    maxContacts: number;
    maxFileSize: number;
    maxImportSize: number;
  };
  integrations: {
    analytics?: {
      enabled: boolean;
      trackingId?: string;
    };
    sentry?: {
      enabled: boolean;
      dsn?: string;
    };
    stripe?: {
      enabled: boolean;
      publicKey?: string;
    };
  };
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  conditions?: Record<string, any>;
}

// Permission and role types
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
}

export interface AccessControl {
  userId: string;
  roles: Role[];
  permissions: Permission[];
  canAccess: (resource: string, action: string) => boolean;
}

// Integration types
export interface Integration {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  lastSyncAt?: string;
  errorMessage?: string;
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  signature: string;
}
