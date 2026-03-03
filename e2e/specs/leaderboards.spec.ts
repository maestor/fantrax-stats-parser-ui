import { test, expect } from '../fixtures/test-fixture';
import { LEADERBOARD_LABELS } from '../config/test-data';

test.describe('Leaderboards', () => {
  test('full flow: redirect, regular table with position tie logic, tab switch, playoffs table', async ({ page }) => {
    // /leaderboards redirects to regular
    await page.goto('/leaderboards');
    await expect(page).toHaveURL(/\/leaderboards\/regular/);

    // regular tab is active and table has data
    const regularTab = page.getByRole('tab', { name: LEADERBOARD_LABELS.REGULAR });
    await expect(regularTab).toHaveAttribute('aria-selected', 'true');
    const rows = page.locator('tr[mat-row]');
    await rows.first().waitFor({ state: 'visible', timeout: 10000 });
    expect(await rows.count()).toBeGreaterThan(0);

    // position tie logic is correct on regular table
    const positionCells = page.locator('tr[mat-row] td:first-child');
    const positions: string[] = [];
    const count = await positionCells.count();
    for (let i = 0; i < count; i++) {
      positions.push((await positionCells.nth(i).textContent() ?? '').trim());
    }
    const numericPositions = positions.filter(p => /^\d+$/.test(p)).map(Number);
    expect(numericPositions.length).toBeGreaterThan(0);
    expect(numericPositions[0]).toBe(1);
    // Tie rows may be present (blank position) depending on fixture/live data.
    expect(positions.every((p) => p === '' || /^\d+$/.test(p))).toBe(true);

    // regular table: expandable season details (multiple open rows)
    const regularRows = page.locator('tr[mat-row]:not(.expanded-detail-row)');
    await regularRows.nth(0).click();
    await expect(page.locator('.expanded-season-row').first()).toBeVisible();

    await regularRows.nth(1).click();
    await expect(regularRows.nth(0)).toHaveAttribute('aria-expanded', 'true');
    await expect(regularRows.nth(1)).toHaveAttribute('aria-expanded', 'true');

    // switch to Playoffs tab
    const playoffsTab = page.getByRole('tab', { name: LEADERBOARD_LABELS.PLAYOFFS });
    await playoffsTab.click();
    await expect(page).toHaveURL(/\/leaderboards\/playoffs/);
    await expect(playoffsTab).toHaveAttribute('aria-selected', 'true');

    // playoffs table has data
    await rows.first().waitFor({ state: 'visible', timeout: 10000 });
    expect(await rows.count()).toBeGreaterThan(0);

    // playoffs table: season details include trophy marker only for championship seasons
    const playoffRows = page.locator('tr[mat-row]:not(.expanded-detail-row)');
    await playoffRows.nth(0).click();

    const playoffSeasonRows = page.locator('.expanded-season-row');
    await expect(playoffSeasonRows.first()).toBeVisible();

    const trophyMarkers = page.locator('.expanded-season-secondary', { hasText: '🏆' });
    const playoffRowsCount = await playoffSeasonRows.count();
    const trophyCount = await trophyMarkers.count();
    expect(trophyCount).toBeGreaterThan(0);
    expect(playoffRowsCount).toBeGreaterThan(trophyCount);
  });

  test('direct URL /leaderboards/regular loads without redirect', async ({ page }) => {
    await page.goto('/leaderboards/regular');
    await expect(page).toHaveURL(/\/leaderboards\/regular/);
    await page.locator('tr[mat-row]').first().waitFor({ state: 'visible', timeout: 10000 });
  });
});
