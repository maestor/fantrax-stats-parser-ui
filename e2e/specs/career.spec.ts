import { test, expect } from '../fixtures/test-fixture';
import { TAB_LABELS } from '../config/test-data';

test.describe('Career listings', () => {
  test('redirects /career to players, renders the table, and switches to goalie careers', async ({ page }) => {
    await page.goto('/career');
    await expect(page).toHaveURL(/\/career\/players$/);

    const playerTab = page.getByRole('tab', { name: TAB_LABELS.CAREER_PLAYERS });
    await expect(playerTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('Pelaajaurahaku')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Joukkue' })).toHaveCount(0);

    const playerRows = page.locator('tr[mat-row]');
    await playerRows.first().waitFor({ state: 'visible', timeout: 10000 });
    expect(await playerRows.count()).toBeGreaterThan(0);

    await page.getByLabel('Pelaajaurahaku').fill('Jamie');
    await expect(page.getByText('Jamie Benn')).toBeVisible();

    const goalieTab = page.getByRole('tab', { name: TAB_LABELS.CAREER_GOALIES });
    await goalieTab.click();

    await expect(page).toHaveURL(/\/career\/goalies$/);
    await expect(goalieTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('Maalivahtiurahaku')).toBeVisible();

    const goalieRows = page.locator('tr[mat-row]');
    await goalieRows.first().waitFor({ state: 'visible', timeout: 10000 });
    expect(await goalieRows.count()).toBeGreaterThan(0);
  });
});
