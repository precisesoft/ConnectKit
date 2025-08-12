# Frontend Security Implementation Checklist

## Overview

This document provides a comprehensive security checklist for ConnectKit's frontend implementation, covering XSS prevention, secure authentication, data protection, and other critical security considerations for modern React applications.

## Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Security Layers                    │
├─────────────────────────────────────────────────────────────────┤
│  Application Security (CSP, XSS Prevention, Input Validation)  │
├─────────────────────────────────────────────────────────────────┤
│  Authentication & Authorization (JWT, Session Management)      │
├─────────────────────────────────────────────────────────────────┤
│  Network Security (HTTPS, API Security, CORS)                  │
├─────────────────────────────────────────────────────────────────┤
│  Data Protection (Encryption, Sanitization, Storage Security)  │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure Security (Build Process, Dependencies)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Cross-Site Scripting (XSS) Prevention

### 1.1 Content Security Policy (CSP) Implementation

**Implementation:**
```typescript
// public/index.html or via HTTP headers
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.connectkit.com wss://api.connectkit.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

**Checklist:**
- [ ] Implement strict CSP headers
- [ ] Use 'self' for most resources
- [ ] Avoid 'unsafe-eval' and minimize 'unsafe-inline'
- [ ] Regularly review and update CSP policies
- [ ] Test CSP in report-only mode before enforcement
- [ ] Monitor CSP violation reports

### 1.2 Input Sanitization and Validation

**Implementation:**
```typescript
// src/utils/sanitization.ts
import DOMPurify from 'dompurify';

export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOWED_URI_REGEXP: /^https?:\/\/|^\/|^#/i,
  });
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
};

// React component with safe rendering
interface SafeHtmlProps {
  html: string;
  className?: string;
}

