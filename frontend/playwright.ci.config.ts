import { defineConfig, devices } from '@playwright/test';

/**
 * CI-specific Playwright configuration that doesn't start its own dev server
 * The GitHub Actions workflow handles starting the frontend and backend
 */
export default defineConfig({
  // Test directories - include both e2e and accessibility tests
  testDir: './',
  testMatch: [
    'tests/**/*.spec.ts',
    'e2e/**/*.spec.ts',
    'tests/accessibility/**/*.spec.ts',
  ],

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: process.env.CI
    ? [['html'], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : 'html',

  // Shared settings for all the projects below
  use: {
    // Use the base URL from environment variable (set by GitHub Actions)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors during navigation
    ignoreHTTPSErrors: true,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Test against mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Test against branded browsers
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  // Global Setup to run before all tests (conditional for e2e tests)
  globalSetup:
    process.env.TEST_TYPE === 'accessibility'
      ? undefined
      : require.resolve('./e2e/global-setup.ts'),

  // Global Teardown to run after all tests (conditional for e2e tests)
  globalTeardown:
    process.env.TEST_TYPE === 'accessibility'
      ? undefined
      : require.resolve('./e2e/global-teardown.ts'),

  // NO webServer configuration - the CI workflow handles starting the servers
  // This prevents port conflicts when running tests in parallel

  // Test timeout
  timeout: 30000,

  // Global timeout for the whole test run
  globalTimeout: process.env.CI ? 60 * 60 * 1000 : undefined, // 1 hour on CI

  // Output folder for test artifacts
  outputDir: 'test-results/',

  // Accessibility testing specific config
  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 5000,

    toHaveScreenshot: {
      // Maximum difference in pixels
      maxDiffPixels: 100,
      // Threshold between 0-1
      threshold: 0.2,
    },
  },
});
