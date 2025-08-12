# ConnectKit API Specification

## Overview

This document provides the complete REST API specification for the ConnectKit backend service. It follows OpenAPI 3.0 standards and includes detailed endpoint definitions, request/response schemas, authentication flows, and error handling.

## Base Information

- **Version**: 1.0.0
- **Base URL**: `https://api.connectkit.com/api/v1`
- **Authentication**: JWT Bearer Token
- **Content Type**: `application/json`
- **Charset**: UTF-8

## Authentication

### JWT Bearer Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Token Structure

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
  role: 'admin' | 'manager' | 'user' | 'readonly';
  iat: number;
  exp: number;
}
```

## Authentication Endpoints

### POST /auth/login

Authenticate user and receive access/refresh tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Request Schema:**
```typescript
interface LoginRequest {
  email: string;          // Valid email format, required
  password: string;       // Minimum 8 characters, required
  rememberMe?: boolean;   // Optional, extends token expiry
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "tenantId": "tenant-123",
      "lastLogin": "2024-01-15T10:30:00Z",
      "isActive": true
    }
  },
  "message": "Login successful",
  "requestId": "req-123456789"
}
```

**Error Responses:**

*401 Unauthorized - Invalid Credentials:*
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid email or password",
  "requestId": "req-123456789"
}
```

*401 Unauthorized - Account Locked:*
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Account is temporarily locked due to multiple failed attempts",
  "details": {
    "lockedUntil": "2024-01-15T11:00:00Z",
    "remainingTime": 1200
  },
  "requestId": "req-123456789"
}
```

*400 Bad Request - Validation Error:*
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    },
    {
      "field": "password",
      "message": "Must be at least 8 characters long"
    }
  ],
  "requestId": "req-123456789"
}
```

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request Schema:**
```typescript
interface RefreshTokenRequest {
  refreshToken: string;   // Valid JWT refresh token, required
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "message": "Token refreshed successfully",
  "requestId": "req-123456789"
}
```

### POST /auth/logout

Invalidate current session tokens.

**Headers Required:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "requestId": "req-123456789"
}
```

### POST /auth/forgot-password

Initiate password reset process.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset instructions sent to email",
  "requestId": "req-123456789"
}
```

### POST /auth/reset-password

Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset-token-123",
  "newPassword": "newSecurePassword123",
  "confirmPassword": "newSecurePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "requestId": "req-123456789"
}
```

## Contact Management Endpoints

### GET /contacts

Retrieve paginated list of contacts.

**Headers Required:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
```typescript
interface ContactListQuery {
  page?: number;          // Page number (default: 1)
  limit?: number;         // Items per page (default: 10, max: 100)
  search?: string;        // Search term for name, email, company
  sortBy?: 'firstName' | 'lastName' | 'company' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';  // Default: 'asc'
  company?: string;       // Filter by company
  tags?: string;          // Comma-separated tags
  createdAfter?: string;  // ISO 8601 date
  createdBefore?: string; // ISO 8601 date
  fields?: string;        // Comma-separated field names to include
}
```

**Example Request:**
```http
GET /api/v1/contacts?page=1&limit=20&search=john&sortBy=firstName&sortOrder=asc&company=Acme&tags=customer,vip&fields=id,firstName,lastName,email
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "firstName": "John",
        "lastName": "Doe",
        "email": ["john.doe@acme.com"],
        "phone": ["+1-555-123-4567"],
        "company": "Acme Corporation",
        "title": "Software Engineer",
        "address": [
          {
            "type": "work",
            "street": "123 Business St",
            "city": "San Francisco",
            "state": "CA",
            "zipCode": "94105",
            "country": "USA"
          }
        ],
        "tags": ["customer", "vip"],
        "customFields": {
          "department": "Engineering",
          "startDate": "2023-01-15"
        },
        "createdAt": "2024-01-01T10:00:00Z",
        "updatedAt": "2024-01-15T14:30:00Z",
        "createdBy": "user-456",
        "lastModifiedBy": "user-789",
        "version": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Contacts retrieved successfully",
  "requestId": "req-123456789"
}
```

### GET /contacts/{id}

Retrieve specific contact by ID.

**Path Parameters:**
- `id` (string, required): Contact UUID

**Headers Required:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
```typescript
interface GetContactQuery {
  fields?: string;        // Comma-separated field names to include
  includeAudit?: boolean; // Include audit trail (admin only)
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "email": ["john.doe@acme.com", "john.personal@gmail.com"],
    "phone": ["+1-555-123-4567", "+1-555-987-6543"],
    "company": "Acme Corporation",
    "title": "Senior Software Engineer",
    "address": [
      {
        "type": "work",
        "street": "123 Business St",
        "city": "San Francisco",
        "state": "CA",
        "zipCode": "94105",
        "country": "USA"
      },
      {
        "type": "home",
        "street": "456 Residential Ave",
        "city": "San Francisco",
        "state": "CA",
        "zipCode": "94110",
        "country": "USA"
      }
    ],
    "tags": ["customer", "vip", "enterprise"],
    "customFields": {
      "department": "Engineering",
      "startDate": "2023-01-15",
      "annualRevenue": 50000,
      "preferredContact": "email"
    },
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-15T14:30:00Z",
    "createdBy": "user-456",
    "lastModifiedBy": "user-789",
    "version": 3
  },
  "message": "Contact retrieved successfully",
  "requestId": "req-123456789"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Contact not found",
  "requestId": "req-123456789"
}
```

### POST /contacts

Create new contact.

**Headers Required:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": ["jane.smith@example.com"],
  "phone": ["+1-555-234-5678"],
  "company": "Tech Solutions Inc",
  "title": "Product Manager",
  "address": [
    {
      "type": "work",
      "street": "789 Innovation Drive",
      "city": "Austin",
      "state": "TX",
      "zipCode": "78701",
      "country": "USA"
    }
  ],
  "tags": ["prospect", "tech"],
  "customFields": {
    "industry": "Technology",
    "leadScore": 85,
    "source": "referral"
  }
}
```

