# Backend Test-Driven Development (TDD) Implementation Plan

## Overview

This document provides a comprehensive Test-Driven Development implementation plan for the ConnectKit backend API. It follows the Red-Green-Refactor cycle and establishes testing standards that ensure high code quality, maintainability, and reliability.

## TDD Philosophy and Approach

### Red-Green-Refactor Cycle

```
🔴 RED    → Write a failing test that describes desired behavior
🟢 GREEN  → Write the minimal code to make the test pass
🔵 REFACTOR → Improve the code while keeping tests green
```

### Testing Pyramid for Backend

```
                    /\
                   /  \
                  / E2E \ ←── 10% - Full integration tests
                 /______\
                /        \
               / INTEGRATION \ ←── 20% - API + Database tests
              /______________\
             /                \
            /       UNIT        \ ←── 70% - Service, Repository, Utils
           /____________________\
```

## Test File Structure and Naming Conventions

### Directory Structure

```
src/tests/
├── unit/                          # Unit tests (70% of test suite)
│   ├── application/
│   │   ├── services/
│   │   │   ├── AuthService.test.ts
│   │   │   ├── ContactService.test.ts
│   │   │   └── OrganizationService.test.ts
│   │   └── use-cases/
│   │       ├── auth/
│   │       │   ├── LoginUseCase.test.ts
│   │       │   ├── RefreshTokenUseCase.test.ts
│   │       │   └── LogoutUseCase.test.ts
│   │       └── contacts/
│   │           ├── CreateContactUseCase.test.ts
│   │           ├── GetContactUseCase.test.ts
│   │           ├── UpdateContactUseCase.test.ts
│   │           └── DeleteContactUseCase.test.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Contact.test.ts
│   │   │   ├── User.test.ts
│   │   │   └── Organization.test.ts
│   │   └── value-objects/
│   │       ├── Email.test.ts
│   │       ├── PhoneNumber.test.ts
│   │       └── Address.test.ts
│   ├── infrastructure/
│   │   ├── database/
│   │   │   └── repositories/
│   │   │       ├── PostgresContactRepository.test.ts
│   │   │       ├── PostgresUserRepository.test.ts
│   │   │       └── PostgresOrganizationRepository.test.ts
│   │   └── cache/
│   │       └── CacheService.test.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   ├── AuthController.test.ts
│   │   │   ├── ContactController.test.ts
│   │   │   └── HealthController.test.ts
│   │   ├── middleware/
│   │   │   ├── auth.test.ts
│   │   │   ├── validation.test.ts
│   │   │   ├── error-handler.test.ts
│   │   │   └── security.test.ts
│   │   └── validators/
│   │       ├── auth.test.ts
│   │       └── contact.test.ts
│   └── shared/
│       └── utils/
│           ├── logger.test.ts
│           ├── crypto.test.ts
│           └── date.test.ts
├── integration/                   # Integration tests (20% of test suite)
│   ├── api/
│   │   ├── auth.integration.test.ts
│   │   ├── contacts.integration.test.ts
│   │   └── organizations.integration.test.ts
│   ├── database/
│   │   ├── migrations.integration.test.ts
│   │   └── repositories.integration.test.ts
│   └── cache/
│       └── redis.integration.test.ts
├── e2e/                          # End-to-end tests (10% of test suite)
│   ├── auth-flow.e2e.test.ts
│   ├── contact-management.e2e.test.ts
│   └── api-versioning.e2e.test.ts
├── fixtures/                     # Test data and builders
│   ├── builders/
│   │   ├── ContactBuilder.ts
│   │   ├── UserBuilder.ts
│   │   └── OrganizationBuilder.ts
│   ├── data/
│   │   ├── contacts.json
│   │   ├── users.json
│   │   └── organizations.json
│   └── database/
│       └── test-migrations/
├── mocks/                        # Mock implementations
│   ├── repositories/
│   │   ├── MockContactRepository.ts
│   │   ├── MockUserRepository.ts
│   │   └── MockOrganizationRepository.ts
│   ├── services/
│   │   └── MockEmailService.ts
│   └── database/
│       └── MockDatabaseConnection.ts
├── helpers/                      # Test utilities
│   ├── test-database.ts
│   ├── test-server.ts
│   ├── auth-helpers.ts
│   └── assertion-helpers.ts
└── setup/                       # Test configuration
    ├── jest.setup.ts
    ├── test-env.ts
    └── global-teardown.ts
```

### Naming Conventions

#### Test Files

- **Unit tests**: `{ClassName}.test.ts`
- **Integration tests**: `{feature}.integration.test.ts`
- **E2E tests**: `{workflow}.e2e.test.ts`

#### Test Descriptions

- **Describe blocks**: Use class/function name
- **Test cases**: Use "should {behavior} when {condition}"

```typescript
describe("ContactService", () => {
  describe("createContact", () => {
    it("should create contact when valid data is provided", async () => {
      // Test implementation
    });

    it("should throw ValidationError when required fields are missing", async () => {
      // Test implementation
    });

    it("should throw ConflictError when contact with email already exists", async () => {
      // Test implementation
    });
  });
});
```

## Testing Order (TDD Implementation Sequence)

### Phase 1: Domain Layer (Week 1)

Start with the core business logic to establish domain rules first.

#### 1.1 Value Objects (Day 1)

```bash
# Test order for value objects
src/tests/unit/domain/value-objects/Email.test.ts
src/tests/unit/domain/value-objects/PhoneNumber.test.ts
src/tests/unit/domain/value-objects/Address.test.ts
```

