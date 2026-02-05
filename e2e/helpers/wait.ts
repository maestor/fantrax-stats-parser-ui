import { Page } from '@playwright/test';

/**
 * Wait for filter updates to complete
 */
export async function waitForFilterUpdate(page: Page): Promise<void> {
  // Wait a bit for Angular to process filter changes
  await page.waitForTimeout(300);
}

/**
 * Wait for team change to complete
 */
export async function waitForTeamChange(
  page: Page,
  expectedTeam: string
): Promise<void> {
  // Wait for heading to update with new team name
  await page
    .getByRole('heading', { name: new RegExp(expectedTeam) })
    .waitFor({ state: 'visible', timeout: 10000 });
}
