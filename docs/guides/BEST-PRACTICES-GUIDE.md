# ConnectKit Best Practices Guide

## Overview

This comprehensive guide establishes the development standards, best practices, and quality requirements for ConnectKit implementation. All team members must follow these practices to ensure code quality, security, maintainability, and performance.

## Test-Driven Development (TDD) Methodology

### Red-Green-Refactor Cycle

#### 1. Red Phase - Write Failing Test
```typescript
// Example: Contact service test (RED)
describe('ContactService', () => {
  describe('createContact', () => {
    it('should create a contact with encrypted PII data', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: ['john.doe@example.com'],
        phone: ['+1234567890'],
        tenantId: 'tenant-uuid'
      };
      
      // Act
      const result = await contactService.createContact(contactData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.emailEncrypted).toBeDefined();
      expect(result.phoneEncrypted).toBeDefined();
      // This test will FAIL initially - that's expected in RED phase
    });
  });
});
```

#### 2. Green Phase - Write Minimal Code
```typescript
// Example: Minimal implementation to pass test (GREEN)
export class ContactService {
  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    const encryptedEmail = await this.encryptionService.encrypt(contactData.email);
    const encryptedPhone = await this.encryptionService.encrypt(contactData.phone);
    
    const contact = await this.repository.create({
      id: uuid(),
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      emailEncrypted: encryptedEmail,
      phoneEncrypted: encryptedPhone,
      tenantId: contactData.tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return contact;
  }
}
```

#### 3. Refactor Phase - Improve Code Quality
```typescript
// Example: Refactored implementation (REFACTOR)
export class ContactService {
  constructor(
    private repository: ContactRepository,
    private encryptionService: EncryptionService,
    private auditService: AuditService,
    private validationService: ValidationService
  ) {}

  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    // Validate input
    await this.validationService.validateContactData(contactData);
    
    // Check for duplicates
    await this.checkForDuplicates(contactData.email);
    
    // Encrypt PII data
    const encryptedData = await this.encryptPiiFields(contactData);
    
    // Create contact with transaction
    const contact = await this.repository.transaction(async (trx) => {
      const newContact = await this.repository.create(
        this.buildContactEntity(contactData, encryptedData),
        trx
      );
      
      // Log audit trail
      await this.auditService.logContactCreation(newContact, trx);
      
      return newContact;
    });
    
    return contact;
  }

  private async encryptPiiFields(contactData: CreateContactRequest) {
    return {
      emailEncrypted: await this.encryptionService.encryptArray(contactData.email),
      phoneEncrypted: await this.encryptionService.encryptArray(contactData.phone),
      addressEncrypted: contactData.address 
        ? await this.encryptionService.encrypt(contactData.address)
        : null
    };
  }
}
```

### TDD Workflow Requirements

1. **Always start with a failing test**
2. **Write the minimum code to pass the test**
3. **Refactor while keeping tests green**
4. **Commit after each complete cycle**
5. **Maintain test coverage above 80%**

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)

#### Good Example - Single Responsibility
```typescript
// Good: Each class has one responsibility
class ContactValidator {
  validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(email),
      errors: emailRegex.test(email) ? [] : ['Invalid email format']
    };
  }
}

class ContactRepository {
  async create(contact: Contact): Promise<Contact> {
    return await this.database.contacts.create(contact);
  }
}

class ContactService {
  constructor(
    private validator: ContactValidator,
    private repository: ContactRepository
  ) {}
  
  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    const validation = this.validator.validateEmail(contactData.email[0]);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }
    
    return await this.repository.create(contactData);
  }
}
```

#### Bad Example - Multiple Responsibilities
```typescript
// Bad: ContactService doing too much
class ContactService {
  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    // Validation logic (should be separate)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email[0])) {
      throw new Error('Invalid email');
    }
    
    // Database logic (should be in repository)
    const query = 'INSERT INTO contacts...';
    const result = await this.database.query(query, contactData);
    
    // Audit logic (should be separate)
    await this.database.query('INSERT INTO audit_log...', {
      action: 'CREATE',
      table: 'contacts',
      recordId: result.id
    });
    
    return result;
  }
}
```

### Open/Closed Principle (OCP)

```typescript
// Good: Open for extension, closed for modification
interface ContactExporter {
  export(contacts: Contact[]): Promise<string>;
}

class CsvContactExporter implements ContactExporter {
  async export(contacts: Contact[]): Promise<string> {
    const headers = 'First Name,Last Name,Email,Phone\n';
    const rows = contacts.map(c => 
      `${c.firstName},${c.lastName},${c.email[0]},${c.phone[0]}`
    ).join('\n');
    return headers + rows;
  }
}

class JsonContactExporter implements ContactExporter {
  async export(contacts: Contact[]): Promise<string> {
    return JSON.stringify(contacts, null, 2);
  }
}

class ContactExportService {
  async exportContacts(contacts: Contact[], exporter: ContactExporter): Promise<string> {
    return await exporter.export(contacts);
  }
}
```

### Liskov Substitution Principle (LSP)

```typescript
// Good: Derived classes can substitute base classes
abstract class BaseRepository<T> {
  abstract create(entity: T): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract update(id: string, entity: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;
}

class ContactRepository extends BaseRepository<Contact> {
  async create(contact: Contact): Promise<Contact> {
    // Maintains contract - returns Contact
    return await this.database.contacts.create(contact);
  }
  
  async findById(id: string): Promise<Contact | null> {
    // Maintains contract - returns Contact or null
    return await this.database.contacts.findUnique({ where: { id } });
  }
  
  // ... other methods maintain the same contract
}
```

