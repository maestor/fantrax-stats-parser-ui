import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('Go to front page correctly and check that everything find with initial state', async ({
  page,
}) => {
  // Site title
  await expect(page).toHaveTitle(/Colorado Avalance - FFHL pelaajatilastot/);

  // Site main heading
  await expect(
    page.getByRole('heading', {
      name: /Colorado Avalance - FFHL pelaajatilastot/,
    })
  ).toBeVisible();

  // Navigation between players and goalies
  await expect(page.getByRole('tablist')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Kenttäpelaajat' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Maalivahdit' })).toBeVisible();

  // Report type switcher
  await expect(page.getByRole('radiogroup')).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Runkosarja' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Playoffs' })).toBeVisible();

  // Season switcher
  await expect(
    page.getByRole('combobox', { name: 'Kausivalitsin' })
  ).toBeVisible();
  await expect(page.getByRole('listbox')).not.toBeVisible(); // Not initially visible

  // Stats per game toggle
  await expect(
    page.getByRole('switch', { name: 'Tilastot per ottelu' })
  ).toBeVisible();

  // Stats table and player search
  await expect(page.getByLabel('Pelaajahaku')).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
});
