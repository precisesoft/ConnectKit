import { rest } from 'msw';
import { 
  createMockApiResponse, 
  createMockApiError,
  createMockUser,
  createMockContact,
} from '../utils';

const API_BASE_URL = 'http://localhost:5000/api';

// Mock data
const mockUsers = [
  createMockUser({
    id: 'user-1',
    email: 'john@example.com',
    username: 'johnuser',
    firstName: 'John',
    lastName: 'Doe',
  }),
  createMockUser({
    id: 'user-2',
    email: 'jane@example.com',
    username: 'janeuser',
    firstName: 'Jane',
    lastName: 'Smith',
  }),
];

const mockContacts = [
  createMockContact({
    id: 'contact-1',
    userId: 'user-1',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
  }),
  createMockContact({
    id: 'contact-2',
    userId: 'user-1',
    firstName: 'Bob',
    lastName: 'Wilson',
    email: 'bob@example.com',
    isFavorite: true,
  }),
  createMockContact({
    id: 'contact-3',
    userId: 'user-1',
    firstName: 'Charlie',
    lastName: 'Brown',
    email: 'charlie@example.com',
  }),
];

// Authentication handlers
export const authHandlers = [
  // Login
  rest.post(`${API_BASE_URL}/auth/login`, (req, res, ctx) => {
    const { email, password } = req.body as any;

    if (email === 'test@example.com' && password === 'TestPass123!') {
      return res(
        ctx.status(200),
        ctx.json(createMockApiResponse({
          user: mockUsers[0],
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        }))
      );
    }

    if (email === 'locked@example.com') {
      return res(
        ctx.status(423),
        ctx.json(createMockApiError('Account is locked', 423))
      );
    }

    return res(
      ctx.status(401),
      ctx.json(createMockApiError('Invalid credentials', 401))
    );
  }),

  // Register
  rest.post(`${API_BASE_URL}/auth/register`, (req, res, ctx) => {
    const { email, username } = req.body as any;

    if (email === 'existing@example.com') {
      return res(
        ctx.status(409),
        ctx.json(createMockApiError('Email already exists', 409))
      );
    }

    if (username === 'existinguser') {
      return res(
        ctx.status(409),
        ctx.json(createMockApiError('Username already exists', 409))
      );
    }

    const newUser = createMockUser({
      id: 'new-user-123',
      email,
      username,
    });

    return res(
      ctx.status(201),
      ctx.json(createMockApiResponse({
        user: newUser,
        message: 'Registration successful',
      }))
    );
  }),

  // Logout
  rest.post(`${API_BASE_URL}/auth/logout`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse(null, { message: 'Logged out successfully' }))
    );
  }),

  // Refresh token
  rest.post(`${API_BASE_URL}/auth/refresh`, (req, res, ctx) => {
    const { refreshToken } = req.body as any;

    if (refreshToken === 'invalid-refresh-token') {
      return res(
        ctx.status(401),
        ctx.json(createMockApiError('Invalid refresh token', 401))
      );
    }

    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse({
        accessToken: 'new-mock-access-token',
        refreshToken: 'new-mock-refresh-token',
      }))
    );
  }),

  // Get current user profile
  rest.get(`${API_BASE_URL}/auth/profile`, (req, res, ctx) => {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json(createMockApiError('Unauthorized', 401))
      );
    }

    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse({ user: mockUsers[0] }))
    );
  }),

  // Forgot password
  rest.post(`${API_BASE_URL}/auth/forgot-password`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse(null, {
        message: 'If an account with that email exists, a password reset link has been sent.',
      }))
    );
  }),

  // Reset password
  rest.post(`${API_BASE_URL}/auth/reset-password`, (req, res, ctx) => {
    const { token } = req.body as any;

    if (token === 'invalid-token') {
      return res(
        ctx.status(400),
        ctx.json(createMockApiError('Invalid or expired reset token', 400))
      );
    }

    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse(null, { message: 'Password reset successful' }))
    );
  }),

  // Change password
  rest.post(`${API_BASE_URL}/auth/change-password`, (req, res, ctx) => {
    const { currentPassword } = req.body as any;

    if (currentPassword !== 'TestPass123!') {
      return res(
        ctx.status(400),
        ctx.json(createMockApiError('Current password is incorrect', 400))
      );
    }

    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse(null, { message: 'Password changed successfully' }))
    );
  }),

  // Verify email
  rest.post(`${API_BASE_URL}/auth/verify-email`, (req, res, ctx) => {
    const { token } = req.body as any;

    if (token === 'invalid-verification-token') {
      return res(
        ctx.status(400),
        ctx.json(createMockApiError('Invalid verification token', 400))
      );
    }

    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse(null, { message: 'Email verified successfully' }))
    );
  }),
];

