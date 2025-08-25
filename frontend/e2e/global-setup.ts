import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🎭 Starting Playwright global setup...');

  // Start browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the dev server to be ready
    console.log('⏳ Waiting for dev server to be ready...');
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000');

    // Verify the app is loaded
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('✅ Dev server is ready');

    // Setup test data or authentication state if needed
    // This is where you could login an admin user, create test data, etc.
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('🎭 Playwright global setup complete');
}

export default globalSetup;