### Interface Segregation Principle (ISP)

```typescript
// Good: Specific, focused interfaces
interface ContactReader {
  findById(id: string): Promise<Contact | null>;
  findByEmail(email: string): Promise<Contact[]>;
  search(query: string): Promise<Contact[]>;
}

interface ContactWriter {
  create(contact: Contact): Promise<Contact>;
  update(id: string, contact: Partial<Contact>): Promise<Contact>;
  delete(id: string): Promise<void>;
}

interface ContactValidator {
  validateCreate(contact: CreateContactRequest): ValidationResult;
  validateUpdate(contact: UpdateContactRequest): ValidationResult;
}

// Implementations can choose which interfaces they need
class ReadOnlyContactService implements ContactReader {
  // Only implements read methods
}

class FullContactService implements ContactReader, ContactWriter {
  // Implements both read and write methods
}
```

### Dependency Inversion Principle (DIP)

```typescript
// Good: Depend on abstractions, not concretions
interface EmailService {
  sendWelcomeEmail(to: string, name: string): Promise<void>;
}

interface Logger {
  info(message: string): void;
  error(message: string, error?: Error): void;
}

class UserRegistrationService {
  constructor(
    private emailService: EmailService,  // Abstract dependency
    private logger: Logger              // Abstract dependency
  ) {}
  
  async registerUser(userData: CreateUserRequest): Promise<User> {
    try {
      const user = await this.createUser(userData);
      await this.emailService.sendWelcomeEmail(user.email, user.firstName);
      this.logger.info(`User registered: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error('User registration failed', error);
      throw error;
    }
  }
}

// Concrete implementations
class SendGridEmailService implements EmailService {
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    // SendGrid implementation
  }
}

class WinstonLogger implements Logger {
  info(message: string): void { /* Winston implementation */ }
  error(message: string, error?: Error): void { /* Winston implementation */ }
}
```

## Clean Code Principles

### Naming Conventions

#### Variables and Functions - Descriptive and Clear
```typescript
// Good: Descriptive names
const encryptedContactEmails = await encryptEmails(contactEmails);
const isValidEmailFormat = validateEmailFormat(email);
const totalActiveContacts = await countActiveContacts(tenantId);

function calculateMonthlySubscriptionCost(
  basePrice: number,
  discountPercentage: number,
  taxRate: number
): number {
  const discountedPrice = basePrice * (1 - discountPercentage / 100);
  return discountedPrice * (1 + taxRate / 100);
}

// Bad: Unclear names
const data = await enc(emails);
const flag = validate(email);
const num = await count(id);
```

#### Classes - Nouns or Noun Phrases
```typescript
// Good: Clear class names
class ContactRepository {}
class EmailValidationService {}
class UserAuthenticationManager {}
class DatabaseConnectionPool {}

// Bad: Unclear or verb-based names
class ContactHandler {}  // Handler is too generic
class Validate {}       // Should be Validator
class Manager {}        // Too generic
```

#### Methods - Verbs or Verb Phrases
```typescript
// Good: Action-oriented method names
class ContactService {
  async createContact(contactData: CreateContactRequest): Promise<Contact> {}
  async updateContactEmail(contactId: string, newEmail: string): Promise<void> {}
  async archiveInactiveContacts(daysInactive: number): Promise<number> {}
  async validateContactEmailUniqueness(email: string, tenantId: string): Promise<boolean> {}
}

// Bad: Noun-based or unclear method names
class ContactService {
  async contact(data: any): Promise<any> {}       // Unclear action
  async emailUpdate(id: string, email: string): Promise<void> {}  // Should be updateEmail
  async inactive(days: number): Promise<number> {}  // Unclear action
}
```

#### Constants - UPPER_SNAKE_CASE
```typescript
// Good: Clear constant names
export const MAX_LOGIN_ATTEMPTS = 5;
export const JWT_EXPIRATION_TIME = '15m';
export const BCRYPT_SALT_ROUNDS = 12;
export const DATABASE_CONNECTION_TIMEOUT = 5000;

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_US: /^\+1\d{10}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
} as const;
```

### Function Design Principles

#### Small Functions - Single Purpose
```typescript
// Good: Small, focused functions
function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

function formatFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`;
}

async function encryptSensitiveData(
  data: string, 
  encryptionKey: string
): Promise<string> {
  const cipher = crypto.createCipher('aes-256-gcm', encryptionKey);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Bad: Large function doing multiple things
async function processContactData(contactData: any): Promise<any> {
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(contactData.email)) {
    throw new Error('Invalid email');
  }
  
  // Phone normalization
  contactData.phone = contactData.phone.replace(/[^\d+]/g, '');
  
  // Name formatting
  contactData.firstName = contactData.firstName.trim();
  contactData.lastName = contactData.lastName.trim();
  
  // Encryption
  const cipher = crypto.createCipher('aes-256-gcm', process.env.ENCRYPTION_KEY);
  let encryptedEmail = cipher.update(contactData.email, 'utf8', 'hex');
  encryptedEmail += cipher.final('hex');
  
  // Database save
  const result = await database.query('INSERT INTO contacts...', contactData);
  
  // Audit log
  await database.query('INSERT INTO audit_log...', { action: 'CREATE' });
  
  return result;
}
```