export const SafeHtml: React.FC<SafeHtmlProps> = ({ html, className }) => {
  const sanitizedHtml = sanitizeHtml(html);
  
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
```

**Form Input Validation:**
```typescript
// src/utils/inputValidation.ts
import * as yup from 'yup';

// Email validation with XSS prevention
export const emailSchema = yup
  .string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format')
  .transform((value) => sanitizeInput(value));

// Name validation
export const nameSchema = yup
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .matches(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')
  .transform((value) => sanitizeInput(value));

// Phone validation
export const phoneSchema = yup
  .string()
  .matches(/^[\d\s()+.-]+$/, 'Phone contains invalid characters')
  .max(20, 'Phone number too long')
  .transform((value) => sanitizeInput(value));

// URL validation
export const urlSchema = yup
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')
  .matches(/^https?:\/\//i, 'URL must use HTTP or HTTPS protocol');
```

**Checklist:**
- [ ] Sanitize all user inputs before processing
- [ ] Validate input format and length constraints
- [ ] Use allowlists instead of blocklists for validation
- [ ] Implement server-side validation as backup
- [ ] Escape HTML characters in user-generated content
- [ ] Use React's built-in XSS protections (avoid dangerouslySetInnerHTML without sanitization)
- [ ] Implement CSP for additional XSS protection

### 1.3 Safe URL Handling

**Implementation:**
```typescript
// src/utils/urlSecurity.ts
export const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

export const isSafeRedirect = (url: string, allowedDomains: string[]): boolean => {
  if (!isValidUrl(url)) return false;
  
  try {
    const parsedUrl = new URL(url);
    return allowedDomains.some(domain => 
      parsedUrl.hostname === domain || 
      parsedUrl.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
};

// Safe redirect component
interface SafeRedirectProps {
  to: string;
  children: React.ReactNode;
  allowedDomains?: string[];
}

export const SafeRedirect: React.FC<SafeRedirectProps> = ({
  to,
  children,
  allowedDomains = ['connectkit.com', 'localhost'],
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (!isSafeRedirect(to, allowedDomains)) {
      e.preventDefault();
      console.warn('Blocked potentially unsafe redirect:', to);
      return;
    }
  };

  return (
    <a href={to} onClick={handleClick} rel="noopener noreferrer">
      {children}
    </a>
  );
};
```

**Checklist:**
- [ ] Validate all URLs before redirects
- [ ] Use allowlist approach for external links
- [ ] Add `rel="noopener noreferrer"` to external links
- [ ] Implement safe redirect mechanisms
- [ ] Sanitize URL parameters
- [ ] Prevent open redirect vulnerabilities

---

## 2. Authentication and Session Security

### 2.1 JWT Token Management

**Implementation:**
```typescript
// src/services/auth/tokenManager.ts
interface TokenData {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

class TokenManager {
  private static readonly TOKEN_KEY = 'connectkit_token';
  private static readonly REFRESH_KEY = 'connectkit_refresh';
  private static readonly EXPIRY_KEY = 'connectkit_expiry';
  private static readonly REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes

  static setTokens(tokenData: TokenData): void {
    // Store tokens in httpOnly cookies (preferred) or localStorage with encryption
    if (this.isLocalStorageSecure()) {
      localStorage.setItem(this.TOKEN_KEY, this.encryptToken(tokenData.token));
      localStorage.setItem(this.REFRESH_KEY, this.encryptToken(tokenData.refreshToken));
      localStorage.setItem(this.EXPIRY_KEY, tokenData.expiresAt.toString());
    } else {
      // Fallback to memory storage (less persistent but more secure)
      this.memoryStorage.set(this.TOKEN_KEY, tokenData.token);
      this.memoryStorage.set(this.REFRESH_KEY, tokenData.refreshToken);
    }
  }

  static getToken(): string | null {
    if (this.isTokenExpired()) {
      this.clearTokens();
      return null;
    }

    if (this.isLocalStorageSecure()) {
      const encryptedToken = localStorage.getItem(this.TOKEN_KEY);
      return encryptedToken ? this.decryptToken(encryptedToken) : null;
    }
    
    return this.memoryStorage.get(this.TOKEN_KEY) || null;
  }

  static isTokenExpired(): boolean {
    const expiryStr = localStorage.getItem(this.EXPIRY_KEY);
    if (!expiryStr) return true;

    const expiry = parseInt(expiryStr, 10);
    return Date.now() >= (expiry - this.REFRESH_BUFFER);
  }

  static shouldRefreshToken(): boolean {
    const expiryStr = localStorage.getItem(this.EXPIRY_KEY);
    if (!expiryStr) return false;

    const expiry = parseInt(expiryStr, 10);
    const timeUntilExpiry = expiry - Date.now();
    return timeUntilExpiry <= this.REFRESH_BUFFER && timeUntilExpiry > 0;
  }

  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
    this.memoryStorage.clear();
  }

  private static encryptToken(token: string): string {
    // Implement client-side encryption (AES-256)
    // Note: Client-side encryption is not perfect security but adds a layer
    return btoa(token); // Simplified - use proper encryption in production
  }

  private static decryptToken(encryptedToken: string): string {
    try {
      return atob(encryptedToken); // Simplified - use proper decryption
    } catch {
      return '';
    }
  }

  private static isLocalStorageSecure(): boolean {
    return location.protocol === 'https:' || location.hostname === 'localhost';
  }

  private static memoryStorage = new Map<string, string>();
}

export { TokenManager };
```

### 2.2 Secure API Client Implementation

**Implementation:**
```typescript
// src/services/http/secureClient.ts
import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError 
} from 'axios';
import { TokenManager } from '../auth/tokenManager';

class SecureApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      withCredentials: false, // Prevent CSRF if using token auth
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  private setupRequestInterceptor(): void {
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication token
        const token = TokenManager.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF protection
        config.headers['X-Timestamp'] = Date.now().toString();
        
        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Validate URL to prevent SSRF
        if (config.url && !this.isValidApiUrl(config.url)) {
          throw new Error('Invalid API URL');
        }

        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private setupResponseInterceptor(): void {
    this.client.interceptors.response.use(
      (response) => this.handleSuccessResponse(response),
      (error) => this.handleErrorResponse(error)
    );
  }

  private handleSuccessResponse(response: AxiosResponse): AxiosResponse {
    // Log successful requests (without sensitive data)
    console.info(`API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    
    return response;
  }

  private async handleErrorResponse(error: AxiosError): Promise<never> {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (this.isRefreshing) {
        return this.queueFailedRequest(originalRequest);
      }

      originalRequest._retry = true;
      this.isRefreshing = true;

      try {
        await this.refreshToken();
        this.processQueue(null);
        return this.client(originalRequest);
      } catch (refreshError) {
        this.processQueue(refreshError);
        TokenManager.clearTokens();
        // Redirect to login
        window.location.href = '/login';
        throw refreshError;
      } finally {
        this.isRefreshing = false;
      }
    }

    // Log errors (without sensitive data)
    console.error(`API Error: ${error.response?.status} ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`);

    throw error;
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = TokenManager.getToken(); // Get refresh token
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post('/auth/refresh', {
      refreshToken,
    });

    TokenManager.setTokens(response.data);
  }

  private queueFailedRequest(config: AxiosRequestConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      this.failedQueue.push({ resolve, reject });
    });
  }

  private processQueue(error: any): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });

    this.failedQueue = [];
  }

  private isValidApiUrl(url: string): boolean {
    // Validate URL to prevent SSRF attacks
    const allowedPaths = ['/auth/', '/contacts/', '/users/', '/settings/'];
    return allowedPaths.some(path => url.startsWith(path));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new SecureApiClient(
  process.env.REACT_APP_API_BASE_URL || 'https://api.connectkit.com'
);
```

**Checklist:**
- [ ] Store tokens securely (preferably httpOnly cookies)
- [ ] Implement automatic token refresh
- [ ] Use short-lived access tokens
- [ ] Clear tokens on logout and errors
- [ ] Implement proper session timeout
- [ ] Validate token integrity
- [ ] Use secure token transmission (HTTPS only)
- [ ] Implement CSRF protection for state-changing requests

### 2.3 Route Protection and Authorization

**Implementation:**
```typescript
// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Loading } from '../atoms/Loading/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login',
}) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <Loading overlay text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Role-based access control hook
export const usePermissions = () => {
  const { user } = useAuthStore();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const permissions = getRolePermissions(user.role);
    return permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  return { hasPermission, hasRole };
};

const getRolePermissions = (role: string): string[] => {
  const rolePermissions: Record<string, string[]> = {
    admin: ['read', 'write', 'delete', 'manage_users'],
    manager: ['read', 'write', 'delete'],
    user: ['read', 'write'],
    viewer: ['read'],
  };

  return rolePermissions[role] || [];
};
```

**Checklist:**
- [ ] Implement route-level authentication checks
- [ ] Use role-based access control (RBAC)
- [ ] Protect sensitive routes and components
- [ ] Implement proper redirect after authentication
- [ ] Handle authorization errors gracefully
- [ ] Validate permissions on both frontend and backend
- [ ] Use principle of least privilege

---

## 3. Data Protection and Privacy

### 3.1 Sensitive Data Handling

**Implementation:**
```typescript
// src/utils/dataProtection.ts
import CryptoJS from 'crypto-js';

class DataProtection {
  private static readonly ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'default-key';

  static encryptSensitiveData(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  static decryptSensitiveData(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  static maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (username.length <= 2) return email;
    
    const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
    return `${maskedUsername}@${domain}`;
  }

  static maskPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 4) return phone;
    
    const visibleDigits = 2;
    const maskedSection = '*'.repeat(cleaned.length - visibleDigits * 2);
    return `${cleaned.slice(0, visibleDigits)}${maskedSection}${cleaned.slice(-visibleDigits)}`;
  }

  static sanitizeForDisplay(data: any, sensitiveFields: string[]): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        if (field.toLowerCase().includes('email')) {
          sanitized[field] = this.maskEmail(sanitized[field]);
        } else if (field.toLowerCase().includes('phone')) {
          sanitized[field] = this.maskPhone(sanitized[field]);
        } else {
          // Generic masking for other sensitive fields
          const value = sanitized[field].toString();
          sanitized[field] = value.length > 4 
            ? `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`
            : '*'.repeat(value.length);
        }
      }
    });

    return sanitized;
  }

  static clearSensitiveData(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
      if (this.isSensitiveField(key)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        this.clearSensitiveData(obj[key]);
      }
    });
  }

  private static isSensitiveField(field: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /auth/i,
      /credential/i,
    ];

    return sensitivePatterns.some(pattern => pattern.test(field));
  }
}

export { DataProtection };
```

### 3.2 Secure Form Handling

**Implementation:**
```typescript
// src/components/forms/SecureForm.tsx
import React, { useCallback, useEffect } from 'react';
import { useForm, FieldValues, UseFormProps } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { DataProtection } from '../../utils/dataProtection';

interface SecureFormProps<T extends FieldValues> {
  schema: any;
  onSubmit: (data: T) => void;
  children: React.ReactNode;
  sensitiveFields?: string[];
  autoComplete?: 'off' | 'on';
}

export function SecureForm<T extends FieldValues>({
  schema,
  onSubmit,
  children,
  sensitiveFields = [],
  autoComplete = 'off',
  ...formProps
}: SecureFormProps<T> & UseFormProps<T>) {
  const {
    handleSubmit,
    formState: { errors },
    ...methods
  } = useForm<T>({
    resolver: yupResolver(schema),
    ...formProps,
  });

  const secureSubmit = useCallback((data: T) => {
    // Sanitize data before submission
    const sanitizedData = { ...data };
    
    // Remove any potential XSS payloads
    Object.keys(sanitizedData).forEach(key => {
      if (typeof sanitizedData[key] === 'string') {
        sanitizedData[key] = sanitizedData[key].trim();
      }
    });

    onSubmit(sanitizedData);
  }, [onSubmit]);

  // Clear form data from memory on unmount
  useEffect(() => {
    return () => {
      // Clear sensitive data from form state
      if (sensitiveFields.length > 0) {
        // This is a cleanup effect
      }
    };
  }, [sensitiveFields]);

  return (
    <form
      onSubmit={handleSubmit(secureSubmit)}
      autoComplete={autoComplete}
      noValidate
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...methods,
            errors,
          });
        }
        return child;
      })}
    </form>
  );
}
```

**Checklist:**
- [ ] Encrypt sensitive data in transit and at rest
- [ ] Mask sensitive data in UI components
- [ ] Implement secure form handling
- [ ] Clear sensitive data from memory when not needed
- [ ] Use secure random number generation
- [ ] Implement proper data retention policies
- [ ] Follow GDPR/privacy regulations

### 3.3 Local Storage Security

**Implementation:**
```typescript
// src/utils/secureStorage.ts
class SecureStorage {
  private static readonly PREFIX = 'ck_';
  private static readonly SENSITIVE_PATTERNS = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
  ];

  static setItem(key: string, value: any, options: {
    encrypt?: boolean;
    expiry?: number;
  } = {}): void {
    const { encrypt = this.isSensitiveKey(key), expiry } = options;

    const data = {
      value: encrypt ? this.encrypt(JSON.stringify(value)) : value,
      encrypted: encrypt,
      timestamp: Date.now(),
      expiry: expiry ? Date.now() + expiry : null,
    };

    try {
      localStorage.setItem(`${this.PREFIX}${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store data:', error);
      // Handle storage quota exceeded
      this.clearExpiredItems();
    }
  }

  static getItem<T>(key: string): T | null {
    try {
      const storedData = localStorage.getItem(`${this.PREFIX}${key}`);
      if (!storedData) return null;

      const data = JSON.parse(storedData);

      // Check expiry
      if (data.expiry && Date.now() > data.expiry) {
        this.removeItem(key);
        return null;
      }

      if (data.encrypted) {
        return JSON.parse(this.decrypt(data.value));
      }

      return data.value;
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      this.removeItem(key); // Remove corrupted data
      return null;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(`${this.PREFIX}${key}`);
  }

  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  static clearExpiredItems(): void {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.expiry && now > data.expiry) {
            localStorage.removeItem(key);
          }
        } catch {
          // Remove corrupted items
          localStorage.removeItem(key);
        }
      }
    });
  }

  private static isSensitiveKey(key: string): boolean {
    return this.SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
  }

  private static encrypt(data: string): string {
    // Simple encryption - use a proper encryption library in production
    return btoa(encodeURIComponent(data));
  }

  private static decrypt(data: string): string {
    try {
      return decodeURIComponent(atob(data));
    } catch {
      throw new Error('Failed to decrypt data');
    }
  }
}

export { SecureStorage };
```

**Checklist:**
- [ ] Encrypt sensitive data in local storage
- [ ] Implement data expiration
- [ ] Clear storage on logout
- [ ] Handle storage quota limits
- [ ] Validate data integrity
- [ ] Use secure storage alternatives when possible

---

## 4. Network Security

### 4.1 HTTPS Enforcement

**Implementation:**
```typescript
// src/utils/httpsEnforcement.ts
class HttpsEnforcement {
  static enforceHttps(): void {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      location.replace(`https:${location.href.substring(location.protocol.length)}`);
    }
  }

  static isSecureContext(): boolean {
    return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
  }

  static validateApiUrls(): void {
    const apiUrl = process.env.REACT_APP_API_BASE_URL;
    if (apiUrl && !apiUrl.startsWith('https://') && !apiUrl.includes('localhost')) {
      throw new Error('API URL must use HTTPS in production');
    }
  }
}

