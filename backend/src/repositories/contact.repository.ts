import {
  BaseRepository,
  QueryOptions,
  PaginationResult,
} from './base.repository';
import {
  Contact,
  CreateContactDTO,
  ContactStatus,
} from '../models/contact.model';
import { ConflictError, NotFoundError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface ContactFilters {
  status?: ContactStatus;
  isFavorite?: boolean;
  company?: string;
  tags?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  city?: string;
  state?: string;
  country?: string;
}

export interface ContactSearchOptions extends QueryOptions {
  filters?: ContactFilters;
}

export class ContactRepository extends BaseRepository<Contact> {
  constructor() {
    super('contacts', 'id');
  }

  protected getAllowedSortFields(): string[] {
    return [
      'id',
      'first_name',
      'last_name',
      'email',
      'phone',
      'company',
      'job_title',
      'city',
      'state',
      'country',
      'status',
      'is_favorite',
      'created_at',
      'updated_at',
    ];
  }

  protected mapRowToEntity(row: any): Contact {
    const contactData: CreateContactDTO = {
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      jobTitle: row.job_title,
      addressLine1: row.address_line1,
      addressLine2: row.address_line2,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
      notes: row.notes,
      tags: row.tags || [],
      status: row.status as ContactStatus,
      isFavorite: row.is_favorite,
    };

    const contact = new Contact(contactData);

    // Override properties with database values
    contact.id = row.id;
    contact.metadata = row.metadata || {};
    contact.createdAt = new Date(row.created_at);
    contact.updatedAt = new Date(row.updated_at);
    contact.deletedAt = row.deleted_at ? new Date(row.deleted_at) : null;

    return contact;
  }

  protected mapEntityToRow(entity: Contact | Partial<Contact>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.userId !== undefined) row.user_id = entity.userId;
    if (entity.firstName !== undefined) row.first_name = entity.firstName;
    if (entity.lastName !== undefined) row.last_name = entity.lastName;
    if (entity.email !== undefined) row.email = entity.email;
    if (entity.phone !== undefined) row.phone = entity.phone;
    if (entity.company !== undefined) row.company = entity.company;
    if (entity.jobTitle !== undefined) row.job_title = entity.jobTitle;
    if (entity.addressLine1 !== undefined)
      row.address_line1 = entity.addressLine1;
    if (entity.addressLine2 !== undefined)
      row.address_line2 = entity.addressLine2;
    if (entity.city !== undefined) row.city = entity.city;
    if (entity.state !== undefined) row.state = entity.state;
    if (entity.postalCode !== undefined) row.postal_code = entity.postalCode;
    if (entity.country !== undefined) row.country = entity.country;
    if (entity.notes !== undefined) row.notes = entity.notes;
    if (entity.tags !== undefined) row.tags = entity.tags;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.isFavorite !== undefined) row.is_favorite = entity.isFavorite;
    if (entity.metadata !== undefined)
      row.metadata = JSON.stringify(entity.metadata);
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.deletedAt !== undefined) row.deleted_at = entity.deletedAt;

    return row;
  }

  /**
   * Create a new contact
   */
  async createContact(contactData: CreateContactDTO): Promise<Contact> {
    // Check for duplicate email within the same user
    if (contactData.email) {
      const existingContact = await this.findByUserAndEmail(
        contactData.userId,
        contactData.email
      );
      if (existingContact) {
        throw new ConflictError(
          `Contact with email ${contactData.email} already exists for this user`
        );
      }
    }

    const contact = new Contact(contactData);
    const createdContact = await this.create(contact);

    logger.info('Contact created', {
      contactId: createdContact.id,
      userId: createdContact.userId,
      name: createdContact.getFullName(),
      email: createdContact.email,
    });

    return createdContact;
  }

  /**
   * Find contacts by user ID
   */
  async findByUserId(
    userId: string,
    options: ContactSearchOptions = {}
  ): Promise<PaginationResult<Contact>> {
    return await this.findAll({
      ...options,
      filters: { ...options.filters, user_id: userId },
    });
  }

  /**
   * Find contact by user ID and contact ID
   */
  async findByUserAndId(
    userId: string,
    contactId: string
  ): Promise<Contact | null> {
    return await this.findOne({ user_id: userId, id: contactId });
  }

  /**
   * Find contact by user ID and email
   */
  async findByUserAndEmail(
    userId: string,
    email: string
  ): Promise<Contact | null> {
    return await this.findOne({ user_id: userId, email: email.toLowerCase() });
  }

  /**
   * Find contact by user ID and phone
   */
  async findByUserAndPhone(
    userId: string,
    phone: string
  ): Promise<Contact | null> {
    return await this.findOne({ user_id: userId, phone });
  }

  /**
   * Verify contact ownership
   */
  async verifyOwnership(contactId: string, userId: string): Promise<Contact> {
    const contact = await this.findById(contactId);

    if (!contact) {
      throw new NotFoundError(`Contact with id ${contactId} not found`);
    }

    if (contact.userId !== userId) {
      throw new ForbiddenError('Access denied to this contact');
    }

    return contact;
  }

  /**
   * Update contact with ownership check
   */
  async updateByUser(
    contactId: string,
    userId: string,
    updates: Partial<Contact>
  ): Promise<Contact> {
    await this.verifyOwnership(contactId, userId);

    // Check for email conflicts if updating email
    if (updates.email) {
      const existingContact = await this.findByUserAndEmail(
        userId,
        updates.email
      );
      if (existingContact && existingContact.id !== contactId) {
        throw new ConflictError(
          `Contact with email ${updates.email} already exists for this user`
        );
      }
    }

    const updatedContact = await this.update(contactId, updates);

    logger.info('Contact updated', {
      contactId,
      userId,
      name: updatedContact.getFullName(),
    });

    return updatedContact;
  }

  /**
   * Soft delete contact with ownership check
   */
  async deleteByUser(contactId: string, userId: string): Promise<void> {
    await this.verifyOwnership(contactId, userId);
    await this.softDelete(contactId);

    logger.info('Contact deleted', {
      contactId,
      userId,
    });
  }

  /**
   * Get favorite contacts for a user
   */
  async findFavoritesByUser(
    userId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Contact>> {
    return await this.findAll({
      ...options,
      filters: { ...options.filters, user_id: userId, is_favorite: true },
    });
  }

  /**
   * Get contacts by status for a user
   */
  async findByUserAndStatus(
    userId: string,
    status: ContactStatus,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Contact>> {
    return await this.findAll({
      ...options,
      filters: { ...options.filters, user_id: userId, status },
    });
  }

  /**
   * Get contacts by company for a user
   */
  async findByUserAndCompany(
    userId: string,
    company: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Contact>> {
    return await this.findAll({
      ...options,
      filters: { ...options.filters, user_id: userId, company },
    });
  }

  /**
   * Get contacts by tags for a user
   */
  async findByUserAndTags(
    userId: string,
    tags: string[],
    options: QueryOptions = {}
  ): Promise<PaginationResult<Contact>> {
    const { limit = 10, offset = 0, sort, order = 'DESC' } = options;

    // Build query to find contacts that have any of the specified tags
    const placeholders = tags.map((_, index) => `$${index + 2}`).join(', ');
    const orderByClause = this.buildOrderByClause(sort, order);

    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1 
        AND deleted_at IS NULL
        AND tags && ARRAY[${placeholders}]
      ${orderByClause}
      LIMIT $${tags.length + 2} OFFSET $${tags.length + 3}
    `;

    const countQuery = `
      SELECT COUNT(*) FROM ${this.tableName}
      WHERE user_id = $1 
        AND deleted_at IS NULL
        AND tags && ARRAY[${placeholders}]
    `;

    const params = [userId, ...tags];

    // Execute queries
    const [dataResult, countResult] = await Promise.all([
      this.executeQuery(query, [...params, limit, offset]),
      this.executeQuery(countQuery, params),
    ]);

    const items = dataResult.rows.map((row: any) => this.mapRowToEntity(row));
    const total = parseInt(countResult.rows[0].count, 10);

    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Search contacts for a user
   */
  async searchByUser(
    userId: string,
    searchTerm: string,
    options: ContactSearchOptions = {}
  ): Promise<PaginationResult<Contact>> {
    const searchFields = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'company',
      'job_title',
      'notes',
    ];
    return await this.search(searchTerm, searchFields, {
      ...options,
      filters: { ...options.filters, user_id: userId },
    });
  }

  /**
   * Get all unique companies for a user
   */
  async getCompaniesByUser(userId: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT company
      FROM ${this.tableName}
      WHERE user_id = $1 
        AND company IS NOT NULL 
        AND company != ''
        AND deleted_at IS NULL
      ORDER BY company
    `;

    const result = await this.executeQuery(query, [userId]);
    return result.rows.map((row: any) => row.company);
  }

  /**
   * Get all unique tags for a user
   */
  async getTagsByUser(userId: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT unnest(tags) as tag
      FROM ${this.tableName}
      WHERE user_id = $1 
        AND tags IS NOT NULL 
        AND array_length(tags, 1) > 0
        AND deleted_at IS NULL
      ORDER BY tag
    `;

    const result = await this.executeQuery(query, [userId]);
    return result.rows.map((row: any) => row.tag);
  }

  /**
   * Get contact statistics for a user
   */
  async getContactStatsByUser(userId: string): Promise<{
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
  }> {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
        COUNT(*) FILTER (WHERE status = 'archived') as archived,
        COUNT(*) FILTER (WHERE is_favorite = true) as favorites,
        COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '') as with_email,
        COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone != '') as with_phone,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recently_added
      FROM ${this.tableName}
      WHERE user_id = $1 AND deleted_at IS NULL
    `;

    const companiesQuery = `
      SELECT company, COUNT(*) as count
      FROM ${this.tableName}
      WHERE user_id = $1 
        AND company IS NOT NULL 
        AND company != ''
        AND deleted_at IS NULL
      GROUP BY company
      ORDER BY count DESC
      LIMIT 5
    `;

    const tagsQuery = `
      SELECT tag, COUNT(*) as count
      FROM (
        SELECT unnest(tags) as tag
        FROM ${this.tableName}
        WHERE user_id = $1 
          AND tags IS NOT NULL 
          AND array_length(tags, 1) > 0
          AND deleted_at IS NULL
      ) t
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 10
    `;

    const [statsResult, companiesResult, tagsResult] = await Promise.all([
      this.executeQuery(statsQuery, [userId]),
      this.executeQuery(companiesQuery, [userId]),
      this.executeQuery(tagsQuery, [userId]),
    ]);

    const stats = statsResult.rows[0];

    return {
      total: parseInt(stats.total, 10),
      active: parseInt(stats.active, 10),
      inactive: parseInt(stats.inactive, 10),
      archived: parseInt(stats.archived, 10),
      favorites: parseInt(stats.favorites, 10),
      withEmail: parseInt(stats.with_email, 10),
      withPhone: parseInt(stats.with_phone, 10),
      byStatus: {
        [ContactStatus.ACTIVE]: parseInt(stats.active, 10),
        [ContactStatus.INACTIVE]: parseInt(stats.inactive, 10),
        [ContactStatus.ARCHIVED]: parseInt(stats.archived, 10),
      },
      recentlyAdded: parseInt(stats.recently_added, 10),
      topCompanies: companiesResult.rows.map((row: any) => ({
        company: row.company,
        count: parseInt(row.count, 10),
      })),
      topTags: tagsResult.rows.map((row: any) => ({
        tag: row.tag,
        count: parseInt(row.count, 10),
      })),
    };
  }

  /**
   * Bulk update contacts for a user
   */
  async bulkUpdateByUser(
    userId: string,
    updates: Array<{ id: string; data: Partial<Contact> }>
  ): Promise<Contact[]> {
    // Verify all contacts belong to the user
    const contactIds = updates.map(update => update.id);
    const verificationQuery = `
      SELECT id FROM ${this.tableName}
      WHERE id = ANY($1) AND user_id = $2 AND deleted_at IS NULL
    `;

    const verificationResult = await this.executeQuery(verificationQuery, [
      contactIds,
      userId,
    ]);
    const validIds = verificationResult.rows.map((row: any) => row.id);

    if (validIds.length !== contactIds.length) {
      const invalidIds = contactIds.filter(id => !validIds.includes(id));
      throw new ForbiddenError(
        `Access denied to contacts: ${invalidIds.join(', ')}`
      );
    }

    const results = await this.bulkUpdate(updates);

    logger.info('Bulk contact update', {
      userId,
      updateCount: results.length,
    });

    return results;
  }

  /**
   * Export contacts for a user
   */
  async exportByUser(
    userId: string,
    options: ContactSearchOptions = {}
  ): Promise<Contact[]> {
    // Remove pagination for export
    const exportOptions = { ...options, limit: undefined, offset: undefined };
    const result = await this.findByUserId(userId, exportOptions);
    return result.items;
  }

  /**
   * Duplicate contact detection
   */
  async findPotentialDuplicates(userId: string): Promise<
    Array<{
      contacts: Contact[];
      reason: string;
    }>
  > {
    const duplicateGroups: Array<{ contacts: Contact[]; reason: string }> = [];

    // Find duplicates by email
    const emailDuplicatesQuery = `
      SELECT email, array_agg(id) as contact_ids
      FROM ${this.tableName}
      WHERE user_id = $1 
        AND email IS NOT NULL 
        AND email != ''
        AND deleted_at IS NULL
      GROUP BY email
      HAVING COUNT(*) > 1
    `;

    const emailResult = await this.executeQuery(emailDuplicatesQuery, [userId]);

    for (const row of emailResult.rows) {
      const contacts = await Promise.all(
        row.contact_ids.map((id: string) => this.findById(id))
      );

      duplicateGroups.push({
        contacts: contacts.filter(Boolean) as Contact[],
        reason: `Duplicate email: ${row.email}`,
      });
    }

    // Find duplicates by phone
    const phoneDuplicatesQuery = `
      SELECT phone, array_agg(id) as contact_ids
      FROM ${this.tableName}
      WHERE user_id = $1 
        AND phone IS NOT NULL 
        AND phone != ''
        AND deleted_at IS NULL
      GROUP BY phone
      HAVING COUNT(*) > 1
    `;

    const phoneResult = await this.executeQuery(phoneDuplicatesQuery, [userId]);

    for (const row of phoneResult.rows) {
      const contacts = await Promise.all(
        row.contact_ids.map((id: string) => this.findById(id))
      );

      duplicateGroups.push({
        contacts: contacts.filter(Boolean) as Contact[],
        reason: `Duplicate phone: ${row.phone}`,
      });
    }

    return duplicateGroups;
  }
}
