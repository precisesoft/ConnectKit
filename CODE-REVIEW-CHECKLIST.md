# Code Review Checklist for ConnectKit

## Overview

This comprehensive code review checklist ensures consistency, quality, and security across the ConnectKit codebase. All code changes must pass this review process before merging to maintain high standards and project integrity.

## Pre-Review Checklist (Author Requirements)

Before submitting code for review, the author must verify:

### TDD Verification
- [ ] **Tests Written First**: All new functionality was developed using TDD (Red-Green-Refactor)
- [ ] **Test Coverage**: New code achieves minimum 80% test coverage (90% for service layer)
- [ ] **Test Quality**: Tests are readable, maintainable, and test the right things
- [ ] **Test Categories**: Appropriate mix of unit, integration, and E2E tests
- [ ] **Edge Cases**: Tests cover error conditions and boundary cases

### Code Quality
- [ ] **Linting Passes**: ESLint checks pass with no errors or warnings
- [ ] **Formatting**: Prettier formatting applied consistently
- [ ] **TypeScript**: Strict mode compliance with no `any` types or suppressions
- [ ] **Build Success**: All build processes complete without errors
- [ ] **No Console Logs**: Debug statements and console logs removed from production code

### Documentation
- [ ] **Code Comments**: Complex business logic documented with clear comments
- [ ] **API Documentation**: OpenAPI specifications updated for API changes
- [ ] **README Updates**: Documentation updated if setup or usage changes
- [ ] **Type Definitions**: All custom types properly documented

### Git Standards
- [ ] **Commit Messages**: Follow conventional commit format
- [ ] **Branch Naming**: Feature/fix branches follow naming convention
- [ ] **Clean History**: Commits are logical and well-organized
- [ ] **No Merge Conflicts**: Branch is up-to-date with target branch

## Reviewer Checklist

### Functional Requirements Review

#### Requirements Adherence
- [ ] **User Story Completion**: Code addresses all acceptance criteria
- [ ] **Business Logic**: Implementation matches business requirements
- [ ] **API Contract**: Maintains backward compatibility unless explicitly breaking
- [ ] **Feature Completeness**: All related functionality is included

#### Error Handling
- [ ] **Graceful Degradation**: Application handles errors without crashing
- [ ] **User-Friendly Messages**: Error messages are helpful to end users
- [ ] **Appropriate HTTP Status**: API endpoints return correct status codes
- [ ] **Logging**: Errors are logged with sufficient context for debugging

#### Edge Cases
- [ ] **Input Validation**: All user inputs are validated and sanitized
- [ ] **Boundary Conditions**: Code handles empty arrays, null values, max limits
- [ ] **Concurrent Access**: Thread-safety considered for shared resources
- [ ] **Network Failures**: External API failures handled appropriately

### Code Quality Review

#### SOLID Principles Adherence

**Single Responsibility Principle (SRP)**
- [ ] **Class Purpose**: Each class has one clear responsibility
- [ ] **Method Focus**: Methods perform single, well-defined tasks
- [ ] **Service Separation**: Business logic separated from presentation logic
- [ ] **Repository Pattern**: Data access logic isolated in repositories

**Open/Closed Principle (OCP)**
- [ ] **Extension Points**: Code is open for extension without modification
- [ ] **Interface Usage**: Dependencies use interfaces rather than concrete classes
- [ ] **Plugin Architecture**: New features can be added via configuration/plugins
- [ ] **Strategy Pattern**: Algorithms can be swapped without changing client code

**Liskov Substitution Principle (LSP)**
- [ ] **Subclass Behavior**: Derived classes can replace base classes seamlessly
- [ ] **Contract Preservation**: Subclasses maintain the same behavioral contracts
- [ ] **Exception Handling**: Subclasses don't throw new exceptions not in base contract
- [ ] **Preconditions**: Subclasses don't strengthen preconditions

**Interface Segregation Principle (ISP)**
- [ ] **Focused Interfaces**: Interfaces are specific to client needs
- [ ] **No Fat Interfaces**: Classes don't depend on methods they don't use
- [ ] **Role-Based Design**: Interfaces represent specific roles or capabilities
- [ ] **Client Decoupling**: Changes to one interface don't affect unrelated clients

