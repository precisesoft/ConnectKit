import { faker } from '@faker-js/faker';
import { User, UserRole } from '../../models/user.model';
import { Contact } from '../../models/contact.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Test data fixtures for generating consistent test data
 */
export class TestFixtures {
  /**
   * Generate a test user with optional overrides
   */
  static createUser(overrides: Partial<any> = {}): any {
    const defaultUser = {
      id: uuidv4(),
      username: faker.internet.userName(),
      email: faker.internet.email().toLowerCase(),
      password: 'TestPass123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: UserRole.USER,
      isActive: true,
      isVerified: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { ...defaultUser, ...overrides };
  }

  /**
   * Generate multiple test users
   */
  static createUsers(count: number, overrides: Partial<any> = {}): any[] {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  /**
   * Generate an admin user
   */
  static createAdminUser(overrides: Partial<any> = {}): any {
    return this.createUser({
      role: UserRole.ADMIN,
      ...overrides,
    });
  }

  /**
   * Generate a locked user account
   */
  static createLockedUser(overrides: Partial<any> = {}): any {
    return this.createUser({
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      ...overrides,
    });
  }

  /**
   * Generate an unverified user
   */
  static createUnverifiedUser(overrides: Partial<any> = {}): any {
    return this.createUser({
      isVerified: false,
      emailVerificationToken: faker.string.uuid(),
      ...overrides,
    });
  }

  /**
   * Generate a user with password reset token
   */
  static createUserWithResetToken(overrides: Partial<any> = {}): any {
    return this.createUser({
      passwordResetToken: faker.string.uuid(),
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      ...overrides,
    });
  }

  /**
   * Generate a test contact
   */
  static createContact(userId?: string, overrides: Partial<any> = {}): any {
    const defaultContact = {
      id: uuidv4(),
      userId: userId || uuidv4(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      phone: faker.phone.number(),
      company: faker.company.name(),
      notes: faker.lorem.paragraph(),
      isFavorite: false,
      tags: [],
      socialMedia: {
        linkedin: faker.internet.url(),
        twitter: faker.internet.url(),
      },
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { ...defaultContact, ...overrides };
  }

  /**
   * Generate multiple test contacts
   */
  static createContacts(
    count: number,
    userId?: string,
    overrides: Partial<any> = {}
  ): any[] {
    return Array.from({ length: count }, () =>
      this.createContact(userId, overrides)
    );
  }

  /**
   * Generate a favorite contact
   */
  static createFavoriteContact(
    userId?: string,
    overrides: Partial<any> = {}
  ): any {
    return this.createContact(userId, {
      isFavorite: true,
      ...overrides,
    });
  }

  /**
   * Generate login credentials for a user
   */
  static createLoginCredentials(user?: any): {
    email: string;
    password: string;
  } {
    return {
      email: user?.email || faker.internet.email().toLowerCase(),
      password: user?.password || 'TestPass123!',
    };
  }

  /**
   * Generate registration data
   */
  static createRegistrationData(overrides: Partial<any> = {}): any {
    const defaultData = {
      username: faker.internet.userName(),
      email: faker.internet.email().toLowerCase(),
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    };

    const data = { ...defaultData, ...overrides };

    // Ensure passwords match if not explicitly set
    if (!overrides.confirmPassword && overrides.password) {
      data.confirmPassword = data.password;
    }

    return data;
  }

  /**
   * Generate password change data
   */
  static createPasswordChangeData(overrides: Partial<any> = {}): any {
    const newPassword = 'NewPass123!';

    return {
      currentPassword: 'TestPass123!',
      newPassword,
      confirmPassword: newPassword,
      ...overrides,
    };
  }

  /**
   * Generate forgot password request
   */
  static createForgotPasswordData(email?: string): { email: string } {
    return {
      email: email || faker.internet.email().toLowerCase(),
    };
  }

  /**
   * Generate reset password data
   */
  static createResetPasswordData(
    token?: string,
    overrides: Partial<any> = {}
  ): any {
    const newPassword = 'ResetPass123!';

    return {
      token: token || faker.string.uuid(),
      newPassword,
      confirmPassword: newPassword,
      ...overrides,
    };
  }

  /**
   * Generate JWT payload
   */
  static createJwtPayload(user?: any): any {
    return {
      sub: user?.id || uuidv4(),
      email: user?.email || faker.internet.email().toLowerCase(),
      username: user?.username || faker.internet.userName(),
      role: user?.role || UserRole.USER,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      jti: uuidv4(),
    };
  }

  /**
   * Generate API error response
   */
  static createApiError(message: string, status: number = 400): any {
    return {
      success: false,
      message,
      status,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate API success response
   */
  static createApiSuccess<T = any>(data: T, message: string = 'Success'): any {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate test database seed data
   */
  static createSeedData(
    options: {
      usersCount?: number;
      contactsPerUser?: number;
      includeAdmin?: boolean;
    } = {}
  ): any {
    const {
      usersCount = 3,
      contactsPerUser = 5,
      includeAdmin = true,
    } = options;

    const users = this.createUsers(usersCount);

    if (includeAdmin) {
      users.push(
        this.createAdminUser({
          username: 'admin',
          email: 'admin@connectkit.com',
        })
      );
    }

    // Hash passwords for database storage
    const hashedUsers = users.map(user => ({
      ...user,
      passwordHash:
        '$2b$10$rJZEXf4vG.yQ8Zx9MjY2nO8qh5B6Y9O2X1K4V3J7L8M9N0P2Q3R4S5T6', // hashed 'TestPass123!'
    }));

    const contacts: any[] = [];
    hashedUsers.forEach(user => {
      const userContacts = this.createContacts(contactsPerUser, user.id);
      contacts.push(...userContacts);
    });

    return {
      users: hashedUsers,
      contacts,
    };
  }

  /**
   * Generate performance test data
   */
  static createPerformanceTestData(
    userCount: number,
    contactsPerUser: number
  ): any {
    return this.createSeedData({
      usersCount: userCount,
      contactsPerUser,
      includeAdmin: false,
    });
  }

  /**
   * Generate test data with specific scenarios
   */
  static createScenarioData(): any {
    const regularUser = this.createUser({
      username: 'testuser',
      email: 'test@example.com',
    });

    const adminUser = this.createAdminUser({
      username: 'adminuser',
      email: 'admin@example.com',
    });

    const lockedUser = this.createLockedUser({
      username: 'lockeduser',
      email: 'locked@example.com',
    });

    const unverifiedUser = this.createUnverifiedUser({
      username: 'unverifieduser',
      email: 'unverified@example.com',
    });

    const users = [regularUser, adminUser, lockedUser, unverifiedUser];

    // Hash passwords
    const hashedUsers = users.map(user => ({
      ...user,
      passwordHash:
        '$2b$10$rJZEXf4vG.yQ8Zx9MjY2nO8qh5B6Y9O2X1K4V3J7L8M9N0P2Q3R4S5T6',
    }));

    const contacts = [
      ...this.createContacts(3, regularUser.id),
      ...this.createContacts(2, adminUser.id),
      this.createFavoriteContact(regularUser.id),
    ];

    return {
      users: hashedUsers,
      contacts,
      scenarios: {
        regularUser,
        adminUser,
        lockedUser,
        unverifiedUser,
      },
    };
  }
}

// Named exports for convenience
export const {
  createUser,
  createUsers,
  createAdminUser,
  createLockedUser,
  createUnverifiedUser,
  createUserWithResetToken,
  createContact,
  createContacts,
  createFavoriteContact,
  createLoginCredentials,
  createRegistrationData,
  createPasswordChangeData,
  createForgotPasswordData,
  createResetPasswordData,
  createJwtPayload,
  createApiError,
  createApiSuccess,
  createSeedData,
  createPerformanceTestData,
  createScenarioData,
} = TestFixtures;
