# Backend Security Implementation Checklist

## Overview

This comprehensive security checklist ensures the ConnectKit backend API follows security best practices and mitigates common vulnerabilities. Each item includes implementation details, validation criteria, and testing approaches.

## OWASP Top 10 Mitigation Checklist

### A01:2021 – Broken Access Control

#### Authentication Security
- [ ] **JWT Token Security**
  - [ ] Use strong, random secret keys (minimum 256 bits)
  - [ ] Implement short-lived access tokens (15-30 minutes)
  - [ ] Use separate refresh tokens with longer expiry (7 days)
  - [ ] Store refresh tokens securely with HttpOnly cookies in web clients
  - [ ] Implement token blacklisting/revocation mechanism
  
  **Implementation:**
  ```typescript
  // src/infrastructure/auth/JWTService.ts
  export class JWTService {
    private readonly ACCESS_TOKEN_EXPIRY = '15m';
    private readonly REFRESH_TOKEN_EXPIRY = '7d';
    private readonly MIN_SECRET_LENGTH = 32;
    
    constructor() {
      if (this.accessTokenSecret.length < this.MIN_SECRET_LENGTH) {
        throw new Error('JWT secret must be at least 32 characters');
      }
    }
    
    generateTokenPair(payload: JWTPayload): TokenPair {
      const accessToken = jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        issuer: 'connectkit-api',
        audience: 'connectkit-client',
        algorithm: 'HS256'
      });
      
      const refreshToken = jwt.sign(
        { userId: payload.userId, type: 'refresh' },
        this.refreshTokenSecret,
        { expiresIn: this.REFRESH_TOKEN_EXPIRY }
      );
      
      return { accessToken, refreshToken };
    }
  }
  ```
  
  **Test Validation:**
  ```typescript
  it('should reject tokens with invalid signature', async () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
    expect(() => jwtService.verifyAccessToken(invalidToken)).toThrow(UnauthorizedError);
  });
  ```

- [ ] **Multi-Factor Authentication (MFA)**
  - [ ] Implement TOTP-based MFA using libraries like `speakeasy`
  - [ ] Require MFA for admin users
  - [ ] Store MFA secrets encrypted in database
  - [ ] Implement backup codes for MFA recovery
  
  **Implementation:**
  ```typescript
  // src/application/services/MFAService.ts
  export class MFAService {
    async generateMFASecret(userId: string): Promise<MFASetupResponse> {
      const secret = speakeasy.generateSecret({
        name: `ConnectKit (${user.email})`,
        issuer: 'ConnectKit'
      });
      
      const encryptedSecret = await this.cryptoService.encrypt(secret.base32);
      await this.userRepository.storeMFASecret(userId, encryptedSecret);
      
      return {
        secret: secret.base32,
        qrCode: secret.otpauth_url,
        backupCodes: await this.generateBackupCodes(userId)
      };
    }
  }
  ```

- [ ] **Session Management**
  - [ ] Implement secure session storage with Redis
  - [ ] Set proper session timeout (30 minutes idle)
  - [ ] Invalidate sessions on password change
  - [ ] Track concurrent sessions per user
  - [ ] Implement session fixation protection
  
  **Implementation:**
  ```typescript
  // src/infrastructure/auth/SessionService.ts
  export class SessionService {
    private readonly SESSION_TIMEOUT = 30 * 60; // 30 minutes
    
    async createSession(userId: string): Promise<string> {
      const sessionId = crypto.randomUUID();
      const sessionData = {
        userId,
        createdAt: new Date(),
        lastActivity: new Date(),
        ipAddress: this.request.ip,
        userAgent: this.request.headers['user-agent']
      };
      
      await this.redis.setex(
        `session:${sessionId}`,
        this.SESSION_TIMEOUT,
        JSON.stringify(sessionData)
      );
      
      return sessionId;
    }
  }
  ```

#### Authorization Security
- [ ] **Role-Based Access Control (RBAC)**
  - [ ] Define granular permissions for each resource
  - [ ] Implement role inheritance (admin > manager > user)
  - [ ] Use middleware to check permissions before controller execution
  - [ ] Default deny approach for undefined permissions
  
  **Implementation:**
  ```typescript
  // src/presentation/middleware/authorization.ts
  export const authorize = (permissions: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      const userPermissions = await this.permissionService.getUserPermissions(user.userId);
      const hasPermission = permissions.every(perm => userPermissions.includes(perm));
      
      if (!hasPermission) {
        throw new ForbiddenError('Insufficient permissions');
      }
      
      next();
    };
  };
  ```

- [ ] **Tenant Isolation**
  - [ ] Ensure all database queries include tenant filter
  - [ ] Validate tenant access in middleware
  - [ ] Use row-level security policies in PostgreSQL
  - [ ] Audit cross-tenant access attempts
  
  **Implementation:**
  ```typescript
  // src/presentation/middleware/tenant-isolation.ts
  export const tenantIsolation = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.tenantId) {
      throw new UnauthorizedError('Invalid tenant context');
    }
    
    // Add tenant filter to all queries
    req.tenantId = req.user.tenantId;
    next();
  };
  
  // PostgreSQL Row Level Security
  CREATE POLICY tenant_isolation_policy ON contacts
    FOR ALL TO application_user
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
  ```

