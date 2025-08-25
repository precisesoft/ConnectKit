import { testDb } from './utils/testDb';
import { redisConnection } from '../config/redis.config';

/**
 * Global test teardown - runs once after all tests
 */
export default async function globalTeardown() {
  try {
    console.log('🧹 Tearing down test environment...');

    // Clean up test data
    console.log('🗑️  Cleaning up test data...');
    await testDb.cleanup();

    // Clear Redis test database
    try {
      const redis = redisConnection.getClient();
      await redis.flushdb();
      console.log('✅ Redis test database cleared');
    } catch (error) {
      console.log('⚠️  Redis cleanup skipped (not connected)');
    }

    // Close database connections
    console.log('📊 Closing database connections...');
    await testDb.close();

    // Close Redis connections
    console.log('🔴 Closing Redis connections...');
    await redisConnection.disconnect();

    // Wait a bit for connections to close gracefully
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('✅ Test environment teardown completed');
  } catch (error) {
    console.error('❌ Error during test teardown:', error);
    // Don't exit with error code as this might hide test failures
  }
}

/**
 * Cleanup function for emergency situations
 */
export async function forceCleanup(): Promise<void> {
  try {
    console.log('⚠️  Performing force cleanup...');

    // Force close all connections
    const closePromises = [
      testDb.close().catch(() => {}),
      redisConnection.disconnect().catch(() => {}),
    ];

    await Promise.allSettled(closePromises);

    console.log('✅ Force cleanup completed');
  } catch (error) {
    console.error('❌ Force cleanup failed:', error);
  }
}

// Handle unexpected exits
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, performing cleanup...');
  await forceCleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, performing cleanup...');
  await forceCleanup();
  process.exit(0);
});

process.on('uncaughtException', async error => {
  console.error('💥 Uncaught exception:', error);
  await forceCleanup();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  await forceCleanup();
  process.exit(1);
});
