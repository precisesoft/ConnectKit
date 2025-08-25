# Phase 2: Backend API Development - Implementation Plan

## Overview

This document outlines the comprehensive backend implementation plan for ConnectKit Phase 2, focusing on building a scalable, secure, and maintainable API service using TypeScript, Express.js, and PostgreSQL with clean architecture principles and Test-Driven Development (TDD).

## Architecture Overview

### Clean Architecture Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                        External Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Controllers   │  │   Middleware    │  │     Routes      │ │
│  │   HTTP Layer    │  │  Auth/Validation│  │   API Endpoints │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │    Services     │  │    Use Cases    │  │      DTOs       │ │
│  │ Business Logic  │  │ Application     │  │ Data Transfer   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                       Domain Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │    Entities     │  │   Value Objects │  │  Domain Events  │ │
│  │ Business Rules  │  │   Invariants    │  │   Aggregates    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Repositories   │  │    Database     │  │  External APIs  │ │
│  │  Data Access    │  │   PostgreSQL    │  │   Integrations  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
backend/
├── src/
│   ├── application/           # Application layer
│   │   ├── dtos/             # Data Transfer Objects
│   │   │   ├── auth/
│   │   │   │   ├── LoginRequestDto.ts
│   │   │   │   ├── TokenResponseDto.ts
│   │   │   │   └── RefreshTokenRequestDto.ts
│   │   │   └── contacts/
│   │   │       ├── CreateContactDto.ts
│   │   │       ├── UpdateContactDto.ts
│   │   │       └── ContactResponseDto.ts
│   │   ├── services/         # Application services
│   │   │   ├── AuthService.ts
│   │   │   ├── ContactService.ts
│   │   │   └── OrganizationService.ts
│   │   └── use-cases/        # Use case implementations
│   │       ├── auth/
│   │       │   ├── LoginUseCase.ts
│   │       │   ├── RefreshTokenUseCase.ts
│   │       │   └── LogoutUseCase.ts
│   │       └── contacts/
│   │           ├── CreateContactUseCase.ts
│   │           ├── GetContactUseCase.ts
│   │           ├── UpdateContactUseCase.ts
│   │           └── DeleteContactUseCase.ts
│   ├── domain/               # Domain layer
│   │   ├── entities/         # Domain entities
│   │   │   ├── Contact.ts
│   │   │   ├── User.ts
│   │   │   └── Organization.ts
│   │   ├── value-objects/    # Value objects
│   │   │   ├── Email.ts
│   │   │   ├── PhoneNumber.ts
│   │   │   └── Address.ts
│   │   ├── repositories/     # Repository interfaces
│   │   │   ├── IContactRepository.ts
│   │   │   ├── IUserRepository.ts
│   │   │   └── IOrganizationRepository.ts
│   │   └── events/           # Domain events
│   │       ├── ContactCreatedEvent.ts
│   │       └── ContactUpdatedEvent.ts
│   ├── infrastructure/       # Infrastructure layer
│   │   ├── database/
│   │   │   ├── config/
│   │   │   │   └── database.ts
│   │   │   ├── repositories/ # Repository implementations
│   │   │   │   ├── PostgresContactRepository.ts
│   │   │   │   ├── PostgresUserRepository.ts
│   │   │   │   └── PostgresOrganizationRepository.ts
│   │   │   ├── migrations/
│   │   │   │   ├── 001_create_users_table.sql
│   │   │   │   ├── 002_create_contacts_table.sql
│   │   │   │   └── 003_create_audit_log_table.sql
│   │   │   └── seeds/
│   │   │       └── initial_data.sql
│   │   ├── cache/
│   │   │   ├── RedisClient.ts
│   │   │   └── CacheService.ts
│   │   └── external-services/
│   │       └── EmailService.ts
│   ├── presentation/         # Presentation layer
│   │   ├── controllers/      # HTTP controllers
│   │   │   ├── AuthController.ts
│   │   │   ├── ContactController.ts
│   │   │   └── HealthController.ts
│   │   ├── middleware/       # Express middleware
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── error-handler.ts
│   │   │   ├── rate-limiter.ts
│   │   │   └── security.ts
│   │   ├── routes/           # API routes
│   │   │   ├── v1/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── contacts.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── validators/       # Request validators
│   │       ├── auth.ts
│   │       └── contact.ts
│   ├── shared/               # Shared utilities
│   │   ├── config/
│   │   │   └── app-config.ts
│   │   ├── constants/
│   │   │   └── app-constants.ts
│   │   ├── errors/           # Custom error classes
│   │   │   ├── AppError.ts
│   │   │   ├── ValidationError.ts
│   │   │   └── UnauthorizedError.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── crypto.ts
│   │   │   └── date.ts
│   │   └── types/
│   │       └── common.ts
│   ├── tests/                # Test files
│   │   ├── unit/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   └── utils/
│   │   ├── integration/
│   │   │   ├── api/
│   │   │   └── database/
│   │   └── e2e/
│   │       └── auth.e2e.test.ts
│   ├── app.ts               # Express app setup
│   └── index.ts             # Application entry point
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.example
└── README.md
```

## Express.js Application Structure with TypeScript

### Application Entry Point (`src/index.ts`)

```typescript
import "express-async-errors";
import express from "express";
import { AppConfig } from "@/shared/config/app-config";
import { DatabaseConnection } from "@/infrastructure/database/config/database";
import { CacheService } from "@/infrastructure/cache/CacheService";
import { Logger } from "@/shared/utils/logger";
import { setupMiddleware } from "@/presentation/middleware";
import { setupRoutes } from "@/presentation/routes";
import { errorHandler } from "@/presentation/middleware/error-handler";