### A02:2021 – Cryptographic Failures

#### Data Encryption
- [ ] **Encryption at Rest**
  - [ ] Use AES-256-GCM for field-level encryption
  - [ ] Implement key rotation mechanism
  - [ ] Store encryption keys in separate key management service
  - [ ] Encrypt PII fields (email, phone, address)
  
  **Implementation:**
  ```typescript
  // src/shared/utils/crypto.ts
  export class CryptoService {
    private readonly ALGORITHM = 'aes-256-gcm';
    private readonly KEY_LENGTH = 32;
    
    async encrypt(plaintext: string): Promise<EncryptedData> {
      const key = await this.getEncryptionKey();
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(this.ALGORITHM, key, iv);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        data: encrypted,
        iv: iv.toString('hex'),
        authTag: cipher.getAuthTag().toString('hex')
      };
    }
    
    async decrypt(encryptedData: EncryptedData): Promise<string> {
      const key = await this.getEncryptionKey();
      const decipher = crypto.createDecipher(
        this.ALGORITHM,
        key,
        Buffer.from(encryptedData.iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    }
  }
  ```

- [ ] **Encryption in Transit**
  - [ ] Enforce TLS 1.3 for all connections
  - [ ] Use HSTS headers with long max-age
  - [ ] Implement certificate pinning for mobile clients
  - [ ] Disable insecure TLS versions and cipher suites
  
  **Implementation:**
  ```typescript
  // src/app.ts
  app.use(helmet({
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.connectkit.com"]
      }
    }
  }));
  ```

#### Password Security
- [ ] **Password Hashing**
  - [ ] Use bcrypt with minimum 12 rounds
  - [ ] Implement password strength requirements
  - [ ] Hash passwords on separate thread to prevent DoS
  - [ ] Store password history to prevent reuse
  
  **Implementation:**
  ```typescript
  // src/infrastructure/auth/PasswordService.ts
  export class PasswordService {
    private readonly SALT_ROUNDS = 12;
    private readonly MIN_LENGTH = 12;
    private readonly COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    
    async hash(password: string): Promise<string> {
      this.validatePassword(password);
      return bcrypt.hash(password, this.SALT_ROUNDS);
    }
    
    private validatePassword(password: string): void {
      if (password.length < this.MIN_LENGTH) {
        throw new ValidationError('Password must be at least 12 characters long');
      }
      
      if (!this.COMPLEXITY_REGEX.test(password)) {
        throw new ValidationError(
          'Password must contain uppercase, lowercase, number, and special character'
        );
      }
    }
  }
  ```

### A03:2021 – Injection

#### SQL Injection Prevention
- [ ] **Parameterized Queries**
  - [ ] Use parameterized queries for all database operations
  - [ ] Validate and sanitize all input parameters
  - [ ] Use ORM/Query Builder with built-in protections
  - [ ] Implement database query monitoring
  
  **Implementation:**
  ```typescript
  // src/infrastructure/database/repositories/BaseRepository.ts
  export abstract class BaseRepository<T> {
    protected async executeQuery<R>(
      query: string,
      params: any[] = []
    ): Promise<R[]> {
      // Log query for security monitoring
      this.logger.debug('Executing query', {
        query: this.sanitizeQueryForLogging(query),
        paramCount: params.length
      });
      
      try {
        const result = await this.db.query(query, params);
        return result.rows;
      } catch (error) {
        this.logger.error('Database query error', { error, query });
        throw new DatabaseError('Query execution failed');
      }
    }
    
    private sanitizeQueryForLogging(query: string): string {
      // Remove sensitive data from logs
      return query.replace(/\$\d+/g, '?');
    }
  }
  ```

- [ ] **Input Validation**
  - [ ] Validate all input using Joi or Zod schemas
  - [ ] Sanitize input to remove potentially dangerous characters
  - [ ] Use whitelist validation instead of blacklist
  - [ ] Implement type checking at runtime
  
  **Implementation:**
  ```typescript
  // src/presentation/validators/contact.ts
  export const createContactSchema = Joi.object({
    firstName: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .pattern(/^[a-zA-Z\s\-']+$/)
      .required(),
    
    email: Joi.array()
      .items(Joi.string().email().lowercase())
      .min(1)
      .required(),
      
    phone: Joi.array()
      .items(Joi.string().pattern(/^\+?[1-9]\d{1,14}$/))
      .optional(),
      
    customFields: Joi.object()
      .pattern(Joi.string(), Joi.alternatives().try(
        Joi.string().max(1000),
        Joi.number(),
        Joi.boolean(),
        Joi.date()
      ))
      .optional()
  });
  ```