#### 1.2 Domain Entities (Day 2-3)

```bash
# Test order for entities
src/tests/unit/domain/entities/User.test.ts
src/tests/unit/domain/entities/Organization.test.ts
src/tests/unit/domain/entities/Contact.test.ts
```

### Phase 2: Infrastructure Layer (Week 2)

Build the data access and external service integrations.

#### 2.1 Database Repositories (Day 1-3)

```bash
# Test order for repositories
src/tests/unit/infrastructure/database/repositories/PostgresUserRepository.test.ts
src/tests/unit/infrastructure/database/repositories/PostgresOrganizationRepository.test.ts
src/tests/unit/infrastructure/database/repositories/PostgresContactRepository.test.ts
```

#### 2.2 Cache and External Services (Day 4-5)

```bash
# Test order for infrastructure services
src/tests/unit/infrastructure/cache/CacheService.test.ts
src/tests/unit/infrastructure/external-services/EmailService.test.ts
```

### Phase 3: Application Layer (Week 3)

Implement business use cases and application services.

#### 3.1 Use Cases (Day 1-3)

```bash
# Test order for use cases
src/tests/unit/application/use-cases/auth/LoginUseCase.test.ts
src/tests/unit/application/use-cases/auth/RefreshTokenUseCase.test.ts
src/tests/unit/application/use-cases/auth/LogoutUseCase.test.ts
src/tests/unit/application/use-cases/contacts/CreateContactUseCase.test.ts
src/tests/unit/application/use-cases/contacts/GetContactUseCase.test.ts
src/tests/unit/application/use-cases/contacts/UpdateContactUseCase.test.ts
src/tests/unit/application/use-cases/contacts/DeleteContactUseCase.test.ts
```

#### 3.2 Application Services (Day 4-5)

```bash
# Test order for services
src/tests/unit/application/services/AuthService.test.ts
src/tests/unit/application/services/ContactService.test.ts
src/tests/unit/application/services/OrganizationService.test.ts
```

### Phase 4: Presentation Layer (Week 4)

Build the HTTP layer with controllers and middleware.

#### 4.1 Middleware (Day 1-2)

```bash
# Test order for middleware
src/tests/unit/presentation/middleware/auth.test.ts
src/tests/unit/presentation/middleware/validation.test.ts
src/tests/unit/presentation/middleware/error-handler.test.ts
src/tests/unit/presentation/middleware/security.test.ts
```

#### 4.2 Controllers (Day 3-4)

```bash
# Test order for controllers
src/tests/unit/presentation/controllers/AuthController.test.ts
src/tests/unit/presentation/controllers/ContactController.test.ts
src/tests/unit/presentation/controllers/HealthController.test.ts
```

#### 4.3 Validators (Day 5)

```bash
# Test order for validators
src/tests/unit/presentation/validators/auth.test.ts
src/tests/unit/presentation/validators/contact.test.ts
```

### Phase 5: Integration Tests (Week 5)

Test component interactions and API endpoints.

```bash
# Integration test order
src/tests/integration/database/repositories.integration.test.ts
src/tests/integration/cache/redis.integration.test.ts
src/tests/integration/api/auth.integration.test.ts
src/tests/integration/api/contacts.integration.test.ts
src/tests/integration/api/organizations.integration.test.ts
```

### Phase 6: E2E Tests (Week 6)

Test complete user workflows.

```bash
# E2E test order
src/tests/e2e/auth-flow.e2e.test.ts
src/tests/e2e/contact-management.e2e.test.ts
src/tests/e2e/api-versioning.e2e.test.ts
```

## Red-Green-Refactor Examples

### Example 1: Authentication Endpoints

#### 🔴 RED - Write Failing Test First

```typescript
// src/tests/unit/application/services/AuthService.test.ts
import { AuthService } from "@/application/services/AuthService";
import { MockUserRepository } from "@/tests/mocks/repositories/MockUserRepository";
import { JWTService } from "@/infrastructure/auth/JWTService";
import { BCryptPasswordService } from "@/infrastructure/auth/BCryptPasswordService";
import { LoginRequestDto } from "@/application/dtos/auth/LoginRequestDto";
import { UnauthorizedError } from "@/shared/errors/UnauthorizedError";
import { UserBuilder } from "@/tests/fixtures/builders/UserBuilder";

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserRepository: MockUserRepository;
  let jwtService: JWTService;
  let passwordService: BCryptPasswordService;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    jwtService = new JWTService();
    passwordService = new BCryptPasswordService();
    authService = new AuthService(
      mockUserRepository,
      jwtService,
      passwordService,
    );
  });

  describe("login", () => {
    it("should return tokens when valid credentials are provided", async () => {
      // 🔴 RED: This test will fail because AuthService.login doesn't exist yet

      // Arrange
      const hashedPassword = await passwordService.hash("password123");
      const user = new UserBuilder()
        .withEmail("test@example.com")
        .withPassword(hashedPassword)
        .build();

      mockUserRepository.users.set(user.id, user);

      const loginRequest: LoginRequestDto = {
        email: "test@example.com",
        password: "password123",
      };

      // Act
      const result = await authService.login(loginRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user.email).toBe("test@example.com");
    });

    it("should throw UnauthorizedError when user does not exist", async () => {
      // 🔴 RED: This test will also fail

      // Arrange
      const loginRequest: LoginRequestDto = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      // Act & Assert
      await expect(authService.login(loginRequest)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("should throw UnauthorizedError when password is incorrect", async () => {
      // 🔴 RED: This test will also fail

      // Arrange
      const hashedPassword = await passwordService.hash("correctPassword");
      const user = new UserBuilder()
        .withEmail("test@example.com")
        .withPassword(hashedPassword)
        .build();

      mockUserRepository.users.set(user.id, user);

      const loginRequest: LoginRequestDto = {
        email: "test@example.com",
        password: "wrongPassword",
      };

      // Act & Assert
      await expect(authService.login(loginRequest)).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });
});
```