**Request Schema:**
```typescript
interface CreateContactRequest {
  firstName: string;              // Required, 1-100 characters
  lastName: string;               // Required, 1-100 characters
  email: string[];                // Required, at least one valid email
  phone?: string[];               // Optional, valid phone numbers
  company?: string;               // Optional, 1-200 characters
  title?: string;                 // Optional, 1-200 characters
  address?: Address[];            // Optional array of addresses
  tags?: string[];                // Optional array of tags
  customFields?: Record<string, any>; // Optional key-value pairs
}

interface Address {
  type: 'home' | 'work' | 'other'; // Required
  street: string;                  // Required
  city: string;                    // Required
  state?: string;                  // Optional
  zipCode?: string;                // Optional
  country: string;                 // Required
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "660f9511-f30c-42e5-b827-557766551001",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": ["jane.smith@example.com"],
    "phone": ["+1-555-234-5678"],
    "company": "Tech Solutions Inc",
    "title": "Product Manager",
    "address": [
      {
        "type": "work",
        "street": "789 Innovation Drive",
        "city": "Austin",
        "state": "TX",
        "zipCode": "78701",
        "country": "USA"
      }
    ],
    "tags": ["prospect", "tech"],
    "customFields": {
      "industry": "Technology",
      "leadScore": 85,
      "source": "referral"
    },
    "createdAt": "2024-01-15T16:45:00Z",
    "updatedAt": "2024-01-15T16:45:00Z",
    "createdBy": "user-123",
    "lastModifiedBy": "user-123",
    "version": 1
  },
  "message": "Contact created successfully",
  "requestId": "req-123456789"
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Contact with email 'jane.smith@example.com' already exists",
  "details": {
    "conflictingField": "email",
    "conflictingValue": "jane.smith@example.com",
    "existingContactId": "550e8400-e29b-41d4-a716-446655440001"
  },
  "requestId": "req-123456789"
}
```

### PUT /contacts/{id}

Update existing contact (full update).

**Path Parameters:**
- `id` (string, required): Contact UUID

