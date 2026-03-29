import { Page, expect } from '@playwright/test';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: new RegExp(`^Pelaajatilastot: ${escapeRegExp(expectedTeam)}$`),
    }),
  ).toBeVisible({ timeout: 10000 });
}