#### 🟢 GREEN - Write Minimal Code to Pass

```typescript
// src/application/services/AuthService.ts
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { JWTService, TokenPair } from "@/infrastructure/auth/JWTService";
import { IPasswordService } from "@/domain/services/IPasswordService";
import { LoginRequestDto } from "@/application/dtos/auth/LoginRequestDto";
import { TokenResponseDto } from "@/application/dtos/auth/TokenResponseDto";
import { UnauthorizedError } from "@/shared/errors/UnauthorizedError";
import { BaseService } from "./BaseService";

export class AuthService extends BaseService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JWTService,
    private readonly passwordService: IPasswordService,
  ) {
    super();
  }

  async login(loginRequest: LoginRequestDto): Promise<TokenResponseDto> {
    this.logOperation("login", { email: loginRequest.email });

    // Find user by email
    const user = await this.userRepository.findByEmail(loginRequest.email);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await this.passwordService.compare(
      loginRequest.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Generate tokens
    const tokens = this.jwtService.generateTokenPair({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });

    return new TokenResponseDto(tokens.accessToken, tokens.refreshToken, user);
  }
}
```

#### 🔵 REFACTOR - Improve Code Quality

```typescript
// src/application/services/AuthService.ts (Refactored)
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { JWTService } from "@/infrastructure/auth/JWTService";
import { IPasswordService } from "@/domain/services/IPasswordService";
import { LoginRequestDto } from "@/application/dtos/auth/LoginRequestDto";
import { TokenResponseDto } from "@/application/dtos/auth/TokenResponseDto";
import { RefreshTokenRequestDto } from "@/application/dtos/auth/RefreshTokenRequestDto";
import { UnauthorizedError } from "@/shared/errors/UnauthorizedError";
import { BaseService } from "./BaseService";

export class AuthService extends BaseService {
  private readonly LOGIN_ATTEMPT_LIMIT = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JWTService,
    private readonly passwordService: IPasswordService,
  ) {
    super();
  }

  async login(loginRequest: LoginRequestDto): Promise<TokenResponseDto> {
    this.logOperation("login", { email: loginRequest.email });

    // Validate input
    this.validateRequired(loginRequest, ["email", "password"]);

    // Find user by email
    const user = await this.userRepository.findByEmail(
      loginRequest.email.toLowerCase(),
    );
    if (!user || !user.isActive) {
      this.logSecurityEvent("login_attempt_invalid_user", {
        email: loginRequest.email,
      });
      throw new UnauthorizedError("Invalid credentials");
    }

    // Check if account is locked
    if (this.isAccountLocked(user)) {
      this.logSecurityEvent("login_attempt_locked_account", {
        userId: user.id,
      });
      throw new UnauthorizedError("Account is temporarily locked");
    }

    // Verify password
    const isPasswordValid = await this.passwordService.compare(
      loginRequest.password,
      user.password,
    );

    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      this.logSecurityEvent("login_attempt_invalid_password", {
        userId: user.id,
      });
      throw new UnauthorizedError("Invalid credentials");
    }

    // Reset failed attempts on successful login
    await this.resetFailedAttempts(user);

    // Generate tokens
    const tokens = this.jwtService.generateTokenPair({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    this.logSecurityEvent("login_successful", { userId: user.id });

    return new TokenResponseDto(tokens.accessToken, tokens.refreshToken, user);
  }

  async refreshToken(
    refreshRequest: RefreshTokenRequestDto,
  ): Promise<TokenResponseDto> {
    this.logOperation("refreshToken");

    try {
      const decoded = this.jwtService.verifyRefreshToken(
        refreshRequest.refreshToken,
      );
      const user = await this.userRepository.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const tokens = this.jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      });

      return new TokenResponseDto(
        tokens.accessToken,
        tokens.refreshToken,
        user,
      );
    } catch (error) {
      this.logSecurityEvent("refresh_token_invalid", { error: error.message });
      throw new UnauthorizedError("Invalid refresh token");
    }
  }

  private isAccountLocked(user: any): boolean {
    if (!user.lockedUntil) return false;
    return new Date() < new Date(user.lockedUntil);
  }

  private async handleFailedLogin(user: any): Promise<void> {
    const failedAttempts = (user.failedLoginAttempts || 0) + 1;

    if (failedAttempts >= this.LOGIN_ATTEMPT_LIMIT) {
      const lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
      await this.userRepository.lockAccount(user.id, lockedUntil);
    } else {
      await this.userRepository.incrementFailedAttempts(
        user.id,
        failedAttempts,
      );
    }
  }

  private async resetFailedAttempts(user: any): Promise<void> {
    if (user.failedLoginAttempts > 0) {
      await this.userRepository.resetFailedAttempts(user.id);
    }
  }

  private logSecurityEvent(event: string, data: any): void {
    this.logger.warn(`Security event: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }
}
```

### Example 2: CRUD Operations

#### 🔴 RED - Contact Service Creation Test

```typescript
// src/tests/unit/application/services/ContactService.test.ts
import { ContactService } from "@/application/services/ContactService";
import { MockContactRepository } from "@/tests/mocks/repositories/MockContactRepository";
import { CreateContactDto } from "@/application/dtos/contacts/CreateContactDto";
import { ValidationError } from "@/shared/errors/ValidationError";
import { ConflictError } from "@/shared/errors/ConflictError";
import { ContactBuilder } from "@/tests/fixtures/builders/ContactBuilder";