**Headers Required:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:** Same as POST /contacts

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "Jane Updated",
    "lastName": "Smith",
    "email": ["jane.updated@example.com"],
    "phone": ["+1-555-234-5678"],
    "company": "Tech Solutions Inc",
    "title": "Senior Product Manager",
    "address": [
      {
        "type": "work",
        "street": "789 Innovation Drive",
        "city": "Austin",
        "state": "TX",
        "zipCode": "78701",
        "country": "USA"
      }
    ],
    "tags": ["customer", "tech"],
    "customFields": {
      "industry": "Technology",
      "leadScore": 90,
      "source": "referral"
    },
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-15T17:30:00Z",
    "createdBy": "user-456",
    "lastModifiedBy": "user-123",
    "version": 4
  },
  "message": "Contact updated successfully",
  "requestId": "req-123456789"
}
```

### PATCH /contacts/{id}

Partial update of contact.

**Path Parameters:**
- `id` (string, required): Contact UUID

**Headers Required:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body (Partial):**
```json
{
  "title": "Senior Product Manager",
  "tags": ["customer", "tech", "enterprise"],
  "customFields": {
    "leadScore": 95
  }
}
```

**Success Response (200):** Same as PUT response

### DELETE /contacts/{id}

Delete contact (soft delete by default).

**Path Parameters:**
- `id` (string, required): Contact UUID

**Headers Required:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
```typescript
interface DeleteContactQuery {
  permanent?: boolean;    // Hard delete (admin only), default: false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contact deleted successfully",
  "requestId": "req-123456789"
}
```

### POST /contacts/bulk

Bulk operations on contacts.

**Headers Required:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "operation": "create",
  "data": [
    {
      "firstName": "Contact 1",
      "lastName": "Test",
      "email": ["contact1@example.com"]
    },
    {
      "firstName": "Contact 2",
      "lastName": "Test",
      "email": ["contact2@example.com"]
    }
  ],
  "options": {
    "skipDuplicates": true,
    "validateOnly": false
  }
}
```

**Request Schema:**
```typescript
interface BulkContactRequest {
  operation: 'create' | 'update' | 'delete';
  data: Array<CreateContactRequest | UpdateContactRequest | { id: string }>;
  options?: {
    skipDuplicates?: boolean;
    validateOnly?: boolean;
    continueOnError?: boolean;
  };
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "processed": 2,
    "successful": 2,
    "failed": 0,
    "skipped": 0,
    "results": [
      {
        "status": "success",
        "data": { "id": "contact-1", "firstName": "Contact 1" }
      },
      {
        "status": "success",
        "data": { "id": "contact-2", "firstName": "Contact 2" }
      }
    ],
    "errors": []
  },
  "message": "Bulk operation completed successfully",
  "requestId": "req-123456789"
}
```

### POST /contacts/search

Advanced contact search.