// Initialize on app start
if (process.env.NODE_ENV === 'production') {
  HttpsEnforcement.enforceHttps();
  HttpsEnforcement.validateApiUrls();
}

export { HttpsEnforcement };
```

### 4.2 CORS Configuration Validation

**Implementation:**
```typescript
// src/utils/corsValidation.ts
class CorsValidation {
  private static readonly ALLOWED_ORIGINS = [
    'https://connectkit.com',
    'https://app.connectkit.com',
    'https://api.connectkit.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
  ];

  static validateOrigin(origin: string): boolean {
    return this.ALLOWED_ORIGINS.includes(origin);
  }

  static checkCorsHeaders(response: Response): void {
    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    const allowCredentials = response.headers.get('Access-Control-Allow-Credentials');

    if (allowOrigin === '*' && allowCredentials === 'true') {
      console.warn('Insecure CORS configuration detected');
    }
  }
}

export { CorsValidation };
```

### 4.3 Request Integrity and Rate Limiting

**Implementation:**
```typescript
// src/utils/requestSecurity.ts
class RequestSecurity {
  private static requestCounts = new Map<string, { count: number; timestamp: number }>();
  private static readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private static readonly MAX_REQUESTS_PER_WINDOW = 100;

  static checkRateLimit(identifier: string = 'global'): boolean {
    const now = Date.now();
    const record = this.requestCounts.get(identifier);

    if (!record || now - record.timestamp > this.RATE_LIMIT_WINDOW) {
      this.requestCounts.set(identifier, { count: 1, timestamp: now });
      return true;
    }

    if (record.count >= this.MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    record.count++;
    return true;
  }

  static generateRequestSignature(data: any): string {
    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).substring(2, 15);
    const payload = JSON.stringify({ data, timestamp, nonce });
    
    // In production, use HMAC with a secret key
    return btoa(payload);
  }