// Contact handlers
export const contactHandlers = [
  // Get contacts
  rest.get(`${API_BASE_URL}/contacts`, (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');
    const search = req.url.searchParams.get('search');
    const isFavorite = req.url.searchParams.get('isFavorite');

    let filteredContacts = [...mockContacts];

    // Apply search filter
    if (search) {
      filteredContacts = filteredContacts.filter(contact =>
        contact.firstName.toLowerCase().includes(search.toLowerCase()) ||
        contact.lastName.toLowerCase().includes(search.toLowerCase()) ||
        contact.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply favorite filter
    if (isFavorite === 'true') {
      filteredContacts = filteredContacts.filter(contact => contact.isFavorite);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse({
        data: paginatedContacts,
        pagination: {
          page,
          limit,
          total: filteredContacts.length,
          totalPages: Math.ceil(filteredContacts.length / limit),
          hasNext: endIndex < filteredContacts.length,
          hasPrevious: page > 1,
        },
      }))
    );
  }),

  // Get single contact
  rest.get(`${API_BASE_URL}/contacts/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const contact = mockContacts.find(c => c.id === id);

    if (!contact) {
      return res(
        ctx.status(404),
        ctx.json(createMockApiError('Contact not found', 404))
      );
    }

    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse({ contact }))
    );
  }),

  // Create contact
  rest.post(`${API_BASE_URL}/contacts`, (req, res, ctx) => {
    const contactData = req.body as any;

    // Check for duplicate email
    if (mockContacts.some(c => c.email === contactData.email)) {
      return res(
        ctx.status(409),
        ctx.json(createMockApiError('Contact with this email already exists', 409))
      );
    }

    const newContact = createMockContact({
      id: `contact-${Date.now()}`,
      ...contactData,
    });

    mockContacts.push(newContact);

    return res(
      ctx.status(201),
      ctx.json(createMockApiResponse({ contact: newContact }))
    );
  }),

  // Update contact
  rest.put(`${API_BASE_URL}/contacts/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const updateData = req.body as any;
    const contactIndex = mockContacts.findIndex(c => c.id === id);

    if (contactIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json(createMockApiError('Contact not found', 404))
      );
    }

    const updatedContact = {
      ...mockContacts[contactIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    mockContacts[contactIndex] = updatedContact;

    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse({ contact: updatedContact }))
    );
  }),

  // Delete contact
  rest.delete(`${API_BASE_URL}/contacts/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const contactIndex = mockContacts.findIndex(c => c.id === id);

    if (contactIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json(createMockApiError('Contact not found', 404))
      );
    }

    mockContacts.splice(contactIndex, 1);

    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse(null, { message: 'Contact deleted successfully' }))
    );
  }),

  // Toggle favorite
  rest.patch(`${API_BASE_URL}/contacts/:id/favorite`, (req, res, ctx) => {
    const { id } = req.params;
    const contactIndex = mockContacts.findIndex(c => c.id === id);

    if (contactIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json(createMockApiError('Contact not found', 404))
      );
    }

    mockContacts[contactIndex].isFavorite = !mockContacts[contactIndex].isFavorite;

    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse({ contact: mockContacts[contactIndex] }))
    );
  }),

  // Get favorite contacts
  rest.get(`${API_BASE_URL}/contacts/favorites`, (req, res, ctx) => {
    const favoriteContacts = mockContacts.filter(c => c.isFavorite);

    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse({
        contacts: favoriteContacts,
        total: favoriteContacts.length,
      }))
    );
  }),

  // Search contacts
  rest.get(`${API_BASE_URL}/contacts/search`, (req, res, ctx) => {
    const query = req.url.searchParams.get('q');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');

    if (!query) {
      return res(
        ctx.status(400),
        ctx.json(createMockApiError('Search query is required', 400))
      );
    }

    const searchResults = mockContacts.filter(contact =>
      contact.firstName.toLowerCase().includes(query.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(query.toLowerCase()) ||
      contact.email.toLowerCase().includes(query.toLowerCase()) ||
      contact.company?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);

    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse({
        contacts: searchResults,
        query,
        total: searchResults.length,
      }))
    );
  }),
];

// User handlers
export const userHandlers = [
  // Get current user
  rest.get(`${API_BASE_URL}/users/me`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse({ user: mockUsers[0] }))
    );
  }),

  // Update user profile
  rest.put(`${API_BASE_URL}/users/me`, (req, res, ctx) => {
    const updateData = req.body as any;
    const updatedUser = {
      ...mockUsers[0],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    return res(
      ctx.status(200),
      ctx.json(createMockApiResponse({ user: updatedUser }))
    );
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = [
  // Simulate network error
  rest.get(`${API_BASE_URL}/error/network`, (req, res, ctx) => {
    return res.networkError('Network error');
  }),

  // Simulate server error
  rest.get(`${API_BASE_URL}/error/server`, (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json(createMockApiError('Internal server error', 500))
    );
  }),

  // Simulate timeout
  rest.get(`${API_BASE_URL}/error/timeout`, (req, res, ctx) => {
    return res(
      ctx.delay('infinite')
    );
  }),
];

// All handlers
export const handlers = [
  ...authHandlers,
  ...contactHandlers,
  ...userHandlers,
  ...errorHandlers,
];