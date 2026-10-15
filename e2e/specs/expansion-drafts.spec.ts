import { test, expect } from '../fixtures/test-fixture';
import { fi } from '../config/i18n';

test.use({ headless: true });

test('draft navigation opens both expansion lists with source teams and career links', async ({ page }) => {
  await page.goto('/draft/entry-drafts');
  const tab = page.getByRole('tab', { name: fi('draft.tabs.expansionDrafts'), exact: true });
  await expect(tab).toBeVisible();
  await tab.click();
  await expect(page).toHaveURL('/draft/expansion-drafts');
  const seattle = page.getByRole('region', { name: 'Seattle Kraken 2021' });
  const vegas = page.getByRole('region', { name: 'Vegas Golden Knights 2017' });
  await expect(seattle.getByRole('link')).toHaveCount(30);
  await expect(vegas.getByRole('link')).toHaveCount(29);
  await expect(vegas.getByText('Juuso Hietanen', { exact: true })).toBeVisible();
  await expect(vegas.getByRole('link', { name: 'Juuso Hietanen' })).toHaveCount(0);
  const zachaRow = seattle.getByRole('row', { name: 'Pavel Zacha Toronto Maple Leafs' });
  await expect(zachaRow).toBeVisible();
  await zachaRow.getByRole('link', { name: 'Pavel Zacha' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/career/players/pavel-zacha-03l0t?from=expansion-drafts');
  await expect(page.getByRole('heading', { name: 'Pavel Zacha', exact: true })).toBeFocused();
  const season = page.getByRole('region', { name: '2021-22', exact: true });
  const expansion = season.getByRole('listitem').last();
  await expect(expansion.getByRole('heading', { name: fi('career.profile.events.expansion'), exact: true })).toBeVisible();
  await expect(expansion.getByText('Toronto Maple Leafs → Seattle Kraken', { exact: true })).toBeVisible();
  await expect(expansion.locator('time')).toHaveCount(0);
  await page.getByRole('link', { name: new RegExp(fi('career.profile.backExpansionDrafts')) }).click();
  await expect(page).toHaveURL('/draft/expansion-drafts');
});

test('a direct expansion link opens a goalie career and keeps its return destination after reload', async ({ page }) => {
  await page.goto('/draft/expansion-drafts');
  const jarry = page.getByRole('link', { name: 'Tristan Jarry', exact: true });
  await expect(jarry).toHaveAttribute('href', '/career/goalies/tristan-jarry-02yjw?from=expansion-drafts');
  await jarry.focus();
  await jarry.press('Enter');
  await expect(page.getByRole('heading', { name: 'Tristan Jarry', exact: true })).toBeFocused();
  await page.reload();
  await expect(page.getByRole('region', { name: '2021-22', exact: true }).getByText('New Jersey Devils → Seattle Kraken', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: new RegExp(fi('career.profile.backExpansionDrafts')) }).click();
  await expect(page).toHaveURL('/draft/expansion-drafts');
});

test('mobile keyboard users can skip into the fully visible draft lists and reach player links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/draft/expansion-drafts');
  await expect(page.getByRole('link', { name: 'Pavel Zacha', exact: true })).toBeVisible();
  const skip = page.getByRole('link', { name: fi('a11y.skipToDraftList'), exact: true });
  await skip.focus();
  await skip.press('Enter');
  await expect(page.getByRole('heading', { name: fi('draft.tabs.expansionDrafts'), exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pavel Zacha', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
