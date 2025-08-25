# ConnectKit - Enterprise Security Recommendations

## Executive Summary

This document outlines comprehensive security recommendations for ConnectKit, an enterprise-ready contact management platform. The security architecture follows defense-in-depth principles, implementing multiple layers of security controls to protect sensitive contact data and ensure regulatory compliance.

## Security Architecture Overview

### Zero Trust Security Model

ConnectKit implements a zero-trust security architecture where no user or system is trusted by default, regardless of location or credentials. Every access request is verified, authenticated, and authorized before granting access to resources.

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet/External Users                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   WAF + DDoS Protection                     │
│            (CloudFlare/AWS WAF/Azure Front Door)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Load Balancer + TLS                         │
│              (nginx/HAProxy with SSL/TLS)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Identity & Access Management                   │
│        (Authentication, Authorization, MFA)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Application Layer                            │
│         (React Frontend + Node.js Backend)                  │
│              + Security Headers                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Data Layer Security                         │
│        (Encrypted PostgreSQL + Redis Cache)                 │
│              + Audit Logging                                │
└─────────────────────────────────────────────────────────────┘
```

### Security Layers

1. **Perimeter Security**: WAF, DDoS protection, network firewalls
2. **Transport Security**: TLS 1.3 encryption for all communications
3. **Identity Security**: Multi-factor authentication, SSO integration
4. **Application Security**: OWASP security controls, secure coding practices
5. **Data Security**: Field-level encryption, secure key management
6. **Infrastructure Security**: Container security, network segmentation
7. **Operational Security**: Monitoring, incident response, compliance

## Authentication and Authorization Framework

### Multi-Factor Authentication (MFA)

- **Primary Authentication**: Username/password with strong password policies
- **Secondary Factors**:
  - TOTP (Time-based One-Time Password) via authenticator apps
  - SMS-based verification (backup method)
  - Hardware security keys (FIDO2/WebAuthn)
  - Biometric authentication for mobile devices

### Single Sign-On (SSO) Integration

```typescript
// SSO Configuration Interface
interface SSOConfiguration {
  provider: "SAML" | "OIDC" | "OAuth2";
  identityProvider: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  claimsMapping: {
    email: string;
    firstName: string;
    lastName: string;
    roles: string;
    groups: string[];
  };
  sessionTimeout: number;
  autoProvision: boolean;
}

// Supported Identity Providers
const supportedProviders = [
  "Azure Active Directory",
  "Google Workspace",
  "Okta",
  "Auth0",
  "Ping Identity",
  "ADFS",
  "Generic SAML 2.0",
  "Generic OIDC",
];
```

### Role-Based Access Control (RBAC)

#### Role Hierarchy

```typescript
interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  hierarchy: number; // 0 = lowest, 100 = highest
}

const defaultRoles: UserRole[] = [
  {
    id: "readonly",
    name: "Read Only",
    description: "Can view contacts and reports",
    permissions: ["contacts:read", "reports:read"],
    hierarchy: 10,
  },
  {
    id: "user",
    name: "Standard User",
    description: "Can manage own contacts and view shared contacts",
    permissions: [
      "contacts:read",
      "contacts:create",
      "contacts:update",
      "contacts:delete_own",
    ],
    hierarchy: 20,
  },
  {
    id: "manager",
    name: "Manager",
    description: "Can manage team contacts and access analytics",
    permissions: [
      "contacts:*",
      "analytics:read",
      "reports:create",
      "users:read",
    ],
    hierarchy: 50,
  },
  {
    id: "admin",
    name: "Administrator",
    description: "Full system access including user management",
    permissions: ["*"],
    hierarchy: 100,
  },
];
```

#### Permission Matrix

```typescript
interface Permission {
  resource: string;
  action: "create" | "read" | "update" | "delete" | "*";
  conditions?: {
    field: string;
    operator: "equals" | "not_equals" | "in" | "not_in";
    value: any;
  }[];
}

