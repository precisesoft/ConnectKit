import express from 'express';
import request from 'supertest';
import { Server } from 'http';
import { app } from '../../app';
import { testDb } from './testDb';
import { redisConnection } from '../../config/redis.config';
import { logger } from '../../utils/logger';

/**
 * Test server utilities for managing Express app instance during tests
 */
export class TestServer {
  private static instance: TestServer | null = null;
  private app: express.Application;
  private server: Server | null = null;
  private port: number;

  private constructor() {
    this.app = app;
    this.port = parseInt(process.env.TEST_PORT || '0', 10); // 0 for random available port
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TestServer {
    if (!this.instance) {
      this.instance = new TestServer();
    }
    return this.instance;
  }

  /**
   * Initialize test server and dependencies
   */
  async initialize(): Promise<void> {
    try {
      // Initialize test database
      await testDb.initialize();

      // Initialize Redis connection for tests
      await redisConnection.initialize();

      // Clean database before tests
      await testDb.cleanup();

      logger.info('Test server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize test server:', error);
      throw new Error('Test server initialization failed');
    }
  }

  /**
   * Start test server
   */
  async start(): Promise<void> {
    if (this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (error?: Error) => {
        if (error) {
          reject(error);
          return;
        }

        const address = this.server!.address();
        const actualPort = typeof address === 'object' ? address?.port : this.port;
        this.port = actualPort || 0;

        logger.info(`Test server started on port ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop test server
   */
  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    return new Promise((resolve) => {
      this.server!.close(() => {
        this.server = null;
        logger.info('Test server stopped');
        resolve();
      });
    });
  }

  /**
   * Get Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get supertest request instance
   */
  getRequest(): request.SuperTest<request.Test> {
    return request(this.app);
  }

  /**
   * Get server port
   */
  getPort(): number {
    return this.port;
  }

  /**
   * Get base URL for requests
   */
  getBaseUrl(): string {
    return `http://localhost:${this.port}`;
  }

  /**
   * Reset server state
   */
  async reset(): Promise<void> {
    try {
      await testDb.reset();
      
      // Clear Redis cache
      const redis = redisConnection.getClient();
      await redis.flushdb();

      logger.info('Test server reset completed');
    } catch (error) {
      logger.error('Failed to reset test server:', error);
      throw error;
    }
  }

  /**
   * Clean up test server and dependencies
   */
  async cleanup(): Promise<void> {
    try {
      await this.stop();
      await testDb.close();
      await redisConnection.close();

      TestServer.instance = null;
      logger.info('Test server cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup test server:', error);
      throw error;
    }
  }
}

/**
 * Helper class for managing test requests with authentication
 */
export class TestRequest {
  private request: request.SuperTest<request.Test>;
  private authToken: string | null = null;

  constructor(app: express.Application) {
    this.request = request(app);
  }

  /**
   * Set authentication token for subsequent requests
   */
  setAuthToken(token: string): this {
    this.authToken = token;
    return this;
  }

  /**
   * Clear authentication token
   */
  clearAuth(): this {
    this.authToken = null;
    return this;
  }

  /**
   * Make authenticated GET request
   */
  get(url: string): request.Test {
    const req = this.request.get(url);
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    return req;
  }

  /**
   * Make authenticated POST request
   */
  post(url: string): request.Test {
    const req = this.request.post(url);
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    return req;
  }

  /**
   * Make authenticated PUT request
   */
  put(url: string): request.Test {
    const req = this.request.put(url);
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    return req;
  }

  /**
   * Make authenticated PATCH request
   */
  patch(url: string): request.Test {
    const req = this.request.patch(url);
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    return req;
  }

  /**
   * Make authenticated DELETE request
   */
  delete(url: string): request.Test {
    const req = this.request.delete(url);
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    return req;
  }
}

/**
 * Test session manager for handling user authentication in tests
 */
export class TestSession {
  private testRequest: TestRequest;
  private user: any = null;
  private tokens: { accessToken?: string; refreshToken?: string } = {};

  constructor(testRequest: TestRequest) {
    this.testRequest = testRequest;
  }

  /**
   * Login with credentials and store tokens
   */
  async login(email: string, password: string): Promise<void> {
    const response = await this.testRequest
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    this.user = response.body.data.user;
    this.tokens.accessToken = response.body.data.accessToken;
    this.tokens.refreshToken = response.body.data.refreshToken;

    // Set auth token for subsequent requests
    this.testRequest.setAuthToken(this.tokens.accessToken!);
  }

  /**
   * Register new user and login
   */
  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
    await this.testRequest
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    // Login with new user
    await this.login(userData.email, userData.password);
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    if (this.tokens.accessToken) {
      await this.testRequest
        .post('/api/auth/logout')
        .send({ refreshToken: this.tokens.refreshToken })
        .expect(200);
    }

    this.user = null;
    this.tokens = {};
    this.testRequest.clearAuth();
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<void> {
    if (!this.tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.testRequest
      .post('/api/auth/refresh')
      .send({ refreshToken: this.tokens.refreshToken })
      .expect(200);

    this.tokens.accessToken = response.body.data.accessToken;
    this.tokens.refreshToken = response.body.data.refreshToken;

    // Update auth token
    this.testRequest.setAuthToken(this.tokens.accessToken!);
  }

  /**
   * Get current user
   */
  getUser(): any {
    return this.user;
  }

  /**
   * Get current tokens
   */
  getTokens(): { accessToken?: string; refreshToken?: string } {
    return { ...this.tokens };
  }

  /**
   * Check if session is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.user && this.tokens.accessToken);
  }

  /**
   * Get test request instance
   */
  getRequest(): TestRequest {
    return this.testRequest;
  }
}

// Helper functions
export const createTestServer = () => TestServer.getInstance();

export const createTestRequest = (app: express.Application) => new TestRequest(app);

export const createTestSession = (testRequest: TestRequest) => new TestSession(testRequest);

// Export singleton for easy access
export const testServer = TestServer.getInstance();