#### Parameter Limits - Use Objects for Multiple Parameters
```typescript
// Good: Object parameters for multiple values
interface CreateContactParams {
  firstName: string;
  lastName: string;
  email: string[];
  phone: string[];
  company?: string;
  title?: string;
  tenantId: string;
  createdBy: string;
}

async function createContact(params: CreateContactParams): Promise<Contact> {
  const { firstName, lastName, email, phone, company, title, tenantId, createdBy } = params;
  // Implementation
}

interface SearchContactParams {
  query?: string;
  tags?: string[];
  company?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  pagination: {
    page: number;
    limit: number;
  };
  tenantId: string;
}

// Bad: Too many individual parameters
async function searchContacts(
  query: string,
  tags: string[],
  company: string,
  fromDate: Date,
  toDate: Date,
  page: number,
  limit: number,
  tenantId: string,
  sortBy: string,
  sortOrder: string
): Promise<Contact[]> {
  // Hard to remember parameter order
}
```

### Error Handling Best Practices

#### Custom Error Classes
```typescript
// Define specific error types
export class ValidationError extends Error {
  public readonly statusCode = 400;
  public readonly errors: string[];
  
  constructor(errors: string[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class ContactNotFoundError extends Error {
  public readonly statusCode = 404;
  public readonly contactId: string;
  
  constructor(contactId: string) {
    super(`Contact with ID ${contactId} not found`);
    this.name = 'ContactNotFoundError';
    this.contactId = contactId;
  }
}

export class DuplicateEmailError extends Error {
  public readonly statusCode = 409;
  public readonly email: string;
  
  constructor(email: string) {
    super(`Contact with email ${email} already exists`);
    this.name = 'DuplicateEmailError';
    this.email = email;
  }
}
```

#### Proper Error Handling
```typescript
// Good: Comprehensive error handling
export class ContactService {
  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    try {
      // Input validation
      const validationResult = await this.validateContactData(contactData);
      if (!validationResult.isValid) {
        throw new ValidationError(validationResult.errors);
      }
      
      // Check for duplicates
      const existingContact = await this.findByEmail(contactData.email[0]);
      if (existingContact) {
        throw new DuplicateEmailError(contactData.email[0]);
      }
      
      // Create contact
      const contact = await this.repository.create(contactData);
      
      // Log success
      this.logger.info('Contact created successfully', { contactId: contact.id });
      
      return contact;
      
    } catch (error) {
      // Log error with context
      this.logger.error('Failed to create contact', {
        error: error.message,
        stack: error.stack,
        contactData: { 
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          email: contactData.email[0] // Don't log sensitive data
        }
      });
      
      // Re-throw known errors
      if (error instanceof ValidationError || 
          error instanceof DuplicateEmailError) {
        throw error;
      }
      
      // Wrap unknown errors
      throw new Error('Internal server error during contact creation');
    }
  }
}
```

## TypeScript Strict Mode Configuration

### tsconfig.json Setup
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    
    // Strict Type Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    
    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Module Resolution
    "moduleResolution": "node",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"],
      "@/services/*": ["src/services/*"]
    },
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    
    // Emit
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "importHelpers": true,
    
    // Experimental
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

### Type Safety Examples

#### Strict Null Checks
```typescript
// Good: Handle null/undefined explicitly
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string[];
  phone?: string[];  // Optional property
  company: string | null;  // Explicit nullable
}

function getContactDisplayName(contact: Contact): string {
  // Handle optional/nullable properties safely
  const firstName = contact.firstName.trim();
  const lastName = contact.lastName.trim();
  
  if (contact.company) {
    return `${firstName} ${lastName} (${contact.company})`;
  }
  
  return `${firstName} ${lastName}`;
}

function getContactPhone(contact: Contact): string | null {
  // Safe navigation with optional properties
  return contact.phone?.[0] ?? null;
}

// Bad: Assuming values exist
function unsafeGetContactDisplayName(contact: Contact): string {
  // This might fail if company is null
  return `${contact.firstName} ${contact.lastName} (${contact.company.toUpperCase()})`;
}
```

#### Discriminated Unions
```typescript
// Good: Type-safe API responses
type ApiResponse<T> = 
  | { success: true; data: T; }
  | { success: false; error: string; statusCode: number; };

async function fetchContact(id: string): Promise<ApiResponse<Contact>> {
  try {
    const contact = await contactRepository.findById(id);
    
    if (!contact) {
      return {
        success: false,
        error: 'Contact not found',
        statusCode: 404
      };
    }
    
    return {
      success: true,
      data: contact
    };
  } catch (error) {
    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500
    };
  }
}

// Usage with type safety
const response = await fetchContact('contact-id');

if (response.success) {
  // TypeScript knows response.data is Contact
  console.log(response.data.firstName);
} else {
  // TypeScript knows response has error and statusCode
  console.error(`Error ${response.statusCode}: ${response.error}`);
}
```

#### Generic Constraints
```typescript
// Good: Constrained generics for type safety
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Repository<T extends BaseEntity> {
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T>;
  delete(id: string): Promise<void>;
}

interface Contact extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string[];
  tenantId: string;
}

class ContactRepository implements Repository<Contact> {
  async create(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    // TypeScript ensures all required fields are present
    const contact: Contact = {
      id: uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...contactData
    };
    
    return await this.database.contacts.create(contact);
  }
  
  // Other methods...
}
```

## React Best Practices

### Component Structure and Hooks