#### NoSQL Injection Prevention
- [ ] **MongoDB/Redis Security**
  - [ ] Sanitize NoSQL queries using express-mongo-sanitize
  - [ ] Use schema validation for document databases
  - [ ] Avoid dynamic query construction
  - [ ] Implement query complexity limits
  
  **Implementation:**
  ```typescript
  // src/app.ts
  import mongoSanitize from 'express-mongo-sanitize';
  
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      this.logger.warn('NoSQL injection attempt detected', {
        key,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
    }
  }));
  ```

### A04:2021 – Insecure Design

#### Secure Architecture
- [ ] **Defense in Depth**
  - [ ] Implement multiple security layers
  - [ ] Use fail-secure defaults
  - [ ] Apply principle of least privilege
  - [ ] Segregate sensitive operations
  
  **Implementation:**
  ```typescript
  // src/application/services/SecurityService.ts
  export class SecurityService {
    async validateSensitiveOperation(
      operation: string,
      userId: string,
      context: SecurityContext
    ): Promise<void> {
      // Multiple validation layers
      await this.validateUserPermissions(userId, operation);
      await this.validateRateLimit(userId, operation);
      await this.validateGeoLocation(context.ipAddress);
      await this.validateDeviceFingerprint(context.deviceId);
      
      // Log security-sensitive operations
      this.auditLogger.logSecurityOperation(operation, userId, context);
    }
  }
  ```

- [ ] **Business Logic Security**
  - [ ] Validate business rules at application layer
  - [ ] Implement workflow state validation
  - [ ] Use finite state machines for complex processes
  - [ ] Validate user context for operations
  
  **Implementation:**
  ```typescript
  // src/domain/entities/Contact.ts
  export class Contact {
    update(changes: Partial<ContactData>, userId: string): Contact {
      // Business rule validation
      if (changes.email && this.isArchived) {
        throw new BusinessRuleViolationError('Cannot modify archived contact');
      }
      
      if (changes.tenantId && changes.tenantId !== this.tenantId) {
        throw new SecurityViolationError('Cannot change contact tenant');
      }
      
      // Validate user can modify this contact
      if (!this.canBeModifiedBy(userId)) {
        throw new UnauthorizedError('User cannot modify this contact');
      }
      
      return new Contact({
        ...this.data,
        ...changes,
        lastModifiedBy: userId,
        updatedAt: new Date(),
        version: this.version + 1
      });
    }
  }
  ```

### A05:2021 – Security Misconfiguration

#### Server Configuration
- [ ] **HTTP Security Headers**
  - [ ] Implement comprehensive security headers
  - [ ] Use Content Security Policy (CSP)
  - [ ] Set proper CORS configuration
  - [ ] Disable unnecessary HTTP methods
  
  **Implementation:**
  ```typescript
  // src/presentation/middleware/security.ts
  export const securityHeaders = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: "same-origin" },
    xssFilter: true,
  });
  ```

- [ ] **Environment Configuration**
  - [ ] Use environment-specific configurations
  - [ ] Validate all environment variables
  - [ ] Use secrets management for sensitive data
  - [ ] Implement configuration validation
  
  **Implementation:**
  ```typescript
  // src/shared/config/app-config.ts
  export class AppConfig {
    private static instance: AppConfig;
    private config: ConfigData;
    
    constructor() {
      this.config = this.validateConfig({
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: parseInt(process.env.PORT || '3001'),
        DB_HOST: this.requireEnv('DB_HOST'),
        DB_PASSWORD: this.requireEnv('DB_PASSWORD'),
        JWT_ACCESS_SECRET: this.requireEnv('JWT_ACCESS_SECRET'),
        JWT_REFRESH_SECRET: this.requireEnv('JWT_REFRESH_SECRET'),
        ENCRYPTION_KEY: this.requireEnv('ENCRYPTION_KEY'),
      });
    }
    
    private requireEnv(key: string): string {
      const value = process.env[key];
      if (!value) {
        throw new Error(`Required environment variable ${key} is not set`);
      }
      return value;
    }
    
    private validateConfig(config: any): ConfigData {
      const schema = Joi.object({
        NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
        PORT: Joi.number().port().required(),
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        DB_PASSWORD: Joi.string().min(8).required(),
        ENCRYPTION_KEY: Joi.string().length(64).required(), // 32 bytes in hex
      });
      
      const { error, value } = schema.validate(config);
      if (error) {
        throw new Error(`Configuration validation error: ${error.message}`);
      }
      
      return value;
    }
  }
  ```

### A06:2021 – Vulnerable and Outdated Components

#### Dependency Security
- [ ] **Dependency Management**
  - [ ] Use npm audit to scan for vulnerabilities
  - [ ] Implement automated dependency updates
  - [ ] Pin specific versions in production
  - [ ] Monitor security advisories
  
  **Implementation:**
  ```bash
  # package.json
  {
    "scripts": {
      "security:audit": "npm audit --audit-level=moderate",
      "security:fix": "npm audit fix",
      "security:check": "npm outdated && npm audit"
    }
  }
  
  # GitHub Actions workflow
  - name: Security audit
    run: |
      npm audit --audit-level=moderate
      npx audit-ci --config audit-ci.json
  ```