**Headers Required:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "company": "Acme"
          }
        }
      ],
      "should": [
        {
          "range": {
            "createdAt": {
              "gte": "2024-01-01T00:00:00Z",
              "lte": "2024-12-31T23:59:59Z"
            }
          }
        }
      ],
      "filter": [
        {
          "terms": {
            "tags": ["customer", "vip"]
          }
        }
      ]
    }
  },
  "sort": [
    {
      "createdAt": {
        "order": "desc"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20
  },
  "fields": ["id", "firstName", "lastName", "email", "company"]
}
```

## Organization Management Endpoints

### GET /organizations

Retrieve organizations list.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": "org-123",
        "name": "Acme Corporation",
        "domain": "acme.com",
        "industry": "Technology",
        "size": "large",
        "address": {
          "street": "123 Business Plaza",
          "city": "San Francisco",
          "state": "CA",
          "zipCode": "94105",
          "country": "USA"
        },
        "contactCount": 150,
        "createdAt": "2023-06-15T10:00:00Z",
        "updatedAt": "2024-01-10T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Organizations retrieved successfully",
  "requestId": "req-123456789"
}
```

### POST /organizations

Create new organization.

**Request Body:**
```json
{
  "name": "Tech Innovations LLC",
  "domain": "techinnovations.com",
  "industry": "Software Development",
  "size": "medium",
  "address": {
    "street": "456 Tech Park",
    "city": "Austin",
    "state": "TX",
    "zipCode": "78701",
    "country": "USA"
  },
  "customFields": {
    "founded": "2020-03-15",
    "employees": 75,
    "revenue": "10M-50M"
  }
}
```

## User Management Endpoints (Admin Only)

### GET /users

List users (Admin only).

**Headers Required:**
```http
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-123",
        "email": "admin@example.com",
        "firstName": "Admin",
        "lastName": "User",
        "role": "admin",
        "isActive": true,
        "lastLogin": "2024-01-15T09:30:00Z",
        "createdAt": "2023-12-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "requestId": "req-123456789"
}
```

## Health and Status Endpoints

### GET /health

System health check (no authentication required).

**Success Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T18:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 12
    },
    "cache": {
      "status": "healthy",
      "responseTime": 3
    },
    "search": {
      "status": "healthy",
      "responseTime": 8
    }
  },
  "uptime": 86400
}
```

### GET /health/detailed

Detailed health check (admin only).

**Headers Required:**
```http
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T18:00:00Z",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 12,
      "connections": {
        "active": 5,
        "idle": 3,
        "total": 8,
        "max": 10
      },
      "queries": {
        "total": 15432,
        "successful": 15401,
        "failed": 31
      }
    },
    "cache": {
      "status": "healthy",
      "responseTime": 3,
      "memory": {
        "used": "256MB",
        "max": "1GB",
        "utilization": "25%"
      },
      "keys": 1245,
      "hits": 8932,
      "misses": 1068
    }
  },
  "performance": {
    "avgResponseTime": 125,
    "requestsPerSecond": 45.2,
    "errorRate": 0.02
  }
}
```

## Error Response Formats

### Standard Error Response

All error responses follow this format:

```typescript
interface ErrorResponse {
  success: false;
  error: string;                    // Error type/category
  message: string;                  // Human-readable message
  details?: any;                    // Additional error details
  requestId: string;                // Request tracking ID
  timestamp?: string;               // ISO 8601 timestamp
}
```

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid request data/parameters |
| 401 | Unauthorized | Authentication required/failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource/constraint violation |
| 422 | Unprocessable Entity | Semantic validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Validation Errors (400)

```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Request validation failed",
  "details": [
    {
      "field": "email",
      "value": "invalid-email",
      "message": "Must be a valid email address",
      "code": "INVALID_FORMAT"
    },
    {
      "field": "firstName",
      "value": "",
      "message": "First name is required",
      "code": "REQUIRED_FIELD"
    }
  ],
  "requestId": "req-123456789"
}
```

### Rate Limiting (429)

```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "details": {
    "limit": 100,
    "remaining": 0,
    "resetTime": "2024-01-15T18:15:00Z",
    "retryAfter": 900
  },
  "requestId": "req-123456789"
}
```

## Rate Limiting

### Rate Limits by Endpoint Category

| Category | Requests | Window | Burst Allowed |
|----------|----------|--------|---------------|
| Authentication | 10 | 15 minutes | No |
| Contact Read | 1000 | 1 hour | Yes (10 req/sec) |
| Contact Write | 100 | 1 hour | Yes (5 req/sec) |
| Search | 200 | 1 hour | Yes (2 req/sec) |
| Bulk Operations | 10 | 1 hour | No |
| Admin Endpoints | 500 | 1 hour | Yes (5 req/sec) |

### Rate Limit Headers

All responses include rate limiting headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642262400
X-RateLimit-Window: 3600
```

## API Versioning

### Version Header

Clients can specify API version using header:

```http
Accept: application/vnd.connectkit.v1+json
```

### URL Versioning (Current)

```http
GET /api/v1/contacts
GET /api/v2/contacts  # Future version
```

### Backwards Compatibility

- Minor versions maintain backward compatibility
- Deprecated fields include `deprecated: true` in responses
- Breaking changes require major version increment

### Version Lifecycle

| Version | Status | Support Until | Deprecation Notice |
|---------|--------|---------------|-------------------|
| v1.0 | Current | 2025-12-31 | N/A |
| v1.1 | Development | TBD | N/A |
| v0.9 | Deprecated | 2024-06-30 | 3 months |

## Pagination

### Query Parameters