**Dependency Inversion Principle (DIP)**
- [ ] **Abstract Dependencies**: High-level modules depend on abstractions
- [ ] **Dependency Injection**: Dependencies are injected rather than created
- [ ] **Inversion of Control**: Framework manages object lifecycle and dependencies
- [ ] **Testability**: Dependencies can be easily mocked for testing

#### Clean Code Standards

**Naming Conventions**
- [ ] **Descriptive Names**: Variables and functions clearly express intent
- [ ] **Consistent Vocabulary**: Same concepts use same terminology throughout
- [ ] **Pronounceable Names**: Names can be spoken and discussed easily
- [ ] **Searchable Names**: Important names are unique and searchable

**Function Design**
- [ ] **Small Functions**: Functions are small and focused (< 20 lines preferred)
- [ ] **Single Level of Abstraction**: Each function operates at one level of abstraction
- [ ] **Command/Query Separation**: Functions either do something or return something, not both
- [ ] **No Side Effects**: Functions don't cause unexpected state changes

**Class Design**
- [ ] **Cohesion**: Class members work together toward a common purpose
- [ ] **Encapsulation**: Internal state is properly hidden and protected
- [ ] **Composition over Inheritance**: Favors composition for code reuse
- [ ] **Minimal Interface**: Classes expose only what clients need

**Comments and Documentation**
- [ ] **Explain Why, Not What**: Comments explain reasoning, not implementation
- [ ] **Legal Comments**: Copyright and license information where required
- [ ] **Warning Comments**: Alert about consequences of changes
- [ ] **TODO Comments**: Include ticket numbers and deadlines

### Security Review (OWASP Top 10)

#### 1. Injection Prevention
- [ ] **Parameterized Queries**: All database queries use parameters, not string concatenation
- [ ] **Input Sanitization**: User inputs are sanitized before processing
- [ ] **Output Encoding**: Data is properly encoded for output context (HTML, JSON, etc.)
- [ ] **NoSQL Injection**: MongoDB and other NoSQL queries are properly constructed

```typescript
// ✅ Good: Parameterized query
const contacts = await db.query(
  'SELECT * FROM contacts WHERE tenant_id = $1 AND email = $2',
  [tenantId, email]
);

// ❌ Bad: String concatenation
const contacts = await db.query(
  `SELECT * FROM contacts WHERE email = '${email}'`
);
```

#### 2. Authentication & Session Management
- [ ] **Strong Passwords**: Password requirements enforce complexity
- [ ] **Secure Session Management**: Sessions are properly created, managed, and destroyed
- [ ] **Multi-Factor Authentication**: MFA implemented for sensitive operations
- [ ] **Account Lockout**: Protection against brute force attacks

```typescript
// ✅ Good: Proper password hashing
const hashedPassword = await bcrypt.hash(password, 12);

// ❌ Bad: Weak hashing or plain text
const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
```

#### 3. Sensitive Data Exposure
- [ ] **Encryption at Rest**: Sensitive data encrypted in database
- [ ] **Encryption in Transit**: All communications use TLS 1.3
- [ ] **Key Management**: Encryption keys properly managed and rotated
- [ ] **Data Classification**: PII and sensitive data clearly identified and protected

```typescript
// ✅ Good: Field-level encryption for PII
interface Contact {
  id: string;
  firstName: string;  // Not encrypted - not PII
  emailEncrypted: string[];  // Encrypted PII
  phoneEncrypted: string[];  // Encrypted PII
}

// ❌ Bad: Sensitive data in plain text
interface Contact {
  id: string;
  firstName: string;
  email: string[];  // PII not encrypted
  ssn: string;      // Highly sensitive, not encrypted
}
```

#### 4. XML External Entities (XXE)
- [ ] **XML Parser Configuration**: XML parsers configured to prevent XXE
- [ ] **File Upload Validation**: Uploaded files validated and scanned
- [ ] **External Resource Access**: Restricted access to external resources
- [ ] **Input Format Validation**: Strict validation of structured data formats