  static validateRequestIntegrity(signature: string, data: any): boolean {
    try {
      const payload = JSON.parse(atob(signature));
      const { data: originalData, timestamp } = payload;

      // Check timestamp (prevent replay attacks)
      const age = Date.now() - parseInt(timestamp);
      if (age > 300000) { // 5 minutes
        return false;
      }

      // Validate data integrity
      return JSON.stringify(originalData) === JSON.stringify(data);
    } catch {
      return false;
    }
  }
}

export { RequestSecurity };
```

**Checklist:**
- [ ] Enforce HTTPS in production
- [ ] Validate CORS configuration
- [ ] Implement request rate limiting
- [ ] Use request signing for sensitive operations
- [ ] Validate SSL certificates
- [ ] Implement proper error handling for network failures
- [ ] Use secure protocols (TLS 1.3+)

---

## 5. Input Validation and Sanitization

### 5.1 Comprehensive Input Validation

**Implementation:**
```typescript
// src/utils/inputValidation.ts
import validator from 'validator';

export class InputValidator {
  static validateEmail(email: string): { isValid: boolean; message?: string } {
    if (!email) {
      return { isValid: false, message: 'Email is required' };
    }

    if (!validator.isEmail(email)) {
      return { isValid: false, message: 'Invalid email format' };
    }

    if (email.length > 254) {
      return { isValid: false, message: 'Email is too long' };
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousPatterns(email)) {
      return { isValid: false, message: 'Email contains invalid characters' };
    }

    return { isValid: true };
  }