```typescript
interface PaginationQuery {
  page?: number;          // Page number (1-based, default: 1)
  limit?: number;         // Items per page (default: 10, max: 100)
  cursor?: string;        // Cursor-based pagination token
}
```

### Response Format

```json
{
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25,
      "hasNext": true,
      "hasPrev": false,
      "nextCursor": "eyJpZCI6IjEyMyIsInRzIjoiMjAyNC0wMS0xNSJ9",
      "prevCursor": null
    }
  }
}
```

### Cursor-based Pagination

For real-time data or large datasets:

```http
GET /api/v1/contacts?cursor=eyJpZCI6IjEyMyIsInRzIjoiMjAyNC0wMS0xNSJ9&limit=20
```

## Filtering and Sorting

### Filter Parameters

```typescript
interface FilterOptions {
  // Field filters
  company?: string;              // Exact match
  title?: string;                // Exact match
  tags?: string;                 // Comma-separated OR match
  
  // Date filters
  createdAfter?: string;         // ISO 8601 date
  createdBefore?: string;        // ISO 8601 date
  updatedAfter?: string;         // ISO 8601 date
  updatedBefore?: string;        // ISO 8601 date
  
  // Search
  search?: string;               // Full-text search
  searchFields?: string;         // Comma-separated fields
  
  // Advanced filters
  customField?: string;          // Format: "key:value"
}
```

### Sort Parameters

```typescript
interface SortOptions {
  sortBy?: string;              // Field name
  sortOrder?: 'asc' | 'desc';   // Sort direction
  sortMultiple?: string;        // Format: "field1:asc,field2:desc"
}
```

### Example Complex Query

```http
GET /api/v1/contacts?page=2&limit=25&company=Acme&tags=customer,vip&createdAfter=2024-01-01T00:00:00Z&sortBy=lastName&sortOrder=asc&search=john&searchFields=firstName,lastName,email
```

## Field Selection

### Sparse Fields

Request only needed fields to improve performance:

```http
GET /api/v1/contacts?fields=id,firstName,lastName,email
```

### Field Expansion

Include related data:

```http
GET /api/v1/contacts?expand=organization,createdBy
```

### Response with Field Selection

```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "firstName": "John",
        "lastName": "Doe",
        "email": ["john.doe@example.com"]
      }
    ]
  }
}
```

## WebSocket Events (Real-time Features)

### Connection

```javascript
const ws = new WebSocket('wss://api.connectkit.com/ws');
ws.addEventListener('open', () => {
  // Send authentication
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
});
```

### Event Types

#### Contact Events

```json
{
  "type": "contact.created",
  "data": {
    "id": "contact-123",
    "firstName": "John",
    "lastName": "Doe",
    "tenantId": "tenant-123"
  },
  "timestamp": "2024-01-15T18:30:00Z",
  "userId": "user-456"
}
```

```json
{
  "type": "contact.updated",
  "data": {
    "id": "contact-123",
    "changes": {
      "title": "Senior Engineer"
    },
    "version": 4
  },
  "timestamp": "2024-01-15T18:31:00Z",
  "userId": "user-456"
}
```

```json
{
  "type": "contact.deleted",
  "data": {
    "id": "contact-123",
    "tenantId": "tenant-123"
  },
  "timestamp": "2024-01-15T18:32:00Z",
  "userId": "user-456"
}
```

#### System Events

```json
{
  "type": "system.maintenance",
  "data": {
    "message": "Scheduled maintenance in 5 minutes",
    "scheduledTime": "2024-01-15T19:00:00Z",
    "duration": "30 minutes"
  },
  "timestamp": "2024-01-15T18:55:00Z"
}
```

### Event Subscription

```json
{
  "type": "subscribe",
  "events": ["contact.created", "contact.updated", "contact.deleted"],
  "filters": {
    "tenantId": "tenant-123"
  }
}
```

## OpenAPI 3.0 Specification

### Complete OpenAPI Document