#### 5. Broken Access Control
- [ ] **Authorization Checks**: Every operation verifies user permissions
- [ ] **Tenant Isolation**: Multi-tenant data properly isolated
- [ ] **Resource-Level Security**: Users can only access their own resources
- [ ] **Privilege Escalation Prevention**: Users cannot gain unauthorized privileges

```typescript
// ✅ Good: Proper authorization check
app.get('/api/contacts/:id', authMiddleware, async (req, res) => {
  const contact = await contactService.findById(req.params.id, req.user.tenantId);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  // Additional permission check
  if (!canUserAccessContact(req.user, contact)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json({ data: contact });
});

// ❌ Bad: Missing authorization
app.get('/api/contacts/:id', async (req, res) => {
  const contact = await contactService.findById(req.params.id);
  res.json({ data: contact }); // No tenant or permission check
});
```

#### 6. Security Misconfiguration
- [ ] **Secure Headers**: Security headers properly configured
- [ ] **Default Credentials**: No default or weak credentials in production
- [ ] **Error Messages**: Error messages don't expose sensitive information
- [ ] **Security Features**: All security features enabled and configured properly

```typescript
// ✅ Good: Security headers configured
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));

// ❌ Bad: No security headers
app.use(express.json()); // Missing security middleware
```

#### 7. Cross-Site Scripting (XSS)
- [ ] **Input Validation**: All inputs validated on both client and server
- [ ] **Output Encoding**: Data properly encoded for HTML context
- [ ] **Content Security Policy**: CSP headers prevent inline scripts
- [ ] **Template Security**: Template engines configured for auto-escaping

```typescript
// ✅ Good: Input validation and output encoding
const createContact = [
  body('firstName').trim().escape().isLength({ min: 1, max: 255 }),
  body('email').isEmail().normalizeEmail(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process validated data
  }
];

// ❌ Bad: No validation or encoding
app.post('/contacts', (req, res) => {
  const contact = req.body; // Unvalidated input
  res.json({ message: `Created ${contact.name}` }); // Potential XSS
});
```

#### 8. Insecure Deserialization
- [ ] **Serialization Security**: Only trusted data is deserialized
- [ ] **Input Validation**: Deserialized data is validated
- [ ] **Type Safety**: Strong typing prevents object injection
- [ ] **Immutable Objects**: Use immutable data structures where possible

#### 9. Components with Known Vulnerabilities
- [ ] **Dependency Scanning**: Dependencies scanned for vulnerabilities
- [ ] **Regular Updates**: Dependencies kept up-to-date
- [ ] **Vulnerability Tracking**: Known vulnerabilities documented and mitigated
- [ ] **Supply Chain Security**: Dependencies from trusted sources only

#### 10. Insufficient Logging & Monitoring
- [ ] **Audit Logging**: All significant operations logged
- [ ] **Security Events**: Authentication and authorization events logged
- [ ] **Log Protection**: Logs protected from tampering and unauthorized access
- [ ] **Monitoring Alerts**: Suspicious activities trigger alerts

```typescript
// ✅ Good: Comprehensive audit logging
async function createContact(contactData: CreateContactRequest, userId: string): Promise<Contact> {
  logger.info('Creating contact', {
    userId,
    tenantId: contactData.tenantId,
    timestamp: new Date().toISOString()
  });

  try {
    const contact = await contactRepository.create(contactData);
    
    await auditLogger.log({
      action: 'CONTACT_CREATED',
      userId,
      resourceId: contact.id,
      resourceType: 'contact',
      tenantId: contactData.tenantId,
      metadata: { contactName: `${contact.firstName} ${contact.lastName}` }
    });

    return contact;
  } catch (error) {
    logger.error('Failed to create contact', {
      userId,
      tenantId: contactData.tenantId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// ❌ Bad: No logging or minimal logging
async function createContact(contactData: CreateContactRequest): Promise<Contact> {
  return await contactRepository.create(contactData); // No logging at all
}
```

### Performance Review

#### Database Performance
- [ ] **Query Optimization**: Queries use appropriate indexes and are efficient
- [ ] **N+1 Prevention**: No N+1 query problems in data fetching
- [ ] **Connection Pooling**: Database connections properly pooled and managed
- [ ] **Transaction Management**: Database transactions used appropriately

