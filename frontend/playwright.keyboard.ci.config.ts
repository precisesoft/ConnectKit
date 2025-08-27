import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/accessibility',
  testMatch: '**/keyboard.spec.ts',
  fullyParallel: false,
  forbidOnly: true,
  retries: 2,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'keyboard-ci-results.json' }]],
  use: {
    baseURL: 'http://localhost:3004',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  timeout: 60000,
});