- [ ] **Component Scanning**
  - [ ] Use Snyk or similar tools for vulnerability scanning
  - [ ] Implement license compliance checking
  - [ ] Monitor for end-of-life dependencies
  - [ ] Use software composition analysis (SCA)
  
  **Implementation:**
  ```yaml
  # .github/workflows/security.yml
  name: Security Scan
  on: [push, pull_request]
  jobs:
    security:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - name: Run Snyk Security Scan
          uses: snyk/actions/node@master
          env:
            SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
          with:
            args: --severity-threshold=high
  ```

### A07:2021 – Identification and Authentication Failures

#### Account Security
- [ ] **Account Lockout**
  - [ ] Implement account lockout after failed attempts
  - [ ] Use progressive delays for repeated failures
  - [ ] Implement CAPTCHA after multiple failures
  - [ ] Monitor and alert on brute force attempts
  
  **Implementation:**
  ```typescript
  // src/application/services/AccountSecurityService.ts
  export class AccountSecurityService {
    private readonly MAX_ATTEMPTS = 5;
    private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    
    async checkAccountSecurity(email: string, ipAddress: string): Promise<void> {
      const attempts = await this.getFailedAttempts(email);
      const ipAttempts = await this.getIPAttempts(ipAddress);
      
      if (attempts >= this.MAX_ATTEMPTS) {
        throw new AccountLockedError('Account is temporarily locked');
      }
      
      if (ipAttempts >= this.MAX_ATTEMPTS * 3) {
        throw new RateLimitError('Too many attempts from this IP');
      }
      
      // Implement progressive delays
      if (attempts > 2) {
        await this.delay(Math.pow(2, attempts) * 1000);
      }
    }
    
    async recordFailedAttempt(email: string, ipAddress: string): Promise<void> {
      await Promise.all([
        this.incrementFailedAttempts(email),
        this.incrementIPAttempts(ipAddress),
        this.logSecurityEvent('failed_login', { email, ipAddress })
      ]);
    }
  }
  ```

- [ ] **Password Recovery**
  - [ ] Use secure password reset tokens
  - [ ] Implement token expiration (15 minutes)
  - [ ] Require email verification for reset
  - [ ] Log all password reset attempts
  
  **Implementation:**
  ```typescript
  // src/application/services/PasswordResetService.ts
  export class PasswordResetService {
    async initiatePasswordReset(email: string): Promise<void> {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        this.logger.info('Password reset attempted for non-existent user', { email });
        return;
      }
      
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      await this.userRepository.storePasswordResetToken(user.id, token, expiresAt);
      await this.emailService.sendPasswordResetEmail(user.email, token);
      
      this.logger.info('Password reset initiated', { userId: user.id });
    }
  }
  ```

### A08:2021 – Software and Data Integrity Failures

#### Code Integrity
- [ ] **Supply Chain Security**
  - [ ] Verify package checksums
  - [ ] Use package-lock.json for reproducible builds
  - [ ] Implement code signing for releases
  - [ ] Use trusted package registries only
  
  **Implementation:**
  ```json
  {
    "scripts": {
      "preinstall": "npx check-audit",
      "verify": "npm ci --only=production"
    },
    "engines": {
      "node": ">=18.0.0",
      "npm": ">=9.0.0"
    }
  }
  ```

- [ ] **Data Integrity**
  - [ ] Implement database constraints
  - [ ] Use checksums for critical data
  - [ ] Implement data validation at multiple layers
  - [ ] Monitor for data tampering
  
  **Implementation:**
  ```sql
  -- Database constraints
  ALTER TABLE contacts ADD CONSTRAINT valid_email 
    CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  
  ALTER TABLE contacts ADD CONSTRAINT valid_tenant 
    CHECK (tenant_id IS NOT NULL);
    
  -- Data integrity trigger
  CREATE OR REPLACE FUNCTION update_checksum()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.data_checksum = md5(
      COALESCE(NEW.first_name, '') || 
      COALESCE(NEW.last_name, '') || 
      COALESCE(NEW.email_encrypted::text, '')
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```

### A09:2021 – Security Logging and Monitoring Failures

#### Audit Logging
- [ ] **Comprehensive Logging**
  - [ ] Log all authentication attempts
  - [ ] Log authorization failures
  - [ ] Log data access and modifications
  - [ ] Log configuration changes
  
  **Implementation:**
  ```typescript
  // src/shared/utils/audit-logger.ts
  export class AuditLogger {
    async logSecurityEvent(
      event: SecurityEvent,
      userId?: string,
      context?: SecurityContext
    ): Promise<void> {
      const logEntry = {
        timestamp: new Date().toISOString(),
        eventType: event.type,
        severity: event.severity,
        userId,
        tenantId: context?.tenantId,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        details: event.details,
        requestId: context?.requestId,
        sessionId: context?.sessionId,
      };
      
      // Log to multiple destinations
      await Promise.all([
        this.writeToDatabase(logEntry),
        this.writeToSyslog(logEntry),
        this.sendToSIEM(logEntry)
      ]);
      
      // Send alerts for critical events
      if (event.severity >= SecuritySeverity.HIGH) {
        await this.sendSecurityAlert(logEntry);
      }
    }
  }
  ```