```typescript
// ✅ Good: Optimized query with proper indexing
async function searchContacts(params: SearchParams): Promise<Contact[]> {
  // Uses search_vector index for full-text search
  const query = `
    SELECT c.*, ts_rank(c.search_vector, query) as rank
    FROM contacts c, plainto_tsquery($1) query
    WHERE c.tenant_id = $2 
      AND c.search_vector @@ query
      AND c.is_deleted = false
    ORDER BY rank DESC, c.created_at DESC
    LIMIT $3 OFFSET $4
  `;
  
  return await db.query(query, [params.q, params.tenantId, params.limit, params.offset]);
}

// ❌ Bad: Inefficient query without indexes
async function searchContacts(query: string): Promise<Contact[]> {
  // Full table scan, no indexes used
  const sql = `
    SELECT * FROM contacts 
    WHERE LOWER(first_name) LIKE LOWER('%${query}%') 
       OR LOWER(last_name) LIKE LOWER('%${query}%')
  `;
  return await db.query(sql); // Also vulnerable to SQL injection
}
```

#### API Performance
- [ ] **Response Times**: API responses under performance thresholds (< 200ms)
- [ ] **Caching Strategy**: Appropriate caching for frequently accessed data
- [ ] **Pagination**: Large result sets properly paginated
- [ ] **Rate Limiting**: API endpoints protected against abuse

```typescript
// ✅ Good: Caching and pagination
app.get('/api/contacts', cache('5m'), async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  
  const result = await contactService.getContacts({
    tenantId: req.user.tenantId,
    page,
    limit
  });
  
  res.json({
    data: result.contacts,
    pagination: result.pagination
  });
});

// ❌ Bad: No caching or pagination limits
app.get('/api/contacts', async (req: Request, res: Response) => {
  const contacts = await contactService.getAllContacts(); // Could return millions
  res.json(contacts); // No caching, always hits database
});
```

#### Frontend Performance
- [ ] **Bundle Size**: JavaScript bundles within size limits
- [ ] **Lazy Loading**: Components and routes loaded on demand
- [ ] **Memoization**: React components properly memoized
- [ ] **Virtual Scrolling**: Large lists use virtualization

```typescript
// ✅ Good: Memoized component with lazy loading
import { lazy, memo, useMemo } from 'react';

const ContactCard = memo(({ contact, onEdit, onDelete }) => {
  const displayName = useMemo(() => 
    `${contact.firstName} ${contact.lastName}`, 
    [contact.firstName, contact.lastName]
  );
  
  return (
    <Card>
      <CardContent>{displayName}</CardContent>
    </Card>
  );
});

const LazyContactForm = lazy(() => import('./ContactForm'));

// ❌ Bad: No memoization, always re-renders
function ContactCard({ contact, onEdit, onDelete }) {
  const displayName = `${contact.firstName} ${contact.lastName}`; // Recalculated every render
  
  return (
    <Card>
      <CardContent>{displayName}</CardContent>
    </Card>
  );
}
```

### Accessibility Review (WCAG 2.1 AA)

#### Keyboard Navigation
- [ ] **Tab Order**: Logical tab order throughout the application
- [ ] **Focus Indicators**: Clear focus indicators for all interactive elements
- [ ] **Keyboard Shortcuts**: All functionality accessible via keyboard
- [ ] **Focus Management**: Focus properly managed in dynamic content

#### Screen Reader Support
- [ ] **Semantic HTML**: Proper HTML semantics used throughout
- [ ] **ARIA Labels**: ARIA labels provided for complex interactions
- [ ] **Alt Text**: All images have appropriate alternative text
- [ ] **Form Labels**: All form fields have proper labels