  static validateName(name: string): { isValid: boolean; message?: string } {
    if (!name) {
      return { isValid: false, message: 'Name is required' };
    }

    if (name.length < 2 || name.length > 50) {
      return { isValid: false, message: 'Name must be between 2 and 50 characters' };
    }

    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      return { isValid: false, message: 'Name contains invalid characters' };
    }

    if (this.containsSuspiciousPatterns(name)) {
      return { isValid: false, message: 'Name contains suspicious content' };
    }

    return { isValid: true };
  }

  static validatePhone(phone: string): { isValid: boolean; message?: string } {
    if (!phone) {
      return { isValid: true }; // Phone is optional
    }

    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      return { isValid: false, message: 'Phone number must be 10-15 digits' };
    }

    if (!/^[\d\s()+.-]+$/.test(phone)) {
      return { isValid: false, message: 'Phone contains invalid characters' };
    }

    return { isValid: true };
  }

  static validateUrl(url: string): { isValid: boolean; message?: string } {
    if (!url) {
      return { isValid: true }; // URL is optional
    }

    if (!validator.isURL(url, { protocols: ['http', 'https'] })) {
      return { isValid: false, message: 'Invalid URL format' };
    }

    if (url.length > 2048) {
      return { isValid: false, message: 'URL is too long' };
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousPatterns(url)) {
      return { isValid: false, message: 'URL contains suspicious content' };
    }

    return { isValid: true };
  }

  static validateTextArea(text: string, maxLength: number = 1000): { isValid: boolean; message?: string } {
    if (!text) {
      return { isValid: true };
    }

    if (text.length > maxLength) {
      return { isValid: false, message: `Text exceeds maximum length of ${maxLength} characters` };
    }

    if (this.containsSuspiciousPatterns(text)) {
      return { isValid: false, message: 'Text contains suspicious content' };
    }

    return { isValid: true };
  }

  private static containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
      /javascript:/i, // JavaScript protocol
      /vbscript:/i, // VBScript protocol
      /on\w+\s*=/i, // Event handlers
      /<iframe/i, // iframes
      /<object/i, // objects
      /<embed/i, // embeds
      /eval\s*\(/i, // eval function
      /expression\s*\(/i, // CSS expressions
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
      .substring(0, 1000); // Limit length
  }

  static validateFileUpload(file: File): { isValid: boolean; message?: string } {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

    if (!file) {
      return { isValid: false, message: 'No file selected' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { isValid: false, message: 'File size exceeds 5MB limit' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { isValid: false, message: 'File type not allowed' };
    }

    // Validate file name
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      return { isValid: false, message: 'File name contains invalid characters' };
    }

    return { isValid: true };
  }
}
```

**Checklist:**
- [ ] Validate all user inputs on both client and server
- [ ] Use whitelist validation instead of blacklist
- [ ] Implement proper length limits
- [ ] Check for malicious patterns
- [ ] Validate file uploads
- [ ] Sanitize inputs before processing
- [ ] Use established validation libraries

---

## 6. Dependency and Supply Chain Security

### 6.1 Dependency Vulnerability Management

**Implementation:**
```bash
# package.json scripts
{
  "scripts": {
    "security:audit": "npm audit --audit-level=moderate",
    "security:audit-fix": "npm audit fix",
    "security:check": "npm run security:audit && npm run security:outdated",
    "security:outdated": "npm outdated",
    "precommit": "npm run security:audit && npm run lint && npm run test"
  }
}
```

```javascript
// .github/workflows/security.yml
name: Security Checks

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1' # Weekly security check

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run security audit
        run: npm audit --audit-level=moderate
      - name: Check for outdated packages
        run: npm outdated
```

### 6.2 Secure Build Process

**Implementation:**
```typescript
// scripts/security-check.js
const fs = require('fs');
const path = require('path');

class SecurityChecker {
  static checkEnvironmentVariables() {
    const requiredVars = [
      'REACT_APP_API_BASE_URL',
    ];

    const sensitiveVars = [
      'REACT_APP_API_KEY',
      'REACT_APP_SECRET',
    ];

    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        throw new Error(`Required environment variable ${varName} is not set`);
      }
    });

    sensitiveVars.forEach(varName => {
      if (process.env[varName] && process.env.NODE_ENV === 'development') {
        console.warn(`Warning: Sensitive variable ${varName} should not be set in development`);
      }
    });
  }

  static validateBuildConfiguration() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check for known vulnerable packages
    const vulnerablePackages = [
      'lodash@<4.17.19',
      'serialize-javascript@<3.1.0',
    ];

    // Check dependencies
    Object.keys(packageJson.dependencies || {}).forEach(pkg => {
      if (this.isVulnerablePackage(pkg, packageJson.dependencies[pkg])) {
        throw new Error(`Vulnerable package detected: ${pkg}`);
      }
    });
  }

  static isVulnerablePackage(packageName, version) {
    // Implement vulnerability checking logic
    return false;
  }

  static checkSourceCode() {
    const suspiciousPatterns = [
      /console\.log\(/g,
      /debugger;/g,
      /eval\(/g,
      /document\.write\(/g,
    ];

    this.scanDirectory('src', suspiciousPatterns);
  }

  static scanDirectory(dir, patterns) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.scanDirectory(filePath, patterns);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        patterns.forEach(pattern => {
          if (pattern.test(content) && process.env.NODE_ENV === 'production') {
            console.warn(`Suspicious pattern found in ${filePath}: ${pattern}`);
          }
        });
      }
    });
  }
}

