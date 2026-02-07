import { test, expect } from '../fixtures/test-fixture';
import { DEFAULT_TEAM, TAB_LABELS } from '../config/test-data';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with correct title and heading', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/FFHL tilastopalvelu/);

    // Check heading
    await expect(
      page.getByRole('heading', { name: /FFHL tilastopalvelu/ })
    ).toBeVisible();

    // Check default team is selected
    await expect(
      page.getByRole('combobox', { name: 'Joukkue' })
    ).toContainText(DEFAULT_TEAM);
  });

  test('navigation tabs are visible', async ({ page }) => {
    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(
      page.getByRole('tab', { name: TAB_LABELS.PLAYERS })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: TAB_LABELS.GOALIES })
    ).toBeVisible();
  });

  test('top controls are visible', async ({ page }) => {
    // Team selector
    await expect(page.getByRole('combobox', { name: 'Joukkue' })).toBeVisible();

    // Season selector
    await expect(
      page.getByRole('combobox', { name: 'Kausivalitsin' })
    ).toBeVisible();

    // Report type selector
    await expect(
      page.getByRole('combobox', { name: 'Stats report type' })
    ).toBeVisible();
  });

  test('table renders with data', async ({ page }) => {
    // Search input visible
    await expect(page.getByLabel('Pelaajahaku')).toBeVisible();

    // Table visible
    await expect(page.getByRole('table')).toBeVisible();

    // At least one data row
    const rows = page.locator('tr[mat-row]');
    await rows.first().waitFor({ state: 'visible', timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('basic tab switching works', async ({ page }) => {
    const playerTab = page.getByRole('tab', { name: TAB_LABELS.PLAYERS });
    const goalieTab = page.getByRole('tab', { name: TAB_LABELS.GOALIES });

    // Switch to goalies
    await goalieTab.click();
    await expect(page).toHaveURL(/.*\/goalie-stats$/);

    // Switch back to players
    await playerTab.click();
    await expect(page).toHaveURL(/.*\/player-stats$/);
  });
});