describe("ContactService", () => {
  let contactService: ContactService;
  let mockContactRepository: MockContactRepository;

  beforeEach(() => {
    mockContactRepository = new MockContactRepository();
    contactService = new ContactService(mockContactRepository);
  });

  describe("createContact", () => {
    it("should create contact when valid data is provided", async () => {
      // 🔴 RED: This will fail initially

      // Arrange
      const userId = "user-123";
      const tenantId = "tenant-123";
      const createContactDto: CreateContactDto = {
        firstName: "John",
        lastName: "Doe",
        email: ["john.doe@example.com"],
        phone: ["+1234567890"],
        company: "Acme Corp",
        title: "Software Engineer",
        address: [],
        tags: ["customer"],
        customFields: { department: "Engineering" },
      };

      // Act
      const result = await contactService.createContact(
        userId,
        tenantId,
        createContactDto,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
      expect(result.email).toEqual(["john.doe@example.com"]);
      expect(result.id).toBeTruthy();
      expect(mockContactRepository.contacts.size).toBe(1);
    });

    it("should throw ValidationError when required fields are missing", async () => {
      // 🔴 RED: This will fail initially

      // Arrange
      const userId = "user-123";
      const tenantId = "tenant-123";
      const createContactDto = {
        // Missing required fields
        company: "Acme Corp",
      } as CreateContactDto;

      // Act & Assert
      await expect(
        contactService.createContact(userId, tenantId, createContactDto),
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ConflictError when contact with email already exists", async () => {
      // 🔴 RED: This will fail initially

      // Arrange
      const userId = "user-123";
      const tenantId = "tenant-123";
      const existingContact = new ContactBuilder()
        .withTenantId(tenantId)
        .withEmail(["john.doe@example.com"])
        .build();

      mockContactRepository.contacts.set(existingContact.id, existingContact);

      const createContactDto: CreateContactDto = {
        firstName: "John",
        lastName: "Doe",
        email: ["john.doe@example.com"], // Duplicate email
        phone: ["+1234567890"],
        company: "Acme Corp",
        title: "Software Engineer",
        address: [],
        tags: [],
        customFields: {},
      };

      // Act & Assert
      await expect(
        contactService.createContact(userId, tenantId, createContactDto),
      ).rejects.toThrow(ConflictError);
    });
  });
});
```

### Example 3: Repository Layer Testing

#### 🔴 RED - Repository Test

```typescript
// src/tests/unit/infrastructure/database/repositories/PostgresContactRepository.test.ts
import { PostgresContactRepository } from "@/infrastructure/database/repositories/PostgresContactRepository";
import { Contact } from "@/domain/entities/Contact";
import { ContactBuilder } from "@/tests/fixtures/builders/ContactBuilder";
import { MockDatabaseConnection } from "@/tests/mocks/database/MockDatabaseConnection";

describe("PostgresContactRepository", () => {
  let repository: PostgresContactRepository;
  let mockDb: MockDatabaseConnection;

  beforeEach(() => {
    mockDb = new MockDatabaseConnection();
    repository = new PostgresContactRepository();
    // Inject mock database
    (repository as any).db = mockDb;
  });

  describe("save", () => {
    it("should save new contact to database", async () => {
      // 🔴 RED: This will fail until implementation exists

      // Arrange
      const contact = new ContactBuilder()
        .withoutId() // New contact without ID
        .withTenantId("tenant-123")
        .withFirstName("John")
        .withLastName("Doe")
        .build();

      // Mock database response
      const mockInsertResult = {
        id: "contact-123",
        tenant_id: "tenant-123",
        first_name: "John",
        last_name: "Doe",
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
      };

      mockDb.queryResults.push([mockInsertResult]);

      // Act
      const savedContact = await repository.save(contact);

      // Assert
      expect(savedContact).toBeDefined();
      expect(savedContact.id).toBe("contact-123");
      expect(mockDb.executedQueries).toHaveLength(1);
      expect(mockDb.executedQueries[0].sql).toContain("INSERT INTO contacts");
    });

    it("should update existing contact in database", async () => {
      // 🔴 RED: This will fail until implementation exists

      // Arrange
      const contact = new ContactBuilder()
        .withId("contact-123")
        .withTenantId("tenant-123")
        .withFirstName("John Updated")
        .build();

      const mockUpdateResult = {
        id: "contact-123",
        tenant_id: "tenant-123",
        first_name: "John Updated",
        last_name: "Doe",
        updated_at: new Date(),
        version: 2,
      };

      mockDb.queryResults.push([mockUpdateResult]);

      // Act
      const updatedContact = await repository.save(contact);

      // Assert
      expect(updatedContact.firstName).toBe("John Updated");
      expect(mockDb.executedQueries).toHaveLength(1);
      expect(mockDb.executedQueries[0].sql).toContain("UPDATE contacts");
    });
  });

  describe("findById", () => {
    it("should return contact when found", async () => {
      // 🔴 RED: This will fail until implementation exists

      // Arrange
      const contactId = "contact-123";
      const tenantId = "tenant-123";

      const mockResult = {
        id: contactId,
        tenant_id: tenantId,
        first_name: "John",
        last_name: "Doe",
        email_encrypted: JSON.stringify(["john@example.com"]),
        created_at: new Date(),
      };

      mockDb.queryResults.push([mockResult]);

      // Act
      const contact = await repository.findById(tenantId, contactId);

      // Assert
      expect(contact).toBeDefined();
      expect(contact!.id).toBe(contactId);
      expect(contact!.firstName).toBe("John");
      expect(mockDb.executedQueries[0].params).toEqual([contactId, tenantId]);
    });

    it("should return null when contact not found", async () => {
      // 🔴 RED: This will fail until implementation exists

      // Arrange
      mockDb.queryResults.push([]); // Empty result

      // Act
      const contact = await repository.findById("tenant-123", "nonexistent");

      // Assert
      expect(contact).toBeNull();
    });
  });
});
```

## Mock Strategies

### Database Mocking

```typescript
// src/tests/mocks/database/MockDatabaseConnection.ts
export interface QueryResult {
  sql: string;
  params: any[];
  result: any[];
}

export class MockDatabaseConnection {
  public executedQueries: QueryResult[] = [];
  public queryResults: any[][] = [];
  private resultIndex = 0;

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const result = this.queryResults[this.resultIndex] || [];
    this.resultIndex++;

    this.executedQueries.push({
      sql: text,
      params: params || [],
      result,
    });

    return { rows: result } as any;
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const mockClient = {
      query: this.query.bind(this),
    };
    return callback(mockClient);
  }

  reset(): void {
    this.executedQueries = [];
    this.queryResults = [];
    this.resultIndex = 0;
  }
}
```

### Repository Mocking

```typescript
// src/tests/mocks/repositories/MockContactRepository.ts
import { IContactRepository } from "@/domain/repositories/IContactRepository";
import { Contact } from "@/domain/entities/Contact";

export class MockContactRepository implements IContactRepository {
  public contacts = new Map<string, Contact>();
  public queries: { method: string; params: any[] }[] = [];

  async findById(tenantId: string, id: string): Promise<Contact | null> {
    this.queries.push({ method: "findById", params: [tenantId, id] });

    const contact = this.contacts.get(id);
    if (contact && contact.tenantId === tenantId && !contact.isDeleted) {
      return contact;
    }
    return null;
  }

  async save(contact: Contact): Promise<Contact> {
    this.queries.push({ method: "save", params: [contact] });

    if (!contact.id) {
      contact = contact.withId(`contact-${Date.now()}`);
    }

    this.contacts.set(contact.id!, contact);
    return contact;
  }

  async findByEmail(tenantId: string, email: string): Promise<Contact | null> {
    this.queries.push({ method: "findByEmail", params: [tenantId, email] });

    for (const contact of this.contacts.values()) {
      if (
        contact.tenantId === tenantId &&
        contact.email.includes(email) &&
        !contact.isDeleted
      ) {
        return contact;
      }
    }
    return null;
  }

  async search(
    tenantId: string,
    query: string,
    offset: number,
    limit: number,
  ): Promise<{ contacts: Contact[]; total: number }> {
    this.queries.push({
      method: "search",
      params: [tenantId, query, offset, limit],
    });

    const allContacts = Array.from(this.contacts.values()).filter(
      (c) => c.tenantId === tenantId && !c.isDeleted,
    );

    const filteredContacts = allContacts.filter(
      (c) =>
        c.firstName.toLowerCase().includes(query.toLowerCase()) ||
        c.lastName.toLowerCase().includes(query.toLowerCase()) ||
        c.company?.toLowerCase().includes(query.toLowerCase()),
    );

    const contacts = filteredContacts.slice(offset, offset + limit);

    return { contacts, total: filteredContacts.length };
  }

  async softDelete(tenantId: string, id: string): Promise<void> {
    this.queries.push({ method: "softDelete", params: [tenantId, id] });

    const contact = this.contacts.get(id);
    if (contact && contact.tenantId === tenantId) {
      this.contacts.set(id, contact.markDeleted());
    }
  }

  async delete(tenantId: string, id: string): Promise<void> {
    this.queries.push({ method: "delete", params: [tenantId, id] });
    this.contacts.delete(id);
  }

  async findAll(
    tenantId: string,
    offset?: number,
    limit?: number,
  ): Promise<Contact[]> {
    this.queries.push({ method: "findAll", params: [tenantId, offset, limit] });

    const contacts = Array.from(this.contacts.values()).filter(
      (c) => c.tenantId === tenantId && !c.isDeleted,
    );

    if (offset !== undefined && limit !== undefined) {
      return contacts.slice(offset, offset + limit);
    }

    return contacts;
  }

  async count(tenantId: string): Promise<number> {
    this.queries.push({ method: "count", params: [tenantId] });

    return Array.from(this.contacts.values()).filter(
      (c) => c.tenantId === tenantId && !c.isDeleted,
    ).length;
  }

  reset(): void {
    this.contacts.clear();
    this.queries = [];
  }
}
```

### Service Mocking

```typescript
// src/tests/mocks/services/MockEmailService.ts
import { IEmailService } from "@/domain/services/IEmailService";

export interface SentEmail {
  to: string;
  subject: string;
  body: string;
  timestamp: Date;
}

export class MockEmailService implements IEmailService {
  public sentEmails: SentEmail[] = [];
  public shouldFail = false;
  public failureMessage = "Email service unavailable";

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    this.sentEmails.push({
      to,
      subject,
      body,
      timestamp: new Date(),
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendEmail(
      email,
      "Welcome to ConnectKit",
      `Hello ${name}, welcome to ConnectKit!`,
    );
  }

  reset(): void {
    this.sentEmails = [];
    this.shouldFail = false;
  }
}
```

## Test Data Builders and Fixtures

### Builder Pattern for Test Data

```typescript
// src/tests/fixtures/builders/ContactBuilder.ts
import { Contact } from "@/domain/entities/Contact";
import { faker } from "@faker-js/faker";

export class ContactBuilder {
  private id?: string;
  private tenantId: string = "default-tenant";
  private firstName: string = faker.person.firstName();
  private lastName: string = faker.person.lastName();
  private email: string[] = [faker.internet.email()];
  private phone: string[] = [faker.phone.number()];
  private company?: string = faker.company.name();
  private title?: string = faker.person.jobTitle();
  private address: any[] = [];
  private tags: string[] = [];
  private customFields: Record<string, any> = {};
  private createdBy: string = "system";
  private lastModifiedBy: string = "system";
  private createdAt: Date = new Date();
  private updatedAt: Date = new Date();
  private version: number = 1;
  private isDeleted: boolean = false;

  withId(id: string): ContactBuilder {
    this.id = id;
    return this;
  }

  withoutId(): ContactBuilder {
    this.id = undefined;
    return this;
  }

  withTenantId(tenantId: string): ContactBuilder {
    this.tenantId = tenantId;
    return this;
  }

  withFirstName(firstName: string): ContactBuilder {
    this.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): ContactBuilder {
    this.lastName = lastName;
    return this;
  }

  withEmail(email: string[]): ContactBuilder {
    this.email = email;
    return this;
  }

  withPhone(phone: string[]): ContactBuilder {
    this.phone = phone;
    return this;
  }

  withCompany(company: string): ContactBuilder {
    this.company = company;
    return this;
  }

  withTitle(title: string): ContactBuilder {
    this.title = title;
    return this;
  }

  withTags(tags: string[]): ContactBuilder {
    this.tags = tags;
    return this;
  }

  withCustomFields(customFields: Record<string, any>): ContactBuilder {
    this.customFields = customFields;
    return this;
  }

  withCreatedBy(createdBy: string): ContactBuilder {
    this.createdBy = createdBy;
    return this;
  }

  markDeleted(): ContactBuilder {
    this.isDeleted = true;
    return this;
  }

  build(): Contact {
    return Contact.fromPersistence({
      id: this.id,
      tenantId: this.tenantId,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      company: this.company,
      title: this.title,
      address: this.address,
      tags: this.tags,
      customFields: this.customFields,
      createdBy: this.createdBy,
      lastModifiedBy: this.lastModifiedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
      isDeleted: this.isDeleted,
    });
  }

  buildMany(count: number): Contact[] {
    return Array.from({ length: count }, (_, index) =>
      new ContactBuilder()
        .withFirstName(faker.person.firstName())
        .withLastName(faker.person.lastName())
        .withEmail([faker.internet.email()])
        .withTenantId(this.tenantId)
        .build(),
    );
  }
}
```

### Test Fixtures

```typescript
// src/tests/fixtures/data/contacts.json
{
  "valid_contacts": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": ["john.doe@example.com"],
      "phone": ["+1234567890"],
      "company": "Acme Corp",
      "title": "Software Engineer"
    },
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": ["jane.smith@example.com"],
      "phone": ["+1234567891"],
      "company": "Tech Solutions",
      "title": "Product Manager"
    }
  ],
  "invalid_contacts": [
    {
      "firstName": "",
      "lastName": "Doe",
      "email": ["invalid-email"],
      "phone": ["invalid-phone"]
    },
    {
      "firstName": "John",
      "lastName": "",
      "email": [],
      "phone": []
    }
  ]
}
```

## Integration Test Setup

### Test Database Setup

```typescript
// src/tests/helpers/test-database.ts
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