```tsx
// ✅ Good: Accessible form with proper labels
<form onSubmit={handleSubmit}>
  <TextField
    id="firstName"
    label="First Name"
    value={firstName}
    onChange={(e) => setFirstName(e.target.value)}
    required
    aria-describedby="firstName-help"
    error={!!errors.firstName}
  />
  <FormHelperText id="firstName-help">
    {errors.firstName || "Enter the contact's first name"}
  </FormHelperText>
  
  <Button type="submit" aria-label="Save contact">
    Save
  </Button>
</form>

// ❌ Bad: Inaccessible form
<form onSubmit={handleSubmit}>
  <input 
    type="text" 
    placeholder="First Name" 
    value={firstName}
    onChange={(e) => setFirstName(e.target.value)}
  /> {/* No label or aria attributes */}
  
  <button type="submit">Save</button> {/* Generic label */}
</form>
```

#### Color and Contrast
- [ ] **Color Contrast**: Text meets WCAG AA contrast requirements (4.5:1 ratio)
- [ ] **Color Independence**: Information not conveyed by color alone
- [ ] **High Contrast Mode**: Application works in high contrast mode
- [ ] **Dark Mode**: Proper contrast maintained in dark themes

#### Responsive Design
- [ ] **Mobile Accessibility**: Touch targets at least 44px square
- [ ] **Zoom Support**: Content readable at 200% zoom
- [ ] **Orientation**: Works in both portrait and landscape modes
- [ ] **Viewport**: Proper viewport meta tag configuration

### Testing Review

#### Test Coverage Verification
- [ ] **Line Coverage**: Minimum 80% line coverage (90% for services)
- [ ] **Branch Coverage**: All conditional branches tested
- [ ] **Function Coverage**: All functions have at least one test
- [ ] **Critical Path Testing**: All user workflows covered by tests

#### Test Quality Assessment
- [ ] **Test Names**: Tests clearly describe expected behavior
- [ ] **Test Structure**: Arrange-Act-Assert pattern followed
- [ ] **Test Independence**: Tests can run independently and in any order
- [ ] **Test Data**: Tests use realistic data and scenarios

```typescript
// ✅ Good: Clear test structure and naming
describe('ContactService', () => {
  describe('createContact', () => {
    it('should create contact with encrypted PII when valid data provided', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: ['john@example.com'],
        tenantId: 'tenant-123'
      };
      mockRepository.findByEmail.mockResolvedValue(null);
      mockEncryption.encryptArray.mockResolvedValue(['encrypted_email']);

      // Act
      const result = await contactService.createContact(contactData);

      // Assert
      expect(result).toMatchObject({
        firstName: 'John',
        lastName: 'Doe'
      });
      expect(mockEncryption.encryptArray).toHaveBeenCalledWith(['john@example.com']);
    });

    it('should throw DuplicateEmailError when email already exists', async () => {
      // Arrange
      const contactData = { /* ... */ };
      mockRepository.findByEmail.mockResolvedValue({ id: 'existing' });

      // Act & Assert
      await expect(contactService.createContact(contactData))
        .rejects
        .toThrow(DuplicateEmailError);
    });
  });
});

// ❌ Bad: Unclear test names and structure
describe('ContactService', () => {
  it('test create', async () => {
    const data = { name: 'John' };
    const result = await service.create(data);
    expect(result).toBeTruthy(); // Vague assertion
  });

  it('create fails', async () => {
    // No clear arrange section
    mockRepo.find.mockResolvedValue(true);
    expect(() => service.create({})).toThrow(); // Missing await
  });
});
```

#### Mock Strategy Review
- [ ] **Appropriate Mocking**: Only external dependencies mocked, not internal logic
- [ ] **Mock Verification**: Mocks verify interactions, not just return values
- [ ] **Test Doubles**: Appropriate use of mocks, stubs, and spies
- [ ] **Mock Cleanup**: Mocks properly reset between tests

### Documentation Review

#### Code Documentation
- [ ] **API Documentation**: All public methods documented with JSDoc
- [ ] **Complex Logic**: Algorithms and business rules explained in comments
- [ ] **Configuration**: Environment variables and configuration documented
- [ ] **Examples**: Usage examples provided for complex APIs