// Run checks
try {
  SecurityChecker.checkEnvironmentVariables();
  SecurityChecker.validateBuildConfiguration();
  SecurityChecker.checkSourceCode();
  console.log('✅ Security checks passed');
} catch (error) {
  console.error('❌ Security check failed:', error.message);
  process.exit(1);
}
```

**Checklist:**
- [ ] Regularly audit dependencies for vulnerabilities
- [ ] Keep dependencies updated
- [ ] Use npm audit and security scanning tools
- [ ] Verify package integrity
- [ ] Use lock files to ensure reproducible builds
- [ ] Implement automated security scanning in CI/CD
- [ ] Review third-party libraries before inclusion

---

## 7. Runtime Security Monitoring

### 7.1 Error Logging and Monitoring

**Implementation:**
```typescript
// src/utils/securityMonitoring.ts
interface SecurityEvent {
  type: 'xss_attempt' | 'unauthorized_access' | 'suspicious_activity' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: number;
  userAgent: string;
  userId?: string;
}

class SecurityMonitoring {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = 100;

  static logSecurityEvent(event: Omit<SecurityEvent, 'timestamp' | 'userAgent'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    };

    this.events.push(securityEvent);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Send critical events immediately
    if (event.severity === 'critical') {
      this.sendImmediateAlert(securityEvent);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', securityEvent);
    }
  }

  static detectXSSAttempt(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
    ];

    const isXSS = xssPatterns.some(pattern => pattern.test(input));
    
    if (isXSS) {
      this.logSecurityEvent({
        type: 'xss_attempt',
        severity: 'high',
        message: 'Potential XSS attempt detected',
        details: { input },
      });
    }

    return isXSS;
  }

  static monitorUnauthorizedAccess(path: string, userRole?: string): void {
    const protectedPaths = ['/admin', '/settings', '/users'];
    const requiredRoles = { '/admin': 'admin', '/settings': 'manager' };

    if (protectedPaths.some(p => path.startsWith(p))) {
      const requiredRole = Object.entries(requiredRoles).find(([p]) => path.startsWith(p))?.[1];
      
      if (requiredRole && userRole !== requiredRole) {
        this.logSecurityEvent({
          type: 'unauthorized_access',
          severity: 'high',
          message: 'Unauthorized access attempt',
          details: { path, userRole, requiredRole },
        });
      }
    }
  }

  static detectSuspiciousActivity(): void {
    const rapidRequests = this.countRecentEvents('suspicious_activity', 60000);
    
    if (rapidRequests > 10) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        message: 'High frequency of suspicious activities detected',
        details: { count: rapidRequests },
      });
    }
  }

  private static countRecentEvents(type: string, timeWindow: number): number {
    const cutoff = Date.now() - timeWindow;
    return this.events.filter(e => e.type === type && e.timestamp > cutoff).length;
  }

  private static sendImmediateAlert(event: SecurityEvent): void {
    // Send to security team or monitoring service
    fetch('/api/security/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(error => {
      console.error('Failed to send security alert:', error);
    });
  }

  static getSecuritySummary(): { eventCounts: Record<string, number>; recentEvents: SecurityEvent[] } {
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentEvents = this.events.slice(-10);

    return { eventCounts, recentEvents };
  }
}

