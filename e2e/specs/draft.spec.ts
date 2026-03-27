import { test, expect } from '../fixtures/test-fixture';
import { NAV_LABELS, TAB_LABELS } from '../config/test-data';
import { fi } from '../config/i18n';

test.describe('Draft pages', () => {
  test('global nav reaches /draft, /draft redirects to entry drafts, and tabs switch between the two views', async ({ page }) => {
    await page.goto('/leaderboards/regular');

    await page.getByRole('button', { name: fi('a11y.openNavMenu') }).click();
    await page.getByRole('button', { name: NAV_LABELS.DRAFTS }).click();

    await expect(page).toHaveURL(/\/draft\/entry-drafts$/);

    const entryDraftsTab = page.getByRole('tab', { name: TAB_LABELS.DRAFT_ENTRY_DRAFTS });
    const openingDraftTab = page.getByRole('tab', { name: TAB_LABELS.DRAFT_OPENING_DRAFT });

    await expect(entryDraftsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: TAB_LABELS.DRAFT_ENTRY_DRAFTS })).toBeVisible();

    await openingDraftTab.click();
    await expect(page).toHaveURL(/\/draft\/opening-draft$/);
    await expect(openingDraftTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: TAB_LABELS.DRAFT_OPENING_DRAFT })).toBeVisible();
  });

  test('direct URL /draft/entry-drafts loads without redirect', async ({ page }) => {
    await page.goto('/draft/entry-drafts');
    await expect(page).toHaveURL(/\/draft\/entry-drafts$/);
    await expect(page.getByRole('heading', { name: TAB_LABELS.DRAFT_ENTRY_DRAFTS })).toBeVisible();
  });

  test('direct URL /draft/opening-draft loads without redirect', async ({ page }) => {
    await page.goto('/draft/opening-draft');
    await expect(page).toHaveURL(/\/draft\/opening-draft$/);
    await expect(page.getByRole('heading', { name: TAB_LABELS.DRAFT_OPENING_DRAFT })).toBeVisible();
  });
});
