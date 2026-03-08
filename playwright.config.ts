import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:4200';
const useExternalServer = process.env['PLAYWRIGHT_EXTERNAL_SERVER'] === '1';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only */
  retries: process.env['CI'] ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env['CI'] ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env['CI']
    ? [['html', { open: 'never' }], ['list']]
    : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* In CI: serve the production build; locally: run Angular dev server */
  webServer: process.env['CI']
    ? {
        command: 'python3 -m http.server 4200 --directory dist/fantrax-stats-parser-ui/browser',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 30000,
      }
    : (useExternalServer
        ? undefined
        : {
            command: 'npm start',
            url: baseURL,
            reuseExistingServer: true,
            timeout: 120000,
          }),

  /* Configure Playwright for Chromium only */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
