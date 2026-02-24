import { test, expect } from '../fixtures/test-fixture';
import { LEADERBOARD_LABELS } from '../config/test-data';

test.describe('Leaderboards', () => {
  test('full flow: redirect, playoffs table with position tie logic, tab switch, regular table', async ({ page }) => {
    // /leaderboards redirects to playoffs
    await page.goto('/leaderboards');
    await expect(page).toHaveURL(/\/leaderboards\/playoffs/);

    // playoffs tab is active and table has data
    const playoffsTab = page.getByRole('tab', { name: LEADERBOARD_LABELS.PLAYOFFS });
    await expect(playoffsTab).toHaveAttribute('aria-selected', 'true');
    const rows = page.locator('tr[mat-row]');
    await rows.first().waitFor({ state: 'visible', timeout: 10000 });
    expect(await rows.count()).toBeGreaterThan(0);

    // position tie logic is correct on playoffs table
    const positionCells = page.locator('tr[mat-row] td:first-child');
    const positions: string[] = [];
    const count = await positionCells.count();
    for (let i = 0; i < count; i++) {
      positions.push((await positionCells.nth(i).textContent() ?? '').trim());
    }
    expect(positions.some(p => /^\d+$/.test(p))).toBe(true);
    expect(positions.some(p => p === '')).toBe(true);

    // switch to Runkosarja tab
    const regularTab = page.getByRole('tab', { name: LEADERBOARD_LABELS.REGULAR });
    await regularTab.click();
    await expect(page).toHaveURL(/\/leaderboards\/regular/);
    await expect(regularTab).toHaveAttribute('aria-selected', 'true');

    // regular table has data
    await rows.first().waitFor({ state: 'visible', timeout: 10000 });
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('direct URL /leaderboards/regular loads without redirect', async ({ page }) => {
    await page.goto('/leaderboards/regular');
    await expect(page).toHaveURL(/\/leaderboards\/regular/);
    await page.locator('tr[mat-row]').first().waitFor({ state: 'visible', timeout: 10000 });
  });
});