export class TestDatabase {
  private static pool: Pool;
  private static readonly TEST_DB_NAME = "connectkit_test";

  static async setup(): Promise<void> {
    // Create test database
    await this.createTestDatabase();

    // Initialize connection pool
    this.pool = new Pool({
      host: process.env.TEST_DB_HOST || "localhost",
      port: parseInt(process.env.TEST_DB_PORT || "5432"),
      database: this.TEST_DB_NAME,
      user: process.env.TEST_DB_USER || "postgres",
      password: process.env.TEST_DB_PASSWORD || "password",
    });

    // Run migrations
    await this.runMigrations();
  }

  static async teardown(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
    await this.dropTestDatabase();
  }

  static async clean(): Promise<void> {
    // Clean all tables in reverse order of dependencies
    const tables = ["audit_log", "contacts", "organizations", "users"];

    for (const table of tables) {
      await this.pool.query(`TRUNCATE TABLE ${table} CASCADE`);
    }
  }

  static getPool(): Pool {
    return this.pool;
  }

  private static async createTestDatabase(): Promise<void> {
    const adminPool = new Pool({
      host: process.env.TEST_DB_HOST || "localhost",
      port: parseInt(process.env.TEST_DB_PORT || "5432"),
      database: "postgres",
      user: process.env.TEST_DB_USER || "postgres",
      password: process.env.TEST_DB_PASSWORD || "password",
    });

    try {
      await adminPool.query(`DROP DATABASE IF EXISTS ${this.TEST_DB_NAME}`);
      await adminPool.query(`CREATE DATABASE ${this.TEST_DB_NAME}`);
    } finally {
      await adminPool.end();
    }
  }

