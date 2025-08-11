# TDD Implementation Guide for ConnectKit

## Overview

This guide provides comprehensive instructions for implementing Test-Driven Development (TDD) in ConnectKit. TDD is mandatory for all development work and must be followed consistently to ensure code quality, reliability, and maintainability.

## Red-Green-Refactor Cycle Detailed Workflow

### 1. RED Phase - Write a Failing Test

The RED phase is where you write a test that describes the desired behavior of code that doesn't exist yet. The test must fail initially.

#### Step-by-Step RED Process

1. **Identify the requirement** you want to implement
2. **Write the simplest test** that expresses that requirement
3. **Run the test** to confirm it fails
4. **Verify the failure reason** is what you expect

#### Example: Contact Service Creation

```typescript
// tests/unit/services/contact.service.test.ts
import { ContactService } from '@/services/contact.service';
import { ContactRepository } from '@/repositories/contact.repository';
import { EncryptionService } from '@/services/encryption.service';
import { AuditService } from '@/services/audit.service';

describe('ContactService', () => {
  describe('createContact', () => {
    // RED: Test that will fail because the method doesn't exist yet
    it('should create a contact with encrypted PII data', async () => {
      // Arrange
      const mockRepository = {
        create: jest.fn(),
        findByEmail: jest.fn().mockResolvedValue(null)
      } as jest.Mocked<ContactRepository>;
      
      const mockEncryption = {
        encryptArray: jest.fn().mockResolvedValue(['encrypted_email'])
      } as jest.Mocked<EncryptionService>;
      
      const mockAudit = {
        logContactCreation: jest.fn().mockResolvedValue(undefined)
      } as jest.Mocked<AuditService>;
      
      const contactService = new ContactService(
        mockRepository,
        mockEncryption,
        mockAudit
      );
      
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: ['john.doe@example.com'],
        phone: ['+1234567890'],
        tenantId: 'tenant-123',
        createdBy: 'user-456'
      };
      
      const expectedContact = {
        id: expect.any(String),
        firstName: 'John',
        lastName: 'Doe',
        emailEncrypted: ['encrypted_email'],
        phoneEncrypted: ['encrypted_phone'],
        tenantId: 'tenant-123',
        createdBy: 'user-456',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      };
      
      mockRepository.create.mockResolvedValue(expectedContact);
      mockEncryption.encryptArray.mockResolvedValueOnce(['encrypted_email']);
      mockEncryption.encryptArray.mockResolvedValueOnce(['encrypted_phone']);
      
      // Act - This will fail because createContact doesn't exist yet
      const result = await contactService.createContact(contactData);
      
      // Assert
      expect(result).toEqual(expectedContact);
      expect(mockEncryption.encryptArray).toHaveBeenCalledWith(['john.doe@example.com']);
      expect(mockEncryption.encryptArray).toHaveBeenCalledWith(['+1234567890']);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          emailEncrypted: ['encrypted_email'],
          phoneEncrypted: ['encrypted_phone']
        })
      );
      expect(mockAudit.logContactCreation).toHaveBeenCalledWith(expectedContact);
    });
    
    // RED: Test for duplicate email validation
    it('should throw error when creating contact with duplicate email', async () => {
      const mockRepository = {
        findByEmail: jest.fn().mockResolvedValue({ id: 'existing-contact' })
      } as jest.Mocked<ContactRepository>;
      
      const contactService = new ContactService(
        mockRepository,
        {} as EncryptionService,
        {} as AuditService
      );
      
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: ['existing@example.com'],
        tenantId: 'tenant-123',
        createdBy: 'user-456'
      };
      
      // Act & Assert - This will fail because the validation doesn't exist yet
      await expect(contactService.createContact(contactData))
        .rejects
        .toThrow('Contact with email existing@example.com already exists');
    });
  });
});
```

**Run the test and verify it fails:**
```bash
npm test -- --testPathPattern=contact.service.test.ts
# Expected: Test fails because ContactService.createContact doesn't exist
```

### 2. GREEN Phase - Write Minimal Code to Pass

The GREEN phase focuses on writing the minimum amount of code to make the failing test pass. Don't worry about code quality yet - just make it work.

```typescript
// src/services/contact.service.ts - Minimal implementation
import { v4 as uuid } from 'uuid';

export class ContactService {
  constructor(
    private repository: ContactRepository,
    private encryptionService: EncryptionService,
    private auditService: AuditService
  ) {}

  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    // Check for duplicate email (minimal validation)
    const existingContact = await this.repository.findByEmail(
      contactData.email[0], 
      contactData.tenantId
    );
    
    if (existingContact) {
      throw new Error(`Contact with email ${contactData.email[0]} already exists`);
    }
    
    // Encrypt PII data
    const emailEncrypted = await this.encryptionService.encryptArray(contactData.email);
    const phoneEncrypted = contactData.phone 
      ? await this.encryptionService.encryptArray(contactData.phone)
      : [];
    
    // Create contact entity
    const contactEntity = {
      id: uuid(),
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      emailEncrypted,
      phoneEncrypted,
      tenantId: contactData.tenantId,
      createdBy: contactData.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to repository
    const createdContact = await this.repository.create(contactEntity);
    
    // Log audit trail
    await this.auditService.logContactCreation(createdContact);
    
    return createdContact;
  }
}
```

**Run the test and verify it passes:**
```bash
npm test -- --testPathPattern=contact.service.test.ts
# Expected: Tests pass with minimal implementation
```

### 3. REFACTOR Phase - Improve Code Quality

The REFACTOR phase is where you improve the code quality while keeping all tests passing. Focus on:
- Extracting methods
- Improving readability
- Adding error handling
- Following SOLID principles

