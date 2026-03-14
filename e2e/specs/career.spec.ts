import { Locator } from '@playwright/test';

import { test, expect } from '../fixtures/test-fixture';
import {
  CAREER_HIGHLIGHT_CARD_LABELS,
  CAREER_HIGHLIGHT_SECTION_LABELS,
  TAB_LABELS,
} from '../config/test-data';

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
    await expect(highlightCards).toHaveCount(7);
    await expect(highlightCards.first().getByRole('table')).toBeVisible();
    await highlightCards.nth(1).scrollIntoViewIfNeeded();
    await expect(highlightCards.nth(1).getByRole('table')).toBeVisible();
    await highlightCards.nth(2).scrollIntoViewIfNeeded();
    await expect(highlightCards.nth(2).getByRole('table')).toBeVisible();
    await highlightCards.nth(3).scrollIntoViewIfNeeded();
    await expect(highlightCards.nth(3).getByRole('table')).toBeVisible();
    await highlightCards.nth(4).scrollIntoViewIfNeeded();
    await expect(highlightCards.nth(4).getByRole('table')).toBeVisible();
    await highlightCards.nth(5).scrollIntoViewIfNeeded();
    await expect(highlightCards.nth(5).getByRole('table')).toBeVisible();
    await highlightCards.nth(6).scrollIntoViewIfNeeded();
    await expect(highlightCards.nth(6).getByRole('table')).toBeVisible();

    const nextPageButtons = page.getByRole('button', { name: 'Näytä seuraavat rivit' });
    let pagedCard: Locator | null = null;
    let pagedCardFirstRow: Locator | null = null;

    for (let index = 0; index < await nextPageButtons.count(); index += 1) {
      const button = nextPageButtons.nth(index);
      if (!(await button.isEnabled())) {
        continue;
      }

      pagedCard = button.locator('xpath=ancestor::app-table-card[1]');
      pagedCardFirstRow = pagedCard.locator('tbody tr').first();
      const firstRowText = (await pagedCardFirstRow.textContent())?.trim() ?? '';

      await button.click();
      await expect(pagedCardFirstRow).not.toHaveText(firstRowText);
      break;
    }

    expect(pagedCard).not.toBeNull();
    expect(pagedCardFirstRow).not.toBeNull();

    const goalieTab = page.getByRole('tab', { name: TAB_LABELS.CAREER_GOALIES });
    await goalieTab.click();

    await expect(page).toHaveURL(/\/career\/goalies$/);
    await expect(goalieTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('Pelaajahaku')).toBeVisible();

    const goalieRows = page.locator('.virtual-table-row[data-row-index]');
    await goalieRows.first().waitFor({ state: 'visible', timeout: 10000 });
    expect(await goalieRows.count()).toBeGreaterThan(0);
  });

  test('switches career highlights to transactions and renders the transaction cards', async ({ page }) => {
    await page.goto('/career/highlights');
    await expect(page).toHaveURL(/\/career\/highlights$/);

    const generalSection = page.getByRole('radio', {
      name: CAREER_HIGHLIGHT_SECTION_LABELS.GENERAL,
    });
    const transactionsSection = page.getByRole('radio', {
      name: CAREER_HIGHLIGHT_SECTION_LABELS.TRANSACTIONS,
    });

    await expect(generalSection).toHaveAttribute('aria-checked', 'true');
    await transactionsSection.click();
    await expect(transactionsSection).toHaveAttribute('aria-checked', 'true');

    const highlightCards = page.locator('app-table-card');
    await expect(highlightCards).toHaveCount(3);
    await expect(
      page.getByRole('heading', { name: CAREER_HIGHLIGHT_CARD_LABELS.MOST_TRADES })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: CAREER_HIGHLIGHT_CARD_LABELS.MOST_CLAIMS })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: CAREER_HIGHLIGHT_CARD_LABELS.MOST_DROPS })
    ).toBeVisible();

    await expect(highlightCards.first().getByRole('table')).toBeVisible();
    await highlightCards.nth(1).scrollIntoViewIfNeeded();
    await expect(highlightCards.nth(1).getByRole('table')).toBeVisible();
    await highlightCards.nth(2).scrollIntoViewIfNeeded();
    await expect(highlightCards.nth(2).getByRole('table')).toBeVisible();
  });
});