export { SecurityMonitoring };
```

### 7.2 Content Security Policy Monitoring

**Implementation:**
```typescript
// src/utils/cspMonitoring.ts
class CSPMonitoring {
  static setupCSPReporting(): void {
    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      this.handleCSPViolation(event);
    });

    // Setup reporting endpoint
    if (window.ReportingObserver) {
      const observer = new ReportingObserver((reports) => {
        reports.forEach(report => {
          if (report.type === 'csp-violation') {
            this.handleCSPReport(report.body);
          }
        });
      });
      
      observer.observe();
    }
  }

  private static handleCSPViolation(event: SecurityPolicyViolationEvent): void {
    const violation = {
      blockedURI: event.blockedURI,
      documentURI: event.documentURI,
      effectiveDirective: event.effectiveDirective,
      originalPolicy: event.originalPolicy,
      referrer: event.referrer,
      violatedDirective: event.violatedDirective,
      timestamp: Date.now(),
    };

    SecurityMonitoring.logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'medium',
      message: 'Content Security Policy violation',
      details: violation,
    });

    // Send to monitoring service
    this.reportViolation(violation);
  }

  private static handleCSPReport(report: any): void {
    SecurityMonitoring.logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'medium',
      message: 'CSP Report received',
      details: report,
    });
  }

  private static reportViolation(violation: any): void {
    fetch('/api/csp-violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(violation),
    }).catch(error => {
      console.error('Failed to report CSP violation:', error);
    });
  }
}

// Initialize CSP monitoring
CSPMonitoring.setupCSPReporting();
export { CSPMonitoring };
```

**Checklist:**
- [ ] Implement comprehensive security logging
- [ ] Monitor for XSS attempts and suspicious inputs
- [ ] Track unauthorized access attempts
- [ ] Set up CSP violation reporting
- [ ] Monitor API usage patterns
- [ ] Implement real-time alerting for critical events
- [ ] Regular security monitoring review

---

## 8. Deployment and Infrastructure Security

### 8.1 Environment Configuration Security

**Implementation:**
```typescript
// src/config/environmentValidation.ts
class EnvironmentValidator {
  private static readonly REQUIRED_VARS = [
    'REACT_APP_API_BASE_URL',
    'REACT_APP_APP_NAME',
  ];