```typescript
// src/services/contact.service.ts - Refactored implementation
export class ContactService {
  constructor(
    private repository: ContactRepository,
    private encryptionService: EncryptionService,
    private auditService: AuditService,
    private validationService: ValidationService,
    private logger: Logger
  ) {}

  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    try {
      this.logger.info('Creating new contact', { 
        firstName: contactData.firstName, 
        lastName: contactData.lastName,
        tenantId: contactData.tenantId 
      });

      // Validate input data
      await this.validateContactData(contactData);

      // Check for duplicates
      await this.checkForDuplicateEmail(contactData.email[0], contactData.tenantId);

      // Create contact with transaction
      const contact = await this.repository.transaction(async (trx) => {
        // Encrypt PII fields
        const encryptedData = await this.encryptPiiFields(contactData);
        
        // Build contact entity
        const contactEntity = this.buildContactEntity(contactData, encryptedData);
        
        // Save to database
        const createdContact = await this.repository.create(contactEntity, trx);
        
        // Log audit trail
        await this.auditService.logContactCreation(createdContact, trx);
        
        return createdContact;
      });

      this.logger.info('Contact created successfully', { contactId: contact.id });
      return contact;

    } catch (error) {
      this.logger.error('Failed to create contact', { 
        error: error.message,
        contactData: { 
          firstName: contactData.firstName, 
          lastName: contactData.lastName 
        }
      });
      throw error;
    }
  }

  private async validateContactData(contactData: CreateContactRequest): Promise<void> {
    const validationResult = await this.validationService.validateCreateContact(contactData);
    
    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }
  }

  private async checkForDuplicateEmail(email: string, tenantId: string): Promise<void> {
    const existingContact = await this.repository.findByEmail(email, tenantId);
    
    if (existingContact) {
      throw new DuplicateEmailError(email);
    }
  }

  private async encryptPiiFields(contactData: CreateContactRequest) {
    const encryptionPromises = [
      this.encryptionService.encryptArray(contactData.email),
      contactData.phone ? this.encryptionService.encryptArray(contactData.phone) : Promise.resolve([])
    ];

    const [emailEncrypted, phoneEncrypted] = await Promise.all(encryptionPromises);

    return { emailEncrypted, phoneEncrypted };
  }

  private buildContactEntity(
    contactData: CreateContactRequest, 
    encryptedData: { emailEncrypted: string[], phoneEncrypted: string[] }
  ): Contact {
    return {
      id: uuid(),
      firstName: contactData.firstName.trim(),
      lastName: contactData.lastName.trim(),
      emailEncrypted: encryptedData.emailEncrypted,
      phoneEncrypted: encryptedData.phoneEncrypted,
      company: contactData.company?.trim() || null,
      title: contactData.title?.trim() || null,
      tags: contactData.tags || [],
      customFields: contactData.customFields || {},
      tenantId: contactData.tenantId,
      createdBy: contactData.createdBy,
      lastModifiedBy: contactData.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isDeleted: false
    };
  }
}
```

**Run tests after refactoring:**
```bash
npm test -- --testPathPattern=contact.service.test.ts
# Expected: All tests still pass after refactoring
```

## Test Coverage Requirements

### Minimum Coverage Thresholds

```json
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/types/**/*',
    '!src/config/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Stricter requirements for core business logic
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/repositories/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary']
};
```

### Coverage Verification Script

```bash
#!/bin/bash
# scripts/test-coverage.sh

echo "🧪 Running test coverage analysis..."

# Run tests with coverage
npm run test:coverage

# Check if coverage meets requirements
if [ $? -eq 0 ]; then
    echo "✅ Coverage requirements met"
    
    # Generate coverage badge
    npm run coverage:badge
    
    # Upload to codecov if in CI
    if [ "$CI" = "true" ]; then
        npx codecov
    fi
else
    echo "❌ Coverage requirements not met"
    echo "Please add more tests to meet the minimum coverage thresholds"
    exit 1
fi
```

## Testing Pyramid Implementation

### 1. Unit Tests (70% of tests)

Unit tests focus on individual functions, classes, or methods in isolation.

#### Service Layer Unit Tests

```typescript
// tests/unit/services/encryption.service.test.ts
describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  const mockEncryptionKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeEach(() => {
    encryptionService = new EncryptionService(mockEncryptionKey);
  });

  describe('encrypt', () => {
    it('should encrypt a string and return different result each time', () => {
      const plaintext = 'sensitive data';
      
      const encrypted1 = encryptionService.encrypt(plaintext);
      const encrypted2 = encryptionService.encrypt(plaintext);
      
      expect(encrypted1).not.toBe(plaintext);
      expect(encrypted2).not.toBe(plaintext);
      expect(encrypted1).not.toBe(encrypted2); // Different IV each time
      expect(encrypted1).toMatch(/^[0-9a-f]+$/); // Hex string
    });

    it('should throw error for invalid encryption key length', () => {
      expect(() => new EncryptionService('short_key')).toThrow(
        'Encryption key must be 32 bytes'
      );
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data back to original', () => {
      const plaintext = 'test@example.com';
      
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for invalid encrypted data format', () => {
      expect(() => encryptionService.decrypt('invalid_data')).toThrow();
    });
  });

  describe('encryptArray', () => {
    it('should encrypt each element in array', () => {
      const emails = ['user1@example.com', 'user2@example.com'];
      
      const encrypted = encryptionService.encryptArray(emails);
      
      expect(encrypted).toHaveLength(2);
      expect(encrypted[0]).not.toBe(emails[0]);
      expect(encrypted[1]).not.toBe(emails[1]);
    });

    it('should handle empty array', () => {
      const result = encryptionService.encryptArray([]);
      expect(result).toEqual([]);
    });
  });
});
```

#### Repository Layer Unit Tests

```typescript
// tests/unit/repositories/contact.repository.test.ts
describe('ContactRepository', () => {
  let repository: ContactRepository;
  let mockDatabase: jest.Mocked<DatabaseManager>;

  beforeEach(() => {
    mockDatabase = {
      query: jest.fn(),
      transaction: jest.fn()
    } as jest.Mocked<DatabaseManager>;
    
    repository = new ContactRepository(mockDatabase);
  });

  describe('create', () => {
    it('should insert contact and return created entity', async () => {
      const contactData = {
        id: 'contact-123',
        firstName: 'John',
        lastName: 'Doe',
        emailEncrypted: ['encrypted_email'],
        tenantId: 'tenant-123',
        createdBy: 'user-456',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDatabase.query.mockResolvedValue({
        rows: [contactData],
        rowCount: 1
      });

      const result = await repository.create(contactData);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contacts'),
        expect.arrayContaining([
          contactData.id,
          contactData.tenantId,
          contactData.firstName,
          contactData.lastName
        ])
      );
      expect(result).toEqual(contactData);
    });

    it('should handle database constraint violations', async () => {
      const contactData = { /* ... */ };
      
      mockDatabase.query.mockRejectedValue(
        new Error('duplicate key value violates unique constraint')
      );

      await expect(repository.create(contactData))
        .rejects
        .toThrow('duplicate key value violates unique constraint');
    });
  });

  describe('findById', () => {
    it('should return contact when found', async () => {
      const contactId = 'contact-123';
      const tenantId = 'tenant-456';
      const expectedContact = { id: contactId, firstName: 'John' };

      mockDatabase.query.mockResolvedValue({
        rows: [expectedContact],
        rowCount: 1
      });

      const result = await repository.findById(contactId, tenantId);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM contacts'),
        [tenantId, contactId]
      );
      expect(result).toEqual(expectedContact);
    });

    it('should return null when contact not found', async () => {
      mockDatabase.query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      const result = await repository.findById('nonexistent', 'tenant-123');

      expect(result).toBeNull();
    });
  });
});
```

