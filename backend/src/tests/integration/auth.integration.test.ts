import { StatusCodes } from 'http-status-codes';
import { testServer, TestRequest, TestSession } from '../utils/testServer';
import { testDb } from '../utils/testDb';
import { createRegistrationData } from '../utils/fixtures';
import { UserRole } from '../../models/user.model';

describe('Auth Integration Tests', () => {
  let request: TestRequest;

  beforeAll(async () => {
    await testServer.initialize();
    await testServer.start();
  });

  beforeEach(async () => {
    await testServer.reset();
    request = new TestRequest(testServer.getApp());
  });

  afterAll(async () => {
    await testServer.cleanup();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const registrationData = createRegistrationData({
        username: 'testuser',
        email: 'test@example.com',
      });

      // Act
      const response = await request
        .post('/api/auth/register')
        .send(registrationData)
        .expect(StatusCodes.CREATED);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        username: registrationData.username,
        email: registrationData.email,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        role: UserRole.USER,
      });
      expect(response.body.data.user.id).toBeDefined();

      // Verify user was created in database
      const userExists = await testDb.exists('users', 'email = $1', [
        registrationData.email,
      ]);
      expect(userExists).toBe(true);
    });

    it('should prevent duplicate email registration', async () => {
      // Arrange
      const registrationData = createRegistrationData({
        email: 'duplicate@example.com',
      });

      await request
        .post('/api/auth/register')
        .send(registrationData)
        .expect(StatusCodes.CREATED);

      const duplicateData = createRegistrationData({
        email: 'duplicate@example.com',
        username: 'different_username',
      });

      // Act & Assert
      await request
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(StatusCodes.CONFLICT);
    });

    it('should prevent duplicate username registration', async () => {
      // Arrange
      const registrationData = createRegistrationData({
        username: 'uniqueuser',
      });

      await request
        .post('/api/auth/register')
        .send(registrationData)
        .expect(StatusCodes.CREATED);

      const duplicateData = createRegistrationData({
        username: 'uniqueuser',
        email: 'different@example.com',
      });

      // Act & Assert
      await request
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(StatusCodes.CONFLICT);
    });

    it('should validate required fields', async () => {
      // Act & Assert
      await request
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          // Missing required fields
        })
        .expect(StatusCodes.BAD_REQUEST);
    });

    it('should validate email format', async () => {
      // Arrange
      const invalidData = createRegistrationData({
        email: 'invalid-email-format',
      });

      // Act & Assert
      await request
        .post('/api/auth/register')
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);
    });

    it('should validate password strength', async () => {
      // Arrange
      const weakPasswordData = createRegistrationData({
        password: '123',
        confirmPassword: '123',
      });

      // Act & Assert
      await request
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(StatusCodes.BAD_REQUEST);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Arrange
      const registrationData = createRegistrationData({
        username: 'logintest',
        email: 'login@example.com',
      });

      await request.post('/api/auth/register').send(registrationData);

      const loginData = {
        email: registrationData.email,
        password: registrationData.password,
      };

      // Act
      const response = await request
        .post('/api/auth/login')
        .send(loginData)
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        username: registrationData.username,
        email: registrationData.email,
      });
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid email', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'ValidPass123!',
      };

      // Act & Assert
      await request
        .post('/api/auth/login')
        .send(loginData)
        .expect(StatusCodes.UNAUTHORIZED);
    });

    it('should reject invalid password', async () => {
      // Arrange
      const registrationData = createRegistrationData({
        email: 'test@example.com',
      });

      await request.post('/api/auth/register').send(registrationData);

      const loginData = {
        email: registrationData.email,
        password: 'WrongPassword123!',
      };

      // Act & Assert
      await request
        .post('/api/auth/login')
        .send(loginData)
        .expect(StatusCodes.UNAUTHORIZED);
    });

    it('should increment failed login attempts', async () => {
      // Arrange
      const registrationData = createRegistrationData({
        email: 'failtest@example.com',
      });

      await request.post('/api/auth/register').send(registrationData);

      const invalidLoginData = {
        email: registrationData.email,
        password: 'WrongPassword123!',
      };

      // Act - First failed attempt
      await request
        .post('/api/auth/login')
        .send(invalidLoginData)
        .expect(StatusCodes.UNAUTHORIZED);

      // Assert
      const user = await testDb.getRecord('users', 'email = $1', [
        registrationData.email,
      ]);
      expect(user?.failed_login_attempts).toBe(1);
    });

    it('should lock account after maximum failed attempts', async () => {
      // Arrange
      const registrationData = createRegistrationData({
        email: 'locktest@example.com',
      });

      await request.post('/api/auth/register').send(registrationData);

      const invalidLoginData = {
        email: registrationData.email,
        password: 'WrongPassword123!',
      };

      // Act - Multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await request
          .post('/api/auth/login')
          .send(invalidLoginData)
          .expect(StatusCodes.UNAUTHORIZED);
      }

      // Assert account is locked
      const user = await testDb.getRecord('users', 'email = $1', [
        registrationData.email,
      ]);
      expect(user?.failed_login_attempts).toBe(5);
      expect(user?.locked_until).not.toBeNull();

      // Try to login with correct password - should still fail
      const validLoginData = {
        email: registrationData.email,
        password: registrationData.password,
      };

      await request
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(StatusCodes.LOCKED); // Account locked error
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // Register -> Login -> Access Protected Route -> Refresh Token -> Logout
      const session = new TestSession(request);

      // 1. Register
      const registrationData = createRegistrationData({
        username: 'flowtest',
        email: 'flow@example.com',
      });

      await request
        .post('/api/auth/register')
        .send(registrationData)
        .expect(StatusCodes.CREATED);

      // 2. Login
      await session.login(registrationData.email, registrationData.password);
      expect(session.isAuthenticated()).toBe(true);

      // 3. Access protected route
      const profileResponse = await session
        .getRequest()
        .get('/api/auth/profile')
        .expect(StatusCodes.OK);

      expect(profileResponse.body.data.user.email).toBe(registrationData.email);

      // 4. Refresh token
      const oldTokens = session.getTokens();
      await session.refreshToken();
      const newTokens = session.getTokens();

      expect(newTokens.accessToken).not.toBe(oldTokens.accessToken);
      expect(newTokens.refreshToken).not.toBe(oldTokens.refreshToken);

      // 5. Logout
      await session.logout();
      expect(session.isAuthenticated()).toBe(false);

      // 6. Verify access is denied after logout
      await request.get('/api/auth/profile').expect(StatusCodes.UNAUTHORIZED);
    });
  });

  describe('Protected Routes', () => {
    let session: TestSession;

    beforeEach(async () => {
      session = new TestSession(request);
      const registrationData = createRegistrationData({
        username: 'protectedtest',
        email: 'protected@example.com',
      });

      await request.post('/api/auth/register').send(registrationData);

      await session.login(registrationData.email, registrationData.password);
    });

    afterEach(async () => {
      if (session.isAuthenticated()) {
        await session.logout();
      }
    });

    it('should allow access to protected routes with valid token', async () => {
      // Act & Assert
      await session
        .getRequest()
        .get('/api/auth/profile')
        .expect(StatusCodes.OK);
    });

    it('should deny access to protected routes without token', async () => {
      // Act & Assert
      await request.get('/api/auth/profile').expect(StatusCodes.UNAUTHORIZED);
    });

    it('should deny access to protected routes with invalid token', async () => {
      // Act & Assert
      await request
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(StatusCodes.UNAUTHORIZED);
    });

    it('should deny access to protected routes with expired token', async () => {
      // This would require mocking time or waiting for token expiration
      // For now, we test with a malformed token that simulates expiration
      await request
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer expired.token.here')
        .expect(StatusCodes.UNAUTHORIZED);
    });
  });

  describe('Password Reset Flow', () => {
    it('should handle forgot password request', async () => {
      // Arrange
      const registrationData = createRegistrationData({
        email: 'reset@example.com',
      });

      await request.post('/api/auth/register').send(registrationData);

      // Act
      const response = await request
        .post('/api/auth/forgot-password')
        .send({ email: registrationData.email })
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link');

      // Verify token was stored in database
      const tokenExists = await testDb.exists(
        'password_reset_tokens',
        'user_id = (SELECT id FROM users WHERE email = $1)',
        [registrationData.email]
      );
      expect(tokenExists).toBe(true);
    });

    it('should not reveal non-existent email addresses', async () => {
      // Act
      const response = await request
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(StatusCodes.OK);

      // Assert - Same response for security
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link');
    });
  });

  describe('Role-based Access Control', () => {
    it('should enforce admin-only routes', async () => {
      // Arrange - Create regular user
      const regularSession = new TestSession(request);
      const userData = createRegistrationData({
        username: 'regularuser',
        email: 'regular@example.com',
      });

      await request.post('/api/auth/register').send(userData);

      await regularSession.login(userData.email, userData.password);

      // Act & Assert - Try to access admin route
      await regularSession
        .getRequest()
        .get('/api/users') // Admin-only route
        .expect(StatusCodes.FORBIDDEN);

      await regularSession.logout();
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      // This test would verify rate limiting works
      // For brevity, testing the concept rather than actual implementation
      const loginData = {
        email: 'rate@example.com',
        password: 'TestPass123!',
      };

      // Simulate multiple rapid requests
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(request.post('/api/auth/login').send(loginData));
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited (depending on implementation)
      const rateLimitedResponses = responses.filter(
        res => res.status === StatusCodes.TOO_MANY_REQUESTS
      );

      // Check that rate limiting is working
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // This assertion depends on your rate limiting configuration
      // expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      // Act
      const response = await request
        .get('/api/auth/status')
        .expect(StatusCodes.OK);

      // Assert security headers are present
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
});