  private static async dropTestDatabase(): Promise<void> {
    const adminPool = new Pool({
      host: process.env.TEST_DB_HOST || "localhost",
      port: parseInt(process.env.TEST_DB_PORT || "5432"),
      database: "postgres",
      user: process.env.TEST_DB_USER || "postgres",
      password: process.env.TEST_DB_PASSWORD || "password",
    });

    try {
      await adminPool.query(`DROP DATABASE IF EXISTS ${this.TEST_DB_NAME}`);
    } finally {
      await adminPool.end();
    }
  }

  private static async runMigrations(): Promise<void> {
    const migrationsPath = join(__dirname, "../../database/migrations");
    const migrationFiles = [
      "001_init.sql",
      "002_contacts.sql",
      "003_audit.sql",
    ];

    for (const file of migrationFiles) {
      const migration = readFileSync(join(migrationsPath, file), "utf8");
      await this.pool.query(migration);
    }
  }
}
```

### Test Server Setup

```typescript
// src/tests/helpers/test-server.ts
import { Application } from "express";
import request from "supertest";
import { setupMiddleware, setupRoutes } from "@/app";
import { TestDatabase } from "./test-database";

export class TestServer {
  private app: Application;
  public request: request.SuperTest<request.Test>;

  constructor() {
    this.app = express();
    setupMiddleware(this.app);
    setupRoutes(this.app);
    this.request = request(this.app);
  }