// Example: Users can only modify contacts they created
const conditionalPermission: Permission = {
  resource: "contacts",
  action: "update",
  conditions: [
    {
      field: "created_by",
      operator: "equals",
      value: "{user.id}",
    },
  ],
};
```

### Session Management

- **JWT Tokens**: Short-lived access tokens (15 minutes)
- **Refresh Tokens**: Longer-lived refresh tokens (24 hours) with rotation
- **Session Storage**: Server-side session store with Redis
- **Session Timeout**: Automatic logout after inactivity (configurable)
- **Concurrent Sessions**: Limit and monitor concurrent sessions per user

## Data Encryption Strategies

### Encryption at Rest

#### Database-Level Encryption

```sql
-- PostgreSQL Transparent Data Encryption (TDE)
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypted columns for PII data
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    first_name_encrypted BYTEA NOT NULL, -- AES-256 encrypted
    last_name_encrypted BYTEA NOT NULL,
    email_encrypted BYTEA[], -- Array of encrypted emails
    phone_encrypted BYTEA[], -- Array of encrypted phone numbers
    address_encrypted BYTEA, -- Encrypted JSON address data
    -- Non-sensitive fields remain unencrypted for search/indexing
    company VARCHAR(255),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Encryption/Decryption functions
CREATE OR REPLACE FUNCTION encrypt_pii(data TEXT, key_id TEXT)
RETURNS BYTEA AS $$
BEGIN
    -- Use application-level key derivation
    RETURN pgp_sym_encrypt(data, get_encryption_key(key_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_pii(encrypted_data BYTEA, key_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, get_encryption_key(key_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Application-Level Encryption

```typescript
// Field-level encryption service
import { createCipher, createDecipher, randomBytes, scrypt } from "crypto";
import { promisify } from "util";

class FieldEncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly keyDerivation = promisify(scrypt);

  async encrypt(plaintext: string, keyId: string): Promise<string> {
    const key = await this.deriveKey(keyId);
    const iv = randomBytes(16);
    const cipher = createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from(keyId)); // Additional authenticated data

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();

    // Return: iv + authTag + encrypted data
    return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
  }

  async decrypt(encryptedData: string, keyId: string): Promise<string> {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
    const key = await this.deriveKey(keyId);
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from(keyId));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  private async deriveKey(keyId: string): Promise<Buffer> {
    const masterKey = process.env.MASTER_ENCRYPTION_KEY;
    const salt = Buffer.from(keyId, "utf8");
    return (await this.keyDerivation(masterKey, salt, 32)) as Buffer;
  }
}
```

### Key Management Architecture

#### AWS KMS Integration

```typescript
import {
  KMSClient,
  GenerateDataKeyCommand,
  DecryptCommand,
} from "@aws-sdk/client-kms";

class KeyManagementService {
  private kmsClient: KMSClient;
  private customerMasterKeyId: string;

  constructor() {
    this.kmsClient = new KMSClient({ region: process.env.AWS_REGION });
    this.customerMasterKeyId = process.env.AWS_KMS_CMK_ID;
  }

  async generateDataKey(encryptionContext: Record<string, string>) {
    const command = new GenerateDataKeyCommand({
      KeyId: this.customerMasterKeyId,
      KeySpec: "AES_256",
      EncryptionContext: encryptionContext,
    });

    const result = await this.kmsClient.send(command);
    return {
      plaintextKey: result.Plaintext,
      encryptedKey: result.CiphertextBlob,
    };
  }

  async decryptDataKey(
    encryptedKey: Uint8Array,
    encryptionContext: Record<string, string>,
  ) {
    const command = new DecryptCommand({
      CiphertextBlob: encryptedKey,
      EncryptionContext: encryptionContext,
    });

    const result = await this.kmsClient.send(command);
    return result.Plaintext;
  }
}
```

#### Key Rotation Strategy

- **Automatic Rotation**: Keys rotated every 90 days
- **Manual Rotation**: Emergency rotation capability
- **Version Management**: Support for multiple key versions during transition
- **Audit Trail**: Complete key usage and rotation history

### Encryption in Transit

```typescript
// TLS Configuration
const tlsOptions = {
  // Minimum TLS version
  secureProtocol: "TLSv1_3_method",

  // Cipher suites (prefer AEAD ciphers)
  ciphers: [
    "TLS_AES_256_GCM_SHA384",
    "TLS_CHACHA20_POLY1305_SHA256",
    "TLS_AES_128_GCM_SHA256",
  ].join(":"),

  // Certificate validation
  rejectUnauthorized: true,
  checkServerIdentity: true,

  // HSTS and security headers
  headers: {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  },
};
```

## Compliance Requirements Implementation

### GDPR (General Data Protection Regulation) Compliance

#### Data Processing Principles

```typescript
interface GDPRCompliance {
  // Article 5 - Principles of processing
  lawfulBasis:
    | "consent"
    | "contract"
    | "legal_obligation"
    | "vital_interests"
    | "public_task"
    | "legitimate_interests";
  dataMinimization: boolean;
  purposeLimitation: string[];
  accuracyRequirement: boolean;
  storageLimitation: number; // retention period in days
  integrityConfidentiality: boolean;

  // Rights of data subjects
  rightToAccess: boolean;
  rightToRectification: boolean;
  rightToErasure: boolean; // "Right to be forgotten"
  rightToPortability: boolean;
  rightToRestriction: boolean;
  rightToObject: boolean;
}

// Data Subject Rights Implementation
class GDPRComplianceService {
  async exportPersonalData(
    userId: string,
    format: "json" | "csv" | "xml",
  ): Promise<string> {
    const personalData = await this.collectAllPersonalData(userId);
    return this.formatDataExport(personalData, format);
  }

  async deletePersonalData(userId: string, reason: string): Promise<void> {
    // Implement cascading deletion while preserving anonymized analytics
    await this.anonymizeUserData(userId);
    await this.logDataDeletion(userId, reason);
  }

  async restrictProcessing(
    userId: string,
    restriction: DataProcessingRestriction,
  ): Promise<void> {
    await this.updateProcessingRestrictions(userId, restriction);
    await this.notifyAffectedSystems(userId, restriction);
  }
}
```

#### Consent Management

```typescript
interface ConsentRecord {
  id: string;
  userId: string;
  purpose: string;
  consentGiven: boolean;
  consentDate: Date;
  consentMethod: "explicit" | "implied" | "opt-in" | "opt-out";
  ipAddress: string;
  userAgent: string;
  withdrawalDate?: Date;
  legalBasis: string;
}

class ConsentManagementService {
  async recordConsent(consent: ConsentRecord): Promise<void> {
    // Store consent with immutable audit trail
    await this.auditLog.recordConsent(consent);
  }

  async withdrawConsent(userId: string, purpose: string): Promise<void> {
    // Process consent withdrawal and update data processing
    await this.updateProcessingRules(userId, purpose, false);
  }

  async getConsentStatus(userId: string): Promise<ConsentRecord[]> {
    return await this.fetchUserConsents(userId);
  }
}
```

### CCPA (California Consumer Privacy Act) Compliance

#### Consumer Rights Implementation

```typescript
interface CCPARequest {
  type: "know" | "delete" | "opt-out" | "opt-in";
  consumerId: string;
  requestDate: Date;
  verificationMethod: "email" | "phone" | "identity_document";
  status: "pending" | "verified" | "processing" | "completed" | "denied";
  completionDeadline: Date; // 45 days from request
}

class CCPAComplianceService {
  async submitConsumerRequest(request: CCPARequest): Promise<string> {
    const requestId = await this.createRequest(request);
    await this.initiateVerificationProcess(request);
    return requestId;
  }

  async processVerifiedRequest(requestId: string): Promise<void> {
    const request = await this.getRequest(requestId);

    switch (request.type) {
      case "know":
        await this.providePersonalInformation(request.consumerId);
        break;
      case "delete":
        await this.deletePersonalInformation(request.consumerId);
        break;
      case "opt-out":
        await this.stopSaleOfPersonalInformation(request.consumerId);
        break;
    }
  }
}
```

### SOC 2 Type II Controls

#### Security Control Framework

```typescript
interface SOC2Control {
  controlId: string;
  category:
    | "security"
    | "availability"
    | "processing_integrity"
    | "confidentiality"
    | "privacy";
  description: string;
  implementation: string;
  testing: string;
  evidence: string[];
}

const soc2Controls: SOC2Control[] = [
  {
    controlId: "CC1.1",
    category: "security",
    description:
      "The entity demonstrates a commitment to integrity and ethical values",
    implementation: "Code of conduct, security policies, ethics training",
    testing: "Annual policy review, employee acknowledgments",
    evidence: [
      "signed_policies.pdf",
      "training_records.xlsx",
      "background_checks.pdf",
    ],
  },
  {
    controlId: "CC2.1",
    category: "security",
    description: "The entity demonstrates independence and competence",
    implementation: "Segregation of duties, role-based access control",
    testing: "Access review, privileged account audit",
    evidence: ["access_review_q1.pdf", "role_matrix.xlsx"],
  },
  // ... additional controls
];
```

#### Continuous Compliance Monitoring

```typescript
class ComplianceMonitoringService {
  async runComplianceCheck(
    framework: "gdpr" | "ccpa" | "soc2" | "iso27001",
  ): Promise<ComplianceReport> {
    const checks = await this.getComplianceChecks(framework);
    const results: ComplianceCheckResult[] = [];

    for (const check of checks) {
      const result = await this.executeCheck(check);
      results.push(result);
    }

    return this.generateComplianceReport(framework, results);
  }

  async scheduleComplianceAudits(): Promise<void> {
    // Schedule regular compliance assessments
    await this.scheduleJob("gdpr-audit", "0 0 1 */3 *"); // Quarterly
    await this.scheduleJob("soc2-assessment", "0 0 1 */6 *"); // Semi-annual
  }
}
```

## Security Monitoring and Incident Response

### Security Information and Event Management (SIEM)

#### Log Aggregation and Analysis

```typescript
interface SecurityEvent {
  id: string;
  timestamp: Date;
  source: string;
  category:
    | "authentication"
    | "authorization"
    | "data_access"
    | "system"
    | "application";
  severity: "low" | "medium" | "high" | "critical";
  event_type: string;
  user_id?: string;
  ip_address: string;
  user_agent?: string;
  details: Record<string, any>;
  risk_score: number;
}

class SecurityEventProcessor {
  async processSecurityEvent(event: SecurityEvent): Promise<void> {
    // Real-time threat detection
    const riskAssessment = await this.analyzeRisk(event);

    if (riskAssessment.score > 80) {
      await this.triggerSecurityAlert(event, riskAssessment);
    }

    // Store for compliance and forensics
    await this.storeSecurityEvent(event);

    // Update threat intelligence
    await this.updateThreatModel(event);
  }

  private async analyzeRisk(event: SecurityEvent): Promise<RiskAssessment> {
    const rules = await this.getSecurityRules();
    let score = 0;
    const triggeredRules: string[] = [];

    for (const rule of rules) {
      if (await this.evaluateRule(rule, event)) {
        score += rule.weight;
        triggeredRules.push(rule.id);
      }
    }

    return { score, triggeredRules, event };
  }
}
```

#### Anomaly Detection

```typescript
interface UserBehaviorBaseline {
  userId: string;
  normalLoginTimes: number[]; // Hours of day
  typicalLocations: GeoLocation[];
  averageSessionDuration: number;
  commonDevices: DeviceFingerprint[];
  usualIPRanges: string[];
}

class AnomalyDetectionService {
  async detectAnomalies(event: SecurityEvent): Promise<Anomaly[]> {
    const baseline = await this.getUserBaseline(event.user_id);
    const anomalies: Anomaly[] = [];

    // Geographic anomaly detection
    if (
      await this.isUnusualLocation(event.ip_address, baseline.typicalLocations)
    ) {
      anomalies.push({
        type: "geographic",
        severity: "high",
        description: "Login from unusual geographic location",
      });
    }

    // Temporal anomaly detection
    if (this.isUnusualTime(event.timestamp, baseline.normalLoginTimes)) {
      anomalies.push({
        type: "temporal",
        severity: "medium",
        description: "Login at unusual time",
      });
    }

    return anomalies;
  }
}
```

### Incident Response Framework

#### Automated Response Actions

```typescript
interface IncidentResponse {
  incidentId: string;
  severity: "low" | "medium" | "high" | "critical";
  category:
    | "data_breach"
    | "unauthorized_access"
    | "malware"
    | "dos_attack"
    | "insider_threat";
  automatedActions: ResponseAction[];
  manualActions: ResponseAction[];
  stakeholders: string[];
  communicationPlan: CommunicationTemplate[];
}

class IncidentResponseService {
  async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    // Immediate automated response
    await this.executeAutomatedActions(incident);

    // Alert security team
    await this.notifySecurityTeam(incident);

    // Create incident ticket
    const ticketId = await this.createIncidentTicket(incident);

    // Execute communication plan if critical
    if (incident.severity === "critical") {
      await this.executeCommunicationPlan(incident);
    }

    // Start forensics collection
    await this.startForensicsCollection(incident);
  }

  private async executeAutomatedActions(
    incident: SecurityIncident,
  ): Promise<void> {
    const actions = this.getAutomatedActions(incident.category);

    for (const action of actions) {
      switch (action.type) {
        case "block_ip":
          await this.blockIPAddress(action.parameters.ip);
          break;
        case "disable_account":
          await this.disableUserAccount(action.parameters.userId);
          break;
        case "isolate_system":
          await this.isolateSystem(action.parameters.systemId);
          break;
      }
    }
  }
}
```

### Threat Intelligence Integration

#### Threat Feed Processing

```typescript
interface ThreatIntelligence {
  iocs: IOC[]; // Indicators of Compromise
  ttpData: TTP[]; // Tactics, Techniques, and Procedures
  vulnerabilities: CVE[];
  threatActors: ThreatActor[];
}

class ThreatIntelligenceService {
  async updateThreatFeeds(): Promise<void> {
    const feeds = [
      "https://api.misp-project.org/feed",
      "https://otx.alienvault.com/api/v1/indicators",
      "https://api.threatcrowd.org/v2/",
    ];

    for (const feed of feeds) {
      const threatData = await this.fetchThreatFeed(feed);
      await this.processThreatData(threatData);
    }
  }

  async checkIOCs(event: SecurityEvent): Promise<IOCMatch[]> {
    const matches: IOCMatch[] = [];
    const iocs = await this.getActiveIOCs();

    for (const ioc of iocs) {
      if (await this.matchesIOC(event, ioc)) {
        matches.push({
          ioc,
          event,
          confidence: this.calculateConfidence(event, ioc),
        });
      }
    }

    return matches;
  }
}
```

## Application Security Controls

### Input Validation and Sanitization

#### Comprehensive Validation Framework

```typescript
import Joi from "joi";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

class InputValidationService {
  // Contact validation schema
  contactSchema = Joi.object({
    firstName: Joi.string()
      .min(1)
      .max(100)
      .pattern(/^[a-zA-Z\s\-'\.]+$/)
      .required(),
    lastName: Joi.string()
      .min(1)
      .max(100)
      .pattern(/^[a-zA-Z\s\-'\.]+$/)
      .required(),
    email: Joi.array()
      .items(Joi.string().email().max(254))
      .min(1)
      .max(5)
      .required(),
    phone: Joi.array()
      .items(Joi.string().pattern(/^\+?[1-9]\d{1,14}$/))
      .max(5),
    company: Joi.string().max(255).optional(),
    title: Joi.string().max(100).optional(),
    customFields: Joi.object().pattern(
      Joi.string(),
      Joi.alternatives().try(
        Joi.string().max(1000),
        Joi.number(),
        Joi.boolean(),
        Joi.date(),
      ),
    ),
  });

  async validateAndSanitize(data: any, schema: Joi.ObjectSchema): Promise<any> {
    // Validate structure and types
    const { error, value } = schema.validate(data, { stripUnknown: true });
    if (error) {
      throw new ValidationError(error.details);
    }

    // Sanitize string fields
    const sanitized = this.deepSanitize(value);

    // Additional security checks
    await this.checkForMaliciousPatterns(sanitized);

    return sanitized;
  }

  private deepSanitize(obj: any): any {
    if (typeof obj === "string") {
      return purify.sanitize(obj);
    } else if (Array.isArray(obj)) {
      return obj.map((item) => this.deepSanitize(item));
    } else if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.deepSanitize(value);
      }
      return sanitized;
    }
    return obj;
  }

  private async checkForMaliciousPatterns(data: any): Promise<void> {
    const maliciousPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
    ];

    const dataStr = JSON.stringify(data);
    for (const pattern of maliciousPatterns) {
      if (pattern.test(dataStr)) {
        throw new SecurityError("Malicious content detected");
      }
    }
  }
}
```

### SQL Injection Prevention

```typescript
// Using parameterized queries with Prisma
class ContactRepository {
  async findContacts(searchTerm: string, userId: string): Promise<Contact[]> {
    // Safe: Using Prisma's query builder with parameterized queries
    return await this.prisma.contact.findMany({
      where: {
        AND: [
          { tenantId: userId },
          {
            OR: [
              { firstName: { contains: searchTerm, mode: "insensitive" } },
              { lastName: { contains: searchTerm, mode: "insensitive" } },
              { company: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        ],
      },
    });
  }

  // For raw queries (when necessary), use prepared statements
  async executeCustomQuery(query: string, params: any[]): Promise<any> {
    // Validate query structure
    if (!this.isAllowedQuery(query)) {
      throw new SecurityError("Query not allowed");
    }

    // Use parameterized query
    return await this.prisma.$queryRaw(Prisma.sql([query], ...params));
  }
}
```

### XSS Prevention

```typescript
// Content Security Policy configuration
const cspDirectives = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "https://apis.google.com"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "img-src": ["'self'", "data:", "https:"],
  "connect-src": ["'self'", "https://api.connectkit.com"],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
};

// Frontend XSS protection
class XSSProtection {
  static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "p", "br"],
      ALLOWED_ATTR: [],
    });
  }

  static escapeHTML(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
```

### CSRF Protection

```typescript
import csrf from "csrf";

class CSRFProtection {
  private tokens = new csrf();

  generateToken(req: Request): string {
    const secret = req.session.csrfSecret || this.tokens.secretSync();
    req.session.csrfSecret = secret;
    return this.tokens.create(secret);
  }

  validateToken(req: Request): boolean {
    const token = req.headers["x-csrf-token"] as string;
    const secret = req.session.csrfSecret;

    if (!token || !secret) {
      return false;
    }

    return this.tokens.verify(secret, token);
  }
}

// Express middleware
export const csrfMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const csrf = new CSRFProtection();

  if (req.method === "GET") {
    res.locals.csrfToken = csrf.generateToken(req);
    next();
  } else {
    if (!csrf.validateToken(req)) {
      return res.status(403).json({ error: "Invalid CSRF token" });
    }
    next();
  }
};
```

## Infrastructure Security

### Container Security

#### Secure Docker Configuration

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy application files
COPY --from=builder --chown=nextjs:nodejs /app .
COPY --chown=nextjs:nodejs . .

# Remove unnecessary packages and files
RUN npm prune --production && \
    rm -rf /tmp/* /var/tmp/* /usr/share/doc/* /usr/share/man/*

# Set security-focused configurations
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Use non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node healthcheck.js

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# Security labels
LABEL security.scan="enabled" \
      security.level="production" \
      maintainer="security@connectkit.com"
```

#### Kubernetes Security Policies

```yaml
# Pod Security Policy
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: connectkit-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - "configMap"
    - "emptyDir"
    - "projected"
    - "secret"
    - "downwardAPI"
    - "persistentVolumeClaim"
  runAsUser:
    rule: "MustRunAsNonRoot"
  seLinux:
    rule: "RunAsAny"
  fsGroup:
    rule: "RunAsAny"

---
# Network Policy for traffic isolation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: connectkit-network-policy
spec:
  podSelector:
    matchLabels:
      app: connectkit
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: nginx-ingress
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
```

### Network Security

#### Zero Trust Network Architecture

```typescript
// Service mesh security configuration (Istio)
interface ServiceMeshSecurity {
  mtls: {
    mode: "STRICT";
    permissiveMode: false;
  };
  authorizationPolicies: AuthorizationPolicy[];
  peerAuthentication: PeerAuthentication;
}

const authorizationPolicies: AuthorizationPolicy[] = [
  {
    name: "api-access-policy",
    selector: { app: "connectkit-api" },
    rules: [
      {
        from: [{ principals: ["cluster.local/ns/default/sa/frontend"] }],
        to: [{ operation: { methods: ["GET", "POST", "PUT", "DELETE"] } }],
        when: [
          {
            key: "request.headers[x-tenant-id]",
            values: ["{{.user_tenant_id}}"],
          },
        ],
      },
    ],
  },
];
```

### Secrets Management

#### HashiCorp Vault Integration

```typescript
import VaultClient from "node-vault";

class SecretsManager {
  private vault: any;

  constructor() {
    this.vault = VaultClient({
      apiVersion: "v1",
      endpoint: process.env.VAULT_ENDPOINT,
      token: process.env.VAULT_TOKEN,
    });
  }

  async getSecret(path: string): Promise<any> {
    try {
      const result = await this.vault.read(`secret/data/${path}`);
      return result.data.data;
    } catch (error) {
      throw new SecretsError(`Failed to retrieve secret: ${path}`);
    }
  }

  async rotateSecret(path: string, newValue: any): Promise<void> {
    await this.vault.write(`secret/data/${path}`, { data: newValue });
    await this.auditSecretRotation(path);
  }

  private async auditSecretRotation(path: string): Promise<void> {
    await this.auditLogger.log({
      event: "secret_rotation",
      path,
      timestamp: new Date(),
      actor: "system",
    });
  }
}
```

## Security Testing and Validation

### Automated Security Testing

#### SAST (Static Application Security Testing)

```yaml
# GitHub Actions security workflow
name: Security Scan
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run CodeQL Analysis
        uses: github/codeql-action/init@v2
        with:
          languages: typescript, javascript

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten

      - name: Run npm audit
        run: |
          npm audit --audit-level moderate

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=medium
```

#### DAST (Dynamic Application Security Testing)

```typescript
// Automated penetration testing with OWASP ZAP
class SecurityTestSuite {
  async runDAST(): Promise<SecurityTestResults> {
    const zapClient = new ZAPClient("http://localhost:8080");

    // Spider the application
    await zapClient.spider.scan("https://app.connectkit.com");

    // Active security scan
    const scanId = await zapClient.ascan.scan("https://app.connectkit.com");

    // Wait for scan completion
    while ((await zapClient.ascan.status(scanId)) < 100) {
      await this.delay(5000);
    }

    // Generate report
    const report = await zapClient.core.htmlreport();
    return this.parseZAPReport(report);
  }

  async runCustomSecurityTests(): Promise<void> {
    // Test authentication bypasses
    await this.testAuthenticationBypass();

    // Test authorization flaws
    await this.testAuthorizationFlaws();

    // Test input validation
    await this.testInputValidation();

    // Test session management
    await this.testSessionManagement();
  }
}
```

### Vulnerability Management Program

#### Vulnerability Assessment Workflow

```typescript
interface VulnerabilityAssessment {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  cvss_score: number;
  cve_id?: string;
  component: string;
  description: string;
  remediation: string;
  status: "new" | "triaged" | "in_progress" | "resolved" | "accepted_risk";
  assignee: string;
  due_date: Date;
  verification_required: boolean;
}

class VulnerabilityManagementService {
  async conductVulnerabilityAssessment(): Promise<VulnerabilityAssessment[]> {
    const vulnerabilities: VulnerabilityAssessment[] = [];

    // Infrastructure vulnerabilities
    const infraVulns = await this.scanInfrastructure();

    // Application vulnerabilities
    const appVulns = await this.scanApplication();

    // Dependencies vulnerabilities
    const depVulns = await this.scanDependencies();

    vulnerabilities.push(...infraVulns, ...appVulns, ...depVulns);

    // Prioritize and assign
    return this.prioritizeVulnerabilities(vulnerabilities);
  }

  private prioritizeVulnerabilities(
    vulnerabilities: VulnerabilityAssessment[],
  ): VulnerabilityAssessment[] {
    return vulnerabilities.sort((a, b) => {
      // Critical vulnerabilities first
      if (a.severity === "critical" && b.severity !== "critical") return -1;
      if (b.severity === "critical" && a.severity !== "critical") return 1;

      // Then by CVSS score
      return b.cvss_score - a.cvss_score;
    });
  }
}
```

## Security Metrics and KPIs

### Security Dashboard Metrics

```typescript
interface SecurityMetrics {
  authentication: {
    failed_login_attempts: number;
    mfa_adoption_rate: number;
    password_policy_compliance: number;
    session_timeout_incidents: number;
  };

  authorization: {
    privilege_escalation_attempts: number;
    unauthorized_access_attempts: number;
    role_assignment_changes: number;
  };

  data_protection: {
    encryption_coverage: number;
    data_classification_compliance: number;
    pii_access_events: number;
    data_retention_violations: number;
  };

  vulnerabilities: {
    critical_vulnerabilities_open: number;
    high_vulnerabilities_open: number;
    mean_time_to_patch: number;
    vulnerability_scan_coverage: number;
  };

  incidents: {
    security_incidents_count: number;
    mean_time_to_detection: number;
    mean_time_to_response: number;
    incident_false_positive_rate: number;
  };

  compliance: {
    gdpr_compliance_score: number;
    soc2_control_effectiveness: number;
    audit_findings_count: number;
    policy_acknowledgment_rate: number;
  };
}

class SecurityMetricsCollector {
  async generateSecurityReport(): Promise<SecurityReport> {
    const metrics = await this.collectMetrics();
    const trends = await this.analyzeTrends(metrics);
    const recommendations = await this.generateRecommendations(metrics, trends);

    return {
      period: this.reportingPeriod,
      metrics,
      trends,
      recommendations,
      actionItems: this.identifyActionItems(recommendations),
    };
  }
}
```

## Conclusion

This comprehensive security framework provides ConnectKit with enterprise-grade protection across all layers of the application stack. The implementation follows industry best practices and regulatory requirements while maintaining usability and performance.

### Key Security Pillars

1. **Defense in Depth**: Multiple security layers protect against various attack vectors
2. **Zero Trust Architecture**: Every access request is verified and validated
3. **Data Protection**: Comprehensive encryption and privacy controls
4. **Compliance**: Built-in support for GDPR, CCPA, and SOC 2
5. **Continuous Monitoring**: Real-time threat detection and response
6. **Incident Response**: Automated and manual response capabilities

### Implementation Priority

1. **Phase 1**: Core authentication, authorization, and encryption
2. **Phase 2**: Monitoring, logging, and incident response
3. **Phase 3**: Compliance controls and audit capabilities
4. **Phase 4**: Advanced threat detection and response automation

This security architecture ensures ConnectKit can meet the stringent requirements of enterprise customers while providing a secure foundation for future growth and feature development.