#### Functional Components with Hooks
```typescript
// Good: Functional component with proper hooks usage
interface ContactFormProps {
  initialData?: Contact;
  onSubmit: (contact: CreateContactRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  // State management
  const [formData, setFormData] = useState<CreateContactRequest>({
    firstName: initialData?.firstName ?? '',
    lastName: initialData?.lastName ?? '',
    email: initialData?.email ?? [''],
    phone: initialData?.phone ?? [''],
    company: initialData?.company ?? '',
    title: initialData?.title ?? ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  
  // Custom hooks
  const { validateForm } = useFormValidation();
  
  // Memoized values
  const isValid = useMemo(() => {
    const validationResult = validateForm(formData);
    return validationResult.isValid;
  }, [formData, validateForm]);
  
  // Form submission handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      const validationResult = validateForm(formData);
      setErrors(validationResult.errors);
      return;
    }
    
    try {
      await onSubmit(formData);
      setIsDirty(false);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  }, [formData, isValid, onSubmit, validateForm]);
  
  // Field update handler
  const updateField = useCallback((field: keyof CreateContactRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);
  
  // Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
  
  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="form-row">
        <TextField
          label="First Name"
          value={formData.firstName}
          onChange={(e) => updateField('firstName', e.target.value)}
          error={!!errors.firstName}
          helperText={errors.firstName}
          required
          disabled={isLoading}
        />
        
        <TextField
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => updateField('lastName', e.target.value)}
          error={!!errors.lastName}
          helperText={errors.lastName}
          required
          disabled={isLoading}
        />
      </div>
      
      {/* Email array handling */}
      <EmailFieldArray
        emails={formData.email}
        onChange={(emails) => updateField('email', emails)}
        errors={errors.email}
        disabled={isLoading}
      />
      
      <div className="form-actions">
        <Button
          type="button"
          variant="outlined"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          variant="contained"
          disabled={!isValid || isLoading}
          loading={isLoading}
        >
          {initialData ? 'Update Contact' : 'Create Contact'}
        </Button>
      </div>
    </form>
  );
};
```

### Performance Optimization

#### React.memo and useMemo
```typescript
// Good: Memoized component for performance
interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  isSelected?: boolean;
}

export const ContactCard = React.memo<ContactCardProps>(({
  contact,
  onEdit,
  onDelete,
  isSelected = false
}) => {
  // Memoize expensive calculations
  const displayName = useMemo(() => {
    return `${contact.firstName} ${contact.lastName}`;
  }, [contact.firstName, contact.lastName]);
  
  const primaryEmail = useMemo(() => {
    return contact.email?.[0] ?? 'No email';
  }, [contact.email]);
  
  const primaryPhone = useMemo(() => {
    return contact.phone?.[0] ?? 'No phone';
  }, [contact.phone]);
  
  // Memoize event handlers to prevent unnecessary re-renders
  const handleEdit = useCallback(() => {
    onEdit(contact);
  }, [contact, onEdit]);
  
  const handleDelete = useCallback(() => {
    onDelete(contact.id);
  }, [contact.id, onDelete]);
  
  return (
    <Card className={`contact-card ${isSelected ? 'selected' : ''}`}>
      <CardContent>
        <Typography variant="h6">{displayName}</Typography>
        <Typography variant="body2" color="textSecondary">
          {contact.company} - {contact.title}
        </Typography>
        <Typography variant="body2">{primaryEmail}</Typography>
        <Typography variant="body2">{primaryPhone}</Typography>
      </CardContent>
      
      <CardActions>
        <IconButton onClick={handleEdit} size="small">
          <EditIcon />
        </IconButton>
        <IconButton onClick={handleDelete} size="small">
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
});

ContactCard.displayName = 'ContactCard';
```

### Custom Hooks for Reusability

```typescript
// Custom hook for contact management
export function useContacts(tenantId: string) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch contacts with React Query
  const {
    data,
    isLoading,
    error: fetchError,
    refetch
  } = useQuery({
    queryKey: ['contacts', tenantId],
    queryFn: () => contactService.getContacts(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Mutation for creating contacts
  const createContactMutation = useMutation({
    mutationFn: contactService.createContact,
    onSuccess: (newContact) => {
      // Optimistically update cache
      queryClient.setQueryData(['contacts', tenantId], (old: Contact[] = []) => [
        ...old,
        newContact
      ]);
      
      // Show success notification
      toast.success('Contact created successfully');
    },
    onError: (error) => {
      console.error('Failed to create contact:', error);
      toast.error('Failed to create contact');
    }
  });
  
  // Mutation for updating contacts
  const updateContactMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Contact> }) =>
      contactService.updateContact(id, updates),
    onSuccess: (updatedContact) => {
      queryClient.setQueryData(['contacts', tenantId], (old: Contact[] = []) =>
        old.map(contact => 
          contact.id === updatedContact.id ? updatedContact : contact
        )
      );
      toast.success('Contact updated successfully');
    }
  });
  
  // Mutation for deleting contacts
  const deleteContactMutation = useMutation({
    mutationFn: contactService.deleteContact,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['contacts', tenantId], (old: Contact[] = []) =>
        old.filter(contact => contact.id !== deletedId)
      );
      toast.success('Contact deleted successfully');
    }
  });
  
  return {
    contacts: data ?? [],
    loading: isLoading,
    error: fetchError?.message ?? null,
    
    // Actions
    createContact: createContactMutation.mutate,
    updateContact: updateContactMutation.mutate,
    deleteContact: deleteContactMutation.mutate,
    refetchContacts: refetch,
    
    // States
    isCreating: createContactMutation.isLoading,
    isUpdating: updateContactMutation.isLoading,
    isDeleting: deleteContactMutation.isLoading
  };
}

// Usage in component
const ContactsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    contacts,
    loading,
    error,
    createContact,
    updateContact,
    deleteContact,
    isCreating
  } = useContacts(user.tenantId);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div className="contacts-page">
      <ContactForm
        onSubmit={createContact}
        isLoading={isCreating}
      />
      
      <ContactList
        contacts={contacts}
        onEdit={updateContact}
        onDelete={deleteContact}
      />
    </div>
  );
};
```

