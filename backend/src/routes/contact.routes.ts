import { Router } from 'express';
import { contactController } from '../controllers/contact.controller';
import { contactValidators } from '../validators/contact.validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { auditLogger } from '../middleware/logger.middleware';

const router = Router();

// All contact routes require authentication
router.use(authenticate);

/**
 * @route   POST /contacts
 * @desc    Create a new contact
 * @access  Private
 */
router.post(
  '/',
  validate(contactValidators.createContact),
  auditLogger('contact_creation'),
  contactController.createContact
);

/**
 * @route   GET /contacts
 * @desc    List contacts with pagination and filters
 * @access  Private
 */
router.get(
  '/',
  validate(contactValidators.listContacts),
  contactController.listContacts
);

/**
 * @route   GET /contacts/search
 * @desc    Search contacts
 * @access  Private
 */
router.get(
  '/search',
  validate(contactValidators.searchContacts),
  contactController.searchContacts
);

/**
 * @route   GET /contacts/favorites
 * @desc    Get favorite contacts
 * @access  Private
 */
router.get(
  '/favorites',
  contactController.getFavorites
);

/**
 * @route   GET /contacts/stats
 * @desc    Get contact statistics
 * @access  Private
 */
router.get(
  '/stats',
  contactController.getContactStats
);

/**
 * @route   GET /contacts/companies
 * @desc    Get unique companies
 * @access  Private
 */
router.get(
  '/companies',
  contactController.getCompanies
);

/**
 * @route   GET /contacts/tags
 * @desc    Get unique tags
 * @access  Private
 */
router.get(
  '/tags',
  contactController.getTags
);

/**
 * @route   GET /contacts/export
 * @desc    Export contacts
 * @access  Private
 */
router.get(
  '/export',
  validate(contactValidators.exportContacts),
  auditLogger('contact_export'),
  contactController.exportContacts
);

/**
 * @route   GET /contacts/duplicates
 * @desc    Find potential duplicate contacts
 * @access  Private
 */
router.get(
  '/duplicates',
  contactController.findDuplicates
);

/**
 * @route   GET /contacts/status/:status
 * @desc    Get contacts by status
 * @access  Private
 */
router.get(
  '/status/:status',
  validate(contactValidators.getContactsByStatus),
  contactController.getContactsByStatus
);

/**
 * @route   GET /contacts/:id
 * @desc    Get contact by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(contactValidators.contactId),
  contactController.getContactById
);

/**
 * @route   PUT /contacts/:id
 * @desc    Update contact
 * @access  Private
 */
router.put(
  '/:id',
  validate([...contactValidators.contactId, ...contactValidators.updateContact]),
  auditLogger('contact_update'),
  contactController.updateContact
);

/**
 * @route   DELETE /contacts/:id
 * @desc    Delete contact
 * @access  Private
 */
router.delete(
  '/:id',
  validate(contactValidators.contactId),
  auditLogger('contact_deletion'),
  contactController.deleteContact
);

/**
 * @route   POST /contacts/:id/archive
 * @desc    Archive contact
 * @access  Private
 */
router.post(
  '/:id/archive',
  validate(contactValidators.contactId),
  auditLogger('contact_archive'),
  contactController.archiveContact
);

/**
 * @route   POST /contacts/:id/restore
 * @desc    Restore archived contact
 * @access  Private
 */
router.post(
  '/:id/restore',
  validate(contactValidators.contactId),
  auditLogger('contact_restore'),
  contactController.restoreContact
);

/**
 * @route   POST /contacts/:id/favorite
 * @desc    Toggle favorite status
 * @access  Private
 */
router.post(
  '/:id/favorite',
  validate(contactValidators.contactId),
  auditLogger('contact_favorite_toggle'),
  contactController.toggleFavorite
);

/**
 * @route   POST /contacts/:id/tags
 * @desc    Add tag to contact
 * @access  Private
 */
router.post(
  '/:id/tags',
  validate([...contactValidators.contactId, ...contactValidators.tagOperation]),
  auditLogger('contact_tag_add'),
  contactController.addTag
);

/**
 * @route   DELETE /contacts/:id/tags
 * @desc    Remove tag from contact
 * @access  Private
 */
router.delete(
  '/:id/tags',
  validate([...contactValidators.contactId, ...contactValidators.tagOperation]),
  auditLogger('contact_tag_remove'),
  contactController.removeTag
);

/**
 * @route   PATCH /contacts/bulk-update
 * @desc    Bulk update contacts
 * @access  Private
 */
router.patch(
  '/bulk-update',
  validate(contactValidators.bulkUpdateContacts),
  auditLogger('bulk_contact_update'),
  contactController.bulkUpdateContacts
);

/**
 * @route   POST /contacts/merge
 * @desc    Merge duplicate contacts
 * @access  Private
 */
router.post(
  '/merge',
  validate(contactValidators.mergeDuplicates),
  auditLogger('contact_merge'),
  contactController.mergeDuplicates
);

/**
 * @route   POST /contacts/import
 * @desc    Import contacts
 * @access  Private
 */
router.post(
  '/import',
  validate(contactValidators.importContacts),
  auditLogger('contact_import'),
  contactController.importContacts
);

export default router;