### 2. Integration Tests (20% of tests)

Integration tests verify that multiple components work together correctly.

#### API Integration Tests

```typescript
// tests/integration/contacts.api.test.ts
import request from 'supertest';
import { createApp } from '@/app';
import { setupTestDatabase, cleanupTestDatabase } from '../setup/test-db';
import { createTestUser, generateAuthToken } from '../setup/test-auth';

describe('Contacts API Integration', () => {
  let app: Express.Application;
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    await setupTestDatabase();
    app = createApp();
    
    testUser = await createTestUser();
    authToken = generateAuthToken(testUser);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean contacts table before each test
    await cleanupContacts();
  });

  describe('POST /api/contacts', () => {
    it('should create a new contact with valid data', async () => {
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: ['john.doe@example.com'],
        phone: ['+1234567890'],
        company: 'Acme Corp',
        title: 'Developer'
      };

      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          firstName: 'John',
          lastName: 'Doe',
          company: 'Acme Corp',
          title: 'Developer',
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        }
      });

      // Verify in database
      const savedContact = await findContactById(response.body.data.id);
      expect(savedContact).toBeDefined();
      expect(savedContact.firstName).toBe('John');
    });

    it('should return 400 for invalid email format', async () => {
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: ['invalid-email'],
      };

      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'email.0',
            message: expect.stringContaining('valid email')
          })
        ])
      });
    });

    it('should return 409 for duplicate email', async () => {
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: ['john.doe@example.com'],
      };

      // Create first contact
      await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Contact with email john.doe@example.com already exists'
      });
    });

    it('should return 401 for missing authentication', async () => {
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: ['john.doe@example.com'],
      };

      await request(app)
        .post('/api/contacts')
        .send(contactData)
        .expect(401);
    });
  });

  describe('GET /api/contacts', () => {
    it('should return paginated contacts for authenticated user', async () => {
      // Create test contacts
      const contacts = await Promise.all([
        createTestContact({ firstName: 'John', lastName: 'Doe' }),
        createTestContact({ firstName: 'Jane', lastName: 'Smith' }),
        createTestContact({ firstName: 'Bob', lastName: 'Wilson' })
      ]);

      const response = await request(app)
        .get('/api/contacts?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ firstName: expect.any(String) })
        ]),
        meta: {
          pagination: {
            page: 1,
            limit: 2,
            total: 3,
            totalPages: 2
          }
        }
      });

      expect(response.body.data).toHaveLength(2);
    });

    it('should filter contacts by search query', async () => {
      await Promise.all([
        createTestContact({ firstName: 'John', lastName: 'Developer', company: 'TechCorp' }),
        createTestContact({ firstName: 'Jane', lastName: 'Designer', company: 'DesignCorp' }),
      ]);

      const response = await request(app)
        .get('/api/contacts?q=Developer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].lastName).toBe('Developer');
    });
  });
});
```

#### Database Integration Tests