## Node.js/Express Best Practices

### Express Application Structure

```typescript
// apps/api/src/app.ts - Main application setup
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { errorHandler } from '@/middleware/error.middleware';
import { loggingMiddleware } from '@/middleware/logging.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';

import { authRoutes } from '@/routes/auth.routes';
import { contactRoutes } from '@/routes/contacts.routes';
import { healthRoutes } from '@/routes/health.routes';

export function createApp(): express.Application {
  const app = express();
  
  // Security middleware
  app.use(helmet({
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
      preload: true
    }
  }));
  
  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
  }));
  
  // Rate limiting
  app.use(rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100'),
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }));
  
  // Body parsing
  app.use(express.json({ 
    limit: '10mb',
    type: 'application/json'
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));
  
  // Logging
  app.use(loggingMiddleware);
  
  // Health check (no auth required)
  app.use('/health', healthRoutes);
  
  // Authentication routes
  app.use('/api/auth', authRoutes);
  
  // Protected routes
  app.use('/api/contacts', authMiddleware, contactRoutes);
  
  // Global error handler (must be last)
  app.use(errorHandler);
  
  return app;
}
```

### Error Handling Middleware

```typescript
// apps/api/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error values
  let statusCode = error.statusCode ?? 500;
  let message = error.message ?? 'Internal Server Error';
  let isOperational = error.isOperational ?? false;
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    isOperational = true;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
    isOperational = true;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  }
  
  // Log error
  const errorLog = {
    message: error.message,
    stack: error.stack,
    statusCode,
    isOperational,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    tenantId: req.user?.tenantId,
    timestamp: new Date().toISOString()
  };
  
  if (statusCode >= 500) {
    logger.error('Server error', errorLog);
  } else {
    logger.warn('Client error', errorLog);
  }
  
  // Send error response
  const errorResponse: any = {
    success: false,
    error: message,
    statusCode
  };
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### Input Validation with Joi

```typescript
// apps/api/src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    req.body = value;
    next();
  };
};

// Validation schemas
export const contactSchemas = {
  create: Joi.object({
    firstName: Joi.string().trim().min(1).max(255).required(),
    lastName: Joi.string().trim().min(1).max(255).required(),
    email: Joi.array().items(
      Joi.string().email().required()
    ).min(1).required(),
    phone: Joi.array().items(
      Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional()
    ).optional(),
    company: Joi.string().trim().max(255).optional().allow(''),
    title: Joi.string().trim().max(255).optional().allow(''),
    tags: Joi.array().items(
      Joi.string().trim().max(50)
    ).max(10).optional(),
    customFields: Joi.object().pattern(
      Joi.string(),
      Joi.alternatives().try(
        Joi.string(),
        Joi.number(),
        Joi.boolean(),
        Joi.date()
      )
    ).optional()
  }),
  
  update: Joi.object({
    firstName: Joi.string().trim().min(1).max(255).optional(),
    lastName: Joi.string().trim().min(1).max(255).optional(),
    email: Joi.array().items(
      Joi.string().email().required()
    ).min(1).optional(),
    phone: Joi.array().items(
      Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional()
    ).optional(),
    company: Joi.string().trim().max(255).optional().allow(''),
    title: Joi.string().trim().max(255).optional().allow(''),
    tags: Joi.array().items(
      Joi.string().trim().max(50)
    ).max(10).optional(),
    customFields: Joi.object().pattern(
      Joi.string(),
      Joi.alternatives().try(
        Joi.string(),
        Joi.number(),
        Joi.boolean(),
        Joi.date()
      )
    ).optional()
  }).min(1)
};
```

## Security Best Practices (OWASP Top 10)

### 1. Injection Prevention

```typescript
// Good: Parameterized queries prevent SQL injection
export class ContactRepository {
  async findByEmail(email: string, tenantId: string): Promise<Contact | null> {
    // Use parameterized query - prevents SQL injection
    const query = `
      SELECT * FROM contacts 
      WHERE tenant_id = $1 
        AND $2 = ANY(
          SELECT unnest(
            ARRAY(
              SELECT pgp_sym_decrypt(email_encrypted, current_setting('app.encryption_key'))
              FROM unnest(email_encrypted) AS email_encrypted
            )
          )
        )
        AND is_deleted = false
    `;
    
    const result = await this.database.query(query, [tenantId, email]);
    return result.rows[0] ?? null;
  }
  
  // Bad: String concatenation vulnerable to injection
  async findByEmailUnsafe(email: string): Promise<Contact | null> {
    const query = `SELECT * FROM contacts WHERE email = '${email}'`; // NEVER DO THIS
    const result = await this.database.query(query);
    return result.rows[0] ?? null;
  }
}
```

### 2. Authentication and Session Management

```typescript
// JWT implementation with secure practices
export class AuthService {
  private readonly jwtSecret: string;
  private readonly refreshSecret: string;
  
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET!;
    
