import {
  Contact,
  ContactStatus,
  CreateContactDTO,
  UpdateContactDTO,
} from '../contact.model';

describe('Contact Model', () => {
  describe('Contact Creation', () => {
    it('should create a valid contact with required fields', () => {
      const contactData: CreateContactDTO = {
        userId: 'user-123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567890',
      };

      const contact = new Contact(contactData);

      expect(contact.userId).toBe(contactData.userId);
      expect(contact.firstName).toBe(contactData.firstName);
      expect(contact.lastName).toBe(contactData.lastName);
      expect(contact.email).toBe(contactData.email);
      expect(contact.phone).toBe(contactData.phone);
      expect(contact.status).toBe(ContactStatus.ACTIVE);
      expect(contact.isFavorite).toBe(false);
      expect(contact.id).toBeDefined();
      expect(contact.createdAt).toBeInstanceOf(Date);
      expect(contact.updatedAt).toBeInstanceOf(Date);
    });

    it('should create contact with optional fields', () => {
      const contactData: CreateContactDTO = {
        userId: 'user-123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        company: 'Tech Corp',
        jobTitle: 'Software Engineer',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'USA',
        notes: 'Met at conference',
        tags: ['colleague', 'developer'],
      };

      const contact = new Contact(contactData);

      expect(contact.company).toBe(contactData.company);
      expect(contact.jobTitle).toBe(contactData.jobTitle);
      expect(contact.addressLine1).toBe(contactData.addressLine1);
      expect(contact.addressLine2).toBe(contactData.addressLine2);
      expect(contact.city).toBe(contactData.city);
      expect(contact.state).toBe(contactData.state);
      expect(contact.postalCode).toBe(contactData.postalCode);
      expect(contact.country).toBe(contactData.country);
      expect(contact.notes).toBe(contactData.notes);
      expect(contact.tags).toEqual(contactData.tags);
    });

    it('should validate email format if provided', () => {
      const invalidEmails = ['invalid', 'test@', '@example.com', 'test@.com'];

      invalidEmails.forEach(email => {
        expect(() => {
          new Contact({
            userId: 'user-123',
            firstName: 'Jane',
            lastName: 'Smith',
            email,
          });
        }).toThrow('Invalid email format');
      });
    });

    it('should allow contact without email', () => {
      const contact = new Contact({
        userId: 'user-123',
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(contact.email).toBeUndefined();
    });

    it('should validate phone format if provided', () => {
      const invalidPhones = ['abc', '++1234567890', '0123456789'];

      invalidPhones.forEach(phone => {
        expect(() => {
          new Contact({
            userId: 'user-123',
            firstName: 'Jane',
            lastName: 'Smith',
            phone,
          });
        }).toThrow('Invalid phone format');
      });
    });
  });

  describe('Contact Updates', () => {
    let contact: Contact;

    beforeEach(() => {
      contact = new Contact({
        userId: 'user-123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      });
    });

    it('should update contact fields', async () => {
      const updateData: UpdateContactDTO = {
        firstName: 'Janet',
        lastName: 'Johnson',
        phone: '+9876543210',
        company: 'New Corp',
        isFavorite: true,
      };

      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      contact.update(updateData);

      expect(contact.firstName).toBe('Janet');
      expect(contact.lastName).toBe('Johnson');
      expect(contact.phone).toBe('+9876543210');
      expect(contact.company).toBe('New Corp');
      expect(contact.isFavorite).toBe(true);
      expect(contact.updatedAt.getTime()).toBeGreaterThan(
        contact.createdAt.getTime()
      );
    });

    it('should not update userId', () => {
      const originalUserId = contact.userId;

      contact.update({
        userId: 'new-user-id',
      } as any);

      expect(contact.userId).toBe(originalUserId);
    });

    it('should validate email on update', () => {
      expect(() => {
        contact.update({ email: 'invalid-email' });
      }).toThrow('Invalid email format');
    });

    it('should validate phone on update', () => {
      expect(() => {
        contact.update({ phone: 'invalid-phone' });
      }).toThrow('Invalid phone format');
    });
  });

  describe('Contact Status', () => {
    let contact: Contact;

    beforeEach(() => {
      contact = new Contact({
        userId: 'user-123',
        firstName: 'Jane',
        lastName: 'Smith',
      });
    });

    it('should archive contact', async () => {
      const originalCreatedAt = contact.createdAt.getTime();
      // Wait 5ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 5));
      contact.archive();

      expect(contact.status).toBe(ContactStatus.ARCHIVED);
      expect(contact.updatedAt.getTime()).toBeGreaterThan(originalCreatedAt);
    });

    it('should activate contact', () => {
      contact.status = ContactStatus.INACTIVE;
      contact.activate();

      expect(contact.status).toBe(ContactStatus.ACTIVE);
    });

    it('should deactivate contact', () => {
      contact.deactivate();

      expect(contact.status).toBe(ContactStatus.INACTIVE);
    });
  });

  describe('Contact Tags', () => {
    let contact: Contact;

    beforeEach(() => {
      contact = new Contact({
        userId: 'user-123',
        firstName: 'Jane',
        lastName: 'Smith',
        tags: ['friend', 'colleague'],
      });
    });

    it('should add new tag', () => {
      contact.addTag('family');

      expect(contact.tags).toContain('family');
      expect(contact.tags).toHaveLength(3);
    });

    it('should not add duplicate tag', () => {
      contact.addTag('friend');

      expect(contact.tags).toHaveLength(2);
    });

    it('should remove tag', () => {
      contact.removeTag('friend');

      expect(contact.tags).not.toContain('friend');
      expect(contact.tags).toHaveLength(1);
    });

    it('should handle removing non-existent tag', () => {
      contact.removeTag('non-existent');

      expect(contact.tags).toHaveLength(2);
    });

    it('should check if tag exists', () => {
      expect(contact.hasTag('friend')).toBe(true);
      expect(contact.hasTag('family')).toBe(false);
    });
  });

  describe('Contact Metadata', () => {
    let contact: Contact;

    beforeEach(() => {
      contact = new Contact({
        userId: 'user-123',
        firstName: 'Jane',
        lastName: 'Smith',
      });
    });

    it('should set metadata', () => {
      contact.setMetadata('source', 'linkedin');

      expect(contact.metadata.source).toBe('linkedin');
    });

    it('should get metadata', () => {
      contact.setMetadata('source', 'linkedin');

      expect(contact.getMetadata('source')).toBe('linkedin');
      expect(contact.getMetadata('nonexistent')).toBeUndefined();
    });

    it('should remove metadata', () => {
      contact.setMetadata('source', 'linkedin');
      contact.removeMetadata('source');

      expect(contact.metadata.source).toBeUndefined();
    });
  });

  describe('Soft Delete', () => {
    let contact: Contact;

    beforeEach(() => {
      contact = new Contact({
        userId: 'user-123',
        firstName: 'Jane',
        lastName: 'Smith',
      });
    });

    it('should soft delete contact', () => {
      contact.softDelete();

      expect(contact.deletedAt).toBeInstanceOf(Date);
      expect(contact.isDeleted()).toBe(true);
    });

    it('should restore soft deleted contact', () => {
      contact.softDelete();
      contact.restore();

      expect(contact.deletedAt).toBeNull();
      expect(contact.isDeleted()).toBe(false);
    });
  });

  describe('Contact Search', () => {
    it('should get full name', () => {
      const contact = new Contact({
        userId: 'user-123',
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(contact.getFullName()).toBe('Jane Smith');
    });

    it('should get search string', () => {
      const contact = new Contact({
        userId: 'user-123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        company: 'Tech Corp',
        notes: 'Important client',
      });

      const searchString = contact.getSearchString();

      expect(searchString).toContain('jane');
      expect(searchString).toContain('smith');
      expect(searchString).toContain('jane@example.com');
      expect(searchString).toContain('tech corp');
      expect(searchString).toContain('important client');
    });
  });

  describe('Contact Serialization', () => {
    it('should serialize contact for API response', () => {
      const contact = new Contact({
        userId: 'user-123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        tags: ['friend'],
      });

      const serialized = contact.toJSON();

      expect(serialized.id).toBe(contact.id);
      expect(serialized.firstName).toBe('Jane');
      expect(serialized.lastName).toBe('Smith');
      expect(serialized.email).toBe('jane@example.com');
      expect(serialized.tags).toEqual(['friend']);
      expect(serialized.fullName).toBe('Jane Smith');
    });
  });
});