```typescript
/**
 * Creates a new contact with encrypted PII data
 * 
 * @param contactData - The contact information to store
 * @param contactData.firstName - Contact's first name (required)
 * @param contactData.lastName - Contact's last name (required)
 * @param contactData.email - Array of email addresses (at least one required)
 * @param contactData.phone - Array of phone numbers (optional)
 * @param contactData.tenantId - Tenant ID for multi-tenant isolation
 * @param contactData.createdBy - ID of user creating the contact
 * 
 * @returns Promise resolving to the created contact with system-generated fields
 * 
 * @throws {ValidationError} When required fields are missing or invalid
 * @throws {DuplicateEmailError} When email already exists for the tenant
 * @throws {DatabaseError} When database operation fails
 * 
 * @example
 * ```typescript
 * const contact = await contactService.createContact({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: ['john@example.com'],
 *   tenantId: 'tenant-123',
 *   createdBy: 'user-456'
 * });
 * console.log(`Created contact: ${contact.id}`);
 * ```
 */
async createContact(contactData: CreateContactRequest): Promise<Contact> {
  // Implementation...
}
```

#### Architectural Documentation
- [ ] **Design Decisions**: Major architectural decisions documented with rationale
- [ ] **API Changes**: Breaking changes clearly documented
- [ ] **Migration Guides**: Instructions for updating existing code
- [ ] **Troubleshooting**: Common issues and solutions documented

### Error Handling Review

#### Error Types and Handling
- [ ] **Custom Error Classes**: Specific error types for different failure scenarios
- [ ] **Error Propagation**: Errors properly caught and re-thrown at appropriate levels
- [ ] **User-Friendly Messages**: Error messages appropriate for end users
- [ ] **Debugging Information**: Sufficient context for developers to debug issues

```typescript
// ✅ Good: Comprehensive error handling
export class ContactService {
  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    try {
      // Validation
      const validation = await this.validateContactData(contactData);
      if (!validation.isValid) {
        throw new ValidationError(validation.errors);
      }

      // Business logic validation
      const existing = await this.repository.findByEmail(contactData.email[0]);
      if (existing) {
        throw new DuplicateEmailError(contactData.email[0]);
      }

      // Create contact
      const contact = await this.repository.create(contactData);
      
      this.logger.info('Contact created', { contactId: contact.id });
      return contact;

    } catch (error) {
      if (error instanceof ValidationError || error instanceof DuplicateEmailError) {
        // Re-throw known business errors
        throw error;
      }

      // Log unexpected errors with context
      this.logger.error('Unexpected error creating contact', {
        error: error.message,
        stack: error.stack,
        contactData: {
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          // Don't log PII like email
        }
      });

      throw new Error('Failed to create contact');
    }
  }
}

// ❌ Bad: Poor error handling
export class ContactService {
  async createContact(contactData: any): Promise<any> {
    try {
      return await this.repository.create(contactData);
    } catch (error) {
      console.log('Error:', error); // Poor logging
      throw error; // Re-throwing without context
    }
  }
}
```

#### Logging Standards
- [ ] **Log Levels**: Appropriate log levels (error, warn, info, debug)
- [ ] **Structured Logging**: Logs include structured data for analysis
- [ ] **Sensitive Data**: No PII or secrets in logs
- [ ] **Performance Impact**: Logging doesn't significantly impact performance

### Database Review

#### Schema Design
- [ ] **Normalization**: Appropriate level of database normalization
- [ ] **Indexes**: Proper indexes for query performance
- [ ] **Constraints**: Database constraints enforce data integrity
- [ ] **Audit Trails**: Change tracking implemented where required

#### Data Security
- [ ] **Row-Level Security**: Multi-tenant data isolation enforced
- [ ] **Field Encryption**: PII data encrypted at field level
- [ ] **Access Controls**: Database users have minimal required permissions
- [ ] **Backup Security**: Database backups encrypted and secured

```sql
-- ✅ Good: Proper RLS policy
CREATE POLICY contacts_tenant_isolation ON contacts
    FOR ALL TO application_user
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- ✅ Good: Proper indexing for performance
CREATE INDEX CONCURRENTLY idx_contacts_search_vector 
ON contacts USING gin(search_vector);

CREATE INDEX CONCURRENTLY idx_contacts_tenant_created 
ON contacts(tenant_id, created_at DESC) 
WHERE is_deleted = false;

-- ❌ Bad: No RLS, missing indexes
CREATE TABLE contacts (
    id UUID PRIMARY KEY,
    tenant_id UUID, -- No RLS policy
    first_name VARCHAR(255),
    -- No indexes for common queries
);
```

