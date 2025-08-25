import { Router } from 'express';
import { createContactController } from '../controllers/contact.controller';

// Lazy controller getter
let contactController: any = null;
const getContactController = () => {
  if (!contactController) {
    contactController = createContactController();
  }
  return contactController;
};
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
  (req, res, next) => getContactController().createContact(req, res, next)
);

/**
 * @route   GET /contacts
 * @desc    List contacts with pagination and filters
 * @access  Private
 */
router.get('/', validate(contactValidators.listContacts), (req, res, next) =>
  getContactController().listContacts(req, res, next)
);

/**
 * @route   GET /contacts/search
 * @desc    Search contacts
 * @access  Private
 */
router.get(
  '/search',
  validate(contactValidators.searchContacts),
  (req, res, next) => getContactController().searchContacts(req, res, next)
);

/**
 * @route   GET /contacts/favorites
 * @desc    Get favorite contacts
 * @access  Private
 */
router.get('/favorites', (req, res, next) =>
  getContactController().getFavorites(req, res, next)
);

/**
 * @route   GET /contacts/stats
 * @desc    Get contact statistics
 * @access  Private
 */
router.get('/stats', (req, res, next) =>
  getContactController().getContactStats(req, res, next)
);

/**
 * @route   GET /contacts/companies
 * @desc    Get unique companies
 * @access  Private
 */
router.get('/companies', (req, res, next) =>
  getContactController().getCompanies(req, res, next)
);

/**
 * @route   GET /contacts/tags
 * @desc    Get unique tags
 * @access  Private
 */
router.get('/tags', (req, res, next) =>
  getContactController().getTags(req, res, next)
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
  (req, res, next) => getContactController().exportContacts(req, res, next)
);

/**
 * @route   GET /contacts/duplicates
 * @desc    Find potential duplicate contacts
 * @access  Private
 */
router.get('/duplicates', (req, res, next) =>
  getContactController().findDuplicates(req, res, next)
);

/**
 * @route   GET /contacts/status/:status
 * @desc    Get contacts by status
 * @access  Private
 */
router.get(
  '/status/:status',
  validate(contactValidators.getContactsByStatus),
  (req, res, next) => getContactController().getContactsByStatus(req, res, next)
);

/**
 * @route   GET /contacts/:id
 * @desc    Get contact by ID
 * @access  Private
 */
router.get('/:id', validate(contactValidators.contactId), (req, res, next) =>
  getContactController().getContactById(req, res, next)
);

/**
 * @route   PUT /contacts/:id
 * @desc    Update contact
 * @access  Private
 */
router.put(
  '/:id',
  validate([
    ...contactValidators.contactId,
    ...contactValidators.updateContact,
  ]),
  auditLogger('contact_update'),
  (req, res, next) => getContactController().updateContact(req, res, next)
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
  (req, res, next) => getContactController().deleteContact(req, res, next)
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
  (req, res, next) => getContactController().archiveContact(req, res, next)
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
  (req, res, next) => getContactController().restoreContact(req, res, next)
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
  (req, res, next) => getContactController().toggleFavorite(req, res, next)
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
  (req, res, next) => getContactController().addTag(req, res, next)
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
  (req, res, next) => getContactController().removeTag(req, res, next)
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
  (req, res, next) => getContactController().bulkUpdateContacts(req, res, next)
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
  (req, res, next) => getContactController().mergeDuplicates(req, res, next)
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
  (req, res, next) => getContactController().importContacts(req, res, next)
);

export default router;