```yaml
openapi: 3.0.3
info:
  title: ConnectKit API
  description: Enterprise Contact Management API
  version: 1.0.0
  contact:
    name: ConnectKit API Team
    email: api-support@connectkit.com
    url: https://docs.connectkit.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
servers:
  - url: https://api.connectkit.com/api/v1
    description: Production server
  - url: https://staging-api.connectkit.com/api/v1
    description: Staging server
  - url: http://localhost:3001/api/v1
    description: Development server
paths:
  /auth/login:
    post:
      tags:
        - Authentication
      summary: User login
      description: Authenticate user and receive access/refresh tokens
      operationId: login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimited'
  /contacts:
    get:
      tags:
        - Contacts
      summary: List contacts
      description: Retrieve paginated list of contacts
      operationId: getContacts
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/Page'
        - $ref: '#/components/parameters/Limit'
        - $ref: '#/components/parameters/Search'
        - $ref: '#/components/parameters/SortBy'
        - $ref: '#/components/parameters/SortOrder'
      responses:
        '200':
          description: Contacts retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ContactListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimited'
    post:
      tags:
        - Contacts
      summary: Create contact
      description: Create a new contact
      operationId: createContact
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateContactRequest'
      responses:
        '201':
          description: Contact created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ContactResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '409':
          $ref: '#/components/responses/Conflict'
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    LoginRequest:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
          example: user@example.com
        password:
          type: string
          minLength: 8
          example: securePassword123
        rememberMe:
          type: boolean
          default: false
    Contact:
      type: object
      required:
        - id
        - firstName
        - lastName
        - email
        - tenantId
        - createdAt
        - updatedAt
      properties:
        id:
          type: string
          format: uuid
          example: 550e8400-e29b-41d4-a716-446655440000
        tenantId:
          type: string
          format: uuid
          example: tenant-123
        firstName:
          type: string
          minLength: 1
          maxLength: 100
          example: John
        lastName:
          type: string
          minLength: 1
          maxLength: 100
          example: Doe
        email:
          type: array
          items:
            type: string
            format: email
          minItems: 1
          example: ['john.doe@example.com']
        phone:
          type: array
          items:
            type: string
            pattern: '^\+?[1-9]\d{1,14}$'
          example: ['+1-555-123-4567']
        company:
          type: string
          maxLength: 200
          example: Acme Corporation
        title:
          type: string
          maxLength: 200
          example: Software Engineer
        address:
          type: array
          items:
            $ref: '#/components/schemas/Address'
        tags:
          type: array
          items:
            type: string
          example: ['customer', 'vip']
        customFields:
          type: object
          additionalProperties: true
          example:
            department: Engineering
            startDate: '2023-01-15'
        createdAt:
          type: string
          format: date-time
          example: '2024-01-01T10:00:00Z'
        updatedAt:
          type: string
          format: date-time
          example: '2024-01-15T14:30:00Z'
        createdBy:
          type: string
          format: uuid
          example: user-456
        lastModifiedBy:
          type: string
          format: uuid
          example: user-789
        version:
          type: integer
          minimum: 1
          example: 3
    Address:
      type: object
      required:
        - type
        - street
        - city
        - country
      properties:
        type:
          type: string
          enum: [home, work, other]
          example: work
        street:
          type: string
          example: 123 Business St
        city:
          type: string
          example: San Francisco
        state:
          type: string
          example: CA
        zipCode:
          type: string
          example: '94105'
        country:
          type: string
          example: USA
  responses:
    ValidationError:
      description: Validation error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    Unauthorized:
      description: Authentication required or failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    Conflict:
      description: Resource conflict
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    RateLimited:
      description: Rate limit exceeded
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
  parameters:
    Page:
      name: page
      in: query
      description: Page number (1-based)
      schema:
        type: integer
        minimum: 1
        default: 1
    Limit:
      name: limit
      in: query
      description: Items per page
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 10
    Search:
      name: search
      in: query
      description: Search term
      schema:
        type: string
    SortBy:
      name: sortBy
      in: query
      description: Field to sort by
      schema:
        type: string
        enum: [firstName, lastName, company, createdAt, updatedAt]
        default: createdAt
    SortOrder:
      name: sortOrder
      in: query
      description: Sort order
      schema:
        type: string
        enum: [asc, desc]
        default: asc
```

This comprehensive API specification provides complete documentation for all ConnectKit backend endpoints, including authentication flows, CRUD operations, error handling, and advanced features like real-time updates and bulk operations.