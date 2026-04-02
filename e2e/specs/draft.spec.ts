import type { Page } from '@playwright/test';

import { test, expect } from '../fixtures/test-fixture';
import { NAV_LABELS, TAB_LABELS } from '../config/test-data';
import { fi } from '../config/i18n';
import { DRAFT_STATISTICS_CARD_IDS } from '../../src/app/draft/statistics/draft-statistics.constants';

function waitForOpeningDraftResponse(page: Page) {
  return page.waitForResponse(
    (response) => response.url().includes('/draft/original') && response.ok(),
    { timeout: 15000 },
  );
}

function waitForEntryDraftResponse(page: Page) {
  return page.waitForResponse(
    (response) => response.url().includes('/draft/entry') && response.ok(),
    { timeout: 15000 },
  );
}

async function expectStatisticsContent(page: Page) {
  const cards = page.locator('app-table-card');
  const firstCard = cards.first();
  const nextPageButton = firstCard.getByRole('button', {
    name: new RegExp(`${fi('draft.statistics.cards.totalPicks.title')}.*${fi('tableCard.next')}`),
  });
  const pageSummary = firstCard.locator('.page-summary');

  await expect(cards).toHaveCount(DRAFT_STATISTICS_CARD_IDS.length);
  await expect(
    firstCard.getByRole('heading', {
      name: fi('draft.statistics.cards.totalPicks.title'),
      exact: true,
    }),
  ).toBeVisible();
  await expect(firstCard.locator('button[mat-icon-button]')).toHaveCount(0);
  await expect(pageSummary).toBeVisible();
  await expect(nextPageButton).toBeVisible();

  const pageSummaryText = (await pageSummary.textContent())?.trim() ?? '';
  const paginationMatch = pageSummaryText.match(/^(\d+)-(\d+)\s*\/\s*(\d+)$/);

  expect(paginationMatch).not.toBeNull();

  if (paginationMatch) {
    const [, start, end, total] = paginationMatch;

    expect(Number(start)).toBeGreaterThanOrEqual(1);
    expect(Number(end)).toBeGreaterThanOrEqual(Number(start));
    expect(Number(total)).toBeGreaterThanOrEqual(Number(end));

    if (Number(total) > 10) {
      await expect(nextPageButton).toBeEnabled();
    } else {
      await expect(nextPageButton).toBeDisabled();
    }
  }
}

async function expectEntryDraftContent(page: Page) {
  const panels = page.locator('mat-expansion-panel');
  const firstPanel = panels.first();
  const firstHeader = firstPanel.locator('mat-expansion-panel-header');

  await expect(firstHeader).toBeVisible({ timeout: 15000 });
  await firstHeader.click();

  await expect(firstPanel.locator('.entry-summary-card').first()).toBeVisible();
  await expect(firstPanel.locator('.entry-season').first()).toBeVisible();
  await expect(firstPanel.locator('.entry-section-title').first())
    .toContainText(fi('draft.entryDrafts.summaryHeading'));
  await expect(firstPanel.locator('.draft-pick-player').first()).toBeVisible();

  expect(await firstHeader.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');

  const panelCount = await panels.count();
  if (panelCount > 1) {
    const secondHeader = panels.nth(1).locator('mat-expansion-panel-header');
    await secondHeader.click();
    await expect(firstHeader).toHaveAttribute('aria-expanded', 'false');
    await expect(secondHeader).toHaveAttribute('aria-expanded', 'true');
  }
}

async function expectOpeningDraftContent(page: Page) {
  const panels = page.locator('mat-expansion-panel');
  const firstHeader = panels.first().locator('mat-expansion-panel-header');
  await expect(firstHeader).toBeVisible();

  const panelCount = await panels.count();
  let tradedOwnerFound = false;

  for (let index = 0; index < Math.min(panelCount, 6); index += 1) {
    const panel = panels.nth(index);
    const header = panel.locator('mat-expansion-panel-header');
    await header.click();

    await expect(panel.locator('.draft-pick-player').first()).toBeVisible();

    if (index === 0) {
      expect(await header.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
    }
    if (index === 1) {
      await expect(firstHeader).toHaveAttribute('aria-expanded', 'false');
      await expect(header).toHaveAttribute('aria-expanded', 'true');
    }

    const tradedOwner = panel.locator('.draft-pick-origin').first();
    if (await tradedOwner.count()) {
      await expect(tradedOwner).toContainText(fi('draft.openingDraft.originalOwnerLabel'));
      tradedOwnerFound = true;
      break;
    }
  }

  expect(tradedOwnerFound).toBe(true);
}

test.describe('Draft pages', () => {
  test('global nav reaches /draft, /draft redirects to entry drafts, and tabs switch between all three views', async ({ page }) => {
    await page.goto('/leaderboards/regular');

    await page.getByRole('button', { name: fi('a11y.openNavMenu') }).last().click();
    const navDialog = page.getByRole('dialog').last();
    await expect(navDialog).toBeVisible();
    const entryDraftResponse = waitForEntryDraftResponse(page);
    await navDialog.getByRole('button', { name: NAV_LABELS.DRAFTS }).click();

    await expect(page).toHaveURL(/\/draft\/entry-drafts$/);
    await entryDraftResponse;
    await expect(
      page.getByRole('heading', { name: fi('nav.drafts'), level: 2, exact: true }),
    ).toBeVisible();

    const openingDraftTab = page.getByRole('tab', { name: TAB_LABELS.DRAFT_OPENING_DRAFT });
    const statisticsTab = page.getByRole('tab', { name: TAB_LABELS.DRAFT_STATISTICS });

    await expectEntryDraftContent(page);

    const openingDraftResponse = waitForOpeningDraftResponse(page);
    await expect(openingDraftTab).toBeVisible();
    await openingDraftTab.click();
    await expect(page).toHaveURL(/\/draft\/opening-draft$/);
    await openingDraftResponse;
    await expect(openingDraftTab).toHaveAttribute('aria-selected', 'true');
    await expectOpeningDraftContent(page);

    await expect(statisticsTab).toBeVisible();
    await statisticsTab.click();
    await expect(page).toHaveURL(/\/draft\/statistics$/);
    await expect(statisticsTab).toHaveAttribute('aria-selected', 'true');
    await expectStatisticsContent(page);
  });

  test('direct URL /draft/entry-drafts loads without redirect', async ({ page }) => {
    const entryDraftResponse = waitForEntryDraftResponse(page);
    await page.goto('/draft/entry-drafts');
    await expect(page).toHaveURL(/\/draft\/entry-drafts$/);
    await entryDraftResponse;
    await expectEntryDraftContent(page);
  });

  test('direct URL /draft/opening-draft loads without redirect', async ({ page }) => {
    const openingDraftResponse = waitForOpeningDraftResponse(page);
    await page.goto('/draft/opening-draft');
    await expect(page).toHaveURL(/\/draft\/opening-draft$/);
    await openingDraftResponse;
    await expectOpeningDraftContent(page);
  });

  test('direct URL /draft/statistics loads without redirect', async ({ page }) => {
    const statisticsResponse = waitForEntryDraftResponse(page);
    await page.goto('/draft/statistics');
    await expect(page).toHaveURL(/\/draft\/statistics$/);
    await statisticsResponse;
    await expectStatisticsContent(page);
  });
});
