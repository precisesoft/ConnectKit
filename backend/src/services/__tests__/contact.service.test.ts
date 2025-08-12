import { ContactService } from '../contact.service';
import { ContactRepository } from '../../repositories/contact.repository';
import { UserRepository } from '../../repositories/user.repository';
import { Contact, ContactStatus } from '../../models/contact.model';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../../utils/errors';
import {
  createMockContactRepository,
  createMockUserRepository,
  createMockRedis,
} from '../../tests/utils/mocks';
import {
  createContact,
  createContacts,
  createFavoriteContact,
  createUser,
  createAdminUser,
} from '../../tests/utils/fixtures';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../repositories/contact.repository');
jest.mock('../../repositories/user.repository');
jest.mock('../../config/redis.config');
jest.mock('../../utils/logger');

describe('ContactService', () => {
  let contactService: ContactService;
  let mockContactRepository: jest.Mocked<ContactRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockRedis: any;

  const testUserId = 'user-123';
  const testUser = createUser({ id: testUserId });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock instances
    mockContactRepository = createMockContactRepository() as jest.Mocked<ContactRepository>;
    mockUserRepository = createMockUserRepository() as jest.Mocked<UserRepository>;
    mockRedis = createMockRedis();

    // Mock the constructor dependencies
    (ContactRepository as jest.MockedClass<typeof ContactRepository>).mockImplementation(() => mockContactRepository);
    (UserRepository as jest.MockedClass<typeof UserRepository>).mockImplementation(() => mockUserRepository);

    // Mock Redis connection
    jest.mock('../../config/redis.config', () => ({
      redisConnection: {
        getClient: () => mockRedis,
      },
    }));

    contactService = new ContactService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getContactById', () => {
    it('should return contact by id when user owns it', async () => {
      // Arrange
      const contactId = 'contact-123';
      const mockContact = createContact(testUserId, { id: contactId });
      
      mockContactRepository.findById.mockResolvedValue(mockContact);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const result = await contactService.getContactById(contactId, testUserId);

      // Assert
      expect(mockContactRepository.findById).toHaveBeenCalledWith(contactId);
      expect(result).toEqual(mockContact);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `contact:${contactId}`,
        300,
        JSON.stringify(mockContact)
      );
    });

    it('should return cached contact when available', async () => {
      // Arrange
      const contactId = 'contact-123';
      const cachedContact = createContact(testUserId, { id: contactId });
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedContact));

      // Act
      const result = await contactService.getContactById(contactId, testUserId, { useCache: true });

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith(`contact:${contactId}`);
      expect(mockContactRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(cachedContact);
    });

    it('should throw NotFoundError when contact not found', async () => {
      // Arrange
      const contactId = 'non-existent-contact';
      mockContactRepository.findById.mockResolvedValue(null);
      mockRedis.get.mockResolvedValue(null);

      // Act & Assert
      await expect(
        contactService.getContactById(contactId, testUserId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user does not own contact', async () => {
      // Arrange
      const contactId = 'contact-123';
      const otherUserId = 'other-user-456';
      const mockContact = createContact(otherUserId, { id: contactId });
      
      mockContactRepository.findById.mockResolvedValue(mockContact);
      mockRedis.get.mockResolvedValue(null);

      // Act & Assert
      await expect(
        contactService.getContactById(contactId, testUserId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow admin to access any contact', async () => {
      // Arrange
      const contactId = 'contact-123';
      const adminId = 'admin-456';
      const otherUserId = 'other-user-789';
      const mockContact = createContact(otherUserId, { id: contactId });
      const adminUser = createAdminUser({ id: adminId });
      
      mockContactRepository.findById.mockResolvedValue(mockContact);
      mockUserRepository.findById.mockResolvedValue(adminUser);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const result = await contactService.getContactById(contactId, adminId);

      // Assert
      expect(result).toEqual(mockContact);
    });
  });

  describe('getContacts', () => {
    it('should return paginated contacts for user', async () => {
      // Arrange
      const contacts = createContacts(10, testUserId);
      const paginationResult = {
        data: contacts.slice(0, 5),
        pagination: {
          page: 1,
          limit: 5,
          total: 10,
          totalPages: 2,
          hasNext: true,
          hasPrevious: false,
        },
      };

      mockContactRepository.findByUserId.mockResolvedValue(paginationResult);

      const request = {
        page: 1,
        limit: 5,
        sort: 'createdAt',
        order: 'desc' as const,
      };

      // Act
      const result = await contactService.getContacts(testUserId, request);

      // Assert
      expect(mockContactRepository.findByUserId).toHaveBeenCalledWith(testUserId, {
        pagination: { page: 1, limit: 5 },
        sorting: { sort: 'createdAt', order: 'desc' },
        filters: {},
      });
      expect(result).toEqual(paginationResult);
    });

    it('should apply search and filters', async () => {
      // Arrange
      const contacts = createContacts(5, testUserId);
      const paginationResult = {
        data: contacts,
        pagination: {
          page: 1,
          limit: 10,
          total: 5,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      mockContactRepository.findByUserId.mockResolvedValue(paginationResult);

      const request = {
        search: 'john',
        filters: {
          isFavorite: true,
        },
      };

      // Act
      const result = await contactService.getContacts(testUserId, request);

      // Assert
      expect(mockContactRepository.findByUserId).toHaveBeenCalledWith(testUserId, {
        pagination: { page: 1, limit: 10 },
        sorting: { sort: 'createdAt', order: 'desc' },
        search: 'john',
        filters: {
          isFavorite: true,
        },
      });
      expect(result).toEqual(paginationResult);
    });
  });

  describe('createContact', () => {
    it('should create contact successfully', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
      };
      
      const createdContact = createContact(testUserId, {
        id: 'new-contact-123',
        ...contactData,
      });

      mockContactRepository.findByUserIdAndEmail.mockResolvedValue(null);
      mockContactRepository.create.mockResolvedValue(createdContact);
      mockRedis.del.mockResolvedValue(1);

      // Act
      const result = await contactService.createContact(testUserId, contactData);

      // Assert
      expect(mockContactRepository.findByUserIdAndEmail).toHaveBeenCalledWith(
        testUserId,
        contactData.email
      );
      expect(mockContactRepository.create).toHaveBeenCalledWith({
        ...contactData,
        userId: testUserId,
      });
      expect(result).toEqual(createdContact);
      expect(mockRedis.del).toHaveBeenCalledWith(`user_contacts:${testUserId}`);
    });

    it('should throw ConflictError for duplicate email', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        phone: '123-456-7890',
      };
      
      const existingContact = createContact(testUserId, {
        email: contactData.email,
      });

      mockContactRepository.findByUserIdAndEmail.mockResolvedValue(existingContact);

      // Act & Assert
      await expect(
        contactService.createContact(testUserId, contactData)
      ).rejects.toThrow(ConflictError);
    });

    it('should allow creating contact without email', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '123-456-7890',
      };
      
      const createdContact = createContact(testUserId, {
        id: 'new-contact-123',
        ...contactData,
        email: null,
      });

      mockContactRepository.create.mockResolvedValue(createdContact);
      mockRedis.del.mockResolvedValue(1);

      // Act
      const result = await contactService.createContact(testUserId, contactData);

      // Assert
      expect(mockContactRepository.findByUserIdAndEmail).not.toHaveBeenCalled();
      expect(result).toEqual(createdContact);
    });
  });

  describe('updateContact', () => {
    it('should update contact successfully', async () => {
      // Arrange
      const contactId = 'contact-123';
      const existingContact = createContact(testUserId, { id: contactId });
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };
      const updatedContact = { ...existingContact, ...updateData };

      mockContactRepository.findById.mockResolvedValue(existingContact);
      mockContactRepository.update.mockResolvedValue(updatedContact);
      mockRedis.del.mockResolvedValueOnce(1); // contact cache
      mockRedis.del.mockResolvedValueOnce(1); // user contacts cache

      // Act
      const result = await contactService.updateContact(contactId, updateData, testUserId);

      // Assert
      expect(mockContactRepository.findById).toHaveBeenCalledWith(contactId);
      expect(mockContactRepository.update).toHaveBeenCalledWith(contactId, updateData);
      expect(result).toEqual(updatedContact);
      expect(mockRedis.del).toHaveBeenCalledWith(`contact:${contactId}`);
      expect(mockRedis.del).toHaveBeenCalledWith(`user_contacts:${testUserId}`);
    });

    it('should prevent updating contact user does not own', async () => {
      // Arrange
      const contactId = 'contact-123';
      const otherUserId = 'other-user-456';
      const existingContact = createContact(otherUserId, { id: contactId });
      const updateData = { firstName: 'Hacked' };

      mockContactRepository.findById.mockResolvedValue(existingContact);

      // Act & Assert
      await expect(
        contactService.updateContact(contactId, updateData, testUserId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should validate email uniqueness on update', async () => {
      // Arrange
      const contactId = 'contact-123';
      const existingContact = createContact(testUserId, { 
        id: contactId,
        email: 'current@example.com',
      });
      const updateData = {
        email: 'existing@example.com',
      };
      const conflictingContact = createContact(testUserId, {
        id: 'other-contact-456',
        email: 'existing@example.com',
      });

      mockContactRepository.findById.mockResolvedValue(existingContact);
      mockContactRepository.findByUserIdAndEmail.mockResolvedValue(conflictingContact);

      // Act & Assert
      await expect(
        contactService.updateContact(contactId, updateData, testUserId)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteContact', () => {
    it('should delete contact successfully', async () => {
      // Arrange
      const contactId = 'contact-123';
      const existingContact = createContact(testUserId, { id: contactId });

      mockContactRepository.findById.mockResolvedValue(existingContact);
      mockContactRepository.delete.mockResolvedValue(undefined);
      mockRedis.del.mockResolvedValueOnce(1); // contact cache
      mockRedis.del.mockResolvedValueOnce(1); // user contacts cache

      // Act
      await contactService.deleteContact(contactId, testUserId);

      // Assert
      expect(mockContactRepository.findById).toHaveBeenCalledWith(contactId);
      expect(mockContactRepository.delete).toHaveBeenCalledWith(contactId);
      expect(mockRedis.del).toHaveBeenCalledWith(`contact:${contactId}`);
      expect(mockRedis.del).toHaveBeenCalledWith(`user_contacts:${testUserId}`);
    });

    it('should prevent deleting contact user does not own', async () => {
      // Arrange
      const contactId = 'contact-123';
      const otherUserId = 'other-user-456';
      const existingContact = createContact(otherUserId, { id: contactId });

      mockContactRepository.findById.mockResolvedValue(existingContact);

      // Act & Assert
      await expect(
        contactService.deleteContact(contactId, testUserId)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle contact favorite status', async () => {
      // Arrange
      const contactId = 'contact-123';
      const existingContact = createContact(testUserId, { 
        id: contactId,
        isFavorite: false,
      });
      const updatedContact = { ...existingContact, isFavorite: true };

      mockContactRepository.findById.mockResolvedValue(existingContact);
      mockContactRepository.update.mockResolvedValue(updatedContact);
      mockRedis.del.mockResolvedValueOnce(1); // contact cache
      mockRedis.del.mockResolvedValueOnce(1); // user contacts cache

      // Act
      const result = await contactService.toggleFavorite(contactId, testUserId);

      // Assert
      expect(mockContactRepository.update).toHaveBeenCalledWith(contactId, {
        isFavorite: true,
      });
      expect(result).toEqual(updatedContact);
    });
  });

  describe('searchContacts', () => {
    it('should search contacts for user', async () => {
      // Arrange
      const query = 'john doe';
      const searchOptions = {
        fields: ['firstName', 'lastName', 'email'],
        limit: 10,
      };
      const searchResults = createContacts(5, testUserId);

      mockContactRepository.searchByUserId.mockResolvedValue(searchResults);

      // Act
      const result = await contactService.searchContacts(testUserId, query, searchOptions);

      // Assert
      expect(mockContactRepository.searchByUserId).toHaveBeenCalledWith(
        testUserId,
        query,
        searchOptions
      );
      expect(result).toEqual(searchResults);
    });

    it('should return empty array for empty query', async () => {
      // Act
      const result = await contactService.searchContacts(testUserId, '');

      // Assert
      expect(result).toEqual([]);
      expect(mockContactRepository.searchByUserId).not.toHaveBeenCalled();
    });
  });

  describe('getFavoriteContacts', () => {
    it('should return favorite contacts for user', async () => {
      // Arrange
      const favoriteContacts = [
        createFavoriteContact(testUserId),
        createFavoriteContact(testUserId),
      ];

      mockContactRepository.findFavoritesByUserId.mockResolvedValue(favoriteContacts);

      // Act
      const result = await contactService.getFavoriteContacts(testUserId);

      // Assert
      expect(mockContactRepository.findFavoritesByUserId).toHaveBeenCalledWith(testUserId);
      expect(result).toEqual(favoriteContacts);
    });

    it('should cache favorite contacts', async () => {
      // Arrange
      const favoriteContacts = [createFavoriteContact(testUserId)];
      mockContactRepository.findFavoritesByUserId.mockResolvedValue(favoriteContacts);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      await contactService.getFavoriteContacts(testUserId);

      // Assert
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `user_favorites:${testUserId}`,
        300,
        JSON.stringify(favoriteContacts)
      );
    });
  });

  describe('getContactStats', () => {
    it('should return contact statistics for user', async () => {
      // Arrange
      const mockStats = {
        total: 50,
        active: 45,
        inactive: 5,
        favorites: 10,
        recentlyAdded: 5,
        byCompany: {
          'Company A': 10,
          'Company B': 8,
        },
      };

      mockContactRepository.getStatsByUserId.mockResolvedValue(mockStats);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const result = await contactService.getContactStats(testUserId);

      // Assert
      expect(mockContactRepository.getStatsByUserId).toHaveBeenCalledWith(testUserId);
      expect(result).toEqual(mockStats);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `user_contact_stats:${testUserId}`,
        600,
        JSON.stringify(mockStats)
      );
    });
  });

  describe('bulkUpdateContacts', () => {
    it('should bulk update contacts successfully', async () => {
      // Arrange
      const contactIds = ['contact-1', 'contact-2', 'contact-3'];
      const updates = { isFavorite: true };
      const updatedCount = 3;

      mockContactRepository.bulkUpdateByUserId.mockResolvedValue(updatedCount);
      mockRedis.del.mockResolvedValue(1);

      // Act
      const result = await contactService.bulkUpdateContacts(testUserId, contactIds, updates);

      // Assert
      expect(mockContactRepository.bulkUpdateByUserId).toHaveBeenCalledWith(
        testUserId,
        contactIds,
        updates
      );
      expect(result).toEqual({
        updated: updatedCount,
        message: `Successfully updated ${updatedCount} contacts`,
      });
      expect(mockRedis.del).toHaveBeenCalledWith(`user_contacts:${testUserId}`);
    });
  });

  describe('bulkDeleteContacts', () => {
    it('should bulk delete contacts successfully', async () => {
      // Arrange
      const contactIds = ['contact-1', 'contact-2', 'contact-3'];
      const deletedCount = 3;

      mockContactRepository.bulkDeleteByUserId.mockResolvedValue(deletedCount);
      mockRedis.del.mockResolvedValue(1);

      // Act
      const result = await contactService.bulkDeleteContacts(testUserId, contactIds);

      // Assert
      expect(mockContactRepository.bulkDeleteByUserId).toHaveBeenCalledWith(
        testUserId,
        contactIds
      );
      expect(result).toEqual({
        deleted: deletedCount,
        message: `Successfully deleted ${deletedCount} contacts`,
      });
      expect(mockRedis.del).toHaveBeenCalledWith(`user_contacts:${testUserId}`);
    });
  });

  describe('exportContacts', () => {
    it('should export contacts in requested format', async () => {
      // Arrange
      const exportRequest = {
        format: 'json' as const,
        fields: ['firstName', 'lastName', 'email'],
        filters: { isFavorite: true },
      };
      
      const contactsToExport = createContacts(5, testUserId);
      mockContactRepository.findByUserId.mockResolvedValue({
        data: contactsToExport,
        pagination: {
          page: 1,
          limit: 100,
          total: 5,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      });

      // Act
      const result = await contactService.exportContacts(testUserId, exportRequest);

      // Assert
      expect(mockContactRepository.findByUserId).toHaveBeenCalledWith(testUserId, {
        pagination: { page: 1, limit: 10000 },
        sorting: { sort: 'createdAt', order: 'asc' },
        filters: exportRequest.filters,
      });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('mimeType');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      const contactId = 'contact-123';
      const dbError = new Error('Database connection failed');
      mockContactRepository.findById.mockRejectedValue(dbError);
      mockRedis.get.mockResolvedValue(null);

      // Act & Assert
      await expect(
        contactService.getContactById(contactId, testUserId)
      ).rejects.toThrow(dbError);
    });

    it('should handle Redis errors gracefully and still return data', async () => {
      // Arrange
      const contactId = 'contact-123';
      const mockContact = createContact(testUserId, { id: contactId });
      const redisError = new Error('Redis connection failed');
      
      mockRedis.get.mockRejectedValue(redisError);
      mockContactRepository.findById.mockResolvedValue(mockContact);
      mockRedis.setex.mockRejectedValue(redisError);

      // Act
      const result = await contactService.getContactById(contactId, testUserId);

      // Assert
      expect(result).toEqual(mockContact);
      expect(mockContactRepository.findById).toHaveBeenCalledWith(contactId);
    });
  });
});