import { test, expect } from '../fixtures/test-fixture';
import { DEFAULT_TEAM, TAB_LABELS } from '../config/test-data';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with correct title, heading, nav tabs, and controls', async ({ page }) => {
    // Title and heading
    await expect(page).toHaveTitle(/FFHL tilastopalvelu/);
    await expect(
      page.getByRole('heading', { name: /FFHL tilastopalvelu/ })
    ).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: 'Joukkue' })
    ).toContainText(DEFAULT_TEAM);

    // Navigation tabs
    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(
      page.getByRole('tab', { name: TAB_LABELS.PLAYERS })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: TAB_LABELS.GOALIES })
    ).toBeVisible();

    // Top controls
    await expect(
      page.getByRole('combobox', { name: 'Kausivalitsin' })
    ).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: 'Stats report type' })
    ).toBeVisible();
  });

  test('table renders with data', async ({ page }) => {
    await expect(page.getByLabel('Pelaajahaku')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    const rows = page.locator('tr[mat-row]');
    await rows.first().waitFor({ state: 'visible', timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('basic tab switching works', async ({ page }) => {
    const playerTab = page.getByRole('tab', { name: TAB_LABELS.PLAYERS });
    const goalieTab = page.getByRole('tab', { name: TAB_LABELS.GOALIES });

    await goalieTab.click();
    await expect(page).toHaveURL(/.*\/goalie-stats$/);

    await playerTab.click();
    await expect(page).toHaveURL(/.*\/player-stats$/);
  });
});
