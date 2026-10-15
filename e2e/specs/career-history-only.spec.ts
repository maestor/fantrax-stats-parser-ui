import { test, expect } from '../fixtures/test-fixture';
import { fi } from '../config/i18n';
import { CAREER_HISTORY_ONLY_PROFILES } from '../config/career-profiles';

for (const profile of CAREER_HISTORY_ONLY_PROFILES) {
  test(`${profile.name} opens from a zero-value career row and returns with keyboard focus`, async ({ page }) => {
    await page.goto(`/career/${profile.list}`);
    const search = page.getByRole('searchbox');
    await search.fill(profile.name);
    const link = page.getByRole('link', { name: new RegExp(profile.name) });
    await expect(link).toHaveAttribute('href', `/career/${profile.list}/${profile.slug}`);
    const row = page.getByRole('row').filter({ has: link });
    await expect(row.getByRole('cell', { name: '0', exact: true })).toHaveCount(8);
    await expect(row.getByRole('cell', { name: '-', exact: true })).toHaveCount(2);
    await row.focus();
    await row.press('Enter');
    await expect(page.getByRole('heading', { name: profile.name, exact: true })).toBeFocused();
    await expect(page.getByRole('button', { name: fi('career.profile.copyLink') })).toBeVisible();
    await expect(page.getByRole('heading', { name: fi('career.profile.history'), exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: fi('career.profile.jumpLabel') })).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: fi('career.profile.scope') })).toHaveCount(0);
    await expect(page.getByText(fi('career.profile.seasonsOwned'), { exact: true })).toHaveCount(0);
    await page.getByRole('link', { name: new RegExp(fi('career.profile.back')) }).click();
    await expect(search).toHaveValue(profile.name);
    await expect(page.getByRole('row').filter({ has: page.getByRole('link', { name: new RegExp(profile.name) }) })).toBeFocused();
    await page.goto(`/career/${profile.list}/${profile.slug}`);
    await page.reload();
    await expect(page.getByRole('heading', { name: profile.name, exact: true })).toBeVisible();
  });
}

test('expansion and opening draft names link to history-only profiles and preserve the draft return path', async ({ page }) => {
  await page.goto('/draft/expansion-drafts');
  await page.getByRole('link', { name: 'Juuso Hietanen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Juuso Hietanen', exact: true })).toBeFocused();
  await expect(page.getByRole('link', { name: new RegExp(fi('career.profile.backExpansionDrafts')) })).toHaveAttribute('href', '/draft/expansion-drafts');

  for (const { name, pick } of [
    { name: 'Alex Mallet', pick: 774 },
    { name: 'Jarkko Immonen', pick: 907 },
  ]) {
    await page.goto('/draft/opening-draft');
    const panel = page.locator('mat-expansion-panel').filter({ has: page.locator('mat-panel-title', { hasText: 'Colorado Avalanche' }) });
    const header = panel.locator('mat-expansion-panel-header');
    if ((await header.getAttribute('aria-expanded')) !== 'true') await header.click();
    await panel.getByRole('link', { name, exact: true }).click({ timeout: 5000 });
    await expect(page.getByRole('heading', { name, exact: true })).toBeFocused();
    await expect(page.getByRole('link', { name: new RegExp(fi('career.profile.backOpeningDraft')) })).toHaveAttribute('href', '/draft/opening-draft');
    const opening = page.getByRole('region', { name: fi('career.profile.openingDraft'), exact: true });
    await expect(opening.getByText(new RegExp(String(pick)))).toBeVisible();
    await expect(opening.getByText(/Colorado Avalanche/)).toBeVisible();
  }
});
