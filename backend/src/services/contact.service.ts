import {
  Contact,
  CreateContactDTO,
  UpdateContactDTO,
  ContactStatus,
} from '../models/contact.model';
import {
  ContactRepository,
  ContactFilters,
  ContactSearchOptions,
} from '../repositories/contact.repository';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { redisConnection } from '../config/redis.config';
import { PaginationResult } from '../repositories/base.repository';
import { SUCCESS_MESSAGES, CACHE_KEYS } from '../utils/constants';

export interface ContactServiceOptions {
  useCache?: boolean;
}

export interface ContactListRequest {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: ContactFilters;
}

export interface ContactBulkUpdateRequest {
  contactIds: string[];
  updates: UpdateContactDTO;
}

export interface ContactExportRequest {
  format?: 'json' | 'csv' | 'excel';
  fields?: string[];
  filters?: ContactFilters;
}

export interface ContactStatsResponse {
  total: number;
  active: number;
  inactive: number;
  archived: number;
  favorites: number;
  withEmail: number;
  withPhone: number;
  byStatus: Record<ContactStatus, number>;
  recentlyAdded: number;
  topCompanies: Array<{ company: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
}

export interface ContactDuplicateGroup {
  contacts: Contact[];
  reason: string;
}

export class ContactService {
  private contactRepository: ContactRepository;
  private redis: any;
  private cacheTimeout = 300; // 5 minutes

  constructor() {
    this.contactRepository = new ContactRepository();
    this.redis = redisConnection.getClient();
  }

  /**
   * Create a new contact
   */
  async createContact(
    userId: string,
    contactData: CreateContactDTO
  ): Promise<Contact> {
    try {
      // Ensure the contact belongs to the requesting user
      contactData.userId = userId;

      const contact = await this.contactRepository.createContact(contactData);

      // Clear related caches
      await this.clearUserContactsCache(userId);

      logger.info('Contact created', {
        contactId: contact.id,
        userId,
        name: contact.getFullName(),
      });

      return contact;
    } catch (error) {
      logger.error('Error creating contact', { error, userId, contactData });
      throw error;
    }
  }

  /**
   * Get contact by ID
   */
  async getContactById(
    contactId: string,
    userId: string,
    options: ContactServiceOptions = {}
  ): Promise<Contact> {
    const { useCache = true } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = CACHE_KEYS.CONTACT(contactId);
        const cachedContact = await this.redis.get(cacheKey);

        if (cachedContact) {
          const contact = JSON.parse(cachedContact);
          // Verify ownership
          if (contact.userId !== userId) {
            throw new ForbiddenError('Access denied to this contact');
          }
          logger.debug('Contact retrieved from cache', { contactId, userId });
          return contact;
        }
      }

      // Verify ownership and get contact
      const contact = await this.contactRepository.verifyOwnership(
        contactId,
        userId
      );

      // Cache the result
      if (useCache) {
        const cacheKey = CACHE_KEYS.CONTACT(contactId);
        await this.redis.setex(
          cacheKey,
          this.cacheTimeout,
          JSON.stringify(contact.toJSON())
        );
      }

