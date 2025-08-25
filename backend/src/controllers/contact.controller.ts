import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { 
  ContactService,
  ContactListRequest,
  ContactBulkUpdateRequest,
  ContactExportRequest
} from '../services/contact.service';
import { CreateContactDTO, UpdateContactDTO, ContactStatus } from '../models/contact.model';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/error.middleware';
import { SUCCESS_MESSAGES } from '../utils/constants';

export class ContactController {
  private contactService: ContactService;

  constructor() {
    this.contactService = new ContactService();
  }

  /**
   * Create a new contact
   */
  createContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const contactData: CreateContactDTO = req.body;

    const contact = await this.contactService.createContact(currentUser.id, contactData);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.CONTACT_CREATED,
      data: { contact: contact.toJSON() },
    });
  });

  /**
   * Get contact by ID
   */
  getContactById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { id } = req.params;

    const contact = await this.contactService.getContactById(id, currentUser.id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: { contact: contact.toJSON() },
    });
  });

  /**
   * List contacts for current user
   */
  listContacts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const request: ContactListRequest = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort: req.query.sort as string,
      order: req.query.order as 'asc' | 'desc',
      search: req.query.search as string,
      filters: {
        status: req.query.status as ContactStatus,
        isFavorite: req.query.isFavorite === 'true' ? true : req.query.isFavorite === 'false' ? false : undefined,
        company: req.query.company as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        hasEmail: req.query.hasEmail === 'true' ? true : req.query.hasEmail === 'false' ? false : undefined,
        hasPhone: req.query.hasPhone === 'true' ? true : req.query.hasPhone === 'false' ? false : undefined,
        city: req.query.city as string,
        state: req.query.state as string,
        country: req.query.country as string,
      },
    };

    const result = await this.contactService.listContacts(currentUser.id, request);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  });

  /**
   * Update contact
   */
  updateContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { id } = req.params;
    const updates: UpdateContactDTO = req.body;

    const updatedContact = await this.contactService.updateContact(id, currentUser.id, updates);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.CONTACT_UPDATED,
      data: { contact: updatedContact.toJSON() },
    });
  });

  /**
   * Delete contact
   */
  deleteContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { id } = req.params;

    await this.contactService.deleteContact(id, currentUser.id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.CONTACT_DELETED,
    });
  });

  /**
   * Archive contact
   */
  archiveContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { id } = req.params;

    const contact = await this.contactService.archiveContact(id, currentUser.id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Contact archived successfully',
      data: { contact: contact.toJSON() },
    });
  });

  /**
   * Restore archived contact
   */
  restoreContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { id } = req.params;

    const contact = await this.contactService.restoreContact(id, currentUser.id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Contact restored successfully',
      data: { contact: contact.toJSON() },
    });
  });

  /**
   * Toggle favorite status
   */
  toggleFavorite = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { id } = req.params;

    const contact = await this.contactService.toggleFavorite(id, currentUser.id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Contact ${contact.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: { contact: contact.toJSON() },
    });
  });

  /**
   * Add tag to contact
   */
  addTag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { id } = req.params;
    const { tag } = req.body;

    if (!tag) {
      throw new ValidationError('Tag is required');
    }

    const contact = await this.contactService.addTag(id, currentUser.id, tag);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Tag added successfully',
      data: { contact: contact.toJSON() },
    });
  });

  /**
   * Remove tag from contact
   */
  removeTag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { id } = req.params;
    const { tag } = req.body;

    if (!tag) {
      throw new ValidationError('Tag is required');
    }

    const contact = await this.contactService.removeTag(id, currentUser.id, tag);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Tag removed successfully',
      data: { contact: contact.toJSON() },
    });
  });

  /**
   * Get favorite contacts
   */
  getFavorites = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const options = {
      limit: parseInt(req.query.limit as string) || 10,
      offset: ((parseInt(req.query.page as string) || 1) - 1) * (parseInt(req.query.limit as string) || 10),
    };

    const result = await this.contactService.getFavorites(currentUser.id, options);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get contacts by status
   */
  getContactsByStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { status } = req.params;

    if (!Object.values(ContactStatus).includes(status as ContactStatus)) {
      throw new ValidationError('Invalid status');
    }

    const options = {
      limit: parseInt(req.query.limit as string) || 10,
      offset: ((parseInt(req.query.page as string) || 1) - 1) * (parseInt(req.query.limit as string) || 10),
    };

    const result = await this.contactService.getContactsByStatus(
      currentUser.id, 
      status as ContactStatus, 
      options
    );
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  });

  /**
   * Search contacts
   */
  searchContacts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { search } = req.query;

    if (!search) {
      throw new ValidationError('Search term is required');
    }

    const options = {
      limit: parseInt(req.query.limit as string) || 10,
      offset: ((parseInt(req.query.page as string) || 1) - 1) * (parseInt(req.query.limit as string) || 10),
    };

    const result = await this.contactService.searchContacts(currentUser.id, search as string, options);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get contact statistics
   */
  getContactStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const stats = await this.contactService.getContactStats(currentUser.id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: { stats },
    });
  });

  /**
   * Get unique companies
   */
  getCompanies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const companies = await this.contactService.getCompanies(currentUser.id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: { companies },
    });
  });

  /**
   * Get unique tags
   */
  getTags = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const tags = await this.contactService.getTags(currentUser.id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: { tags },
    });
  });

  /**
   * Bulk update contacts
   */
  bulkUpdateContacts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const request: ContactBulkUpdateRequest = req.body;

    if (!request.contactIds || !Array.isArray(request.contactIds) || request.contactIds.length === 0) {
      throw new ValidationError('Contact IDs array is required');
    }

    if (!request.updates) {
      throw new ValidationError('Updates object is required');
    }

    const results = await this.contactService.bulkUpdateContacts(currentUser.id, request);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: `${results.length} contacts updated successfully`,
      data: { contacts: results.map(contact => contact.toJSON()) },
    });
  });

  /**
   * Export contacts
   */
  exportContacts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const request: ContactExportRequest = {
      format: req.query.format as 'json' | 'csv' | 'excel' || 'json',
      fields: req.query.fields ? (req.query.fields as string).split(',') : undefined,
      filters: {
        status: req.query.status as ContactStatus,
        isFavorite: req.query.isFavorite === 'true' ? true : req.query.isFavorite === 'false' ? false : undefined,
        company: req.query.company as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      },
    };

    const exportData = await this.contactService.exportContacts(currentUser.id, request);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: { contacts: exportData },
    });
  });

  /**
   * Find duplicate contacts
   */
  findDuplicates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const duplicates = await this.contactService.findDuplicates(currentUser.id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: { duplicates },
    });
  });

  /**
   * Merge duplicate contacts
   */
  mergeDuplicates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { primaryContactId, duplicateContactIds } = req.body;

    if (!primaryContactId) {
      throw new ValidationError('Primary contact ID is required');
    }

    if (!duplicateContactIds || !Array.isArray(duplicateContactIds) || duplicateContactIds.length === 0) {
      throw new ValidationError('Duplicate contact IDs array is required');
    }

    const mergedContact = await this.contactService.mergeDuplicates(
      currentUser.id,
      primaryContactId,
      duplicateContactIds
    );
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Contacts merged successfully',
      data: { contact: mergedContact.toJSON() },
    });
  });

  /**
   * Import contacts
   */
  importContacts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { contacts } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      throw new ValidationError('Contacts array is required');
    }

    const result = await this.contactService.importContacts(currentUser.id, contacts);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Import completed: ${result.successful.length} successful, ${result.failed.length} failed`,
      data: {
        successful: result.successful.map(contact => contact.toJSON()),
        failed: result.failed,
        summary: {
          total: contacts.length,
          successful: result.successful.length,
          failed: result.failed.length,
        },
      },
    });
  });
}

// Factory function for lazy instantiation
export const createContactController = (): ContactController => {
  return new ContactController();
};