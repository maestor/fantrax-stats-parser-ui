import { Locator } from '@playwright/test';

import { test, expect } from '../fixtures/test-fixture';
import { fi } from '../config/i18n';
import {
  CAREER_HIGHLIGHT_CARD_LABELS,
  CAREER_HIGHLIGHT_SECTION_LABELS,
  TAB_LABELS,
} from '../config/test-data';
import {
  CAREER_HIGHLIGHT_CARD_TYPES,
} from '../../src/app/career/highlights/career-highlights.constants';

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
    const highlightsJumpNav = page.getByRole('navigation', {
      name: fi('career.highlights.jumpNavAriaLabel'),
    });
    await expect(highlightCards).toHaveCount(CAREER_HIGHLIGHT_CARD_TYPES.length);
    await expect(
      highlightsJumpNav.getByRole('button', {
        name: CAREER_HIGHLIGHT_SECTION_LABELS.ACHIEVEMENTS,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      highlightsJumpNav.getByRole('button', {
        name: CAREER_HIGHLIGHT_SECTION_LABELS.JOURNEYS,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      highlightsJumpNav.getByRole('button', {
        name: CAREER_HIGHLIGHT_SECTION_LABELS.LONG_STAYS,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      highlightsJumpNav.getByRole('button', {
        name: CAREER_HIGHLIGHT_SECTION_LABELS.TRANSACTIONS,
        exact: true,
      }),
    ).toBeVisible();

    for (let index = 0; index < CAREER_HIGHLIGHT_CARD_TYPES.length; index += 1) {
      const card = highlightCards.nth(index);
      await card.scrollIntoViewIfNeeded();
      await expect(card.getByRole('table')).toBeVisible();
    }

    const nextPageButtons = page.getByRole('button', {
      name: new RegExp(fi('tableCard.next')),
    });
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

  test('scrolls career highlights to the transactions section and keeps all grouped sections available', async ({ page }) => {
    await page.goto('/career/highlights');
    await expect(page).toHaveURL(/\/career\/highlights$/);

    const highlightsJumpNav = page.getByRole('navigation', {
      name: fi('career.highlights.jumpNavAriaLabel'),
    });
    const transactionsSection = highlightsJumpNav.getByRole('button', {
      name: CAREER_HIGHLIGHT_SECTION_LABELS.TRANSACTIONS,
      exact: true,
    });

    await transactionsSection.click();
    await expect(page).toHaveURL(/\/career\/highlights#career-highlights-section-transactions$/);

    const highlightCards = page.locator('app-table-card');
    await expect(highlightCards).toHaveCount(CAREER_HIGHLIGHT_CARD_TYPES.length);
    await expect(
      page.getByRole('heading', { level: 4, name: CAREER_HIGHLIGHT_SECTION_LABELS.TRANSACTIONS }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: CAREER_HIGHLIGHT_CARD_LABELS.MOST_TRADES })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: CAREER_HIGHLIGHT_CARD_LABELS.MOST_CLAIMS })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: CAREER_HIGHLIGHT_CARD_LABELS.MOST_DROPS })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: CAREER_HIGHLIGHT_CARD_LABELS.REUNION_KING })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: fi('career.highlights.cards.mostTeamsPlayed.title') }),
    ).toBeVisible();

    const transactionsCard = page.getByRole('heading', {
      name: CAREER_HIGHLIGHT_CARD_LABELS.MOST_TRADES,
    }).locator('xpath=ancestor::app-table-card[1]');
    await transactionsCard.scrollIntoViewIfNeeded();
    await expect(transactionsCard.getByRole('table')).toBeVisible();
  });
});