    if (this.jwtSecret.length < 32 || this.refreshSecret.length < 32) {
      throw new Error('JWT secrets must be at least 32 characters long');
    }
  }
  
  async login(email: string, password: string): Promise<AuthResult> {
    // Rate limiting check
    await this.checkRateLimit(email);
    
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      await this.recordFailedAttempt(email);
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedError(`Account locked for ${remainingTime} minutes`);
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      await this.recordFailedAttempt(email);
      
      // Lock account after max attempts
      if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS - 1) {
        await this.lockAccount(user.id);
      }
      
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Clear failed attempts on successful login
    await this.clearFailedAttempts(user.id);
    
    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    // Store refresh token (hashed)
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.storeRefreshToken(user.id, refreshTokenHash);
    
    // Update last login
    await this.userRepository.updateLastLogin(user.id);
    
    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user)
    };
  }
  
  private generateAccessToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role
      },
      this.jwtSecret,
      {
        expiresIn: '15m',
        issuer: 'ConnectKit',
        audience: 'ConnectKit-API'
      }
    );
  }
  
  private generateRefreshToken(user: User): string {
    return jwt.sign(
      { userId: user.id },
      this.refreshSecret,
      {
        expiresIn: '7d',
        issuer: 'ConnectKit',
        audience: 'ConnectKit-Refresh'
      }
    );
  }
}
```

### 3. Data Encryption

```typescript
// Field-level encryption service
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  
  constructor(private readonly encryptionKey: string) {
    if (Buffer.from(encryptionKey, 'hex').length !== this.keyLength) {
      throw new Error('Encryption key must be 32 bytes (64 hex characters)');
    }
  }
  
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, Buffer.from(this.encryptionKey, 'hex'));
    cipher.setAAD(Buffer.from('ConnectKit-PII'));
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine IV, tag, and encrypted data
    return iv.toString('hex') + tag.toString('hex') + encrypted;
  }
  
  decrypt(encryptedData: string): string {
    const iv = Buffer.from(encryptedData.substr(0, this.ivLength * 2), 'hex');
    const tag = Buffer.from(encryptedData.substr(this.ivLength * 2, this.tagLength * 2), 'hex');
    const encrypted = encryptedData.substr((this.ivLength + this.tagLength) * 2);
    
    const decipher = crypto.createDecipher(this.algorithm, Buffer.from(this.encryptionKey, 'hex'));
    decipher.setAAD(Buffer.from('ConnectKit-PII'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Encrypt array of values
  encryptArray(values: string[]): string[] {
    return values.map(value => this.encrypt(value));
  }
  
  // Decrypt array of values
  decryptArray(encryptedValues: string[]): string[] {
    return encryptedValues.map(encrypted => this.decrypt(encrypted));
  }
}
```

### 4. Access Control and Authorization

```typescript
// Role-based access control middleware
interface UserPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAudit: boolean;
  canManageUsers: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    canViewAudit: true,
    canManageUsers: true
  },
  manager: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    canViewAudit: true,
    canManageUsers: false
  },
  user: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    canViewAudit: false,
    canManageUsers: false
  },
  readonly: {
    canCreate: false,
    canRead: true,
    canUpdate: false,
    canDelete: false,
    canViewAudit: false,
    canManageUsers: false
  }
};

