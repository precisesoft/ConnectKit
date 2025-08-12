import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshTokenExpiresIn: string;
  issuer: string;
  audience: string;
  algorithm: string;
}

export interface SessionConfig {
  secret: string;
  name: string;
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: boolean | 'strict' | 'lax' | 'none';
}

export interface SecurityConfig {
  bcryptRounds: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordResetExpiry: number;
  emailVerificationExpiry: number;
  mfaIssuer: string;
}

export interface OAuth2Config {
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  github: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}

export interface AuthConfig {
  jwt: JWTConfig;
  session: SessionConfig;
  security: SecurityConfig;
  oauth2: OAuth2Config;
}

class AuthConfiguration {
  private config: AuthConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): AuthConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      jwt: {
        secret: this.getJWTSecret(),
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: process.env.JWT_ISSUER || 'connectkit-api',
        audience: process.env.JWT_AUDIENCE || 'connectkit-app',
        algorithm: 'HS256',
      },
      
      session: {
        secret: this.getSessionSecret(),
        name: process.env.SESSION_NAME || 'connectkit.sid',
        maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24 hours
        secure: isProduction,
        httpOnly: true,
        sameSite: isProduction ? 'strict' : 'lax',
      },
      
      security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '1800000', 10), // 30 minutes
        passwordResetExpiry: parseInt(process.env.PASSWORD_RESET_EXPIRY || '3600000', 10), // 1 hour
        emailVerificationExpiry: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY || '86400000', 10), // 24 hours
        mfaIssuer: process.env.MFA_ISSUER || 'ConnectKit',
      },
      
      oauth2: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID || '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
        },
        github: {
          clientId: process.env.GITHUB_CLIENT_ID || '',
          clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
          redirectUri: process.env.GITHUB_REDIRECT_URI || '',
        },
      },
    };
  }

  private getJWTSecret(): string {
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production');
      }
      
      // Generate a random secret for development
      const generatedSecret = crypto.randomBytes(64).toString('hex');
      logger.warn('Using generated JWT secret for development. Set JWT_SECRET environment variable.');
      return generatedSecret;
    }
    
    return secret;
  }

  private getSessionSecret(): string {
    const secret = process.env.SESSION_SECRET;
    
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('SESSION_SECRET is required in production');
      }
      
      // Generate a random secret for development
      const generatedSecret = crypto.randomBytes(64).toString('hex');
      logger.warn('Using generated session secret for development. Set SESSION_SECRET environment variable.');
      return generatedSecret;
    }
    
    return secret;
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate JWT configuration
    if (this.config.jwt.secret.length < 32) {
      errors.push('JWT secret must be at least 32 characters long');
    }

    if (!this.isValidTimespan(this.config.jwt.expiresIn)) {
      errors.push('Invalid JWT expiration time format');
    }

    if (!this.isValidTimespan(this.config.jwt.refreshTokenExpiresIn)) {
      errors.push('Invalid JWT refresh token expiration time format');
    }

    // Validate session configuration
    if (this.config.session.secret.length < 32) {
      errors.push('Session secret must be at least 32 characters long');
    }

    if (this.config.session.maxAge < 60000) { // Less than 1 minute
      errors.push('Session max age must be at least 60000ms (1 minute)');
    }

    // Validate security configuration
    if (this.config.security.bcryptRounds < 10 || this.config.security.bcryptRounds > 15) {
      errors.push('Bcrypt rounds must be between 10 and 15');
    }

    if (this.config.security.maxLoginAttempts < 1) {
      errors.push('Max login attempts must be at least 1');
    }

    if (this.config.security.lockoutDuration < 60000) { // Less than 1 minute
      errors.push('Lockout duration must be at least 60000ms (1 minute)');
    }

    // Validate OAuth2 configuration for production
    if (process.env.NODE_ENV === 'production') {
      if (this.config.oauth2.google.clientId && !this.config.oauth2.google.clientSecret) {
        errors.push('Google OAuth client secret is required when client ID is provided');
      }
      
      if (this.config.oauth2.github.clientId && !this.config.oauth2.github.clientSecret) {
        errors.push('GitHub OAuth client secret is required when client ID is provided');
      }
    }

    if (errors.length > 0) {
      logger.error('Auth configuration validation failed:', { errors });
      throw new Error(`Auth configuration validation failed: ${errors.join(', ')}`);
    }

    logger.info('Auth configuration loaded successfully', {
      jwtExpiresIn: this.config.jwt.expiresIn,
      refreshTokenExpiresIn: this.config.jwt.refreshTokenExpiresIn,
      sessionMaxAge: this.config.session.maxAge,
      bcryptRounds: this.config.security.bcryptRounds,
      maxLoginAttempts: this.config.security.maxLoginAttempts,
    });
  }

  private isValidTimespan(timespan: string): boolean {
    // Simple validation for JWT timespan format (e.g., "1h", "30m", "7d")
    const timespanRegex = /^\d+[smhdw]$/;
    return timespanRegex.test(timespan);
  }

  getConfig(): AuthConfig {
    return { ...this.config };
  }

  getJWTConfig(): JWTConfig {
    return { ...this.config.jwt };
  }

  getSessionConfig(): SessionConfig {
    return { ...this.config.session };
  }

  getSecurityConfig(): SecurityConfig {
    return { ...this.config.security };
  }

  getOAuth2Config(): OAuth2Config {
    return {
      google: { ...this.config.oauth2.google },
      github: { ...this.config.oauth2.github },
    };
  }

  isOAuth2Enabled(provider: 'google' | 'github'): boolean {
    const config = this.config.oauth2[provider];
    return !!(config.clientId && config.clientSecret);
  }
}

export const authConfig = new AuthConfiguration();
export default authConfig;