async function bootstrap(): Promise<void> {
  const app = express();
  const config = AppConfig.getInstance();
  const logger = Logger.getInstance();

  try {
    // Initialize database connection
    await DatabaseConnection.getInstance().connect();
    logger.info("Database connected successfully");

    // Initialize cache service
    await CacheService.getInstance().connect();
    logger.info("Cache service connected successfully");

    // Setup middleware
    setupMiddleware(app);

    // Setup routes
    setupRoutes(app);

    // Global error handler (must be last)
    app.use(errorHandler);

    // Start server
    const port = config.get("PORT");
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${config.get("NODE_ENV")}`);
    });
  } catch (error) {
    logger.error("Failed to start application:", error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: unknown) => {
  Logger.getInstance().error("Unhandled Promise Rejection:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  Logger.getInstance().error("Uncaught Exception:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  Logger.getInstance().info("SIGTERM received, shutting down gracefully");
  await DatabaseConnection.getInstance().disconnect();
  await CacheService.getInstance().disconnect();
  process.exit(0);
});

bootstrap();
```

### Express App Configuration (`src/app.ts`)

```typescript
import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import { AppConfig } from "@/shared/config/app-config";
import { Logger } from "@/shared/utils/logger";

export function setupMiddleware(app: Application): void {
  const config = AppConfig.getInstance();
  const logger = Logger.getInstance();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // CORS configuration
  app.use(
    cors({
      origin: config.get("ALLOWED_ORIGINS")?.split(",") || [
        "http://localhost:3000",
      ],
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    }),
  );

  // Request parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Compression
  app.use(compression());

  // Data sanitization
  app.use(mongoSanitize());
  app.use(hpp());

  // Rate limiting
  app.use(
    "/api/",
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: "Too many requests from this IP, please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Logging
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    }),
  );

  // Request ID middleware
  app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    res.setHeader("X-Request-ID", req.id);
    next();
  });
}
```

## JWT Authentication Flow with Refresh Tokens

### JWT Service Implementation

```typescript
// src/infrastructure/auth/JWTService.ts
import jwt from "jsonwebtoken";
import { AppConfig } from "@/shared/config/app-config";
import { UnauthorizedError } from "@/shared/errors/UnauthorizedError";

export interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTService {
  private readonly config = AppConfig.getInstance();
  private readonly accessTokenSecret = this.config.get("JWT_ACCESS_SECRET");
  private readonly refreshTokenSecret = this.config.get("JWT_REFRESH_SECRET");
  private readonly accessTokenExpiry =
    this.config.get("JWT_ACCESS_EXPIRY") || "15m";
  private readonly refreshTokenExpiry =
    this.config.get("JWT_REFRESH_EXPIRY") || "7d";

  generateTokenPair(payload: Omit<JWTPayload, "iat" | "exp">): TokenPair {
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiry },
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret) as JWTPayload;
    } catch (error) {
      throw new UnauthorizedError("Invalid access token");
    }
  }

  verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as { userId: string };
    } catch (error) {
      throw new UnauthorizedError("Invalid refresh token");
    }
  }

  extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }
    return authHeader.substring(7);
  }
}
```

### Authentication Middleware

```typescript
// src/presentation/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { JWTService, JWTPayload } from "@/infrastructure/auth/JWTService";
import { UnauthorizedError } from "@/shared/errors/UnauthorizedError";
import { Logger } from "@/shared/utils/logger";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      id?: string;
    }
  }
}

export class AuthMiddleware {
  private readonly jwtService = new JWTService();
  private readonly logger = Logger.getInstance();

  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = this.jwtService.extractTokenFromHeader(
        req.headers.authorization,
      );

      const payload = this.jwtService.verifyAccessToken(token);
      req.user = payload;

      this.logger.info(`User authenticated: ${payload.userId}`, {
        requestId: req.id,
        userId: payload.userId,
        tenantId: payload.tenantId,
      });

      next();
    } catch (error) {
      this.logger.warn("Authentication failed", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      next(error);
    }
  };

  authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        return next(new UnauthorizedError("Authentication required"));
      }

      if (!roles.includes(req.user.role)) {
        return next(new UnauthorizedError("Insufficient permissions"));
      }

      next();
    };
  };
}

export const authMiddleware = new AuthMiddleware();
```

## Database Connection Pooling and Query Optimization

### Database Configuration

```typescript
// src/infrastructure/database/config/database.ts
import { Pool, PoolConfig, Client } from "pg";
import { AppConfig } from "@/shared/config/app-config";
import { Logger } from "@/shared/utils/logger";

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool | null = null;
  private readonly config = AppConfig.getInstance();
  private readonly logger = Logger.getInstance();

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<void> {
    const poolConfig: PoolConfig = {
      host: this.config.get("DB_HOST"),
      port: parseInt(this.config.get("DB_PORT") || "5432"),
      database: this.config.get("DB_NAME"),
      user: this.config.get("DB_USER"),
      password: this.config.get("DB_PASSWORD"),
      ssl:
        this.config.get("NODE_ENV") === "production"
          ? { rejectUnauthorized: false }
          : false,
      max: parseInt(this.config.get("DB_POOL_MAX") || "10"),
      min: parseInt(this.config.get("DB_POOL_MIN") || "2"),
      idleTimeoutMillis: parseInt(
        this.config.get("DB_IDLE_TIMEOUT") || "10000",
      ),
      connectionTimeoutMillis: parseInt(
        this.config.get("DB_CONNECTION_TIMEOUT") || "2000",
      ),
      acquireTimeoutMillis: parseInt(
        this.config.get("DB_ACQUIRE_TIMEOUT") || "2000",
      ),
    };

    this.pool = new Pool(poolConfig);

    // Test connection
    const client = await this.pool.connect();
    await client.query("SELECT NOW()");
    client.release();

    this.logger.info("Database connection pool created successfully");

    // Monitor pool events
    this.pool.on("connect", () => {
      this.logger.debug("New client connected to database");
    });

    this.pool.on("error", (err) => {
      this.logger.error("Unexpected error on idle client", err);
    });
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.logger.info("Database connection pool closed");
    }
  }

  getPool(): Pool {
    if (!this.pool) {
      throw new Error("Database not connected");
    }
    return this.pool;
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    try {
      const result = await this.pool!.query(text, params);
      const duration = Date.now() - start;

      this.logger.debug("Database query executed", {
        query: text,
        duration: `${duration}ms`,
        rows: result.rows.length,
      });

      return result.rows;
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error("Database query failed", {
        query: text,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  async transaction<T>(callback: (client: Client) => Promise<T>): Promise<T> {
    const client = await this.pool!.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
```

## Service Layer Pattern Implementation

### Base Service Class

```typescript
// src/application/services/BaseService.ts
import { Logger } from "@/shared/utils/logger";
import { ValidationError } from "@/shared/errors/ValidationError";

export abstract class BaseService {
  protected readonly logger = Logger.getInstance();

  protected validateRequired(
    data: Record<string, any>,
    fields: string[],
  ): void {
    const missing = fields.filter((field) => !data[field]);
    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missing.join(", ")}`,
      );
    }
  }

  protected sanitizeInput<T>(data: T): T {
    if (typeof data === "string") {
      return data.trim() as T;
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeInput(item)) as T;
    }
    if (typeof data === "object" && data !== null) {
      const sanitized = {} as T;
      for (const [key, value] of Object.entries(data)) {
        (sanitized as any)[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    return data;
  }

  protected logOperation(operation: string, data?: any): void {
    this.logger.info(`Service operation: ${operation}`, {
      operation,
      data: this.logger.isDebugEnabled() ? data : undefined,
    });
  }
}
```

### Contact Service Implementation

```typescript
// src/application/services/ContactService.ts
import { BaseService } from "./BaseService";
import { IContactRepository } from "@/domain/repositories/IContactRepository";
import { Contact } from "@/domain/entities/Contact";
import { CreateContactDto } from "@/application/dtos/contacts/CreateContactDto";
import { UpdateContactDto } from "@/application/dtos/contacts/UpdateContactDto";
import { ContactResponseDto } from "@/application/dtos/contacts/ContactResponseDto";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { ConflictError } from "@/shared/errors/ConflictError";

export class ContactService extends BaseService {
  constructor(private readonly contactRepository: IContactRepository) {
    super();
  }

  async createContact(
    userId: string,
    tenantId: string,
    createContactDto: CreateContactDto,
  ): Promise<ContactResponseDto> {
    this.logOperation("createContact", { userId, tenantId });

    // Validate required fields
    this.validateRequired(createContactDto, ["firstName", "lastName", "email"]);

    // Sanitize input
    const sanitizedData = this.sanitizeInput(createContactDto);

    // Check for existing contact with same email
    const existingContact = await this.contactRepository.findByEmail(
      tenantId,
      sanitizedData.email[0],
    );

    if (existingContact) {
      throw new ConflictError("Contact with this email already exists");
    }

    // Create contact entity
    const contact = Contact.create({
      ...sanitizedData,
      tenantId,
      createdBy: userId,
      lastModifiedBy: userId,
    });

    // Save to repository
    const savedContact = await this.contactRepository.save(contact);

    this.logger.info("Contact created successfully", {
      contactId: savedContact.id,
      tenantId,
    });

    return ContactResponseDto.fromEntity(savedContact);
  }

  async getContact(
    userId: string,
    tenantId: string,
    contactId: string,
  ): Promise<ContactResponseDto> {
    this.logOperation("getContact", { userId, tenantId, contactId });

    const contact = await this.contactRepository.findById(tenantId, contactId);

    if (!contact) {
      throw new NotFoundError("Contact not found");
    }

    return ContactResponseDto.fromEntity(contact);
  }

  async updateContact(
    userId: string,
    tenantId: string,
    contactId: string,
    updateContactDto: UpdateContactDto,
  ): Promise<ContactResponseDto> {
    this.logOperation("updateContact", { userId, tenantId, contactId });

    // Get existing contact
    const existingContact = await this.contactRepository.findById(
      tenantId,
      contactId,
    );

    if (!existingContact) {
      throw new NotFoundError("Contact not found");
    }

    // Sanitize input
    const sanitizedData = this.sanitizeInput(updateContactDto);

    // Update contact
    const updatedContact = existingContact.update({
      ...sanitizedData,
      lastModifiedBy: userId,
    });

    // Save to repository
    const savedContact = await this.contactRepository.save(updatedContact);

    this.logger.info("Contact updated successfully", {
      contactId: savedContact.id,
      tenantId,
    });

    return ContactResponseDto.fromEntity(savedContact);
  }

  async deleteContact(
    userId: string,
    tenantId: string,
    contactId: string,
  ): Promise<void> {
    this.logOperation("deleteContact", { userId, tenantId, contactId });

    const contact = await this.contactRepository.findById(tenantId, contactId);

    if (!contact) {
      throw new NotFoundError("Contact not found");
    }

    await this.contactRepository.softDelete(tenantId, contactId);

    this.logger.info("Contact deleted successfully", {
      contactId,
      tenantId,
    });
  }

  async searchContacts(
    userId: string,
    tenantId: string,
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    contacts: ContactResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logOperation("searchContacts", {
      userId,
      tenantId,
      query,
      page,
      limit,
    });

    const { contacts, total } = await this.contactRepository.search(
      tenantId,
      query,
      (page - 1) * limit,
      limit,
    );

    const contactDtos = contacts.map((contact) =>
      ContactResponseDto.fromEntity(contact),
    );

    return {
      contacts: contactDtos,
      total,
      page,
      limit,
    };
  }
}
```

## Repository Pattern for Data Access

### Base Repository Interface

```typescript
// src/domain/repositories/IBaseRepository.ts
export interface IBaseRepository<T> {
  findById(tenantId: string, id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(tenantId: string, id: string): Promise<void>;
  softDelete(tenantId: string, id: string): Promise<void>;
  findAll(tenantId: string, offset?: number, limit?: number): Promise<T[]>;
  count(tenantId: string): Promise<number>;
}
```

### Contact Repository Implementation

```typescript
// src/infrastructure/database/repositories/PostgresContactRepository.ts
import { IContactRepository } from "@/domain/repositories/IContactRepository";
import { Contact } from "@/domain/entities/Contact";
import { DatabaseConnection } from "@/infrastructure/database/config/database";
import { Logger } from "@/shared/utils/logger";

export class PostgresContactRepository implements IContactRepository {
  private readonly db = DatabaseConnection.getInstance();
  private readonly logger = Logger.getInstance();

  async findById(tenantId: string, id: string): Promise<Contact | null> {
    const query = `
      SELECT * FROM contacts 
      WHERE id = $1 AND tenant_id = $2 AND is_deleted = false
    `;

    const rows = await this.db.query(query, [id, tenantId]);

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  async save(contact: Contact): Promise<Contact> {
    if (contact.id) {
      return this.update(contact);
    } else {
      return this.create(contact);
    }
  }

  private async create(contact: Contact): Promise<Contact> {
    const query = `
      INSERT INTO contacts (
        tenant_id, first_name, last_name, email_encrypted, phone_encrypted,
        company, title, address_encrypted, tags, custom_fields,
        created_by, last_modified_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      contact.tenantId,
      contact.firstName,
      contact.lastName,
      JSON.stringify(contact.email), // Encrypted in real implementation
      JSON.stringify(contact.phone), // Encrypted in real implementation
      contact.company,
      contact.title,
      JSON.stringify(contact.address), // Encrypted in real implementation
      contact.tags,
      JSON.stringify(contact.customFields),
      contact.createdBy,
      contact.lastModifiedBy,
    ];

    const rows = await this.db.query(query, values);
    return this.mapRowToEntity(rows[0]);
  }

  private async update(contact: Contact): Promise<Contact> {
    const query = `
      UPDATE contacts 
      SET first_name = $3, last_name = $4, email_encrypted = $5, 
          phone_encrypted = $6, company = $7, title = $8, 
          address_encrypted = $9, tags = $10, custom_fields = $11,
          last_modified_by = $12, updated_at = NOW(), version = version + 1
      WHERE id = $1 AND tenant_id = $2 AND is_deleted = false
      RETURNING *
    `;

    const values = [
      contact.id,
      contact.tenantId,
      contact.firstName,
      contact.lastName,
      JSON.stringify(contact.email),
      JSON.stringify(contact.phone),
      contact.company,
      contact.title,
      JSON.stringify(contact.address),
      contact.tags,
      JSON.stringify(contact.customFields),
      contact.lastModifiedBy,
    ];

    const rows = await this.db.query(query, values);

    if (rows.length === 0) {
      throw new Error("Contact not found or update failed");
    }

    return this.mapRowToEntity(rows[0]);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const query = `DELETE FROM contacts WHERE id = $1 AND tenant_id = $2`;
    await this.db.query(query, [id, tenantId]);
  }

  async softDelete(tenantId: string, id: string): Promise<void> {
    const query = `
      UPDATE contacts 
      SET is_deleted = true, updated_at = NOW() 
      WHERE id = $1 AND tenant_id = $2
    `;
    await this.db.query(query, [id, tenantId]);
  }

  async findByEmail(tenantId: string, email: string): Promise<Contact | null> {
    // In production, this would need to handle encrypted email search
    const query = `
      SELECT * FROM contacts 
      WHERE tenant_id = $1 AND email_encrypted LIKE $2 AND is_deleted = false
    `;

    const rows = await this.db.query(query, [tenantId, `%${email}%`]);

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  async search(
    tenantId: string,
    query: string,
    offset: number,
    limit: number,
  ): Promise<{ contacts: Contact[]; total: number }> {
    const searchQuery = `
      SELECT * FROM contacts 
      WHERE tenant_id = $1 AND is_deleted = false
      AND (
        first_name ILIKE $2 OR 
        last_name ILIKE $2 OR 
        company ILIKE $2 OR
        title ILIKE $2
      )
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const countQuery = `
      SELECT COUNT(*) FROM contacts 
      WHERE tenant_id = $1 AND is_deleted = false
      AND (
        first_name ILIKE $2 OR 
        last_name ILIKE $2 OR 
        company ILIKE $2 OR
        title ILIKE $2
      )
    `;

    const searchTerm = `%${query}%`;

    const [rows, countRows] = await Promise.all([
      this.db.query(searchQuery, [tenantId, searchTerm, limit, offset]),
      this.db.query(countQuery, [tenantId, searchTerm]),
    ]);

    const contacts = rows.map((row) => this.mapRowToEntity(row));
    const total = parseInt(countRows[0].count);

    return { contacts, total };
  }

  async findAll(
    tenantId: string,
    offset: number = 0,
    limit: number = 10,
  ): Promise<Contact[]> {
    const query = `
      SELECT * FROM contacts 
      WHERE tenant_id = $1 AND is_deleted = false
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const rows = await this.db.query(query, [tenantId, limit, offset]);
    return rows.map((row) => this.mapRowToEntity(row));
  }

  async count(tenantId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) FROM contacts 
      WHERE tenant_id = $1 AND is_deleted = false
    `;

    const rows = await this.db.query(query, [tenantId]);
    return parseInt(rows[0].count);
  }

  private mapRowToEntity(row: any): Contact {
    return Contact.fromPersistence({
      id: row.id,
      tenantId: row.tenant_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: JSON.parse(row.email_encrypted || "[]"),
      phone: JSON.parse(row.phone_encrypted || "[]"),
      company: row.company,
      title: row.title,
      address: JSON.parse(row.address_encrypted || "[]"),
      tags: row.tags || [],
      customFields: JSON.parse(row.custom_fields || "{}"),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      lastModifiedBy: row.last_modified_by,
      version: row.version,
    });
  }
}
```

## Middleware Stack

### Security Middleware

```typescript
// src/presentation/middleware/security.ts
import { Request, Response, NextFunction } from "express";
import xss from "xss";
import { Logger } from "@/shared/utils/logger";

export class SecurityMiddleware {
  private readonly logger = Logger.getInstance();

  xssProtection = (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Sanitize request body
      if (req.body) {
        req.body = this.sanitizeObject(req.body);
      }

      // Sanitize query parameters
      if (req.query) {
        req.query = this.sanitizeObject(req.query);
      }

      next();
    } catch (error) {
      this.logger.error("XSS sanitization error", error);
      next(error);
    }
  };

  private sanitizeObject(obj: any): any {
    if (typeof obj === "string") {
      return xss(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  tenantIsolation = (req: Request, res: Response, next: NextFunction): void => {
    if (req.user) {
      // Ensure all database queries are scoped to the user's tenant
      req.headers["x-tenant-id"] = req.user.tenantId;
    }
    next();
  };
}

export const securityMiddleware = new SecurityMiddleware();
```

### Validation Middleware

```typescript
// src/presentation/middleware/validation.ts
import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ValidationError } from "@/shared/errors/ValidationError";

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      throw new ValidationError("Validation failed", details);
    }

    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      throw new ValidationError("Query validation failed", details);
    }

    next();
  };
};
```

### Error Handler Middleware

```typescript
// src/presentation/middleware/error-handler.ts
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { Logger } from "@/shared/utils/logger";
import { AppError } from "@/shared/errors/AppError";
import { ValidationError } from "@/shared/errors/ValidationError";
import { UnauthorizedError } from "@/shared/errors/UnauthorizedError";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { ConflictError } from "@/shared/errors/ConflictError";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const logger = Logger.getInstance();

  logger.error("Request error", {
    requestId: req.id,
    method: req.method,
    url: req.url,
    error: error.message,
    stack: error.stack,
  });

  if (error instanceof ValidationError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Validation Error",
      message: error.message,
      details: error.details,
      requestId: req.id,
    });
    return;
  }

  if (error instanceof UnauthorizedError) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: "Unauthorized",
      message: error.message,
      requestId: req.id,
    });
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: "Not Found",
      message: error.message,
      requestId: req.id,
    });
    return;
  }

  if (error instanceof ConflictError) {
    res.status(StatusCodes.CONFLICT).json({
      success: false,
      error: "Conflict",
      message: error.message,
      requestId: req.id,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.name,
      message: error.message,
      requestId: req.id,
    });
    return;
  }

  // Handle database errors
  if (error.message.includes("duplicate key value")) {
    res.status(StatusCodes.CONFLICT).json({
      success: false,
      error: "Duplicate Entry",
      message: "Resource already exists",
      requestId: req.id,
    });
    return;
  }

  // Default error response
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : error.message,
    requestId: req.id,
  });
};
```

## API Versioning Strategy

### Version Management

```typescript
// src/presentation/routes/index.ts
import { Application } from "express";
import { v1Routes } from "./v1";
import { v2Routes } from "./v2"; // Future version