## Review Process Guidelines

### Review Assignment
- **Required Reviewers**: Minimum 2 reviewers for all changes
- **Subject Matter Experts**: Include domain experts for complex changes
- **Security Review**: Security team review for authentication/authorization changes
- **Performance Review**: Performance team review for database schema changes

### Review Timeline
- **Initial Review**: Within 24 hours of PR submission
- **Response Time**: Authors respond to feedback within 24 hours
- **Final Approval**: All feedback addressed before merge
- **Emergency Changes**: Expedited review process for critical fixes

### Review Comments Guidelines

#### Providing Feedback
- **Be Specific**: Point to exact lines and provide concrete suggestions
- **Explain Reasoning**: Include why a change is needed
- **Provide Examples**: Show correct implementation when suggesting changes
- **Be Constructive**: Focus on code improvement, not personal criticism

#### Comment Categories
```markdown
**Critical**: Must be fixed before merge
- Security vulnerabilities
- Functional correctness issues
- Data integrity problems

**Major**: Should be fixed before merge
- Performance issues
- Maintainability concerns
- Design pattern violations

**Minor**: Nice to have improvements
- Code style suggestions
- Optimization opportunities
- Documentation enhancements

**Nitpick**: Optional improvements
- Variable naming suggestions
- Comment improvements
- Minor refactoring opportunities
```

#### Example Review Comments

```markdown
**Critical**: SQL Injection Vulnerability
```typescript
// This is vulnerable to SQL injection
const query = `SELECT * FROM contacts WHERE name = '${name}'`;
```

Please use parameterized queries:
```typescript
const query = 'SELECT * FROM contacts WHERE name = $1';
const result = await db.query(query, [name]);
```

**Major**: Missing Error Handling
The `createContact` method doesn't handle the case where the database is unavailable. Consider adding a try-catch block and appropriate error logging.

**Minor**: Inconsistent Naming
Consider renaming `usr` to `user` for better readability and consistency with the rest of the codebase.

**Nitpick**: Consider Memoization
This calculation runs on every render. Consider using `useMemo` to optimize performance:
```typescript
const displayName = useMemo(() => 
  `${firstName} ${lastName}`, 
  [firstName, lastName]
);
```
```

### Automated Checks Integration

#### Pre-merge Requirements
- [ ] **CI/CD Pipeline**: All automated checks must pass
- [ ] **Test Coverage**: Coverage thresholds met
- [ ] **Security Scan**: No high or critical vulnerabilities
- [ ] **Performance Regression**: No significant performance degradation

#### Quality Gates
```yaml
quality_gates:
  test_coverage:
    line_coverage: 80%
    branch_coverage: 75%
    function_coverage: 90%
  
  code_complexity:
    cyclomatic_complexity: 10
    cognitive_complexity: 15
  
  security:
    high_vulnerabilities: 0
    medium_vulnerabilities: 3
  
  performance:
    api_response_time_p95: 200ms
    database_query_time_p95: 50ms
```

### Post-Review Actions

#### Author Responsibilities
- [ ] **Address All Feedback**: Respond to every comment with changes or explanations
- [ ] **Update Documentation**: Ensure related documentation is updated
- [ ] **Test Changes**: Verify all feedback addressed correctly
- [ ] **Squash Commits**: Clean up commit history before merge

#### Reviewer Responsibilities
- [ ] **Re-review Changes**: Review updated code after feedback addressed
- [ ] **Verify Tests**: Ensure new tests cover suggested changes
- [ ] **Approve Merge**: Explicitly approve when satisfied with changes
- [ ] **Monitor Post-merge**: Watch for any issues after code is deployed

This comprehensive code review checklist ensures that all ConnectKit code meets high standards for quality, security, performance, and maintainability. Regular use of this checklist helps maintain consistency across the development team and reduces the likelihood of issues in production.