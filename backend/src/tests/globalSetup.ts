import { config } from 'dotenv';
import { testDb } from './utils/testDb';
import { redisConnection } from '../config/redis.config';
import { logger } from '../utils/logger';

/**
 * Global test setup - runs once before all tests
 */
export default async function globalSetup() {
  try {
    console.log('🧪 Setting up test environment...');

    // Load test environment variables
    config({ path: '.env.test' });

    // Override environment for tests
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

    // Test database configuration
    process.env.DB_NAME = process.env.TEST_DB_NAME || 'connectkit_test';
    process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
    process.env.DB_PORT = process.env.TEST_DB_PORT || '5432';
    process.env.DB_USER = process.env.TEST_DB_USER || 'postgres';
    process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';

    // Redis test configuration
    process.env.REDIS_HOST = process.env.TEST_REDIS_HOST || 'localhost';
    process.env.REDIS_PORT = process.env.TEST_REDIS_PORT || '6379';
    process.env.REDIS_DB = process.env.TEST_REDIS_DB || '1';

    // JWT test secrets
    process.env.JWT_SECRET = process.env.TEST_JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
    process.env.JWT_REFRESH_SECRET = process.env.TEST_JWT_REFRESH_SECRET || 'test-refresh-secret-key-for-testing-only';
    process.env.ENCRYPTION_KEY = process.env.TEST_ENCRYPTION_KEY || 'test-encryption-key-32-chars-long';

    // Initialize test database
    console.log('📊 Initializing test database...');
    await testDb.initialize();

    // Initialize Redis connection
    console.log('🔴 Connecting to test Redis...');
    await redisConnection.initialize();

    // Clean up any existing test data
    console.log('🧹 Cleaning up test environment...');
    await testDb.cleanup();
    
    const redis = redisConnection.getClient();
    await redis.flushdb();

    console.log('✅ Test environment setup completed successfully');
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    process.exit(1);
  }
}

/**
 * Setup function for creating test database schema
 */
export async function setupTestSchema(): Promise<void> {
  try {
    console.log('🗄️  Creating test database schema...');

    const schemaQueries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        last_login_at TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        email_verification_token VARCHAR(255),
        two_factor_secret VARCHAR(255),
        two_factor_enabled BOOLEAN DEFAULT false,
        backup_codes TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Contacts table
      `CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        company VARCHAR(255),
        notes TEXT,
        is_favorite BOOLEAN DEFAULT false,
        tags TEXT[],
        social_media JSONB,
        address JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // User sessions table (for tracking active sessions)
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_id VARCHAR(255) UNIQUE NOT NULL,
        device_info TEXT,
        ip_address INET,
        location VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Password reset tokens table
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Email verification tokens table
      `CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
      `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
      `CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)`,
      `CREATE INDEX IF NOT EXISTS idx_contacts_favorite ON contacts(is_favorite)`,
      `CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_user_sessions_token_id ON user_sessions(token_id)`,
      `CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)`,
      `CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token)`,

      // Updated timestamp triggers
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
       RETURNS TRIGGER AS $$
       BEGIN
         NEW.updated_at = CURRENT_TIMESTAMP;
         RETURN NEW;
       END;
       $$ language 'plpgsql'`,

      `CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

      `CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
    ];

    for (const query of schemaQueries) {
      await testDb.query(query);
    }

    console.log('✅ Test database schema created successfully');
  } catch (error) {
    console.error('❌ Failed to create test database schema:', error);
    throw error;
  }
}

/**
 * Utility function to wait for services to be ready
 */
async function waitForServices(): Promise<void> {
  const maxRetries = 30;
  const retryDelay = 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Test database connection
      await testDb.query('SELECT 1');
      
      // Test Redis connection
      const redis = redisConnection.getClient();
      await redis.ping();

      console.log('✅ All services are ready');
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`Services not ready after ${maxRetries} attempts: ${error}`);
      }
      
      console.log(`⏳ Waiting for services... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}