export const requirePermission = (permission: keyof UserPermissions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userPermissions = ROLE_PERMISSIONS[req.user.role];
    
    if (!userPermissions[permission]) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

// Usage in routes
app.get('/api/contacts', 
  authMiddleware, 
  requirePermission('canRead'), 
  contactController.getContacts
);

app.delete('/api/contacts/:id', 
  authMiddleware, 
  requirePermission('canDelete'), 
  contactController.deleteContact
);
```

## Database Best Practices

### Connection Pooling
```typescript
// Database connection management
export class DatabaseManager {
  private pool: Pool;
  private readonly maxConnections: number;
  private readonly idleTimeoutMs: number;
  
  constructor() {
    this.maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS ?? '20');
    this.idleTimeoutMs = parseInt(process.env.DB_IDLE_TIMEOUT ?? '30000');
    
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      
      // Connection pool settings
      max: this.maxConnections,
      min: 2,
      idleTimeoutMillis: this.idleTimeoutMs,
      connectionTimeoutMillis: 5000,
      acquireTimeoutMillis: 60000,
      
      // Application name for monitoring
      application_name: 'ConnectKit-API'
    });
    
    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('Database pool error', { error: err.message, stack: err.stack });
    });
    
    // Monitor pool metrics
    this.setupPoolMonitoring();
  }
  
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    
    try {
      // Set session variables for RLS
      if (params && params.length > 0) {
        const tenantId = this.extractTenantId(params);
        const userId = this.extractUserId(params);
        
        if (tenantId) {
          await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant_id', tenantId]);
        }
        if (userId) {
          await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId]);
        }
      }
      
      const result = await client.query<T>(text, params);
      return result;
      
    } finally {
      client.release();
    }
  }
  
  private setupPoolMonitoring(): void {
    setInterval(() => {
      const totalCount = this.pool.totalCount;
      const idleCount = this.pool.idleCount;
      const waitingCount = this.pool.waitingCount;
      
      logger.info('Database pool metrics', {
        totalConnections: totalCount,
        idleConnections: idleCount,
        waitingClients: waitingCount,
        activeConnections: totalCount - idleCount
      });
      
      // Alert if pool is running low
      if (waitingCount > 0) {
        logger.warn('Database pool under pressure', { waitingCount });
      }
    }, 30000); // Log every 30 seconds
  }
}
```

### Query Optimization
```typescript
// Optimized contact search with proper indexing
export class ContactRepository {
  async searchContacts(params: ContactSearchParams): Promise<SearchResult<Contact>> {
    const { 
      query, 
      tags, 
      company, 
      dateRange, 
      pagination,
      tenantId 
    } = params;
    
    let whereConditions: string[] = ['c.tenant_id = $1', 'c.is_deleted = false'];
    let queryParams: any[] = [tenantId];
    let paramIndex = 2;
    
    // Full-text search using search_vector index
    if (query) {
      whereConditions.push(`c.search_vector @@ plainto_tsquery('english', $${paramIndex})`);
      queryParams.push(query);
      paramIndex++;
    }
    
    // Tag filtering using GIN index
    if (tags && tags.length > 0) {
      whereConditions.push(`c.tags && $${paramIndex}`);
      queryParams.push(tags);
      paramIndex++;
    }
    
    // Company filtering
    if (company) {
      whereConditions.push(`LOWER(c.company) LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${company}%`);
      paramIndex++;
    }
    
    // Date range filtering
    if (dateRange) {
      whereConditions.push(`c.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      queryParams.push(dateRange.from, dateRange.to);
      paramIndex += 2;
    }
    
    const whereClause = whereConditions.join(' AND ');
    const offset = (pagination.page - 1) * pagination.limit;
    
    // Main query with ranking for relevance
    const searchQuery = `
      SELECT 
        c.*,
        ${query ? `ts_rank(c.search_vector, plainto_tsquery('english', $2)) as rank` : '0 as rank'}
      FROM contacts c
      WHERE ${whereClause}
      ORDER BY ${query ? 'rank DESC,' : ''} c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM contacts c
      WHERE ${whereClause}
    `;
    
    queryParams.push(pagination.limit, offset);
    
    // Execute both queries in parallel
    const [searchResult, countResult] = await Promise.all([
      this.database.query(searchQuery, queryParams.slice(0, -2).concat([pagination.limit, offset])),
      this.database.query(countQuery, queryParams.slice(0, -2))
    ]);
    
    const contacts = searchResult.rows.map(row => this.mapRowToContact(row));
    const total = parseInt(countResult.rows[0].total);
    
    return {
      data: contacts,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };
  }
}
```

## API Design Best Practices

### RESTful API Design

```typescript
// Consistent API response format
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    version: string;
  };
}

// Contact controller with proper REST endpoints
export class ContactController {
  constructor(
    private contactService: ContactService,
    private logger: Logger
  ) {}
  
  // GET /api/contacts - List contacts with filtering and pagination
  getContacts = asyncHandler(async (req: Request, res: Response) => {
    const searchParams: ContactSearchParams = {
      query: req.query.q as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      company: req.query.company as string,
      dateRange: this.parseDateRange(req.query),
      pagination: {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 20, 100) // Max 100
      },
      tenantId: req.user!.tenantId
    };
    
    const result = await this.contactService.searchContacts(searchParams);
    
    const response: ApiResponse<Contact[]> = {
      success: true,
      data: result.data,
      meta: {
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
    
    res.json(response);
  });
  
  // GET /api/contacts/:id - Get single contact
  getContactById = asyncHandler(async (req: Request, res: Response) => {
    const contact = await this.contactService.findById(req.params.id, req.user!.tenantId);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      data: contact,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    });
  });
  
  // POST /api/contacts - Create new contact
  createContact = asyncHandler(async (req: Request, res: Response) => {
    const contactData: CreateContactRequest = {
      ...req.body,
      tenantId: req.user!.tenantId,
      createdBy: req.user!.id
    };
    
    const contact = await this.contactService.createContact(contactData);
    
    res.status(201).json({
      success: true,
      data: contact,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    });
  });
  
  // PUT /api/contacts/:id - Full update
  updateContact = asyncHandler(async (req: Request, res: Response) => {
    const updates: UpdateContactRequest = {
      ...req.body,
      lastModifiedBy: req.user!.id
    };
    
    const contact = await this.contactService.updateContact(
      req.params.id, 
      updates, 
      req.user!.tenantId
    );
    
    res.json({
      success: true,
      data: contact,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    });
  });
  
  // PATCH /api/contacts/:id - Partial update
  patchContact = asyncHandler(async (req: Request, res: Response) => {
    const updates: Partial<UpdateContactRequest> = {
      ...req.body,
      lastModifiedBy: req.user!.id
    };
    
    const contact = await this.contactService.patchContact(
      req.params.id, 
      updates, 
      req.user!.tenantId
    );
    
    res.json({
      success: true,
      data: contact,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    });
  });
  
  // DELETE /api/contacts/:id - Soft delete
  deleteContact = asyncHandler(async (req: Request, res: Response) => {
    await this.contactService.deleteContact(req.params.id, req.user!.tenantId);
    
    res.status(204).send();
  });
}
```

### API Versioning Strategy

```typescript
// Version-aware routing
export class ApiRouter {
  private readonly v1Router = express.Router();
  private readonly v2Router = express.Router();
  
  constructor() {
    this.setupV1Routes();
    this.setupV2Routes();
  }
  
  private setupV1Routes(): void {
    // V1 Contact routes
    this.v1Router.use('/contacts', contactRoutesV1);
    this.v1Router.use('/auth', authRoutesV1);
  }
  
  private setupV2Routes(): void {
    // V2 routes with breaking changes
    this.v2Router.use('/contacts', contactRoutesV2);
    this.v2Router.use('/auth', authRoutesV2);
  }
  
  public getRouter(): express.Router {
    const router = express.Router();
    
    // Version detection middleware
    router.use((req, res, next) => {
      const version = req.headers['api-version'] as string || 
                     req.query.version as string || 
                     'v1';
      
      req.apiVersion = version;
      next();
    });
    
    // Route to appropriate version
    router.use('/v1', this.v1Router);
    router.use('/v2', this.v2Router);
    
    // Default to v1 for backward compatibility
    router.use((req, res, next) => {
      if (req.apiVersion === 'v1') {
        this.v1Router(req, res, next);
      } else if (req.apiVersion === 'v2') {
        this.v2Router(req, res, next);
      } else {
        res.status(400).json({
          success: false,
          error: `Unsupported API version: ${req.apiVersion}`,
          supportedVersions: ['v1', 'v2']
        });
      }
    });
    
    return router;
  }
}
```

## Git Commit Message Conventions

### Conventional Commits Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- **feat**: New feature for the user
- **fix**: Bug fix for the user
- **docs**: Documentation changes
- **style**: Formatting, missing semi-colons, etc.
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to build process or auxiliary tools
- **perf**: Performance improvements
- **ci**: Changes to CI configuration files and scripts
- **build**: Changes that affect the build system or external dependencies

### Examples

```bash
# Feature commits
feat(auth): implement JWT refresh token rotation
feat(contacts): add bulk import functionality with CSV validation
feat(api): add rate limiting middleware with Redis backend

# Bug fix commits
fix(contacts): resolve duplicate email validation issue
fix(auth): handle expired token gracefully in middleware
fix(database): fix connection pool memory leak

# Documentation commits
docs(api): update OpenAPI specification for contact endpoints
docs(readme): add development setup instructions
docs(security): document encryption key rotation process

# Refactoring commits
refactor(contacts): extract validation logic into separate service
refactor(database): simplify query builder implementation
refactor(auth): migrate from callback to async/await pattern

# Test commits
test(contacts): add unit tests for contact service methods
test(integration): add API endpoint integration tests
test(e2e): add contact CRUD workflow tests

# Performance commits
perf(search): optimize contact search query with proper indexing
perf(api): implement response caching for read operations
```

### Breaking Changes

```bash
feat(api)!: change contact API response format

BREAKING CHANGE: Contact API now returns email as array instead of string.

Before:
{
  "email": "user@example.com"
}

After:
{
  "email": ["user@example.com"]
}
```

## Code Review Checklist

### Pre-Review Checklist (Author)

- [ ] **Tests Written First**: All new code follows TDD approach
- [ ] **Test Coverage**: Minimum 80% coverage for new code
- [ ] **Lint Passing**: ESLint and Prettier checks pass
- [ ] **Type Safety**: TypeScript strict mode compliance
- [ ] **Security**: No sensitive data in logs or responses
- [ ] **Performance**: No N+1 queries or unnecessary computations
- [ ] **Documentation**: Code comments for complex logic
- [ ] **Git History**: Clean commit messages following conventions

### Review Criteria (Reviewer)

#### Functional Requirements
- [ ] **Requirements Met**: Code addresses stated requirements
- [ ] **Edge Cases**: Error conditions and edge cases handled
- [ ] **User Experience**: Changes improve or maintain UX
- [ ] **API Contract**: Backward compatibility maintained

#### Code Quality
- [ ] **SOLID Principles**: Code follows SOLID design principles
- [ ] **Clean Code**: Functions are small and single-purpose
- [ ] **Naming**: Variables and functions have descriptive names
- [ ] **Comments**: Complex logic is well-documented
- [ ] **Duplication**: No significant code duplication

#### Security
- [ ] **Input Validation**: All inputs properly validated
- [ ] **SQL Injection**: Parameterized queries used
- [ ] **XSS Prevention**: Output properly escaped
- [ ] **Authentication**: Proper access controls in place
- [ ] **Sensitive Data**: No credentials or PII in logs

#### Performance
- [ ] **Database**: Efficient queries with proper indexes
- [ ] **Caching**: Appropriate caching strategies used
- [ ] **Memory**: No memory leaks or excessive usage
- [ ] **Network**: Minimal API calls and data transfer

#### Testing
- [ ] **Unit Tests**: Comprehensive unit test coverage
- [ ] **Integration Tests**: API endpoints tested end-to-end
- [ ] **Test Quality**: Tests are readable and maintainable
- [ ] **Mock Strategy**: External dependencies properly mocked

### Review Comments Template

```markdown
## Summary
Brief overview of changes and impact.

## Strengths
- What was done well
- Good patterns followed
- Security considerations addressed

## Areas for Improvement
- Specific issues with code examples
- Suggestions for better approaches
- Performance or security concerns

## Questions
- Clarifications needed
- Alternative approaches to consider

## Action Items
- [ ] Must-fix issues before merge
- [ ] Nice-to-have improvements for future
- [ ] Documentation updates needed
```

This comprehensive best practices guide establishes the foundation for high-quality ConnectKit development. All team members must follow these practices to ensure consistency, security, and maintainability throughout the project lifecycle.