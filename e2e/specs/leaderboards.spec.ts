import { test, expect } from '../fixtures/test-fixture';
import { LEADERBOARD_LABELS } from '../config/test-data';

test.describe('Leaderboards', () => {
  test('navigating to /leaderboards redirects to /leaderboards/playoffs', async ({ page }) => {
    await page.goto('/leaderboards');
    await expect(page).toHaveURL(/\/leaderboards\/playoffs/);
  });

  test('playoffs table loads with data and correct tab is active', async ({ page }) => {
    await page.goto('/leaderboards/playoffs');

    const playoffsTab = page.getByRole('tab', { name: LEADERBOARD_LABELS.PLAYOFFS });
    await expect(playoffsTab).toBeVisible();
    await expect(playoffsTab).toHaveAttribute('aria-current', 'page');

    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    const rows = page.locator('tr[mat-row]');
    await rows.first().waitFor({ state: 'visible', timeout: 10000 });
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('switching to Runkosarja tab loads regular table', async ({ page }) => {
    await page.goto('/leaderboards/playoffs');

    const regularTab = page.getByRole('tab', { name: LEADERBOARD_LABELS.REGULAR });
    await regularTab.click();

    await expect(page).toHaveURL(/\/leaderboards\/regular/);
    await expect(regularTab).toHaveAttribute('aria-current', 'page');

    const rows = page.locator('tr[mat-row]');
    await rows.first().waitFor({ state: 'visible', timeout: 10000 });
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('position column shows number for first tied team and empty for next', async ({ page }) => {
    await page.goto('/leaderboards/playoffs');
    await page.locator('tr[mat-row]').first().waitFor({ state: 'visible', timeout: 10000 });

    const positionCells = page.locator('tr[mat-row] td:first-child');
    const count = await positionCells.count();
    expect(count).toBeGreaterThan(0);

    const positions: string[] = [];
    for (let i = 0; i < count; i++) {
      positions.push((await positionCells.nth(i).textContent() ?? '').trim());
    }

    const numericPositions = positions.filter(p => /^\d+$/.test(p));
    expect(numericPositions.length).toBeGreaterThan(0);

    // fixture has tieRank: true for Tampa Bay Lightning (position 3)
    const emptyPositions = positions.filter(p => p === '');
    expect(emptyPositions.length).toBeGreaterThan(0);
  });

  test('direct URL /leaderboards/regular works without redirect', async ({ page }) => {
    await page.goto('/leaderboards/regular');
    await expect(page).toHaveURL(/\/leaderboards\/regular/);
    await page.locator('tr[mat-row]').first().waitFor({ state: 'visible', timeout: 10000 });
  });
});