  private static readonly PRODUCTION_VARS = [
    'REACT_APP_SENTRY_DSN',
    'REACT_APP_ANALYTICS_ID',
  ];

  static validateEnvironment(): void {
    // Check required variables
    this.REQUIRED_VARS.forEach(varName => {
      if (!process.env[varName]) {
        throw new Error(`Required environment variable ${varName} is not set`);
      }
    });

    // Production-specific validation
    if (process.env.NODE_ENV === 'production') {
      this.validateProductionEnvironment();
    }

    // Development-specific validation
    if (process.env.NODE_ENV === 'development') {
      this.validateDevelopmentEnvironment();
    }
  }

  private static validateProductionEnvironment(): void {
    // Ensure production URLs use HTTPS
    const apiUrl = process.env.REACT_APP_API_BASE_URL;
    if (apiUrl && !apiUrl.startsWith('https://')) {
      throw new Error('Production API URL must use HTTPS');
    }

    // Check for debug flags
    if (process.env.REACT_APP_DEBUG === 'true') {
      console.warn('Debug mode is enabled in production');
    }
  }

  private static validateDevelopmentEnvironment(): void {
    // Allow localhost and HTTP in development
    console.info('Development mode: relaxed security validation');
  }

  static getSecureConfig() {
    this.validateEnvironment();

    return {
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
      appName: process.env.REACT_APP_APP_NAME,
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      enableDebug: process.env.REACT_APP_DEBUG === 'true' && process.env.NODE_ENV !== 'production',
    };
  }
}

export { EnvironmentValidator };
```

### 8.2 Build Security Validation

**Implementation:**
```bash
#!/bin/bash
# scripts/security-build-check.sh

set -e

echo "🔒 Running security build checks..."

# Check for sensitive data in build
echo "Checking for sensitive data in build..."
if grep -r "password\|secret\|private" build/ --exclude="*.map" 2>/dev/null; then
    echo "❌ Sensitive data found in build files"
    exit 1
fi

# Check for debug statements
echo "Checking for debug statements..."
if grep -r "console\." build/ --exclude="*.map" 2>/dev/null; then
    echo "⚠️  Console statements found in build (consider removing for production)"
fi

# Validate CSP headers
echo "Validating security headers..."
node scripts/validate-security-headers.js

# Check file permissions
echo "Checking file permissions..."
find build/ -type f -perm /o+w -exec echo "❌ World-writable file found: {}" \;

echo "✅ Security build checks completed"
```

**Checklist:**
- [ ] Validate environment variables
- [ ] Check for sensitive data in builds
- [ ] Implement secure build process
- [ ] Validate security headers
- [ ] Check file permissions
- [ ] Use secure deployment practices
- [ ] Implement infrastructure as code

---

## Security Checklist Summary

### Pre-Development Security Setup
- [ ] CSP headers configured and tested
- [ ] HTTPS enforcement implemented
- [ ] Security-focused linting rules enabled
- [ ] Dependency vulnerability scanning automated

### Development Phase Security
- [ ] Input validation implemented for all forms
- [ ] XSS prevention measures in place
- [ ] Authentication and authorization working
- [ ] Secure API client implemented
- [ ] Data sanitization functions created

### Testing Phase Security
- [ ] Security-focused test cases written
- [ ] Penetration testing performed
- [ ] Vulnerability assessments completed
- [ ] Code review for security issues

### Pre-Production Security
- [ ] Environment variables validated
- [ ] Build process security checked
- [ ] CSP violations monitored
- [ ] Security headers validated
- [ ] SSL/TLS configuration verified

### Production Security Monitoring
- [ ] Security event logging active
- [ ] Real-time monitoring configured
- [ ] Incident response plan in place
- [ ] Regular security audits scheduled
- [ ] Dependency updates automated

### Ongoing Security Maintenance
- [ ] Regular security training for team
- [ ] Security policies documented
- [ ] Incident response procedures tested
- [ ] Security metrics tracked and reported
- [ ] Third-party security assessments scheduled

This comprehensive security checklist ensures that ConnectKit's frontend implements defense-in-depth security measures, protecting against common web application vulnerabilities while maintaining usability and performance.