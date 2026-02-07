import { test as base } from '@playwright/test';
import { setupApiMocks } from '../mocks/api-mock';

/**
 * Custom Playwright test fixture that automatically sets up API mocking in CI.
 *
 * In CI (process.env.CI is set), all requests to the backend API are intercepted
 * and served from local JSON fixture files. Locally, tests hit the live backend.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    if (process.env['CI']) {
      await setupApiMocks(page);
    }
    await use(page);
  },
});

export { expect } from '@playwright/test';
