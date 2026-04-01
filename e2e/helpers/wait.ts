import { Page } from '@playwright/test';

/**
 * Wait for filter updates to complete
 */
export async function waitForFilterUpdate(page: Page): Promise<void> {
  // Wait a bit for Angular to process filter changes
  await page.waitForTimeout(300);
}