  static async create(): Promise<TestServer> {
    await TestDatabase.setup();
    return new TestServer();
  }

  async cleanup(): Promise<void> {
    await TestDatabase.clean();
  }

  async close(): Promise<void> {
    await TestDatabase.teardown();
  }
}
```

### Authentication Helpers

```typescript
// src/tests/helpers/auth-helpers.ts
import { JWTService } from "@/infrastructure/auth/JWTService";
import { UserBuilder } from "@/tests/fixtures/builders/UserBuilder";

export class AuthHelpers {
  private static jwtService = new JWTService();

  static async createAuthenticatedUser(overrides: Partial<any> = {}): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = new UserBuilder().withRole("user").build();

    const tokens = this.jwtService.generateTokenPair({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });

    return {
      user: { ...user, ...overrides },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  static async createAdminUser(): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
  }> {
    return this.createAuthenticatedUser({ role: "admin" });
  }

  static getAuthHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
}
```

## API Contract Testing

### Contract Testing Setup

```typescript
// src/tests/integration/api/contracts/contact-api.contract.test.ts
import { TestServer } from "@/tests/helpers/test-server";
import { AuthHelpers } from "@/tests/helpers/auth-helpers";
import { ContactBuilder } from "@/tests/fixtures/builders/ContactBuilder";

describe("Contact API Contract Tests", () => {
  let testServer: TestServer;
  let authToken: string;

  beforeAll(async () => {
    testServer = await TestServer.create();
    const auth = await AuthHelpers.createAuthenticatedUser();
    authToken = auth.accessToken;
  });

  afterAll(async () => {
    await testServer.close();
  });

  afterEach(async () => {
    await testServer.cleanup();
  });

  describe("POST /api/v1/contacts", () => {
    it("should conform to API contract for successful creation", async () => {
      // Arrange
      const createContactData = {
        firstName: "John",
        lastName: "Doe",
        email: ["john.doe@example.com"],
        phone: ["+1234567890"],
        company: "Acme Corp",
        title: "Software Engineer",
      };

      // Act
      const response = await testServer.request
        .post("/api/v1/contacts")
        .set(AuthHelpers.getAuthHeaders(authToken))
        .send(createContactData)
        .expect(201);

      // Assert API contract
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          firstName: "John",
          lastName: "Doe",
          email: ["john.doe@example.com"],
          phone: ["+1234567890"],
          company: "Acme Corp",
          title: "Software Engineer",
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        message: "Contact created successfully",
        requestId: expect.any(String),
      });

      // Validate response schema
      expect(typeof response.body.data.id).toBe("string");
      expect(response.body.data.id).toMatch(/^[a-fA-F0-9-]+$/);
      expect(new Date(response.body.data.createdAt)).toBeInstanceOf(Date);
    });

    it("should conform to API contract for validation errors", async () => {
      // Arrange
      const invalidData = {
        firstName: "", // Invalid: empty string
        lastName: "Doe",
        email: ["invalid-email"], // Invalid: not a valid email
      };

      // Act
      const response = await testServer.request
        .post("/api/v1/contacts")
        .set(AuthHelpers.getAuthHeaders(authToken))
        .send(invalidData)
        .expect(400);

      // Assert error contract
      expect(response.body).toMatchObject({
        success: false,
        error: "Validation Error",
        message: expect.any(String),
        details: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
          }),
        ]),
        requestId: expect.any(String),
      });
    });

    it("should conform to API contract for unauthorized access", async () => {
      // Act
      const response = await testServer.request
        .post("/api/v1/contacts")
        .send({ firstName: "John", lastName: "Doe" })
        .expect(401);

      // Assert unauthorized contract
      expect(response.body).toMatchObject({
        success: false,
        error: "Unauthorized",
        message: expect.any(String),
        requestId: expect.any(String),
      });
    });
  });

  describe("GET /api/v1/contacts/:id", () => {
    it("should conform to API contract for existing contact", async () => {
      // Arrange
      const contact = await createTestContact();

      // Act
      const response = await testServer.request
        .get(`/api/v1/contacts/${contact.id}`)
        .set(AuthHelpers.getAuthHeaders(authToken))
        .expect(200);

      // Assert response contract
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: contact.id,
          firstName: expect.any(String),
          lastName: expect.any(String),
          email: expect.any(Array),
          phone: expect.any(Array),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        requestId: expect.any(String),
      });
    });

    it("should conform to API contract for non-existent contact", async () => {
      // Act
      const response = await testServer.request
        .get("/api/v1/contacts/non-existent-id")
        .set(AuthHelpers.getAuthHeaders(authToken))
        .expect(404);

      // Assert not found contract
      expect(response.body).toMatchObject({
        success: false,
        error: "Not Found",
        message: "Contact not found",
        requestId: expect.any(String),
      });
    });
  });

  async function createTestContact(): Promise<any> {
    const createResponse = await testServer.request
      .post("/api/v1/contacts")
      .set(AuthHelpers.getAuthHeaders(authToken))
      .send({
        firstName: "Test",
        lastName: "User",
        email: ["test@example.com"],
        phone: ["+1234567890"],
      });

    return createResponse.body.data;
  }
});
```

## Coverage Requirements

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  // ... other config
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/tests/**",
    "!src/migrations/**",
    "!src/**/index.ts", // Barrel exports
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Higher requirements for critical components
    "./src/application/services/": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    "./src/domain/entities/": {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    "./src/infrastructure/database/repositories/": {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    "./src/presentation/controllers/": {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Coverage Validation Script

```typescript
// scripts/validate-coverage.ts
import { readFileSync } from "fs";
import { join } from "path";

