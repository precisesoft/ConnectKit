import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

export interface CreateUserDTO {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

export class User {
  id: string;
  email: string;
  username: string;
  passwordHash?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  verificationToken: string | null;
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  private password?: string;

  constructor(data: CreateUserDTO, skipValidation: boolean = false) {
    this.validateEmail(data.email);
    if (!skipValidation) {
      this.validatePassword(data.password);
    }

    this.id = uuidv4();
    this.email = data.email.toLowerCase();
    this.username = data.username.toLowerCase();
    this.password = data.password;
    this.role = data.role || UserRole.USER;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.phone = data.phone;
    this.isActive = true;
    this.isVerified = false;
    this.verificationToken = null;
    this.resetPasswordToken = null;
    this.resetPasswordExpires = null;
    this.mfaEnabled = false;
    this.mfaSecret = null;
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
    this.lastLoginAt = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  private validatePassword(password: string): void {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
    }
  }

  async hashPassword(): Promise<void> {
    if (!this.password) {
      throw new Error('Password is required for hashing');
    }
    const saltRounds = 10;
    this.passwordHash = await bcrypt.hash(this.password, saltRounds);
    this.password = undefined; // Clear plain password
  }

  async verifyPassword(password: string): Promise<boolean> {
    if (!this.passwordHash) {
      return false;
    }
    return bcrypt.compare(password, this.passwordHash);
  }

  incrementFailedLoginAttempts(): void {
    this.failedLoginAttempts++;
    
    if (this.failedLoginAttempts >= 5) {
      // Lock account for 30 minutes
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
    
    this.updatedAt = new Date();
  }

  resetFailedLoginAttempts(): void {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
    this.lastLoginAt = new Date();
    this.updatedAt = new Date();
  }

  isLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date());
  }

  generateVerificationToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.verificationToken = token;
    this.updatedAt = new Date();
    return token;
  }

  verifyEmail(token: string): boolean {
    if (this.verificationToken === token) {
      this.isVerified = true;
      this.verificationToken = null;
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  generatePasswordResetToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = token;
    this.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    this.updatedAt = new Date();
    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    if (
      this.resetPasswordToken !== token ||
      !this.resetPasswordExpires ||
      this.resetPasswordExpires < new Date()
    ) {
      return false;
    }

    this.validatePassword(newPassword);
    this.password = newPassword;
    await this.hashPassword();
    
    this.resetPasswordToken = null;
    this.resetPasswordExpires = null;
    this.updatedAt = new Date();
    
    return true;
  }

  update(data: UpdateUserDTO): void {
    if (data.firstName !== undefined) this.firstName = data.firstName;
    if (data.lastName !== undefined) this.lastName = data.lastName;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.isActive !== undefined) this.isActive = data.isActive;
    
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore(): void {
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  toJSON(): any {
    const obj = { ...this };
    delete (obj as any).passwordHash;
    delete (obj as any).password;
    delete (obj as any).verificationToken;
    delete (obj as any).resetPasswordToken;
    delete (obj as any).resetPasswordExpires;
    delete (obj as any).mfaSecret;
    return obj;
  }
}