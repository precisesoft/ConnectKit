import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🎭 Starting Playwright global teardown...');

  try {
    // Cleanup any global test data
    // This is where you could clean up test databases, files, etc.
    // Example: Clean up test files
    // await fs.promises.rm('./test-uploads', { recursive: true, force: true });
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here - we don't want to fail the entire test suite
    // if cleanup fails
  }

  console.log('🎭 Playwright global teardown complete');
}

export default globalTeardown;