interface CoverageThresholds {
  [path: string]: {
    branches: number;
    functions: number;
    lines: number;
    statements: number;
  };
}

const COVERAGE_THRESHOLDS: CoverageThresholds = {
  "src/application/services/": {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
  "src/domain/entities/": {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
  "src/infrastructure/database/repositories/": {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
  global: { branches: 80, functions: 80, lines: 80, statements: 80 },
};

function validateCoverage(): void {
  try {
    const coverageReport = JSON.parse(
      readFileSync(
        join(process.cwd(), "coverage/coverage-summary.json"),
        "utf8",
      ),
    );

    let allPassed = true;

    for (const [path, thresholds] of Object.entries(COVERAGE_THRESHOLDS)) {
      const coverage =
        path === "global" ? coverageReport.total : coverageReport[path];

      if (!coverage) {
        console.error(`❌ No coverage data found for ${path}`);
        allPassed = false;
        continue;
      }

      const metrics = ["branches", "functions", "lines", "statements"] as const;

      for (const metric of metrics) {
        const actual = coverage[metric].pct;
        const required = thresholds[metric];

        if (actual < required) {
          console.error(
            `❌ ${path} ${metric} coverage ${actual}% is below threshold ${required}%`,
          );
          allPassed = false;
        } else {
          console.log(
            `✅ ${path} ${metric} coverage ${actual}% meets threshold ${required}%`,
          );
        }
      }
    }

    if (!allPassed) {
      console.error("\n❌ Coverage validation failed");
      process.exit(1);
    } else {
      console.log("\n✅ All coverage thresholds met");
    }
  } catch (error) {
    console.error("Failed to validate coverage:", error);
    process.exit(1);
  }
}

validateCoverage();
```

## Test Execution Commands

### Package.json Test Scripts

```json
{
  "scripts": {
    "test": "jest --coverage --verbose",
    "test:unit": "jest --testPathPattern=unit --coverage",
    "test:integration": "jest --testPathPattern=integration --coverage",
    "test:e2e": "jest --testPathPattern=e2e --runInBand",
    "test:watch": "jest --watch --coverage=false",
    "test:watch:unit": "jest --testPathPattern=unit --watch --coverage=false",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:mutation": "stryker run",
    "test:coverage": "jest --coverage && npm run test:validate-coverage",
    "test:validate-coverage": "tsx scripts/validate-coverage.ts",
    "test:ci": "jest --coverage --ci --watchAll=false --maxWorkers=2",
    "test:audit": "npm audit && npm run test:coverage"
  }
}
```

### GitHub Actions Workflow

```yaml
# .github/workflows/backend-tests.yml
name: Backend Tests

on:
  push:
    branches: [main, develop]
    paths: ["backend/**"]
  pull_request:
    branches: [main, develop]
    paths: ["backend/**"]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: connectkit_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Run linting
        working-directory: backend
        run: npm run lint

      - name: Run type checking
        working-directory: backend
        run: npm run type-check

      - name: Run unit tests
        working-directory: backend
        run: npm run test:unit
        env:
          NODE_ENV: test

      - name: Run integration tests
        working-directory: backend
        run: npm run test:integration
        env:
          NODE_ENV: test
          TEST_DB_HOST: localhost
          TEST_DB_PORT: 5432
          TEST_DB_USER: postgres
          TEST_DB_PASSWORD: postgres
          REDIS_HOST: localhost
          REDIS_PORT: 6379

      - name: Run E2E tests
        working-directory: backend
        run: npm run test:e2e
        env:
          NODE_ENV: test
          TEST_DB_HOST: localhost
          TEST_DB_PORT: 5432
          TEST_DB_USER: postgres
          TEST_DB_PASSWORD: postgres
          REDIS_HOST: localhost
          REDIS_PORT: 6379

      - name: Validate coverage
        working-directory: backend
        run: npm run test:validate-coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: backend/coverage/lcov.info
          flags: backend
          name: backend-coverage
```

This comprehensive TDD implementation plan provides a structured approach to building the ConnectKit backend with high-quality, well-tested code. The plan emphasizes the Red-Green-Refactor cycle and ensures comprehensive test coverage across all layers of the application.
