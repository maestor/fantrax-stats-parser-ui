import { test, expect } from '../fixtures/test-fixture';
import { TAB_LABELS } from '../config/test-data';
import { fi } from '../config/i18n';
import categoryFixture from '../fixtures/data/leaderboard--categories.json';

const fixtureSeasonLabel = `${categoryFixture.season}–${String((categoryFixture.season + 1) % 100).padStart(2, '0')}`;

test.describe('Team category stats', () => {
  test('loads regular category data, compares teams, and expands credited contributors', async ({ page }) => {
    const playerStatsRequests: string[] = [];
    page.on('request', (request) => {
      if (/\/(players|goalies)\//.test(new URL(request.url()).pathname)) {
        playerStatsRequests.push(request.url());
      }
    });

    await page.goto('/category-stats');
    await expect(page).toHaveURL(/\/category-stats$/);
    await expect(page.getByRole('tab', { name: TAB_LABELS.CATEGORY_STATS })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { level: 2 })).toContainText('Colorado Avalanche');
    await expect(page.getByRole('combobox', { name: fi('categoryStats.seasonLabel') })).toContainText(fixtureSeasonLabel);
    await expect(page.getByText('Colorado Avalanche')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    const comparison = page.getByRole('combobox', { name: fi('categoryStats.comparisonLabel') });
    await comparison.click();
    await page.getByRole('option', { name: 'Carolina Hurricanes' }).click();
    await expect(page.getByRole('columnheader', { name: 'Vertailu (CAR)' })).toBeVisible();
    await expect(page.getByRole('columnheader')).toHaveCount(5);
    await expect(page.getByRole('table')).not.toContainText('CAR:');
    const goalsRow = page.locator('tr[mat-row][data-row-key="goals"]');
    await expect(goalsRow).toContainText('275 (−16)');
    await expect(goalsRow).toContainText('186 (+89)');
    await expect(goalsRow).toContainText('5. (−1)');
    await expect(goalsRow).toContainText('212 (+63)');
    await expect(goalsRow.locator('.stats-table-delta-negative').first()).toHaveText('−16');
    await expect(goalsRow.locator('.stats-table-delta-positive').first()).toHaveText('+89');

    const goals = fi('tableColumn.goals');
    const goalsCategoryRow = page.locator('tr[mat-row][data-row-index]').filter({ hasText: goals });
    await goalsCategoryRow.click();
    await expect(goalsCategoryRow).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.expanded-season-row').first()).toBeVisible();

    expect(playerStatsRequests).toEqual([]);
  });
});
