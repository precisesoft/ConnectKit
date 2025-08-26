import { User, UserRole, CreateUserDTO, UpdateUserDTO } from '../user.model';
import bcrypt from 'bcrypt';

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a valid user with required fields', () => {
      const userData: CreateUserDTO = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userData);

      expect(user.email).toBe(userData.email);
      expect(user.username).toBe(userData.username);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(UserRole.USER);
      expect(user.isActive).toBe(true);
      expect(user.isVerified).toBe(false);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should hash the password on creation', async () => {
      const userData: CreateUserDTO = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userData);
      await user.hashPassword();

      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(userData.password);

      const isValid = await bcrypt.compare(
        userData.password,
        user.passwordHash!
      );
      expect(isValid).toBe(true);
    });

    it('should validate email format', () => {
      const invalidEmails = ['invalid', 'test@', '@example.com', 'test@.com'];

      invalidEmails.forEach(email => {
        expect(() => {
          new User({
            email,
            username: 'testuser',
            password: 'SecurePass123!',
            firstName: 'John',
            lastName: 'Doe',
          });
        }).toThrow('Invalid email format');
      });
    });

    it('should validate password strength', () => {
      const weakPasswords = ['weak', '12345678', 'password', 'Password1'];

      weakPasswords.forEach(password => {
        expect(() => {
          new User({
            email: 'test@example.com',
            username: 'testuser',
            password,
            firstName: 'John',
            lastName: 'Doe',
          });
        }).toThrow(
          'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
        );
      });
    });
  });

  describe('Password Management', () => {
    let user: User;

    beforeEach(() => {
      user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should verify correct password', async () => {
      await user.hashPassword();
      const isValid = await user.verifyPassword('SecurePass123!');
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      await user.hashPassword();
      const isValid = await user.verifyPassword('WrongPassword123!');
      expect(isValid).toBe(false);
    });

    it('should handle failed login attempts', () => {
      user.incrementFailedLoginAttempts();
      expect(user.failedLoginAttempts).toBe(1);

      for (let i = 0; i < 4; i++) {
        user.incrementFailedLoginAttempts();
      }

      expect(user.failedLoginAttempts).toBe(5);
      expect(user.isLocked()).toBe(true);
      expect(user.lockedUntil).toBeInstanceOf(Date);
    });

    it('should reset failed login attempts on successful login', () => {
      user.failedLoginAttempts = 3;
      user.resetFailedLoginAttempts();

      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
    });
  });

  describe('User Updates', () => {
    let user: User;

    beforeEach(() => {
      user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should update user fields', () => {
      const updateData: UpdateUserDTO = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567890',
      };

      user.update(updateData);

      expect(user.firstName).toBe('Jane');
      expect(user.lastName).toBe('Smith');
      expect(user.phone).toBe('+1234567890');
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should not update email or username directly', () => {
      const originalEmail = user.email;
      const originalUsername = user.username;

      user.update({
        email: 'newemail@example.com',
        username: 'newusername',
      } as any);

      expect(user.email).toBe(originalEmail);
      expect(user.username).toBe(originalUsername);
    });
  });

  describe('User Verification', () => {
    let user: User;

    beforeEach(() => {
      user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should generate verification token', () => {
      const token = user.generateVerificationToken();

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(32);
      expect(user.verificationToken).toBe(token);
    });

    it('should verify user with correct token', () => {
      const token = user.generateVerificationToken();
      const result = user.verifyEmail(token);

      expect(result).toBe(true);
      expect(user.isVerified).toBe(true);
      expect(user.verificationToken).toBeNull();
    });

    it('should not verify user with incorrect token', () => {
      user.generateVerificationToken();
      const result = user.verifyEmail('wrong-token');

      expect(result).toBe(false);
      expect(user.isVerified).toBe(false);
    });
  });

  describe('Password Reset', () => {
    let user: User;

    beforeEach(() => {
      user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should generate password reset token', () => {
      const token = user.generatePasswordResetToken();

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(32);
      expect(user.resetPasswordToken).toBe(token);
      expect(user.resetPasswordExpires).toBeInstanceOf(Date);

      const expiresIn = user.resetPasswordExpires!.getTime() - Date.now();
      expect(expiresIn).toBeGreaterThan(3500000); // ~1 hour
      expect(expiresIn).toBeLessThan(3700000);
    });

    it('should reset password with valid token', async () => {
      const token = user.generatePasswordResetToken();
      const newPassword = 'NewSecurePass123!';

      const result = await user.resetPassword(token, newPassword);

      expect(result).toBe(true);
      expect(user.resetPasswordToken).toBeNull();
      expect(user.resetPasswordExpires).toBeNull();

      const isValid = await user.verifyPassword(newPassword);
      expect(isValid).toBe(true);
    });

    it('should not reset password with invalid token', async () => {
      user.generatePasswordResetToken();
      const result = await user.resetPassword('wrong-token', 'NewPass123!');

      expect(result).toBe(false);
      expect(user.resetPasswordToken).not.toBeNull();
    });

    it('should not reset password with expired token', async () => {
      const token = user.generatePasswordResetToken();
      user.resetPasswordExpires = new Date(Date.now() - 1000); // Expired

      const result = await user.resetPassword(token, 'NewPass123!');

      expect(result).toBe(false);
    });
  });

  describe('Soft Delete', () => {
    it('should soft delete user', () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      user.softDelete();

      expect(user.deletedAt).toBeInstanceOf(Date);
      expect(user.isDeleted()).toBe(true);
    });

    it('should restore soft deleted user', () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      user.softDelete();
      expect(user.isDeleted()).toBe(true);

      user.restore();
      expect(user.deletedAt).toBeNull();
      expect(user.isDeleted()).toBe(false);
    });
  });

  describe('User Serialization', () => {
    it('should serialize user without sensitive data', () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      user.passwordHash = 'hashed-password';
      user.verificationToken = 'verification-token';
      user.resetPasswordToken = 'reset-token';
      user.mfaSecret = 'mfa-secret';

      const serialized = user.toJSON();

      expect(serialized.email).toBe('test@example.com');
      expect(serialized.username).toBe('testuser');
      expect(serialized.firstName).toBe('John');
      expect(serialized.lastName).toBe('Doe');
      expect(serialized.passwordHash).toBeUndefined();
      expect(serialized.verificationToken).toBeUndefined();
      expect(serialized.resetPasswordToken).toBeUndefined();
      expect(serialized.mfaSecret).toBeUndefined();
    });
  });
});