      return contact;
    } catch (error) {
      logger.error('Error retrieving contact', { error, contactId, userId });
      throw error;
    }
  }

  /**
   * List contacts for a user
   */
  async listContacts(
    userId: string,
    request: ContactListRequest
  ): Promise<PaginationResult<Contact>> {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'desc',
        search,
        filters = {},
      } = request;

      // Check cache for this specific query
      const cacheKey = CACHE_KEYS.USER_CONTACTS(userId, page, limit);
      const cachedResult = await this.redis.get(cacheKey);

      if (cachedResult && !search && Object.keys(filters).length === 0) {
        logger.debug('Contacts retrieved from cache', { userId, page, limit });
        return JSON.parse(cachedResult);
      }

      const offset = (page - 1) * limit;
      const searchOptions: ContactSearchOptions = {
        limit,
        offset,
        sort,
        order: order.toUpperCase() as 'ASC' | 'DESC',
        filters,
      };

      let result: PaginationResult<Contact>;

      if (search) {
        result = await this.contactRepository.searchByUser(
          userId,
          search,
          searchOptions
        );
      } else {
        result = await this.contactRepository.findByUserId(
          userId,
          searchOptions
        );
      }

      // Cache simple queries (no search, no filters)
      if (!search && Object.keys(filters).length === 0) {
        await this.redis.setex(
          cacheKey,
          this.cacheTimeout,
          JSON.stringify(result)
        );
      }

      return result;
    } catch (error) {
      logger.error('Error listing contacts', { error, userId, request });
      throw error;
    }
  }

  /**
   * Update contact
   */
  async updateContact(
    contactId: string,
    userId: string,
    updates: UpdateContactDTO
  ): Promise<Contact> {
    try {
      const updatedContact = await this.contactRepository.updateByUser(
        contactId,
        userId,
        updates
      );

      // Clear caches
      await this.clearContactCache(contactId);
      await this.clearUserContactsCache(userId);

      logger.info('Contact updated', {
        contactId,
        userId,
        name: updatedContact.getFullName(),
      });

      return updatedContact;
    } catch (error) {
      logger.error('Error updating contact', { error, contactId, userId });
      throw error;
    }
  }

  /**
   * Delete contact
   */
  async deleteContact(contactId: string, userId: string): Promise<void> {
    try {
      await this.contactRepository.deleteByUser(contactId, userId);

      // Clear caches
      await this.clearContactCache(contactId);
      await this.clearUserContactsCache(userId);

      logger.info('Contact deleted', { contactId, userId });
    } catch (error) {
      logger.error('Error deleting contact', { error, contactId, userId });
      throw error;
    }
  }

  /**
   * Archive contact
   */
  async archiveContact(contactId: string, userId: string): Promise<Contact> {
    try {
      const contact = await this.updateContact(contactId, userId, {
        status: ContactStatus.ARCHIVED,
      });

      logger.info('Contact archived', { contactId, userId });
      return contact;
    } catch (error) {
      logger.error('Error archiving contact', { error, contactId, userId });
      throw error;
    }
  }

  /**
   * Restore archived contact
   */
  async restoreContact(contactId: string, userId: string): Promise<Contact> {
    try {
      const contact = await this.updateContact(contactId, userId, {
        status: ContactStatus.ACTIVE,
      });

      logger.info('Contact restored', { contactId, userId });
      return contact;
    } catch (error) {
      logger.error('Error restoring contact', { error, contactId, userId });
      throw error;
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(contactId: string, userId: string): Promise<Contact> {
    try {
      const contact = await this.getContactById(contactId, userId, {
        useCache: false,
      });

      const updatedContact = await this.updateContact(contactId, userId, {
        isFavorite: !contact.isFavorite,
      });

      logger.info('Contact favorite toggled', {
        contactId,
        userId,
        isFavorite: updatedContact.isFavorite,
      });

      return updatedContact;
    } catch (error) {
      logger.error('Error toggling contact favorite', {
        error,
        contactId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Add tag to contact
   */
  async addTag(
    contactId: string,
    userId: string,
    tag: string
  ): Promise<Contact> {
    try {
      const contact = await this.getContactById(contactId, userId, {
        useCache: false,
      });

      if (contact.hasTag(tag)) {
        return contact; // Tag already exists
      }

      const updatedTags = [...contact.tags, tag];
      const updatedContact = await this.updateContact(contactId, userId, {
        tags: updatedTags,
      });

      logger.info('Tag added to contact', { contactId, userId, tag });
      return updatedContact;
    } catch (error) {
      logger.error('Error adding tag to contact', {
        error,
        contactId,
        userId,
        tag,
      });
      throw error;
    }
  }

  /**
   * Remove tag from contact
   */
  async removeTag(
    contactId: string,
    userId: string,
    tag: string
  ): Promise<Contact> {
    try {
      const contact = await this.getContactById(contactId, userId, {
        useCache: false,
      });

      if (!contact.hasTag(tag)) {
        return contact; // Tag doesn't exist
      }

      const updatedTags = contact.tags.filter(t => t !== tag);
      const updatedContact = await this.updateContact(contactId, userId, {
        tags: updatedTags,
      });

      logger.info('Tag removed from contact', { contactId, userId, tag });
      return updatedContact;
    } catch (error) {
      logger.error('Error removing tag from contact', {
        error,
        contactId,
        userId,
        tag,
      });
      throw error;
    }
  }

  /**
   * Get favorite contacts
   */
  async getFavorites(
    userId: string,
    options: ContactSearchOptions = {}
  ): Promise<PaginationResult<Contact>> {
    try {
      return await this.contactRepository.findFavoritesByUser(userId, options);
    } catch (error) {
      logger.error('Error retrieving favorite contacts', { error, userId });
      throw error;
    }
  }

  /**
   * Get contacts by status
   */
  async getContactsByStatus(
    userId: string,
    status: ContactStatus,
    options: ContactSearchOptions = {}
  ): Promise<PaginationResult<Contact>> {
    try {
      return await this.contactRepository.findByUserAndStatus(
        userId,
        status,
        options
      );
    } catch (error) {
      logger.error('Error retrieving contacts by status', {
        error,
        userId,
        status,
      });
      throw error;
    }
  }

  /**
   * Get contacts by company
   */
  async getContactsByCompany(
    userId: string,
    company: string,
    options: ContactSearchOptions = {}
  ): Promise<PaginationResult<Contact>> {
    try {
      return await this.contactRepository.findByUserAndCompany(
        userId,
        company,
        options
      );
    } catch (error) {
      logger.error('Error retrieving contacts by company', {
        error,
        userId,
        company,
      });
      throw error;
    }
  }

  /**
   * Get contacts by tags
   */
  async getContactsByTags(
    userId: string,
    tags: string[],
    options: ContactSearchOptions = {}
  ): Promise<PaginationResult<Contact>> {
    try {
      return await this.contactRepository.findByUserAndTags(
        userId,
        tags,
        options
      );
    } catch (error) {
      logger.error('Error retrieving contacts by tags', {
        error,
        userId,
        tags,
      });
      throw error;
    }
  }

  /**
   * Search contacts
   */
  async searchContacts(
    userId: string,
    searchTerm: string,
    options: ContactSearchOptions = {}
  ): Promise<PaginationResult<Contact>> {
    try {
      return await this.contactRepository.searchByUser(
        userId,
        searchTerm,
        options
      );
    } catch (error) {
      logger.error('Error searching contacts', { error, userId, searchTerm });
      throw error;
    }
  }

  /**
   * Get contact statistics
   */
  async getContactStats(userId: string): Promise<ContactStatsResponse> {
    try {
      return await this.contactRepository.getContactStatsByUser(userId);
    } catch (error) {
      logger.error('Error retrieving contact statistics', { error, userId });
      throw error;
    }
  }

  /**
   * Get unique companies
   */
  async getCompanies(userId: string): Promise<string[]> {
    try {
      return await this.contactRepository.getCompaniesByUser(userId);
    } catch (error) {
      logger.error('Error retrieving companies', { error, userId });
      throw error;
    }
  }

  /**
   * Get unique tags
   */
  async getTags(userId: string): Promise<string[]> {
    try {
      return await this.contactRepository.getTagsByUser(userId);
    } catch (error) {
      logger.error('Error retrieving tags', { error, userId });
      throw error;
    }
  }

  /**
   * Bulk update contacts
   */
  async bulkUpdateContacts(
    userId: string,
    request: ContactBulkUpdateRequest
  ): Promise<Contact[]> {
    try {
      const { contactIds, updates } = request;

      if (contactIds.length === 0) {
        throw new ValidationError('No contacts specified for update');
      }

      const bulkUpdates = contactIds.map(id => ({
        id,
        data: updates,
      }));

      const results = await this.contactRepository.bulkUpdateByUser(
        userId,
        bulkUpdates
      );

      // Clear caches
      await Promise.all([
        ...contactIds.map(id => this.clearContactCache(id)),
        this.clearUserContactsCache(userId),
      ]);

      logger.info('Bulk contact update completed', {
        userId,
        updateCount: results.length,
      });

      return results;
    } catch (error) {
      logger.error('Error in bulk contact update', { error, userId });
      throw error;
    }
  }

  /**
   * Export contacts
   */
  async exportContacts(
    userId: string,
    request: ContactExportRequest = {}
  ): Promise<any[]> {
    try {
      const { format = 'json', fields, filters = {} } = request;

      const contacts = await this.contactRepository.exportByUser(userId, {
        filters,
      });

      let exportData = contacts.map(contact => contact.toJSON());

      // Filter fields if specified
      if (fields && fields.length > 0) {
        exportData = exportData.map(contact => {
          const filteredContact: any = {};
          for (const field of fields) {
            if (contact[field] !== undefined) {
              filteredContact[field] = contact[field];
            }
          }
          return filteredContact;
        });
      }

      logger.info('Contact export completed', {
        userId,
        exportCount: exportData.length,
        format,
      });

      return exportData;
    } catch (error) {
      logger.error('Error exporting contacts', { error, userId });
      throw error;
    }
  }

  /**
   * Find potential duplicate contacts
   */
  async findDuplicates(userId: string): Promise<ContactDuplicateGroup[]> {
    try {
      return await this.contactRepository.findPotentialDuplicates(userId);
    } catch (error) {
      logger.error('Error finding duplicate contacts', { error, userId });
      throw error;
    }
  }

  /**
   * Merge duplicate contacts
   */
  async mergeDuplicates(
    userId: string,
    primaryContactId: string,
    duplicateContactIds: string[]
  ): Promise<Contact> {
    try {
      // Verify ownership of all contacts
      const allContactIds = [primaryContactId, ...duplicateContactIds];
      await Promise.all(
        allContactIds.map(id =>
          this.contactRepository.verifyOwnership(id, userId)
        )
      );

      const primaryContact = await this.getContactById(
        primaryContactId,
        userId,
        { useCache: false }
      );
      const duplicateContacts = await Promise.all(
        duplicateContactIds.map(id =>
          this.getContactById(id, userId, { useCache: false })
        )
      );

      // Merge data (combine tags, keep most complete information)
      const mergedTags = [
        ...new Set([
          ...primaryContact.tags,
          ...duplicateContacts.flatMap(contact => contact.tags),
        ]),
      ];

      // Update primary contact with merged data
      const updates: UpdateContactDTO = {
        tags: mergedTags,
        // Add any other merge logic here
      };

      // Fill in missing data from duplicates
      for (const duplicate of duplicateContacts) {
        if (!primaryContact.phone && duplicate.phone) {
          updates.phone = duplicate.phone;
        }
        if (!primaryContact.company && duplicate.company) {
          updates.company = duplicate.company;
        }
        if (!primaryContact.jobTitle && duplicate.jobTitle) {
          updates.jobTitle = duplicate.jobTitle;
        }
        // Add more fields as needed
      }

      // Update primary contact
      const mergedContact = await this.updateContact(
        primaryContactId,
        userId,
        updates
      );

      // Delete duplicate contacts
      await Promise.all(
        duplicateContactIds.map(id => this.deleteContact(id, userId))
      );

      logger.info('Contacts merged', {
        userId,
        primaryContactId,
        duplicateContactIds,
        mergedContactName: mergedContact.getFullName(),
      });

      return mergedContact;
    } catch (error) {
      logger.error('Error merging duplicate contacts', {
        error,
        userId,
        primaryContactId,
        duplicateContactIds,
      });
      throw error;
    }
  }

  /**
   * Import contacts from array
   */
  async importContacts(
    userId: string,
    contactsData: CreateContactDTO[]
  ): Promise<{
    successful: Contact[];
    failed: Array<{ data: CreateContactDTO; error: string }>;
  }> {
    try {
      const successful: Contact[] = [];
      const failed: Array<{ data: CreateContactDTO; error: string }> = [];

      for (const contactData of contactsData) {
        try {
          contactData.userId = userId; // Ensure correct ownership
          const contact = await this.createContact(userId, contactData);
          successful.push(contact);
        } catch (error) {
          failed.push({
            data: contactData,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.info('Contact import completed', {
        userId,
        totalContacts: contactsData.length,
        successful: successful.length,
        failed: failed.length,
      });

      return { successful, failed };
    } catch (error) {
      logger.error('Error importing contacts', { error, userId });
      throw error;
    }
  }

  /**
   * Clear contact cache
   */
  private async clearContactCache(contactId: string): Promise<void> {
    try {
      const cacheKey = CACHE_KEYS.CONTACT(contactId);
      await this.redis.del(cacheKey);
    } catch (error) {
      logger.warn('Failed to clear contact cache', { error, contactId });
    }
  }

  /**
   * Clear user contacts cache
   */
  private async clearUserContactsCache(userId: string): Promise<void> {
    try {
      // Clear all cached pages for this user
      const pattern = `connectkit:user:${userId}:contacts:*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.warn('Failed to clear user contacts cache', { error, userId });
    }
  }
}
