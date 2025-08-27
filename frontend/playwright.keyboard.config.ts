import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/accessibility',
  testMatch: '**/keyboard.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report-keyboard' }],
    ['json', { outputFile: 'keyboard-results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3004',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
});
