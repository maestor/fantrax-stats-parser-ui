import { test, expect } from '../fixtures/test-fixture';
import { TAB_LABELS } from '../config/test-data';

test.describe('Career listings', () => {
  test('redirects /career to players, renders the table, switches to highlights, and then to goalie careers', async ({ page }) => {
    await page.goto('/career');
    await expect(page).toHaveURL(/\/career\/players$/);

    const playerTab = page.getByRole('tab', { name: TAB_LABELS.CAREER_PLAYERS });
    await expect(playerTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('Pelaajahaku')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Joukkue' })).toHaveCount(0);

    const playerRows = page.locator('.virtual-table-row[data-row-index]');
    await playerRows.first().waitFor({ state: 'visible', timeout: 10000 });
    expect(await playerRows.count()).toBeGreaterThan(0);

    await page.getByLabel('Pelaajahaku').fill('Jamie');
    await expect(page.getByText('Jamie Benn')).toBeVisible();

    const highlightsTab = page.getByRole('tab', { name: TAB_LABELS.CAREER_HIGHLIGHTS });
    await highlightsTab.click();

    await expect(page).toHaveURL(/\/career\/highlights$/);
    await expect(highlightsTab).toHaveAttribute('aria-selected', 'true');
    const highlightCards = page.locator('app-table-card');
    await expect(highlightCards).toHaveCount(2);
    await expect(highlightCards.first().getByRole('table')).toBeVisible();
    await expect(highlightCards.nth(1).getByRole('table')).toBeVisible();

    const mostTeamsCard = highlightCards.first();
    const firstMostTeamsRow = mostTeamsCard.locator('tbody tr').first();
    const firstMostTeamsRowText = (await firstMostTeamsRow.textContent())?.trim() ?? '';
    await mostTeamsCard.getByRole('button', { name: 'Näytä seuraavat rivit' }).click();
    await expect(firstMostTeamsRow).not.toHaveText(firstMostTeamsRowText);

    const goalieTab = page.getByRole('tab', { name: TAB_LABELS.CAREER_GOALIES });
    await goalieTab.click();

    await expect(page).toHaveURL(/\/career\/goalies$/);
    await expect(goalieTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('Pelaajahaku')).toBeVisible();

    const goalieRows = page.locator('.virtual-table-row[data-row-index]');
    await goalieRows.first().waitFor({ state: 'visible', timeout: 10000 });
    expect(await goalieRows.count()).toBeGreaterThan(0);
  });
});
