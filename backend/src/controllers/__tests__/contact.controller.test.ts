import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ContactController, contactController } from '../contact.controller';
import { ContactService } from '../../services/contact.service';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../utils/errors';
import {
  createMockRequest,
  createMockResponse,
  createMockContactService,
} from '../../tests/utils/mocks';
import {
  createContact,
  createContacts,
  createUser,
} from '../../tests/utils/fixtures';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../services/contact.service');
jest.mock('../../utils/logger');

describe('ContactController', () => {
  let controller: ContactController;
  let mockContactService: jest.Mocked<ContactService>;
  let mockRequest: Request;
  let mockResponse: Response;

  const testUser = createUser();

  beforeEach(() => {
    jest.clearAllMocks();

    mockContactService =
      createMockContactService() as jest.Mocked<ContactService>;
    mockRequest = createMockRequest() as Request;
    mockResponse = createMockResponse() as Response;

    (
      ContactService as jest.MockedClass<typeof ContactService>
    ).mockImplementation(() => mockContactService);
    controller = new ContactController();

    // Set authenticated user
    (mockRequest as any).user = testUser;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getContactById', () => {
    it('should return contact by id successfully', async () => {
      // Arrange
      const contactId = 'contact-123';
      const mockContact = createContact(testUser.id, { id: contactId });

      mockRequest.params = { id: contactId };
      mockContactService.getContactById.mockResolvedValue(mockContact);

      // Act
      await controller.getContactById(mockRequest, mockResponse);

      // Assert
      expect(mockContactService.getContactById).toHaveBeenCalledWith(
        contactId,
        testUser.id,
        { useCache: true }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { contact: mockContact },
      });
    });

    it('should handle contact not found', async () => {
      // Arrange
      const contactId = 'non-existent-contact';
      const error = new NotFoundError('Contact not found');

      mockRequest.params = { id: contactId };
      mockContactService.getContactById.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.getContactById(mockRequest, mockResponse)
      ).rejects.toThrow(error);
    });
  });

  describe('getContacts', () => {
    it('should return paginated contacts list', async () => {
      // Arrange
      const contacts = createContacts(5, testUser.id);
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

      mockRequest.query = { page: '1', limit: '10' };
      mockContactService.getContacts.mockResolvedValue(paginationResult);

      // Act
      await controller.getContacts(mockRequest, mockResponse);

      // Assert
      expect(mockContactService.getContacts).toHaveBeenCalledWith(testUser.id, {
        page: 1,
        limit: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: paginationResult,
      });
    });

    it('should apply search filters', async () => {
      // Arrange
      const contacts = createContacts(3, testUser.id);
      const paginationResult = {
        data: contacts,
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      mockRequest.query = { search: 'john', isFavorite: 'true' };
      mockContactService.getContacts.mockResolvedValue(paginationResult);

      // Act
      await controller.getContacts(mockRequest, mockResponse);

      // Assert
      expect(mockContactService.getContacts).toHaveBeenCalledWith(testUser.id, {
        search: 'john',
        filters: { isFavorite: true },
      });
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
      const createdContact = createContact(testUser.id, {
        id: 'new-contact-123',
        ...contactData,
      });

      mockRequest.body = contactData;
      mockContactService.createContact.mockResolvedValue(createdContact);

      // Act
      await controller.createContact(mockRequest, mockResponse);

      // Assert
      expect(mockContactService.createContact).toHaveBeenCalledWith(
        testUser.id,
        contactData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Contact created successfully',
        data: { contact: createdContact },
      });
    });
  });

  describe('updateContact', () => {
    it('should update contact successfully', async () => {
      // Arrange
      const contactId = 'contact-123';
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const existingContact = createContact(testUser.id, { id: contactId });
      const updatedContact = { ...existingContact, ...updateData };

      mockRequest.params = { id: contactId };
      mockRequest.body = updateData;
      mockContactService.updateContact.mockResolvedValue(updatedContact);

      // Act
      await controller.updateContact(mockRequest, mockResponse);

      // Assert
      expect(mockContactService.updateContact).toHaveBeenCalledWith(
        contactId,
        updateData,
        testUser.id
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Contact updated successfully',
        data: { contact: updatedContact },
      });
    });
  });

  describe('deleteContact', () => {
    it('should delete contact successfully', async () => {
      // Arrange
      const contactId = 'contact-123';

      mockRequest.params = { id: contactId };
      mockContactService.deleteContact.mockResolvedValue(undefined);

      // Act
      await controller.deleteContact(mockRequest, mockResponse);

      // Assert
      expect(mockContactService.deleteContact).toHaveBeenCalledWith(
        contactId,
        testUser.id
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Contact deleted successfully',
      });
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle contact favorite status', async () => {
      // Arrange
      const contactId = 'contact-123';
      const updatedContact = createContact(testUser.id, {
        id: contactId,
        isFavorite: true,
      });

      mockRequest.params = { id: contactId };
      mockContactService.toggleFavorite.mockResolvedValue(updatedContact);

      // Act
      await controller.toggleFavorite(mockRequest, mockResponse);

      // Assert
      expect(mockContactService.toggleFavorite).toHaveBeenCalledWith(
        contactId,
        testUser.id
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Contact favorite status updated',
        data: { contact: updatedContact },
      });
    });
  });

  describe('searchContacts', () => {
    it('should search contacts successfully', async () => {
      // Arrange
      const query = 'john doe';
      const searchResults = createContacts(3, testUser.id);

      mockRequest.query = { q: query, limit: '10' };
      mockContactService.searchContacts.mockResolvedValue(searchResults);

      // Act
      await controller.searchContacts(mockRequest, mockResponse);

      // Assert
      expect(mockContactService.searchContacts).toHaveBeenCalledWith(
        testUser.id,
        query,
        { limit: 10 }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          contacts: searchResults,
          query,
          total: searchResults.length,
        },
      });
    });

    it('should require search query', async () => {
      // Arrange
      mockRequest.query = {};

      // Act & Assert
      await expect(
        controller.searchContacts(mockRequest, mockResponse)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getFavoriteContacts', () => {
    it('should return favorite contacts', async () => {
      // Arrange
      const favoriteContacts = createContacts(3, testUser.id).map(contact => ({
        ...contact,
        isFavorite: true,
      }));

      mockContactService.getFavoriteContacts.mockResolvedValue(
        favoriteContacts
      );

      // Act
      await controller.getFavoriteContacts(mockRequest, mockResponse);

      // Assert
      expect(mockContactService.getFavoriteContacts).toHaveBeenCalledWith(
        testUser.id
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          contacts: favoriteContacts,
          total: favoriteContacts.length,
        },
      });
    });
  });

  describe('getContactStats', () => {
    it('should return contact statistics', async () => {
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

      mockContactService.getContactStats.mockResolvedValue(mockStats);

      // Act
      await controller.getContactStats(mockRequest, mockResponse);

      // Assert
      expect(mockContactService.getContactStats).toHaveBeenCalledWith(
        testUser.id
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { stats: mockStats },
      });
    });
  });

  describe('bulkUpdateContacts', () => {
    it('should bulk update contacts successfully', async () => {
      // Arrange
      const contactIds = ['contact-1', 'contact-2', 'contact-3'];
      const updates = { isFavorite: true };
      const mockResult = {
        updated: 3,
        message: 'Successfully updated 3 contacts',
      };

      mockRequest.body = { contactIds, updates };
      mockContactService.bulkUpdateContacts.mockResolvedValue(mockResult);

      // Act
      await controller.bulkUpdateContacts(mockRequest, mockResponse);

      // Assert
      expect(mockContactService.bulkUpdateContacts).toHaveBeenCalledWith(
        testUser.id,
        contactIds,
        updates
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: mockResult.message,
        data: { updated: mockResult.updated },
      });
    });
  });

  describe('exportContacts', () => {
    it('should export contacts successfully', async () => {
      // Arrange
      const exportRequest = {
        format: 'json' as const,
        fields: ['firstName', 'lastName', 'email'],
      };
      const exportResult = {
        data: 'exported-data',
        filename: 'contacts.json',
        mimeType: 'application/json',
      };

      mockRequest.body = exportRequest;
      mockContactService.exportContacts.mockResolvedValue(exportResult);

      // Act
      await controller.exportContacts(mockRequest, mockResponse);

      // Assert
      expect(mockContactService.exportContacts).toHaveBeenCalledWith(
        testUser.id,
        exportRequest
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Contacts exported successfully',
        data: exportResult,
      });
    });
  });

  describe('singleton instance', () => {
    it('should export singleton instance', () => {
      expect(contactController).toBeInstanceOf(ContactController);
    });
  });
});