- [ ] **Log Protection**
  - [ ] Protect log files from tampering
  - [ ] Use structured logging (JSON)
  - [ ] Implement log rotation
  - [ ] Sanitize sensitive data from logs
  
  **Implementation:**
  ```typescript
  // src/shared/utils/logger.ts
  export class Logger {
    private sanitizeSensitiveData(data: any): any {
      if (typeof data !== 'object') return data;
      
      const sanitized = { ...data };
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
      
      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      }
      
      return sanitized;
    }
  }
  ```

#### Security Monitoring
- [ ] **Real-time Monitoring**
  - [ ] Monitor failed authentication attempts
  - [ ] Track unusual user behavior patterns
  - [ ] Monitor for privilege escalation attempts
  - [ ] Implement anomaly detection
  
  **Implementation:**
  ```typescript
  // src/application/services/SecurityMonitoringService.ts
  export class SecurityMonitoringService {
    async monitorUserBehavior(userId: string, action: string, context: any): Promise<void> {
      const pattern = await this.analyzeUserPattern(userId, action, context);
      
      if (pattern.isAnomalous) {
        await this.handleSecurityAnomaly(userId, action, pattern);
      }
      
      // Update user behavior profile
      await this.updateBehaviorProfile(userId, action, context);
    }
    
    private async handleSecurityAnomaly(
      userId: string,
      action: string,
      pattern: BehaviorPattern
    ): Promise<void> {
      const alert = {
        type: 'BEHAVIOR_ANOMALY',
        severity: this.calculateSeverity(pattern),
        userId,
        action,
        details: pattern,
        timestamp: new Date(),
      };
      
      await this.auditLogger.logSecurityEvent(alert);
      
      if (alert.severity >= SecuritySeverity.HIGH) {
        await this.escalateSecurityIncident(alert);
      }
    }
  }
  ```

### A10:2021 – Server-Side Request Forgery (SSRF)

#### Request Validation
- [ ] **URL Validation**
  - [ ] Whitelist allowed domains and IPs
  - [ ] Block internal IP ranges
  - [ ] Validate URL schemes (allow only HTTP/HTTPS)
  - [ ] Implement timeout and size limits
  
  **Implementation:**
  ```typescript
  // src/shared/utils/url-validator.ts
  export class URLValidator {
    private readonly ALLOWED_SCHEMES = ['http', 'https'];
    private readonly BLOCKED_RANGES = [
      '127.0.0.0/8',    // Loopback
      '10.0.0.0/8',     // Private Class A
      '172.16.0.0/12',  // Private Class B
      '192.168.0.0/16', // Private Class C
      '169.254.0.0/16', // Link-local
      '0.0.0.0/8',      // Current network
    ];
    
    async validateURL(url: string): Promise<void> {
      const parsed = new URL(url);
      
      // Check scheme
      if (!this.ALLOWED_SCHEMES.includes(parsed.protocol.slice(0, -1))) {
        throw new ValidationError(`Unsupported URL scheme: ${parsed.protocol}`);
      }
      
      // Resolve hostname to IP
      const ip = await dns.lookup(parsed.hostname);
      
      // Check if IP is in blocked ranges
      if (this.isBlockedIP(ip.address)) {
        throw new SecurityError(`Access to IP ${ip.address} is blocked`);
      }
      
      // Check against whitelist
      if (!this.isWhitelistedDomain(parsed.hostname)) {
        throw new SecurityError(`Domain ${parsed.hostname} is not whitelisted`);
      }
    }
    
    private isBlockedIP(ip: string): boolean {
      return this.BLOCKED_RANGES.some(range => ipRangeCheck(ip, range));
    }
  }
  ```

## Input Validation and Sanitization by Endpoint

### Authentication Endpoints

#### POST /auth/login
- [ ] **Email Validation**
  ```typescript
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(254)
    .required()
  ```

- [ ] **Password Validation**
  ```typescript
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    // Don't validate complexity on login to avoid user enumeration
  ```

- [ ] **Rate Limiting**
  ```typescript
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
  ```

#### POST /auth/refresh
- [ ] **Token Validation**
  ```typescript
  refreshToken: Joi.string()
    .pattern(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/)
    .required()
  ```

### Contact Management Endpoints

