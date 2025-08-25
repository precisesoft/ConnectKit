import crypto from 'crypto';
import { SECURITY_CONSTANTS } from './constants';
import { logger } from './logger';

interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag: string;
}

interface DecryptionInput {
  encrypted: string;
  iv: string;
  tag: string;
}

class EncryptionService {
  private readonly algorithm = SECURITY_CONSTANTS.ENCRYPTION_ALGORITHM;
  private readonly keyLength = 32; // 256 bits
  private readonly key: Buffer;

  constructor() {
    this.key = this.getEncryptionKey();
  }

  private getEncryptionKey(): Buffer {
    const keyString = process.env.ENCRYPTION_KEY;

    if (!keyString) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'ENCRYPTION_KEY environment variable is required in production'
        );
      }

      // Generate a random key for development
      const generatedKey = crypto.randomBytes(this.keyLength).toString('hex');
      logger.warn(
        'Using generated encryption key for development. Set ENCRYPTION_KEY environment variable.'
      );
      return Buffer.from(generatedKey, 'hex');
    }

    if (keyString.length !== this.keyLength * 2) {
      // hex string length
      throw new Error(
        'ENCRYPTION_KEY must be 64 characters (32 bytes) in hex format'
      );
    }

    return Buffer.from(keyString, 'hex');
  }

  /**
   * Encrypt a string using AES-256-GCM
   */
  encrypt(text: string): EncryptionResult {
    try {
      const iv = crypto.randomBytes(SECURITY_CONSTANTS.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt a string using AES-256-GCM
   */
  decrypt(data: DecryptionInput): string {
    try {
      const iv = Buffer.from(data.iv, 'hex');
      const tag = Buffer.from(data.tag, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

      decipher.setAuthTag(tag);

      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt sensitive fields in an object
   */
  encryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: Array<keyof T>
  ): T {
    const encrypted = { ...obj };

    for (const field of fieldsToEncrypt) {
      const value = encrypted[field];
      if (value && typeof value === 'string') {
        const encryptedData = this.encrypt(value);
        encrypted[field] = JSON.stringify(encryptedData) as T[keyof T];
      }
    }

    return encrypted;
  }

  /**
   * Decrypt sensitive fields in an object
   */
  decryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: Array<keyof T>
  ): T {
    const decrypted = { ...obj };

    for (const field of fieldsToDecrypt) {
      const value = decrypted[field];
      if (value && typeof value === 'string') {
        try {
          const encryptedData = JSON.parse(value) as DecryptionInput;
          decrypted[field] = this.decrypt(encryptedData) as T[keyof T];
        } catch (error) {
          // If parsing fails, assume it's not encrypted
          logger.warn(`Failed to decrypt field ${String(field)}:`, error);
        }
      }
    }

    return decrypted;
  }

  /**
   * Generate a secure random token
   */
  generateToken(length: number = SECURITY_CONSTANTS.TOKEN_LENGTH): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a secure random salt
   */
  generateSalt(length: number = SECURITY_CONSTANTS.SALT_LENGTH): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a string using SHA-256
   */
  hash(text: string, salt?: string): string {
    const hash = crypto.createHash(SECURITY_CONSTANTS.HASH_ALGORITHM);
    hash.update(text);

    if (salt) {
      hash.update(salt);
    }

    return hash.digest('hex');
  }

  /**
   * Generate HMAC signature
   */
  generateHMAC(data: string, secret?: string): string {
    const key = secret || this.key.toString('hex');
    const hmac = crypto.createHmac(SECURITY_CONSTANTS.HASH_ALGORITHM, key);
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Generate a cryptographically secure UUID
   */
  generateSecureUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Generate a secure password
   */
  generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';

    // Ensure at least one character from each category
    password += this.getRandomChar(lowercase);
    password += this.getRandomChar(uppercase);
    password += this.getRandomChar(numbers);
    password += this.getRandomChar(symbols);

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += this.getRandomChar(allChars);
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }

  private getRandomChar(chars: string): string {
    const randomIndex = crypto.randomInt(0, chars.length);
    return chars[randomIndex];
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(
    data: any,
    fieldsToMask: string[] = ['password', 'token', 'secret']
  ): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item, fieldsToMask));
    }

    const masked = { ...data };

    for (const key in masked) {
      if (
        fieldsToMask.some(field =>
          key.toLowerCase().includes(field.toLowerCase())
        )
      ) {
        masked[key] = '***MASKED***';
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskSensitiveData(masked[key], fieldsToMask);
      }
    }

    return masked;
  }

  /**
   * Generate a secure API key
   */
  generateApiKey(): string {
    const prefix = 'ck_'; // ConnectKit prefix
    const timestamp = Date.now().toString(36);
    const random = this.generateToken(16);

    return `${prefix}${timestamp}_${random}`;
  }

  /**
   * Validate API key format
   */
  validateApiKeyFormat(apiKey: string): boolean {
    const apiKeyRegex = /^ck_[a-z0-9]+_[a-f0-9]{32}$/;
    return apiKeyRegex.test(apiKey);
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

// Export utility functions
export const {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  generateToken,
  generateSalt,
  hash,
  generateHMAC,
  verifyHMAC,
  generateSecureUUID,
  generateSecurePassword,
  maskSensitiveData,
  generateApiKey,
  validateApiKeyFormat,
} = encryptionService;

export { EncryptionResult, DecryptionInput };