```typescript
// tests/integration/database.test.ts
describe('Database Integration', () => {
  let database: DatabaseManager;

  beforeAll(async () => {
    database = new DatabaseManager();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await database.close();
    await cleanupTestDatabase();
  });

  describe('Row Level Security', () => {
    it('should enforce tenant isolation in contacts table', async () => {
      const tenant1Id = 'tenant-1';
      const tenant2Id = 'tenant-2';
      const userId = 'user-123';

      // Create contacts for different tenants
      await database.query(`
        INSERT INTO contacts (id, tenant_id, first_name, last_name, created_by, last_modified_by)
        VALUES 
          ('contact-1', $1, 'John', 'Doe', $3, $3),
          ('contact-2', $2, 'Jane', 'Smith', $3, $3)
      `, [tenant1Id, tenant2Id, userId]);

      // Set session for tenant 1
      await database.query('SELECT set_config($1, $2, true)', ['app.current_tenant_id', tenant1Id]);

      // Query should only return tenant 1 contacts
      const result = await database.query('SELECT * FROM contacts');
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].first_name).toBe('John');
      expect(result.rows[0].tenant_id).toBe(tenant1Id);
    });

    it('should log all operations in audit_log table', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-456';

      // Set session variables
      await database.query('SELECT set_config($1, $2, true)', ['app.current_tenant_id', tenantId]);
      await database.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId]);

      // Insert a contact (should trigger audit log)
      await database.query(`
        INSERT INTO contacts (id, tenant_id, first_name, last_name, created_by, last_modified_by)
        VALUES ('contact-audit', $1, 'Test', 'User', $2, $2)
      `, [tenantId, userId]);

      // Check audit log
      const auditResult = await database.query(`
        SELECT * FROM audit_log 
        WHERE table_name = 'contacts' 
        AND record_id = 'contact-audit'
        AND action = 'INSERT'
      `);

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0]).toMatchObject({
        tenant_id: tenantId,
        table_name: 'contacts',
        record_id: 'contact-audit',
        action: 'INSERT',
        user_id: userId
      });
    });
  });

  describe('Encryption Integration', () => {
    it('should encrypt and decrypt PII data transparently', async () => {
      const encryptionService = new EncryptionService(process.env.ENCRYPTION_KEY!);
      const originalEmail = 'test@example.com';
      const originalPhone = '+1234567890';

      // Encrypt data
      const encryptedEmail = encryptionService.encrypt(originalEmail);
      const encryptedPhone = encryptionService.encrypt(originalPhone);

      // Store encrypted data
      await database.query(`
        INSERT INTO contacts (
          id, tenant_id, first_name, last_name, 
          email_encrypted, phone_encrypted, created_by, last_modified_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      `, [
        'contact-encrypt',
        'tenant-123',
        'Test',
        'User',
        [encryptedEmail],
        [encryptedPhone],
        'user-456'
      ]);

      // Retrieve and decrypt
      const result = await database.query(
        'SELECT email_encrypted, phone_encrypted FROM contacts WHERE id = $1',
        ['contact-encrypt']
      );

      const decryptedEmail = encryptionService.decrypt(result.rows[0].email_encrypted[0]);
      const decryptedPhone = encryptionService.decrypt(result.rows[0].phone_encrypted[0]);

      expect(decryptedEmail).toBe(originalEmail);
      expect(decryptedPhone).toBe(originalPhone);
    });
  });
});
```

### 3. End-to-End (E2E) Tests (10% of tests)

E2E tests verify complete user workflows from frontend to backend.

#### Cypress E2E Tests

```typescript
// tests/e2e/contact-management.cy.ts
describe('Contact Management E2E', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('test@example.com', 'password123');
    cy.visit('/contacts');
  });

  afterEach(() => {
    // Clean up test data
    cy.cleanupTestContacts();
  });

  it('should complete full contact CRUD workflow', () => {
    // Create a new contact
    cy.get('[data-testid="add-contact-button"]').click();
    
    cy.get('[data-testid="first-name-input"]').type('John');
    cy.get('[data-testid="last-name-input"]').type('Doe');
    cy.get('[data-testid="email-input"]').type('john.doe@example.com');
    cy.get('[data-testid="phone-input"]').type('+1234567890');
    cy.get('[data-testid="company-input"]').type('Acme Corp');
    cy.get('[data-testid="title-input"]').type('Developer');
    
    cy.get('[data-testid="save-contact-button"]').click();
    
    // Verify contact appears in list
    cy.get('[data-testid="contact-list"]').should('contain', 'John Doe');
    cy.get('[data-testid="contact-list"]').should('contain', 'Acme Corp');
    
    // Edit the contact
    cy.get('[data-testid="contact-card"]:contains("John Doe")')
      .find('[data-testid="edit-contact-button"]')
      .click();
    
    cy.get('[data-testid="company-input"]').clear().type('Better Corp');
    cy.get('[data-testid="save-contact-button"]').click();
    
    // Verify update
    cy.get('[data-testid="contact-list"]').should('contain', 'Better Corp');
    cy.get('[data-testid="contact-list"]').should('not.contain', 'Acme Corp');
    
    // Delete the contact
    cy.get('[data-testid="contact-card"]:contains("John Doe")')
      .find('[data-testid="delete-contact-button"]')
      .click();
    
    cy.get('[data-testid="confirm-delete-button"]').click();
    
    // Verify deletion
    cy.get('[data-testid="contact-list"]').should('not.contain', 'John Doe');
  });

  it('should handle validation errors appropriately', () => {
    cy.get('[data-testid="add-contact-button"]').click();
    
    // Try to save without required fields
    cy.get('[data-testid="save-contact-button"]').click();
    
    // Verify validation errors
    cy.get('[data-testid="first-name-error"]').should('be.visible');
    cy.get('[data-testid="last-name-error"]').should('be.visible');
    cy.get('[data-testid="email-error"]').should('be.visible');
    
    // Fill in valid data
    cy.get('[data-testid="first-name-input"]').type('John');
    cy.get('[data-testid="last-name-input"]').type('Doe');
    
    // Test invalid email
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="save-contact-button"]').click();
    
    cy.get('[data-testid="email-error"]').should('contain', 'Please enter a valid email');
    
    // Fix email and save
    cy.get('[data-testid="email-input"]').clear().type('john.doe@example.com');
    cy.get('[data-testid="save-contact-button"]').click();
    
    // Should succeed
    cy.get('[data-testid="contact-list"]').should('contain', 'John Doe');
  });

  it('should handle duplicate email error', () => {
    // Create first contact
    cy.createTestContact({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'duplicate@example.com'
    });
    
    // Try to create second contact with same email
    cy.get('[data-testid="add-contact-button"]').click();
    
    cy.get('[data-testid="first-name-input"]').type('John');
    cy.get('[data-testid="last-name-input"]').type('Doe');
    cy.get('[data-testid="email-input"]').type('duplicate@example.com');
    
    cy.get('[data-testid="save-contact-button"]').click();
    
    // Should show duplicate error
    cy.get('[data-testid="error-toast"]')
      .should('be.visible')
      .and('contain', 'Contact with email duplicate@example.com already exists');
  });

  it('should search and filter contacts', () => {
    // Create test data
    cy.createTestContact({ firstName: 'John', lastName: 'Developer', company: 'TechCorp' });
    cy.createTestContact({ firstName: 'Jane', lastName: 'Designer', company: 'DesignCorp' });
    cy.createTestContact({ firstName: 'Bob', lastName: 'Manager', company: 'TechCorp' });
    
    cy.visit('/contacts');
    
    // Test search by name
    cy.get('[data-testid="search-input"]').type('John');
    cy.get('[data-testid="contact-list"]').should('contain', 'John Developer');
    cy.get('[data-testid="contact-list"]').should('not.contain', 'Jane Designer');
    
    // Clear search
    cy.get('[data-testid="search-input"]').clear();
    
    // Test search by company
    cy.get('[data-testid="search-input"]').type('TechCorp');
    cy.get('[data-testid="contact-list"]').should('contain', 'John Developer');
    cy.get('[data-testid="contact-list"]').should('contain', 'Bob Manager');
    cy.get('[data-testid="contact-list"]').should('not.contain', 'Jane Designer');
    
    // Test company filter
    cy.get('[data-testid="company-filter"]').select('DesignCorp');
    cy.get('[data-testid="contact-list"]').should('contain', 'Jane Designer');
    cy.get('[data-testid="contact-list"]').should('not.contain', 'John Developer');
  });
});
```

## Test File Naming and Organization

### File Structure
```
tests/
├── unit/                          # Unit tests
│   ├── controllers/
│   │   ├── auth.controller.test.ts
│   │   └── contacts.controller.test.ts
│   ├── services/
│   │   ├── auth.service.test.ts
│   │   ├── contact.service.test.ts
│   │   └── encryption.service.test.ts
│   ├── repositories/
│   │   ├── contact.repository.test.ts
│   │   └── user.repository.test.ts
│   ├── utils/
│   │   ├── validation.test.ts
│   │   └── crypto.test.ts
│   └── middleware/
│       ├── auth.middleware.test.ts
│       └── error.middleware.test.ts
├── integration/                   # Integration tests
│   ├── api/
│   │   ├── auth.api.test.ts
│   │   └── contacts.api.test.ts
│   ├── database/
│   │   ├── migrations.test.ts
│   │   ├── rls.test.ts
│   │   └── encryption.test.ts
│   └── services/
│       └── contact-workflow.test.ts
├── e2e/                          # End-to-end tests
│   ├── auth/
│   │   ├── login.cy.ts
│   │   └── registration.cy.ts
│   ├── contacts/
│   │   ├── contact-management.cy.ts
│   │   └── contact-search.cy.ts
│   └── admin/
│       └── user-management.cy.ts
├── fixtures/                     # Test data
│   ├── contacts.json
│   ├── users.json
│   └── tenant-data.json
├── mocks/                        # Mock implementations
│   ├── database.mock.ts
│   ├── encryption.mock.ts
│   └── external-api.mock.ts
├── setup/                        # Test setup utilities
│   ├── test-db.ts
│   ├── test-server.ts
│   ├── test-auth.ts
│   └── cleanup.ts
└── support/                      # Cypress support files
    ├── commands.ts
    ├── index.ts
    └── e2e.ts
```

### Naming Conventions

1. **Test files**: `{module-name}.test.ts` for unit/integration, `{feature}.cy.ts` for E2E
2. **Describe blocks**: Use the class/function/feature name being tested
3. **Test cases**: Use "should [expected behavior] when [condition]"
4. **Variables**: Use descriptive names that indicate test scenarios

```typescript
// Good test naming
describe('ContactService', () => {
  describe('createContact', () => {
    it('should create contact with encrypted PII when valid data provided', async () => {});
    it('should throw ValidationError when required fields missing', async () => {});
    it('should throw DuplicateEmailError when email already exists', async () => {});
  });

  describe('updateContact', () => {
    it('should update contact and increment version when valid changes provided', async () => {});
    it('should throw ContactNotFoundError when contact does not exist', async () => {});
  });
});
```

## Mock and Stub Strategies

### Repository Mocking

```typescript
// tests/mocks/repository.mocks.ts
export const createMockContactRepository = (): jest.Mocked<ContactRepository> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  search: jest.fn(),
  transaction: jest.fn()
});

// Usage in tests
describe('ContactService', () => {
  let contactService: ContactService;
  let mockRepository: jest.Mocked<ContactRepository>;

  beforeEach(() => {
    mockRepository = createMockContactRepository();
    contactService = new ContactService(mockRepository, /* other deps */);
  });

  it('should create contact when data is valid', async () => {
    const contactData = { /* test data */ };
    const expectedResult = { id: 'contact-123', ...contactData };
    
    mockRepository.findByEmail.mockResolvedValue(null); // No duplicate
    mockRepository.create.mockResolvedValue(expectedResult);

    const result = await contactService.createContact(contactData);

    expect(mockRepository.findByEmail).toHaveBeenCalledWith(
      contactData.email[0], 
      contactData.tenantId
    );
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining(contactData)
    );
    expect(result).toEqual(expectedResult);
  });
});
```

### Service Mocking

```typescript
// tests/mocks/service.mocks.ts
export const createMockEncryptionService = (): jest.Mocked<EncryptionService> => ({
  encrypt: jest.fn().mockImplementation((data: string) => `encrypted_${data}`),
  decrypt: jest.fn().mockImplementation((data: string) => data.replace('encrypted_', '')),
  encryptArray: jest.fn().mockImplementation((data: string[]) => 
    data.map(item => `encrypted_${item}`)
  ),
  decryptArray: jest.fn().mockImplementation((data: string[]) => 
    data.map(item => item.replace('encrypted_', ''))
  )
});

export const createMockLogger = (): jest.Mocked<Logger> => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
});
```

### Database Mocking for Integration Tests

```typescript
// tests/setup/test-db.ts
import { DatabaseManager } from '@/utils/database';

export class TestDatabaseManager extends DatabaseManager {
  private testData: Map<string, any[]> = new Map();

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    // Mock specific queries for tests
    if (text.includes('INSERT INTO contacts')) {
      return this.mockInsertContact(params);
    } else if (text.includes('SELECT * FROM contacts WHERE id')) {
      return this.mockFindContactById(params);
    }
    
    // Fall back to real database for complex queries
    return super.query(text, params);
  }

  private mockInsertContact(params: any[]): QueryResult<any> {
    const [id, tenantId, firstName, lastName] = params || [];
    const contact = {
      id,
      tenant_id: tenantId,
      first_name: firstName,
      last_name: lastName,
      created_at: new Date(),
      updated_at: new Date()
    };

    if (!this.testData.has('contacts')) {
      this.testData.set('contacts', []);
    }
    this.testData.get('contacts')!.push(contact);

    return { rows: [contact], rowCount: 1 } as QueryResult<any>;
  }

  private mockFindContactById(params: any[]): QueryResult<any> {
    const [tenantId, contactId] = params || [];
    const contacts = this.testData.get('contacts') || [];
    const contact = contacts.find(c => c.id === contactId && c.tenant_id === tenantId);

    return {
      rows: contact ? [contact] : [],
      rowCount: contact ? 1 : 0
    } as QueryResult<any>;
  }

  clearTestData(): void {
    this.testData.clear();
  }
}
```

## Test Data Management

### Test Fixtures

```typescript
// tests/fixtures/contacts.json
{
  "validContact": {
    "firstName": "John",
    "lastName": "Doe",
    "email": ["john.doe@example.com"],
    "phone": ["+1234567890"],
    "company": "Acme Corp",
    "title": "Software Developer"
  },
  "minimalContact": {
    "firstName": "Jane",
    "lastName": "Smith",
    "email": ["jane.smith@example.com"]
  },
  "invalidContacts": [
    {
      "description": "Missing required firstName",
      "data": {
        "lastName": "Doe",
        "email": ["test@example.com"]
      }
    },
    {
      "description": "Invalid email format",
      "data": {
        "firstName": "John",
        "lastName": "Doe",
        "email": ["invalid-email"]
      }
    }
  ]
}
```

### Test Data Builders

```typescript
// tests/builders/contact.builder.ts
export class ContactBuilder {
  private contact: Partial<Contact> = {
    id: 'test-contact-id',
    firstName: 'Test',
    lastName: 'User',
    email: ['test@example.com'],
    phone: ['+1234567890'],
    company: 'Test Corp',
    title: 'Test Title',
    tags: [],
    customFields: {},
    tenantId: 'test-tenant',
    createdBy: 'test-user',
    lastModifiedBy: 'test-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    isDeleted: false
  };

  withId(id: string): ContactBuilder {
    this.contact.id = id;
    return this;
  }

  withName(firstName: string, lastName: string): ContactBuilder {
    this.contact.firstName = firstName;
    this.contact.lastName = lastName;
    return this;
  }

  withEmail(...emails: string[]): ContactBuilder {
    this.contact.email = emails;
    return this;
  }

  withPhone(...phones: string[]): ContactBuilder {
    this.contact.phone = phones;
    return this;
  }

  withCompany(company: string, title?: string): ContactBuilder {
    this.contact.company = company;
    if (title) {
      this.contact.title = title;
    }
    return this;
  }

  withTenant(tenantId: string): ContactBuilder {
    this.contact.tenantId = tenantId;
    return this;
  }

  withTags(...tags: string[]): ContactBuilder {
    this.contact.tags = tags;
    return this;
  }

  withCustomFields(fields: Record<string, any>): ContactBuilder {
    this.contact.customFields = fields;
    return this;
  }

  build(): Contact {
    return { ...this.contact } as Contact;
  }

  buildCreateRequest(): CreateContactRequest {
    return {
      firstName: this.contact.firstName!,
      lastName: this.contact.lastName!,
      email: this.contact.email!,
      phone: this.contact.phone,
      company: this.contact.company,
      title: this.contact.title,
      tags: this.contact.tags,
      customFields: this.contact.customFields,
      tenantId: this.contact.tenantId!,
      createdBy: this.contact.createdBy!
    };
  }
}

// Usage in tests
describe('ContactService', () => {
  it('should create contact with all fields', async () => {
    const contactRequest = new ContactBuilder()
      .withName('John', 'Doe')
      .withEmail('john@example.com', 'john.doe@company.com')
      .withPhone('+1234567890')
      .withCompany('Acme Corp', 'Senior Developer')
      .withTags('important', 'lead')
      .buildCreateRequest();

    const result = await contactService.createContact(contactRequest);
    
    expect(result).toMatchObject({
      firstName: 'John',
      lastName: 'Doe'
    });
  });
});
```

## Mutation Testing Setup

### Stryker Configuration

```javascript
// stryker.conf.mjs
import { fileURLToPath } from 'url';

const config = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'dashboard'],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true,
  },
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/types/**/*.ts',
    '!src/**/*.d.ts'
  ],
  thresholds: {
    high: 85,
    low: 70,
    break: 60
  },
  timeoutMS: 60000,
  maxConcurrentTestRunners: 2,
  tempDirName: 'stryker-tmp',
  cleanTempDir: true,
  dashboard: {
    project: process.env.STRYKER_DASHBOARD_PROJECT || 'connectkit',
    version: process.env.GITHUB_REF_NAME || 'main'
  }
};

export default config;
```

### Mutation Testing Script

```bash
#!/bin/bash
# scripts/mutation-test.sh

echo "🧬 Running mutation testing with Stryker..."

# Ensure tests pass first
echo "Running normal tests first..."
npm run test:unit

if [ $? -ne 0 ]; then
    echo "❌ Unit tests failed. Fix tests before running mutation testing."
    exit 1
fi

# Run mutation tests
echo "Starting mutation testing..."
npx stryker run

# Check results
if [ $? -eq 0 ]; then
    echo "✅ Mutation testing completed successfully"
    echo "📊 Check reports in stryker-tmp/reports/mutation/html/index.html"
else
    echo "❌ Mutation testing failed to meet thresholds"
    echo "💡 Consider adding more specific test cases to kill more mutants"
    exit 1
fi
```

## Performance Testing Integration

### Load Testing with Artillery

```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 300
      arrivalRate: 10
      rampTo: 50
      name: "Ramp up load"
    - duration: 600
      arrivalRate: 50
      name: "Sustained load"
  processor: "./performance-processor.js"
  variables:
    auth_endpoint: "/api/auth/login"
    contacts_endpoint: "/api/contacts"

scenarios:
  - name: "Contact CRUD Operations"
    weight: 70
    flow:
      - post:
          url: "{{ auth_endpoint }}"
          json:
            email: "test{{ $randomString() }}@example.com"
            password: "password123"
          capture:
            - json: "$.data.accessToken"
              as: "token"
      
      - post:
          url: "{{ contacts_endpoint }}"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            firstName: "{{ $randomString() }}"
            lastName: "{{ $randomString() }}"
            email: ["{{ $randomString() }}@example.com"]
          capture:
            - json: "$.data.id"
              as: "contactId"
      
      - get:
          url: "{{ contacts_endpoint }}/{{ contactId }}"
          headers:
            Authorization: "Bearer {{ token }}"
      
      - put:
          url: "{{ contacts_endpoint }}/{{ contactId }}"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            firstName: "Updated{{ $randomString() }}"
            lastName: "{{ $randomString() }}"
            email: ["updated{{ $randomString() }}@example.com"]
      
      - delete:
          url: "{{ contacts_endpoint }}/{{ contactId }}"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "Search Operations"
    weight: 30
    flow:
      - post:
          url: "{{ auth_endpoint }}"
          json:
            email: "search{{ $randomString() }}@example.com"
            password: "password123"
          capture:
            - json: "$.data.accessToken"
              as: "token"
      
      - get:
          url: "{{ contacts_endpoint }}?q={{ $randomString() }}"
          headers:
            Authorization: "Bearer {{ token }}"
      
      - get:
          url: "{{ contacts_endpoint }}?company=TechCorp"
          headers:
            Authorization: "Bearer {{ token }}"
```

### Performance Test Processor

```javascript
// tests/performance/performance-processor.js
module.exports = {
  // Set up test data before scenarios
  setupTestData: function(requestParams, context, ee, next) {
    // Create test users and contacts for realistic load testing
    return next();
  },

  // Log response times for analysis
  logResponseTime: function(requestParams, response, context, ee, next) {
    if (response.statusCode >= 400) {
      ee.emit('counter', 'http.errors', 1);
    }
    
    if (response.timings && response.timings.response > 1000) {
      ee.emit('counter', 'http.slow_responses', 1);
    }
    
    return next();
  },

  // Clean up test data after scenarios
  cleanupTestData: function(context, ee, next) {
    // Remove test data created during load testing
    return next();
  }
};
```

## Contract Testing Between Services

### Pact Consumer Tests

```typescript
// tests/contract/contact-api.consumer.pact.test.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { ContactApiClient } from '@/services/contact-api.client';

const { like, eachLike, string, integer, datetime } = MatchersV3;

describe('Contact API Consumer Contract', () => {
  const provider = new PactV3({
    consumer: 'ConnectKit-Web',
    provider: 'ConnectKit-API',
    port: 3001,
    dir: path.resolve(process.cwd(), 'pacts')
  });

  let client: ContactApiClient;

  beforeEach(() => {
    client = new ContactApiClient('http://localhost:3001');
  });

  describe('GET /api/contacts', () => {
    it('should return a list of contacts', async () => {
      await provider
        .given('contacts exist for tenant')
        .uponReceiving('a request for contacts')
        .withRequest({
          method: 'GET',
          path: '/api/contacts',
          headers: {
            'Authorization': like('Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'),
            'Content-Type': 'application/json'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: true,
            data: eachLike({
              id: string('550e8400-e29b-41d4-a716-446655440000'),
              firstName: string('John'),
              lastName: string('Doe'),
              company: string('Acme Corp'),
              title: string('Developer'),
              createdAt: datetime("yyyy-MM-dd'T'HH:mm:ss.SSSX"),
              updatedAt: datetime("yyyy-MM-dd'T'HH:mm:ss.SSSX")
            }),
            meta: {
              pagination: {
                page: integer(1),
                limit: integer(20),
                total: integer(1),
                totalPages: integer(1)
              },
              timestamp: datetime("yyyy-MM-dd'T'HH:mm:ss.SSSX"),
              version: string('v1')
            }
          }
        });

      const response = await client.getContacts({
        page: 1,
        limit: 20,
        tenantId: 'test-tenant'
      });

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.data[0]).toHaveProperty('firstName', 'John');
    });
  });

  describe('POST /api/contacts', () => {
    it('should create a new contact', async () => {
      const newContact = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: ['jane.smith@example.com'],
        phone: ['+1234567890'],
        company: 'Tech Corp',
        title: 'Designer'
      };

      await provider
        .given('tenant exists')
        .uponReceiving('a request to create a contact')
        .withRequest({
          method: 'POST',
          path: '/api/contacts',
          headers: {
            'Authorization': like('Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'),
            'Content-Type': 'application/json'
          },
          body: newContact
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: true,
            data: {
              id: string('550e8400-e29b-41d4-a716-446655440001'),
              firstName: string('Jane'),
              lastName: string('Smith'),
              company: string('Tech Corp'),
              title: string('Designer'),
              createdAt: datetime("yyyy-MM-dd'T'HH:mm:ss.SSSX"),
              updatedAt: datetime("yyyy-MM-dd'T'HH:mm:ss.SSSX")
            },
            meta: {
              timestamp: datetime("yyyy-MM-dd'T'HH:mm:ss.SSSX"),
              version: string('v1')
            }
          }
        });

      const response = await client.createContact(newContact);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('firstName', 'Jane');
      expect(response.data).toHaveProperty('id');
    });
  });
});
```

## Test Automation in CI/CD

### GitHub Actions Test Workflow

```yaml
# .github/workflows/test-automation.yml
name: Test Automation Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20.10.0'

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage --ci
        env:
          CI: true
      
      - name: Upload unit test coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/unit/lcov.info
          flags: unit-tests

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16.1
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: connectkit_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7.2
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run db:migrate:test
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/connectkit_test
      
      - name: Run integration tests
        run: npm run test:integration -- --coverage --ci
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/connectkit_test
          REDIS_URL: redis://localhost:6379
          CI: true
      
      - name: Upload integration test coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/integration/lcov.info
          flags: integration-tests

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16.1
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: connectkit_e2e
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7.2
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build applications
        run: npm run build
      
      - name: Setup test environment
        run: |
          npm run db:migrate:e2e
          npm run seed:test-data
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/connectkit_e2e
          REDIS_URL: redis://localhost:6379
      
      - name: Start applications
        run: |
          npm run start:api &
          npm run start:web &
          sleep 30
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/connectkit_e2e
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test
      
      - name: Run E2E tests
        run: npm run test:e2e:ci
        env:
          CYPRESS_baseUrl: http://localhost:3000
      
      - name: Upload E2E test artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots-videos
          path: |
            cypress/screenshots
            cypress/videos

  mutation-tests:
    name: Mutation Tests
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Fetch full history for better mutation analysis
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run mutation tests
        run: npm run test:mutation
        env:
          STRYKER_DASHBOARD_API_KEY: ${{ secrets.STRYKER_DASHBOARD_API_KEY }}
      
      - name: Upload mutation test report
        uses: actions/upload-artifact@v3
        with:
          name: mutation-test-report
          path: stryker-tmp/reports/

  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: [integration-tests]
    if: github.event_name == 'push'
    
    services:
      postgres:
        image: postgres:16.1
        env:
          POSTGRES_PASSWORD: perf_password
          POSTGRES_DB: connectkit_perf
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7.2
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build and start API
        run: |
          npm run build:api
          npm run start:api &
          sleep 15
        env:
          DATABASE_URL: postgresql://postgres:perf_password@localhost:5432/connectkit_perf
          REDIS_URL: redis://localhost:6379
          NODE_ENV: production
      
      - name: Run performance tests
        run: npm run test:performance
      
      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-test-results
          path: tests/performance/reports/

  test-summary:
    name: Test Summary
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests]
    if: always()
    
    steps:
      - name: Download all test artifacts
        uses: actions/download-artifact@v3
      
      - name: Generate test summary
        run: |
          echo "# Test Results Summary" >> $GITHUB_STEP_SUMMARY
          echo "## Unit Tests: ${{ needs.unit-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "## Integration Tests: ${{ needs.integration-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "## E2E Tests: ${{ needs.e2e-tests.result }}" >> $GITHUB_STEP_SUMMARY
          
          if [ "${{ needs.unit-tests.result }}" = "success" ] && [ "${{ needs.integration-tests.result }}" = "success" ] && [ "${{ needs.e2e-tests.result }}" = "success" ]; then
            echo "✅ All tests passed successfully!" >> $GITHUB_STEP_SUMMARY
          else
            echo "❌ Some tests failed. Please check the individual test results." >> $GITHUB_STEP_SUMMARY
          fi
```

## Example Test Cases for Each Layer

### Controller Layer Tests

```typescript
// tests/unit/controllers/contacts.controller.test.ts
describe('ContactsController', () => {
  let controller: ContactsController;
  let mockService: jest.Mocked<ContactService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockService = {
      createContact: jest.fn(),
      findById: jest.fn(),
      searchContacts: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn()
    } as jest.Mocked<ContactService>;

    controller = new ContactsController(mockService, mockLogger);

    mockRequest = {
      user: { id: 'user-123', tenantId: 'tenant-456', role: 'user' },
      params: {},
      query: {},
      body: {}
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('createContact', () => {
    it('should create contact and return 201 with contact data', async () => {
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: ['john@example.com']
      };
      
      const createdContact = {
        id: 'contact-123',
        ...contactData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = contactData;
      mockService.createContact.mockResolvedValue(createdContact);

      await controller.createContact(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.createContact).toHaveBeenCalledWith({
        ...contactData,
        tenantId: 'tenant-456',
        createdBy: 'user-123'
      });
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdContact,
        meta: {
          timestamp: expect.any(String),
          version: 'v1'
        }
      });
    });

    it('should handle service errors and call next middleware', async () => {
      const error = new ValidationError(['First name is required']);
      mockRequest.body = { lastName: 'Doe' };
      mockService.createContact.mockRejectedValue(error);

      await controller.createContact(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getContacts', () => {
    it('should return paginated contacts with search parameters', async () => {
      const searchResult = {
        data: [
          { id: 'contact-1', firstName: 'John', lastName: 'Doe' },
          { id: 'contact-2', firstName: 'Jane', lastName: 'Smith' }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      };

      mockRequest.query = {
        q: 'john',
        page: '1',
        limit: '20'
      };

      mockService.searchContacts.mockResolvedValue(searchResult);

      await controller.getContacts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.searchContacts).toHaveBeenCalledWith({
        query: 'john',
        tags: undefined,
        company: undefined,
        dateRange: undefined,
        pagination: { page: 1, limit: 20 },
        tenantId: 'tenant-456'
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: searchResult.data,
        meta: {
          pagination: searchResult.pagination,
          timestamp: expect.any(String),
          version: 'v1'
        }
      });
    });
  });
});
```

### Service Layer Tests

```typescript
// tests/unit/services/contact.service.test.ts
describe('ContactService', () => {
  let service: ContactService;
  let mockRepository: jest.Mocked<ContactRepository>;
  let mockEncryption: jest.Mocked<EncryptionService>;
  let mockAudit: jest.Mocked<AuditService>;
  let mockValidation: jest.Mocked<ValidationService>;

  beforeEach(() => {
    mockRepository = createMockContactRepository();
    mockEncryption = createMockEncryptionService();
    mockAudit = createMockAuditService();
    mockValidation = createMockValidationService();

    service = new ContactService(
      mockRepository,
      mockEncryption,
      mockAudit,
      mockValidation,
      mockLogger
    );
  });

  describe('createContact', () => {
    const validContactData = {
      firstName: 'John',
      lastName: 'Doe',
      email: ['john@example.com'],
      phone: ['+1234567890'],
      tenantId: 'tenant-123',
      createdBy: 'user-456'
    };

    it('should create contact with encrypted PII when all validations pass', async () => {
      // Arrange
      mockValidation.validateCreateContact.mockResolvedValue({ isValid: true, errors: [] });
      mockRepository.findByEmail.mockResolvedValue(null);
      mockEncryption.encryptArray.mockImplementation(async (data) => 
        data.map(item => `encrypted_${item}`)
      );
      
      const expectedContact = {
        id: 'contact-123',
        ...validContactData,
        emailEncrypted: ['encrypted_john@example.com'],
        phoneEncrypted: ['encrypted_+1234567890'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.transaction.mockImplementation(async (callback) => {
        mockRepository.create.mockResolvedValue(expectedContact);
        return await callback(mockRepository);
      });

      // Act
      const result = await service.createContact(validContactData);

      // Assert
      expect(mockValidation.validateCreateContact).toHaveBeenCalledWith(validContactData);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('john@example.com', 'tenant-123');
      expect(mockEncryption.encryptArray).toHaveBeenCalledWith(['john@example.com']);
      expect(mockEncryption.encryptArray).toHaveBeenCalledWith(['+1234567890']);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          emailEncrypted: ['encrypted_john@example.com'],
          phoneEncrypted: ['encrypted_+1234567890']
        }),
        mockRepository
      );
      expect(mockAudit.logContactCreation).toHaveBeenCalledWith(expectedContact, mockRepository);
      expect(result).toEqual(expectedContact);
    });

    it('should throw ValidationError when validation fails', async () => {
      // Arrange
      const validationErrors = ['First name is required', 'Email is invalid'];
      mockValidation.validateCreateContact.mockResolvedValue({
        isValid: false,
        errors: validationErrors
      });

      // Act & Assert
      await expect(service.createContact(validContactData))
        .rejects
        .toThrow(ValidationError);
      
      expect(mockRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockEncryption.encryptArray).not.toHaveBeenCalled();
    });

    it('should throw DuplicateEmailError when email already exists', async () => {
      // Arrange
      mockValidation.validateCreateContact.mockResolvedValue({ isValid: true, errors: [] });
      mockRepository.findByEmail.mockResolvedValue({ id: 'existing-contact' });

      // Act & Assert
      await expect(service.createContact(validContactData))
        .rejects
        .toThrow(DuplicateEmailError);
      
      expect(mockEncryption.encryptArray).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should rollback transaction on repository error', async () => {
      // Arrange
      mockValidation.validateCreateContact.mockResolvedValue({ isValid: true, errors: [] });
      mockRepository.findByEmail.mockResolvedValue(null);
      mockEncryption.encryptArray.mockResolvedValue(['encrypted_data']);
      
      const dbError = new Error('Database connection failed');
      mockRepository.transaction.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.createContact(validContactData))
        .rejects
        .toThrow('Database connection failed');
      
      // Verify transaction was attempted
      expect(mockRepository.transaction).toHaveBeenCalled();
    });
  });

  describe('searchContacts', () => {
    const searchParams = {
      query: 'john',
      tags: ['important'],
      company: 'TechCorp',
      pagination: { page: 1, limit: 20 },
      tenantId: 'tenant-123'
    };

    it('should return decrypted contacts with pagination metadata', async () => {
      const encryptedContacts = [
        {
          id: 'contact-1',
          firstName: 'John',
          emailEncrypted: ['encrypted_john@example.com'],
          phoneEncrypted: ['encrypted_+1234567890']
        }
      ];

      const searchResult = {
        data: encryptedContacts,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      };

      mockRepository.search.mockResolvedValue(searchResult);
      mockEncryption.decryptArray.mockImplementation((data) =>
        data.map(item => item.replace('encrypted_', ''))
      );

      const result = await service.searchContacts(searchParams);

      expect(mockRepository.search).toHaveBeenCalledWith(searchParams);
      expect(mockEncryption.decryptArray).toHaveBeenCalledWith(['encrypted_john@example.com']);
      expect(mockEncryption.decryptArray).toHaveBeenCalledWith(['encrypted_+1234567890']);
      
      expect(result.data[0]).toMatchObject({
        id: 'contact-1',
        firstName: 'John',
        email: ['john@example.com'],
        phone: ['+1234567890']
      });
    });
  });
});
```

This TDD Implementation Guide provides a comprehensive framework for implementing test-driven development in ConnectKit. Following these practices ensures high code quality, reliability, and maintainability throughout the development process.