export function setupRoutes(app: Application): void {
  // Version 1 routes (current)
  app.use("/api/v1", v1Routes);

  // Version 2 routes (future)
  // app.use('/api/v2', v2Routes);

  // Default to latest version
  app.use("/api", v1Routes);

  // Health check endpoint (unversioned)
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  });
}
```

### Version-specific Routes

```typescript
// src/presentation/routes/v1/index.ts
import { Router } from "express";
import { authRoutes } from "./auth";
import { contactRoutes } from "./contacts";
import { organizationRoutes } from "./organizations";

const router = Router();

// Mount version-specific routes
router.use("/auth", authRoutes);
router.use("/contacts", contactRoutes);
router.use("/organizations", organizationRoutes);

// Version information
router.get("/", (req, res) => {
  res.json({
    version: "v1",
    description: "ConnectKit API Version 1",
    documentation: "/api/v1/docs",
  });
});

export { router as v1Routes };
```

## OpenAPI Documentation Approach

### Swagger Configuration

```typescript
// src/shared/config/swagger.ts
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";
import { AppConfig } from "./app-config";

const config = AppConfig.getInstance();

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ConnectKit API",
      version: "1.0.0",
      description: "Enterprise Contact Management API",
      contact: {
        name: "ConnectKit Team",
        email: "api-support@connectkit.com",
      },
    },
    servers: [
      {
        url: config.get("API_BASE_URL") || "http://localhost:3001/api/v1",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication information is missing or invalid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  error: { type: "string", example: "Unauthorized" },
                  message: { type: "string", example: "Invalid token" },
                  requestId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        ValidationError: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  error: { type: "string", example: "Validation Error" },
                  message: { type: "string", example: "Validation failed" },
                  details: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        message: { type: "string" },
                      },
                    },
                  },
                  requestId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [
    "./src/presentation/routes/**/*.ts",
    "./src/presentation/controllers/**/*.ts",
  ],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Application): void {
  app.use(
    "/api/v1/docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      customCssUrl: "/swagger-ui-custom.css",
      customSiteTitle: "ConnectKit API Documentation",
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );
}
```

## Performance Optimization Techniques

### Caching Strategy

```typescript
// src/infrastructure/cache/CacheService.ts
import Redis from "ioredis";
import { AppConfig } from "@/shared/config/app-config";
import { Logger } from "@/shared/utils/logger";

