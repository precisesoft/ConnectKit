import { http, HttpResponse } from 'msw';
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
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const { email, password } = (await request.json()) as any;

    if (email === 'test@example.com' && password === 'TestPass123!') {
      return HttpResponse.json(
        createMockApiResponse({
          user: mockUsers[0],
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        }),
        { status: 200 }
      );
    }

    if (email === 'locked@example.com') {
      return HttpResponse.json(createMockApiError('Account is locked', 423), {
        status: 423,
      });
    }

    return HttpResponse.json(createMockApiError('Invalid credentials', 401), {
      status: 401,
    });
  }),

  // Register
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const { email, username } = (await request.json()) as any;

    if (email === 'existing@example.com') {
      return HttpResponse.json(
        createMockApiError('Email already exists', 409),
        { status: 409 }
      );
    }

    if (username === 'existinguser') {
      return HttpResponse.json(
        createMockApiError('Username already exists', 409),
        { status: 409 }
      );
    }

    const newUser = createMockUser({
      id: 'new-user-123',
      email,
      username,
    });

    return HttpResponse.json(
      createMockApiResponse({
        user: newUser,
        message: 'Registration successful',
      }),
      { status: 201 }
    );
  }),

  // Logout
  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json(
      createMockApiResponse(null, { message: 'Logged out successfully' }),
      { status: 200 }
    );
  }),

  // Refresh token
  http.post(`${API_BASE_URL}/auth/refresh`, async ({ request }) => {
    const { refreshToken } = (await request.json()) as any;

    if (refreshToken === 'invalid-refresh-token') {
      return HttpResponse.json(
        createMockApiError('Invalid refresh token', 401),
        { status: 401 }
      );
    }

    return HttpResponse.json(
      createMockApiResponse({
        accessToken: 'new-mock-access-token',
        refreshToken: 'new-mock-refresh-token',
      }),
      { status: 200 }
    );
  }),

  // Get current user profile
  http.get(`${API_BASE_URL}/auth/profile`, ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(createMockApiError('Unauthorized', 401), {
        status: 401,
      });
    }

    return HttpResponse.json(createMockApiResponse({ user: mockUsers[0] }), {
      status: 200,
    });
  }),

  // Forgot password
  http.post(`${API_BASE_URL}/auth/forgot-password`, () => {
    return HttpResponse.json(
      createMockApiResponse(null, {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      }),
      { status: 200 }
    );
  }),

  // Reset password
  http.post(`${API_BASE_URL}/auth/reset-password`, async ({ request }) => {
    const { token } = (await request.json()) as any;

    if (token === 'invalid-token') {
      return HttpResponse.json(
        createMockApiError('Invalid or expired reset token', 400),
        { status: 400 }
      );
    }

    return HttpResponse.json(
      createMockApiResponse(null, { message: 'Password reset successful' }),
      { status: 200 }
    );
  }),

  // Change password
  http.post(`${API_BASE_URL}/auth/change-password`, async ({ request }) => {
    const { currentPassword } = (await request.json()) as any;

    if (currentPassword !== 'TestPass123!') {
      return HttpResponse.json(
        createMockApiError('Current password is incorrect', 400),
        { status: 400 }
      );
    }

    return HttpResponse.json(
      createMockApiResponse(null, { message: 'Password changed successfully' }),
      { status: 200 }
    );
  }),

  // Verify email
  http.post(`${API_BASE_URL}/auth/verify-email`, async ({ request }) => {
    const { token } = (await request.json()) as any;

    if (token === 'invalid-verification-token') {
      return HttpResponse.json(
        createMockApiError('Invalid verification token', 400),
        { status: 400 }
      );
    }

    return HttpResponse.json(
      createMockApiResponse(null, { message: 'Email verified successfully' }),
      { status: 200 }
    );
  }),
];