#### POST /contacts
- [ ] **Input Sanitization**
  ```typescript
  const createContactSchema = Joi.object({
    firstName: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .pattern(/^[a-zA-Z\s\-'\.]+$/)
      .required(),
      
    lastName: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .pattern(/^[a-zA-Z\s\-'\.]+$/)
      .required(),
      
    email: Joi.array()
      .items(
        Joi.string()
          .email()
          .lowercase()
          .trim()
          .max(254)
      )
      .min(1)
      .max(5)
      .unique()
      .required(),
      
    phone: Joi.array()
      .items(
        Joi.string()
          .pattern(/^\+?[1-9]\d{1,14}$/)
          .trim()
      )
      .max(5)
      .unique()
      .optional(),
      
    company: Joi.string()
      .trim()
      .max(200)
      .pattern(/^[a-zA-Z0-9\s\-&'.,()]+$/)
      .optional(),
      
    customFields: Joi.object()
      .pattern(
        Joi.string().max(50),
        Joi.alternatives().try(
          Joi.string().max(1000),
          Joi.number().safe(),
          Joi.boolean(),
          Joi.date().iso()
        )
      )
      .max(20) // Limit number of custom fields
      .optional()
  });
  ```

- [ ] **XSS Prevention**
  ```typescript
  import DOMPurify from 'isomorphic-dompurify';
  
  export const sanitizeHTML = (input: string): string => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  };
  ```

#### GET /contacts (Search)
- [ ] **Search Parameter Validation**
  ```typescript
  const searchSchema = Joi.object({
    page: Joi.number().integer().min(1).max(1000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string()
      .trim()
      .max(100)
      .pattern(/^[a-zA-Z0-9\s@.-]+$/)
      .optional(),
    sortBy: Joi.string()
      .valid('firstName', 'lastName', 'company', 'createdAt', 'updatedAt')
      .default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  });
  ```

### Bulk Operations
- [ ] **Batch Size Limits**
  ```typescript
  const bulkContactSchema = Joi.object({
    operation: Joi.string().valid('create', 'update', 'delete').required(),
    data: Joi.array()
      .items(Joi.object()) // Specific schema based on operation
      .min(1)
      .max(1000) // Limit batch size
      .required(),
    options: Joi.object({
      skipDuplicates: Joi.boolean().default(false),
      validateOnly: Joi.boolean().default(false),
      continueOnError: Joi.boolean().default(true)
    }).optional()
  });
  ```

## SQL Injection Prevention Measures

### Parameterized Queries
```typescript
// ✅ SECURE - Parameterized query
const findContactsByCompany = async (tenantId: string, company: string) => {
  const query = `
    SELECT id, first_name, last_name, email_encrypted 
    FROM contacts 
    WHERE tenant_id = $1 AND company = $2 AND is_deleted = false
    ORDER BY created_at DESC
  `;
  return this.db.query(query, [tenantId, company]);
};

// ❌ INSECURE - String concatenation
const insecureSearch = async (searchTerm: string) => {
  const query = `SELECT * FROM contacts WHERE name LIKE '%${searchTerm}%'`;
  return this.db.query(query); // NEVER DO THIS
};
```

### Query Builder Usage
```typescript
// Using Knex.js query builder
const searchContacts = (tenantId: string, filters: ContactFilters) => {
  let query = this.knex('contacts')
    .where('tenant_id', tenantId)
    .where('is_deleted', false);
    
  if (filters.company) {
    query = query.where('company', 'ilike', `%${filters.company}%`);
  }
  
  if (filters.tags?.length) {
    query = query.whereRaw('tags && ?', [filters.tags]);
  }
  
  return query
    .orderBy(filters.sortBy || 'created_at', filters.sortOrder || 'desc')
    .limit(filters.limit || 10)
    .offset((filters.page - 1) * filters.limit);
};
```

### Dynamic Query Validation
```typescript
export class QueryValidator {
  private readonly ALLOWED_SORT_FIELDS = [
    'first_name', 'last_name', 'company', 'created_at', 'updated_at'
  ];
  
  private readonly ALLOWED_OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'ILIKE'];
  
  validateSortField(field: string): void {
    if (!this.ALLOWED_SORT_FIELDS.includes(field)) {
      throw new ValidationError(`Invalid sort field: ${field}`);
    }
  }
  
  validateFilterOperator(operator: string): void {
    if (!this.ALLOWED_OPERATORS.includes(operator.toUpperCase())) {
      throw new ValidationError(`Invalid operator: ${operator}`);
    }
  }
  
  sanitizeSearchTerm(term: string): string {
    // Remove potentially dangerous characters
    return term.replace(/[;'"|\\]/g, '').trim();
  }
}
```

## XSS Protection Implementation

### Content Security Policy
```typescript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "wss:", "https://api.connectkit.com"],
    fontSrc: ["'self'", "https://fonts.googleapis.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
  reportOnly: false,
}));
```

### Input Sanitization
```typescript
import xss from 'xss';

export class InputSanitizer {
  private readonly xssOptions = {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script'],
  };
  
  sanitizeString(input: string): string {
    return xss(input, this.xssOptions);
  }
  
  sanitizeObject<T>(obj: T): T {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj) as T;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item)) as T;
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {} as T;
      for (const [key, value] of Object.entries(obj)) {
        (sanitized as any)[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }
}
```

### Output Encoding
```typescript
export class OutputEncoder {
  encodeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  
  encodeJSON(obj: any): string {
    return JSON.stringify(obj)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');
  }
}
```

