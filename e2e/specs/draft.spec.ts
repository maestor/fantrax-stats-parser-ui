import type { Page } from '@playwright/test';

import { test, expect } from '../fixtures/test-fixture';
import { NAV_LABELS, TAB_LABELS } from '../config/test-data';
import { fi } from '../config/i18n';

function waitForOpeningDraftResponse(page: Page) {
  return page.waitForResponse(
    (response) => response.url().includes('/draft/original') && response.ok(),
    { timeout: 15000 },
  );
}

async function expectOpeningDraftContent(page: Page) {
  const panels = page.locator('mat-expansion-panel');
  await expect(panels.first().locator('mat-expansion-panel-header')).toBeVisible();

  const panelCount = await panels.count();
  let tradedOwnerFound = false;

  for (let index = 0; index < Math.min(panelCount, 6); index += 1) {
    const panel = panels.nth(index);
    const header = panel.locator('mat-expansion-panel-header');
    await header.click();

    await expect(panel.locator('.draft-pick-player').first()).toBeVisible();

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
  test('global nav reaches /draft, /draft redirects to entry drafts, and tabs switch between the two views', async ({ page }) => {
    await page.goto('/leaderboards/regular');

    await page.getByRole('button', { name: fi('a11y.openNavMenu') }).click();
    await page.getByRole('button', { name: NAV_LABELS.DRAFTS }).last().click();

    await expect(page).toHaveURL(/\/draft\/entry-drafts$/);

    const entryDraftsTab = page.getByRole('tab', { name: TAB_LABELS.DRAFT_ENTRY_DRAFTS });
    const openingDraftTab = page.getByRole('tab', { name: TAB_LABELS.DRAFT_OPENING_DRAFT });

    await expect(entryDraftsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText(fi('draft.placeholders.entryDrafts'))).toBeVisible();

    const openingDraftResponse = waitForOpeningDraftResponse(page);
    await openingDraftTab.click();
    await expect(page).toHaveURL(/\/draft\/opening-draft$/);
    await openingDraftResponse;
    await expect(openingDraftTab).toHaveAttribute('aria-selected', 'true');
    await expectOpeningDraftContent(page);
  });

  test('direct URL /draft/entry-drafts loads without redirect', async ({ page }) => {
    await page.goto('/draft/entry-drafts');
    await expect(page).toHaveURL(/\/draft\/entry-drafts$/);
    await expect(page.getByText(fi('draft.placeholders.entryDrafts'))).toBeVisible();
  });

  test('direct URL /draft/opening-draft loads without redirect', async ({ page }) => {
    const openingDraftResponse = waitForOpeningDraftResponse(page);
    await page.goto('/draft/opening-draft');
    await expect(page).toHaveURL(/\/draft\/opening-draft$/);
    await openingDraftResponse;
    await expectOpeningDraftContent(page);
  });
});
