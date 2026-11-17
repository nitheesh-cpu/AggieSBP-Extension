import { defineConfig } from '@playwright/test';

// End-to-end tests load the real, built extension (build/) into Chromium.
// Run `npm run build` first. Extensions only work in a persistent context, which the
// `context` fixture in e2e/fixtures.ts creates, so there are no browser projects here.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './e2e/global-setup.ts',
  outputDir: './test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Each test gets its own browser profile, but Chromium with extensions is heavy on small CI runners.
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