## CSRF Protection

### CSRF Token Implementation
```typescript
import csrf from 'csurf';

// CSRF protection for state-changing operations
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

// Apply to non-GET routes
app.use(/\/(contacts|organizations|users)/, (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});
```

### SameSite Cookie Configuration
```typescript
app.use(session({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 60 * 1000, // 30 minutes
  },
  // ... other session options
}));
```

## Rate Limiting Configuration

### Endpoint-Specific Rate Limits
```typescript
// src/presentation/middleware/rate-limiter.ts
export class RateLimiter {
  static createLimiter(options: RateLimitOptions) {
    return rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      message: options.message,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Use user ID for authenticated requests, IP for anonymous
        return req.user?.userId || req.ip;
      },
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
      },
      onLimitReached: (req, res, options) => {
        this.logRateLimitExceeded(req, options);
      },
    });
  }

  // Different limits for different endpoint types
  static authLimiter = this.createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: 'Too many authentication attempts',
  });

  static apiLimiter = this.createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // 1000 requests per hour
    message: 'Rate limit exceeded',
  });

  static searchLimiter = this.createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 200, // 200 searches per hour
    message: 'Search rate limit exceeded',
  });

  static bulkLimiter = this.createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 bulk operations per hour
    message: 'Bulk operation rate limit exceeded',
  });
}
```

### Progressive Rate Limiting
```typescript
export class ProgressiveRateLimiter {
  async checkRateLimit(
    userId: string,
    operation: string,
    tier: UserTier = 'basic'
  ): Promise<void> {
    const key = `rate_limit:${userId}:${operation}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, this.getWindowDuration(operation));
    }
    
    const limit = this.getRateLimit(operation, tier);
    
    if (current > limit) {
      const ttl = await this.redis.ttl(key);
      throw new RateLimitError(`Rate limit exceeded. Try again in ${ttl} seconds.`);
    }
    
    // Implement progressive delays for approaching limits
    if (current > limit * 0.8) {
      await this.delay(this.calculateDelay(current, limit));
    }
  }
  
  private getRateLimit(operation: string, tier: UserTier): number {
    const limits = {
      basic: { api: 100, search: 50, bulk: 5 },
      premium: { api: 500, search: 200, bulk: 20 },
      enterprise: { api: 2000, search: 1000, bulk: 100 },
    };
    
    return limits[tier][operation] || limits.basic[operation];
  }
}
```

## API Key Management

### API Key Generation
```typescript
export class APIKeyService {
  async generateAPIKey(userId: string, name: string): Promise<APIKeyResponse> {
    const keyId = crypto.randomUUID();
    const key = this.generateSecureKey();
    const hashedKey = await bcrypt.hash(key, 12);
    
    const apiKey = {
      id: keyId,
      userId,
      name,
      hashedKey,
      permissions: ['read:contacts'], // Default permissions
      createdAt: new Date(),
      lastUsedAt: null,
      isActive: true,
    };
    
    await this.apiKeyRepository.create(apiKey);
    
    // Return the plain key only once
    return {
      id: keyId,
      key: `ck_${keyId}_${key}`, // Prefix for identification
      name,
      permissions: apiKey.permissions,
      createdAt: apiKey.createdAt,
    };
  }
  
  private generateSecureKey(): string {
    return crypto.randomBytes(32).toString('base64url');
  }
  
  async validateAPIKey(keyString: string): Promise<APIKey> {
    const [prefix, keyId, key] = keyString.split('_');
    
    if (prefix !== 'ck' || !keyId || !key) {
      throw new UnauthorizedError('Invalid API key format');
    }
    
    const apiKey = await this.apiKeyRepository.findById(keyId);
    if (!apiKey || !apiKey.isActive) {
      throw new UnauthorizedError('Invalid API key');
    }
    
    const isValid = await bcrypt.compare(key, apiKey.hashedKey);
    if (!isValid) {
      throw new UnauthorizedError('Invalid API key');
    }
    
    // Update last used timestamp
    await this.apiKeyRepository.updateLastUsed(keyId);
    
    return apiKey;
  }
}
```

### API Key Middleware
```typescript
export const apiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    throw new UnauthorizedError('API key required');
  }
  
  try {
    const key = await apiKeyService.validateAPIKey(apiKey);
    const user = await userService.findById(key.userId);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid user');
    }
    
    // Set user context
    req.user = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      permissions: key.permissions,
      authType: 'api_key',
    };
    
    next();
  } catch (error) {
    next(error);
  }
};
```

## Audit Logging Requirements

### Security Event Categories
```typescript
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  TOKEN_REFRESH = 'token_refresh',
  
  // Authorization events
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  PERMISSION_ESCALATION = 'permission_escalation',
  
  // Data events
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  DATA_DELETION = 'data_deletion',
  DATA_EXPORT = 'data_export',
  
  // Security events
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  SECURITY_VIOLATION = 'security_violation',
  
  // System events
  CONFIGURATION_CHANGE = 'configuration_change',
  SECURITY_POLICY_CHANGE = 'security_policy_change',
  USER_ROLE_CHANGE = 'user_role_change',
}

