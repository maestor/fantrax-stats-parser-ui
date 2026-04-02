import { test, expect } from '../fixtures/test-fixture';
import {
  A11Y_LABELS,
  DEFAULT_TEAM,
  FILTER_LABELS,
  NAV_LABELS,
  ROUTE_LABELS,
  SEARCH_LABELS,
  TAB_LABELS,
} from '../config/test-data';
import { SettingsDrawer } from '../page-objects/SettingsDrawer';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with correct title, heading, nav tabs, and controls', async ({ page }) => {
    const settingsDrawer = new SettingsDrawer(page);

    // Title and heading
    await expect(page).toHaveTitle(/FFHL tilastopalvelu/);
    await expect(
      page.getByRole('heading', { name: /FFHL tilastopalvelu/ })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: `${ROUTE_LABELS.PLAYER_STATS}: ${DEFAULT_TEAM}` })
    ).toBeVisible();
    await expect(page.getByLabel(A11Y_LABELS.OPEN_SETTINGS_DRAWER)).toBeVisible();

    // Navigation tabs
    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(
      page.getByRole('tab', { name: TAB_LABELS.PLAYERS })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: TAB_LABELS.GOALIES })
    ).toBeVisible();

    // Drawer controls
    await settingsDrawer.open();
    await expect(
      page.getByRole('combobox', { name: FILTER_LABELS.TEAM })
    ).toContainText(DEFAULT_TEAM);
    await expect(
      page.getByRole('combobox', { name: FILTER_LABELS.SEASON })
    ).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: FILTER_LABELS.REPORT_TYPE })
    ).toBeVisible();
    await settingsDrawer.close();
  });

  test('table renders with data and / key focuses search', async ({ page }) => {
    await expect(page.getByLabel(SEARCH_LABELS.PLAYER)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    const rows = page.locator('tr[mat-row]');
    await rows.first().waitFor({ state: 'visible', timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Press / to focus search field
    await page.keyboard.press('/');
    const searchInput = page.getByLabel(SEARCH_LABELS.PLAYER);
    await expect(searchInput).toBeFocused();
  });

  test('basic tab switching works', async ({ page }) => {
    const playerTab = page.getByRole('tab', { name: TAB_LABELS.PLAYERS });
    const goalieTab = page.getByRole('tab', { name: TAB_LABELS.GOALIES });

    await goalieTab.click();
    await expect(page).toHaveURL(/.*\/goalie-stats$/);

    await playerTab.click();
    await expect(page).toHaveURL(/.*\/player-stats$/);
  });

  test('global navigation opens career listings and career tabs switch between players and goalies', async ({ page }) => {
    const settingsDrawer = new SettingsDrawer(page);

    await page.getByRole('button', { name: A11Y_LABELS.OPEN_NAV_MENU }).click();
    const navDialog = page.getByRole('dialog').last();
    await expect(navDialog).toBeVisible();
    await navDialog.getByRole('button', { name: NAV_LABELS.PLAYER_CAREERS }).click();

    await expect(page).toHaveURL(/\/career\/players$/);
    await expect(page.getByLabel(A11Y_LABELS.OPEN_SETTINGS_DRAWER)).toBeVisible();
    await expect(page.getByLabel(SEARCH_LABELS.CAREER_PLAYER)).toBeVisible();

    await settingsDrawer.open();
    await expect(page.getByRole('combobox', { name: FILTER_LABELS.TEAM })).toBeVisible();
    await expect(page.getByRole('combobox', { name: FILTER_LABELS.SEASON })).toHaveCount(0);
    await settingsDrawer.close();

    const goalieCareerTab = page.getByRole('tab', { name: TAB_LABELS.CAREER_GOALIES });
    await goalieCareerTab.click();

    await expect(page).toHaveURL(/\/career\/goalies$/);
    await expect(page.getByLabel(SEARCH_LABELS.CAREER_PLAYER)).toBeVisible();
  });
});
