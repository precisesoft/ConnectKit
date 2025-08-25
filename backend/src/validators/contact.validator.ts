import { body, param, query } from 'express-validator';
import { commonValidations } from '../middleware/validation.middleware';
import { CONTACT_CONSTANTS } from '../utils/constants';

export const contactValidators = {
  // Contact ID parameter validation
  contactId: [commonValidations.uuid('id')],

  // Create contact validation
  createContact: [
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.email('email', true),
    commonValidations.phone('phone', true),
    commonValidations.text(
      'company',
      CONTACT_CONSTANTS.MAX_COMPANY_LENGTH,
      true
    ),
    commonValidations.text(
      'jobTitle',
      CONTACT_CONSTANTS.MAX_JOB_TITLE_LENGTH,
      true
    ),
    commonValidations.text(
      'addressLine1',
      CONTACT_CONSTANTS.MAX_ADDRESS_LENGTH,
      true
    ),
    commonValidations.text(
      'addressLine2',
      CONTACT_CONSTANTS.MAX_ADDRESS_LENGTH,
      true
    ),
    commonValidations.text('city', CONTACT_CONSTANTS.MAX_CITY_LENGTH, true),
    commonValidations.text('state', CONTACT_CONSTANTS.MAX_STATE_LENGTH, true),
    body('postalCode')
      .optional()
      .trim()
      .matches(/^[A-Za-z0-9\s-]{3,20}$/)
      .withMessage('Invalid postal code format'),
    commonValidations.text(
      'country',
      CONTACT_CONSTANTS.MAX_COUNTRY_LENGTH,
      true
    ),
    commonValidations.text('notes', CONTACT_CONSTANTS.MAX_NOTES_LENGTH, true),
    body('tags')
      .optional()
      .isArray({ max: CONTACT_CONSTANTS.MAX_TAGS_COUNT })
      .withMessage(`Maximum ${CONTACT_CONSTANTS.MAX_TAGS_COUNT} tags allowed`)
      .custom(tags => {
        if (
          tags &&
          tags.some(
            (tag: string) =>
              typeof tag !== 'string' ||
              tag.length > CONTACT_CONSTANTS.MAX_TAG_LENGTH ||
              tag.trim().length === 0
          )
        ) {
          throw new Error(
            `Each tag must be a non-empty string with max ${CONTACT_CONSTANTS.MAX_TAG_LENGTH} characters`
          );
        }
        return true;
      }),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'archived'])
      .withMessage('Status must be one of: active, inactive, archived'),
    commonValidations.boolean('isFavorite', true),
  ],

  // Update contact validation
  updateContact: [
    commonValidations.name('firstName', true),
    commonValidations.name('lastName', true),
    commonValidations.email('email', true),
    commonValidations.phone('phone', true),
    commonValidations.text(
      'company',
      CONTACT_CONSTANTS.MAX_COMPANY_LENGTH,
      true
    ),
    commonValidations.text(
      'jobTitle',
      CONTACT_CONSTANTS.MAX_JOB_TITLE_LENGTH,
      true
    ),
    commonValidations.text(
      'addressLine1',
      CONTACT_CONSTANTS.MAX_ADDRESS_LENGTH,
      true
    ),
    commonValidations.text(
      'addressLine2',
      CONTACT_CONSTANTS.MAX_ADDRESS_LENGTH,
      true
    ),
    commonValidations.text('city', CONTACT_CONSTANTS.MAX_CITY_LENGTH, true),
    commonValidations.text('state', CONTACT_CONSTANTS.MAX_STATE_LENGTH, true),
    body('postalCode')
      .optional()
      .trim()
      .matches(/^[A-Za-z0-9\s-]{3,20}$/)
      .withMessage('Invalid postal code format'),
    commonValidations.text(
      'country',
      CONTACT_CONSTANTS.MAX_COUNTRY_LENGTH,
      true
    ),
    commonValidations.text('notes', CONTACT_CONSTANTS.MAX_NOTES_LENGTH, true),
    body('tags')
      .optional()
      .isArray({ max: CONTACT_CONSTANTS.MAX_TAGS_COUNT })
      .withMessage(`Maximum ${CONTACT_CONSTANTS.MAX_TAGS_COUNT} tags allowed`)
      .custom(tags => {
        if (
          tags &&
          tags.some(
            (tag: string) =>
              typeof tag !== 'string' ||
              tag.length > CONTACT_CONSTANTS.MAX_TAG_LENGTH ||
              tag.trim().length === 0
          )
        ) {
          throw new Error(
            `Each tag must be a non-empty string with max ${CONTACT_CONSTANTS.MAX_TAG_LENGTH} characters`
          );
        }
        return true;
      }),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'archived'])
      .withMessage('Status must be one of: active, inactive, archived'),
    commonValidations.boolean('isFavorite', true),
  ],

  // List contacts validation
  listContacts: [
    commonValidations.page(),
    commonValidations.limit(),
    commonValidations.sort('sort', [
      'firstName',
      'lastName',
      'email',
      'phone',
      'company',
      'jobTitle',
      'city',
      'state',
      'country',
      'status',
      'isFavorite',
      'createdAt',
      'updatedAt',
    ]),
    commonValidations.order(),
    commonValidations.search(),
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'archived'])
      .withMessage('Status filter must be one of: active, inactive, archived'),
    query('isFavorite')
      .optional()
      .isBoolean()
      .withMessage('isFavorite filter must be a boolean')
      .toBoolean(),
    query('company')
      .optional()
      .trim()
      .isLength({ max: CONTACT_CONSTANTS.MAX_COMPANY_LENGTH })
      .withMessage(
        `Company filter must not exceed ${CONTACT_CONSTANTS.MAX_COMPANY_LENGTH} characters`
      ),
    query('tags')
      .optional()
      .isString()
      .withMessage('Tags filter must be a comma-separated string')
      .custom(value => {
        const tags = value.split(',').map((tag: string) => tag.trim());
        if (
          tags.some(
            (tag: string) => tag.length > CONTACT_CONSTANTS.MAX_TAG_LENGTH
          )
        ) {
          throw new Error(
            `Each tag must not exceed ${CONTACT_CONSTANTS.MAX_TAG_LENGTH} characters`
          );
        }
        return true;
      }),
    query('hasEmail')
      .optional()
      .isBoolean()
      .withMessage('hasEmail filter must be a boolean')
      .toBoolean(),
    query('hasPhone')
      .optional()
      .isBoolean()
      .withMessage('hasPhone filter must be a boolean')
      .toBoolean(),
    query('city')
      .optional()
      .trim()
      .isLength({ max: CONTACT_CONSTANTS.MAX_CITY_LENGTH })
      .withMessage(
        `City filter must not exceed ${CONTACT_CONSTANTS.MAX_CITY_LENGTH} characters`
      ),
    query('state')
      .optional()
      .trim()
      .isLength({ max: CONTACT_CONSTANTS.MAX_STATE_LENGTH })
      .withMessage(
        `State filter must not exceed ${CONTACT_CONSTANTS.MAX_STATE_LENGTH} characters`
      ),
    query('country')
      .optional()
      .trim()
      .isLength({ max: CONTACT_CONSTANTS.MAX_COUNTRY_LENGTH })
      .withMessage(
        `Country filter must not exceed ${CONTACT_CONSTANTS.MAX_COUNTRY_LENGTH} characters`
      ),
  ],

  // Search contacts validation
  searchContacts: [
    query('search')
      .notEmpty()
      .withMessage('Search term is required')
      .trim()
      .isLength({ min: 2, max: 500 })
      .withMessage('Search term must be between 2 and 500 characters'),
    commonValidations.page(),
    commonValidations.limit(),
  ],

  // Get contacts by status validation
  getContactsByStatus: [
    param('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['active', 'inactive', 'archived'])
      .withMessage('Status must be one of: active, inactive, archived'),
    commonValidations.page(),
    commonValidations.limit(),
  ],

  // Add/Remove tag validation
  tagOperation: [
    body('tag')
      .notEmpty()
      .withMessage('Tag is required')
      .trim()
      .isLength({ min: 1, max: CONTACT_CONSTANTS.MAX_TAG_LENGTH })
      .withMessage(
        `Tag must be between 1 and ${CONTACT_CONSTANTS.MAX_TAG_LENGTH} characters`
      )
      .matches(/^[a-zA-Z0-9\s\-_]+$/)
      .withMessage(
        'Tag can only contain letters, numbers, spaces, hyphens, and underscores'
      ),
  ],

  // Bulk update contacts validation
  bulkUpdateContacts: [
    body('contactIds')
      .isArray({ min: 1, max: 100 })
      .withMessage('Contact IDs array is required (1-100 items)')
      .custom(ids => {
        if (
          ids.some(
            (id: string) =>
              typeof id !== 'string' ||
              !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                id
              )
          )
        ) {
          throw new Error('All contact IDs must be valid UUIDs');
        }
        return true;
      }),
    body('updates')
      .isObject()
      .withMessage('Updates must be an object')
      .custom(updates => {
        const allowedFields = [
          'status',
          'isFavorite',
          'tags',
          'company',
          'jobTitle',
          'notes',
          'city',
          'state',
          'country',
        ];
        const updateKeys = Object.keys(updates);
        if (updateKeys.length === 0) {
          throw new Error('At least one update field is required');
        }
        if (updateKeys.some(key => !allowedFields.includes(key))) {
          throw new Error(
            `Only these fields can be bulk updated: ${allowedFields.join(', ')}`
          );
        }
        return true;
      }),
    body('updates.status')
      .optional()
      .isIn(['active', 'inactive', 'archived'])
      .withMessage('Status must be one of: active, inactive, archived'),
    body('updates.isFavorite')
      .optional()
      .isBoolean()
      .withMessage('isFavorite must be a boolean'),
    body('updates.tags')
      .optional()
      .isArray({ max: CONTACT_CONSTANTS.MAX_TAGS_COUNT })
      .withMessage(`Maximum ${CONTACT_CONSTANTS.MAX_TAGS_COUNT} tags allowed`),
  ],

  // Export contacts validation
  exportContacts: [
    query('format')
      .optional()
      .isIn(['json', 'csv', 'excel'])
      .withMessage('Export format must be one of: json, csv, excel'),
    query('fields')
      .optional()
      .isString()
      .withMessage('Fields must be a comma-separated string')
      .custom(value => {
        const validFields = [
          'firstName',
          'lastName',
          'email',
          'phone',
          'company',
          'jobTitle',
          'addressLine1',
          'addressLine2',
          'city',
          'state',
          'postalCode',
          'country',
          'notes',
          'tags',
          'status',
          'isFavorite',
          'createdAt',
          'updatedAt',
        ];
        const requestedFields = value.split(',').map((f: string) => f.trim());
        if (
          requestedFields.some((field: string) => !validFields.includes(field))
        ) {
          throw new Error(
            `Invalid field(s). Valid fields: ${validFields.join(', ')}`
          );
        }
        return true;
      }),
    // Include the same filters as listContacts
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'archived'])
      .withMessage('Status filter must be one of: active, inactive, archived'),
    query('isFavorite')
      .optional()
      .isBoolean()
      .withMessage('isFavorite filter must be a boolean')
      .toBoolean(),
    query('company')
      .optional()
      .trim()
      .isLength({ max: CONTACT_CONSTANTS.MAX_COMPANY_LENGTH }),
    query('tags')
      .optional()
      .isString()
      .withMessage('Tags filter must be a comma-separated string'),
  ],

  // Merge duplicates validation
  mergeDuplicates: [
    body('primaryContactId')
      .notEmpty()
      .withMessage('Primary contact ID is required')
      .isUUID()
      .withMessage('Primary contact ID must be a valid UUID'),
    body('duplicateContactIds')
      .isArray({ min: 1, max: 10 })
      .withMessage('Duplicate contact IDs array is required (1-10 items)')
      .custom(ids => {
        if (
          ids.some(
            (id: string) =>
              typeof id !== 'string' ||
              !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                id
              )
          )
        ) {
          throw new Error('All duplicate contact IDs must be valid UUIDs');
        }
        return true;
      }),
  ],

  // Import contacts validation
  importContacts: [
    body('contacts')
      .isArray({ min: 1, max: 1000 })
      .withMessage('Contacts array is required (1-1000 items)'),
    body('contacts.*.firstName')
      .notEmpty()
      .withMessage('First name is required for each contact')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('First name must be between 1 and 100 characters'),
    body('contacts.*.lastName')
      .notEmpty()
      .withMessage('Last name is required for each contact')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Last name must be between 1 and 100 characters'),
    body('contacts.*.email')
      .optional()
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('contacts.*.phone')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    body('contacts.*.company')
      .optional()
      .trim()
      .isLength({ max: CONTACT_CONSTANTS.MAX_COMPANY_LENGTH })
      .withMessage(
        `Company must not exceed ${CONTACT_CONSTANTS.MAX_COMPANY_LENGTH} characters`
      ),
  ],
};

export default contactValidators;