export enum SecuritySeverity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}
```

### Audit Log Implementation
```typescript
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  details?: Record<string, any>;
  requestId?: string;
  sessionId?: string;
  outcome: 'success' | 'failure' | 'error';
}

export class AuditService {
  async logSecurityEvent(event: Partial<AuditLogEntry>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      outcome: 'success',
      ...event,
    };
    
    // Store in database
    await this.auditRepository.create(auditEntry);
    
    // Send to external logging service
    await this.sendToExternalLog(auditEntry);
    
    // Send alerts for high-severity events
    if (auditEntry.severity >= SecuritySeverity.HIGH) {
      await this.sendSecurityAlert(auditEntry);
    }
  }
  
  async queryAuditLogs(
    filters: AuditLogFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<AuditLogEntry>> {
    // Ensure users can only see their own tenant's logs
    const tenantFilter = { ...filters, tenantId: req.user.tenantId };
    
    return this.auditRepository.findWithFilters(tenantFilter, pagination);
  }
}
```

### Audit Middleware
```typescript
export const auditMiddleware = (
  eventType: SecurityEventType,
  severity: SecuritySeverity = SecuritySeverity.LOW
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    
    // Continue with request processing
    next();
    
    // Log after response
    res.on('finish', async () => {
      try {
        await auditService.logSecurityEvent({
          eventType,
          severity,
          userId: req.user?.userId,
          tenantId: req.user?.tenantId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          resource: req.path,
          action: req.method,
          details: {
            statusCode: res.statusCode,
            responseTime: Date.now() - startTime,
            requestSize: req.headers['content-length'],
            responseSize: res.get('content-length'),
          },
          requestId: req.id,
          outcome: res.statusCode < 400 ? 'success' : 'failure',
        });
      } catch (error) {
        logger.error('Failed to log audit event', error);
      }
    });
  };
};
```

## Security Testing Commands

### Security Test Scripts
```json
{
  "scripts": {
    "test:security": "npm run test:security:unit && npm run test:security:integration",
    "test:security:unit": "jest --testPathPattern=security --coverage",
    "test:security:integration": "jest --testPathPattern=security.integration",
    "security:audit": "npm audit --audit-level=moderate",
    "security:scan": "npx retire && npm run security:audit",
    "security:penetration": "npm run test:e2e:security",
    "security:validate": "npm run security:scan && npm run test:security"
  }
}
```

### Security Test Examples
```typescript
// src/tests/security/authentication.security.test.ts
describe('Authentication Security', () => {
  describe('Brute Force Protection', () => {
    it('should lock account after 5 failed attempts', async () => {
      const email = 'test@example.com';
      
      // Attempt login 5 times with wrong password
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({ email, password: 'wrongpassword' })
          .expect(401);
      }
      
      // 6th attempt should be blocked
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrongpassword' })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Account is temporarily locked');
        });
    });
    
    it('should implement progressive delays', async () => {
      const email = 'test@example.com';
      
      // First failure - no delay
      const start1 = Date.now();
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrong' })
        .expect(401);
      const duration1 = Date.now() - start1;
      
      // Third failure - should have delay
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrong' })
        .expect(401);
        
      const start3 = Date.now();
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrong' })
        .expect(401);
      const duration3 = Date.now() - start3;
      
      expect(duration3).toBeGreaterThan(duration1 + 1000); // At least 1s delay
    });
  });
  
  describe('JWT Security', () => {
    it('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { userId: 'test', exp: Math.floor(Date.now() / 1000) - 3600 },
        'secret'
      );
      
      await request(app)
        .get('/api/v1/contacts')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
    
    it('should reject tokens with invalid signature', async () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
      
      await request(app)
        .get('/api/v1/contacts')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });
  });
});
```

### SQL Injection Tests
```typescript
// src/tests/security/sql-injection.security.test.ts
describe('SQL Injection Protection', () => {
  it('should prevent SQL injection in search queries', async () => {
    const maliciousSearch = "'; DROP TABLE contacts; --";
    
    const response = await request(app)
      .get('/api/v1/contacts')
      .query({ search: maliciousSearch })
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
    
    // Should return empty results, not execute malicious SQL
    expect(response.body.data.contacts).toEqual([]);
    
    // Verify table still exists by making another query
    await request(app)
      .get('/api/v1/contacts')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
  });
  
  it('should sanitize sort parameters', async () => {
    const maliciousSort = 'id; DELETE FROM contacts WHERE 1=1; --';
    
    await request(app)
      .get('/api/v1/contacts')
      .query({ sortBy: maliciousSort })
      .set('Authorization', `Bearer ${validToken}`)
      .expect(400) // Should reject invalid sort field
      .expect((res) => {
        expect(res.body.error).toBe('Validation Error');
      });
  });
});
```

This comprehensive security checklist provides detailed implementation guidance for securing the ConnectKit backend API against common vulnerabilities and attack vectors.