// Contact handlers
export const contactHandlers = [
  // Get contacts
  http.get(`${API_BASE_URL}/contacts`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search');
    const isFavorite = url.searchParams.get('isFavorite');

    let filteredContacts = [...mockContacts];

    // Apply search filter
    if (search) {
      filteredContacts = filteredContacts.filter(
        contact =>
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

    return HttpResponse.json(
      createMockApiResponse({
        data: paginatedContacts,
        pagination: {
          page,
          limit,
          total: filteredContacts.length,
          totalPages: Math.ceil(filteredContacts.length / limit),
          hasNext: endIndex < filteredContacts.length,
          hasPrevious: page > 1,
        },
      }),
      { status: 200 }
    );
  }),

  // Get single contact
  http.get(`${API_BASE_URL}/contacts/:id`, ({ params }) => {
    const { id } = params;
    const contact = mockContacts.find(c => c.id === id);

    if (!contact) {
      return HttpResponse.json(createMockApiError('Contact not found', 404), {
        status: 404,
      });
    }

    return HttpResponse.json(createMockApiResponse({ contact }), {
      status: 200,
    });
  }),

  // Create contact
  http.post(`${API_BASE_URL}/contacts`, async ({ request }) => {
    const contactData = (await request.json()) as any;

    // Check for duplicate email
    if (mockContacts.some(c => c.email === contactData.email)) {
      return HttpResponse.json(
        createMockApiError('Contact with this email already exists', 409),
        { status: 409 }
      );
    }

    const newContact = createMockContact({
      id: `contact-${Date.now()}`,
      ...contactData,
    });

    mockContacts.push(newContact);

    return HttpResponse.json(createMockApiResponse({ contact: newContact }), {
      status: 201,
    });
  }),

  // Update contact
  http.put(`${API_BASE_URL}/contacts/:id`, async ({ params, request }) => {
    const { id } = params;
    const updateData = (await request.json()) as any;
    const contactIndex = mockContacts.findIndex(c => c.id === id);

    if (contactIndex === -1) {
      return HttpResponse.json(createMockApiError('Contact not found', 404), {
        status: 404,
      });
    }

    const updatedContact = {
      ...mockContacts[contactIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    mockContacts[contactIndex] = updatedContact;

    return HttpResponse.json(
      createMockApiResponse({ contact: updatedContact }),
      { status: 200 }
    );
  }),

  // Delete contact
  http.delete(`${API_BASE_URL}/contacts/:id`, ({ params }) => {
    const { id } = params;
    const contactIndex = mockContacts.findIndex(c => c.id === id);

    if (contactIndex === -1) {
      return HttpResponse.json(createMockApiError('Contact not found', 404), {
        status: 404,
      });
    }

    mockContacts.splice(contactIndex, 1);

    return HttpResponse.json(
      createMockApiResponse(null, { message: 'Contact deleted successfully' }),
      { status: 200 }
    );
  }),

  // Toggle favorite
  http.patch(`${API_BASE_URL}/contacts/:id/favorite`, ({ params }) => {
    const { id } = params;
    const contactIndex = mockContacts.findIndex(c => c.id === id);

    if (contactIndex === -1) {
      return HttpResponse.json(createMockApiError('Contact not found', 404), {
        status: 404,
      });
    }

    mockContacts[contactIndex].isFavorite =
      !mockContacts[contactIndex].isFavorite;

    return HttpResponse.json(
      createMockApiResponse({ contact: mockContacts[contactIndex] }),
      { status: 200 }
    );
  }),

  // Get favorite contacts
  http.get(`${API_BASE_URL}/contacts/favorites`, () => {
    const favoriteContacts = mockContacts.filter(c => c.isFavorite);

    return HttpResponse.json(
      createMockApiResponse({
        contacts: favoriteContacts,
        total: favoriteContacts.length,
      }),
      { status: 200 }
    );
  }),

  // Search contacts
  http.get(`${API_BASE_URL}/contacts/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!query) {
      return HttpResponse.json(
        createMockApiError('Search query is required', 400),
        { status: 400 }
      );
    }

    const searchResults = mockContacts
      .filter(
        contact =>
          contact.firstName.toLowerCase().includes(query.toLowerCase()) ||
          contact.lastName.toLowerCase().includes(query.toLowerCase()) ||
          contact.email.toLowerCase().includes(query.toLowerCase()) ||
          contact.company?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);

    return HttpResponse.json(
      createMockApiResponse({
        contacts: searchResults,
        query,
        total: searchResults.length,
      }),
      { status: 200 }
    );
  }),
];

// User handlers
export const userHandlers = [
  // Get current user
  http.get(`${API_BASE_URL}/users/me`, () => {
    return HttpResponse.json(createMockApiResponse({ user: mockUsers[0] }), {
      status: 200,
    });
  }),

  // Update user profile
  http.put(`${API_BASE_URL}/users/me`, async ({ request }) => {
    const updateData = (await request.json()) as any;
    const updatedUser = {
      ...mockUsers[0],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(createMockApiResponse({ user: updatedUser }), {
      status: 200,
    });
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = [
  // Simulate network error
  http.get(`${API_BASE_URL}/error/network`, () => {
    return HttpResponse.error();
  }),

  // Simulate server error
  http.get(`${API_BASE_URL}/error/server`, () => {
    return HttpResponse.json(createMockApiError('Internal server error', 500), {
      status: 500,
    });
  }),

  // Simulate timeout
  http.get(`${API_BASE_URL}/error/timeout`, () => {
    return new Promise(() => {}); // Never resolves
  }),
];

// All handlers
export const handlers = [
  ...authHandlers,
  ...contactHandlers,
  ...userHandlers,
  ...errorHandlers,
];
