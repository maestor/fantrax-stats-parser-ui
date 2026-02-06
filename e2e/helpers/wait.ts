import { Page, expect } from '@playwright/test';

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
  // Wait for mobile team name display or visible combobox to show the expected team
  // On mobile, the combobox may be inside a closed drawer, so check .mobile-team-name first
  const mobileTeamName = page.locator('.mobile-team-name');
  const isMobile = (await mobileTeamName.count()) > 0;

  if (isMobile) {
    await expect(mobileTeamName).toHaveText(expectedTeam, { timeout: 10000 });
  } else {
    await page
      .getByRole('combobox', { name: 'Joukkue' })
      .waitFor({ state: 'visible', timeout: 10000 });
  }
}