export class CacheService {
  private static instance: CacheService;
  private redis: Redis | null = null;
  private readonly config = AppConfig.getInstance();
  private readonly logger = Logger.getInstance();

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async connect(): Promise<void> {
    this.redis = new Redis({
      host: this.config.get("REDIS_HOST") || "localhost",
      port: parseInt(this.config.get("REDIS_PORT") || "6379"),
      password: this.config.get("REDIS_PASSWORD"),
      db: parseInt(this.config.get("REDIS_DB") || "0"),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    await this.redis.connect();
    this.logger.info("Redis cache connected successfully");
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
      this.logger.info("Redis cache disconnected");
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis!.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error("Cache get error", { key, error });
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis!.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis!.set(key, serialized);
      }
    } catch (error) {
      this.logger.error("Cache set error", { key, error });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis!.del(key);
    } catch (error) {
      this.logger.error("Cache delete error", { key, error });
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis!.keys(pattern);
      if (keys.length > 0) {
        await this.redis!.del(...keys);
      }
    } catch (error) {
      this.logger.error("Cache pattern invalidation error", { pattern, error });
    }
  }

  generateKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(":")}`;
  }
}
```

### Query Optimization

```typescript
// src/infrastructure/database/repositories/OptimizedContactRepository.ts
import { PostgresContactRepository } from "./PostgresContactRepository";
import { CacheService } from "@/infrastructure/cache/CacheService";
import { Contact } from "@/domain/entities/Contact";

export class OptimizedContactRepository extends PostgresContactRepository {
  private readonly cache = CacheService.getInstance();
  private readonly CACHE_TTL = 300; // 5 minutes

  async findById(tenantId: string, id: string): Promise<Contact | null> {
    const cacheKey = this.cache.generateKey("contact", tenantId, id);

    // Try cache first
    const cached = await this.cache.get<Contact>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fallback to database
    const contact = await super.findById(tenantId, id);

    if (contact) {
      await this.cache.set(cacheKey, contact, this.CACHE_TTL);
    }

    return contact;
  }

  async save(contact: Contact): Promise<Contact> {
    const savedContact = await super.save(contact);

    // Update cache
    const cacheKey = this.cache.generateKey(
      "contact",
      contact.tenantId,
      contact.id!,
    );
    await this.cache.set(cacheKey, savedContact, this.CACHE_TTL);

    // Invalidate search cache
    await this.cache.invalidatePattern(`search:${contact.tenantId}:*`);

    return savedContact;
  }

  async search(
    tenantId: string,
    query: string,
    offset: number,
    limit: number,
  ): Promise<{ contacts: Contact[]; total: number }> {
    const cacheKey = this.cache.generateKey(
      "search",
      tenantId,
      query,
      offset.toString(),
      limit.toString(),
    );

    // Try cache first
    const cached = await this.cache.get<{ contacts: Contact[]; total: number }>(
      cacheKey,
    );
    if (cached) {
      return cached;
    }

    // Fallback to database with optimized query
    const result = await super.search(tenantId, query, offset, limit);

    // Cache for shorter time due to frequent updates
    await this.cache.set(cacheKey, result, 60); // 1 minute

    return result;
  }

  async softDelete(tenantId: string, id: string): Promise<void> {
    await super.softDelete(tenantId, id);

    // Remove from cache
    const cacheKey = this.cache.generateKey("contact", tenantId, id);
    await this.cache.del(cacheKey);

    // Invalidate search cache
    await this.cache.invalidatePattern(`search:${tenantId}:*`);
  }
}
```

## Environment Configuration

### Environment Variables

```bash
# .env.example

# Application
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001/api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=connectkit_dev
DB_USER=postgres
DB_PASSWORD=password
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=10000
DB_CONNECTION_TIMEOUT=2000
DB_ACQUIRE_TIMEOUT=2000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=debug
LOG_FORMAT=combined

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Performance
REQUEST_TIMEOUT=30000
MAX_REQUEST_SIZE=10mb
```

## Deployment Configuration

### Docker Configuration

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies
FROM base AS deps-dev
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3001

ENV PORT 3001

CMD ["node", "dist/index.js"]
```

## Testing Strategy

### Test Configuration

```typescript
// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/tests/**",
    "!src/migrations/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testTimeout: 30000,
  maxWorkers: 4,
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    "./src/application/services/": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

This comprehensive backend implementation plan provides the foundation for building a scalable, secure, and maintainable API service for ConnectKit. The next phase will focus on implementing comprehensive Test-Driven Development practices to ensure code quality and reliability.
