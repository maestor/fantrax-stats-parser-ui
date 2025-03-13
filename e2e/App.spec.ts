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

/**
 * test('test', async ({ page }) => {
  await page.goto('http://localhost:4200/player-stats');
  await page.getByRole('heading', { name: 'Colorado Avalance - FFHL' }).click();
  await page.getByRole('tab', { name: 'Kenttäpelaajat' }).click();
  await page.getByRole('tab', { name: 'Maalivahdit' }).click();
  await page.getByRole('tab', { name: 'Kenttäpelaajat' }).click();
  await page.getByRole('radio', { name: 'Runkosarja' }).click();
  await page.getByRole('radio', { name: 'Playoffs' }).click();
  await page.locator('div').filter({ hasText: 'Kausivalitsin' }).nth(4).click();
  await page.getByRole('option', { name: '-2014' }).click();
  await page.getByText('Tilastot per ottelu').click();
  await page.getByText('Tilastot per ottelu').click();
  await page.locator('div').filter({ hasText: 'Pelaajahaku' }).nth(4).click();
  await page.getByRole('textbox', { name: 'Pelaajahaku' }).click();
  await page.getByRole('textbox', { name: 'Pelaajahaku' }).fill('Jees jees');
  await page.getByRole('cell', { name: 'Ei hakutuloksia' }).click();
  await page.getByRole('button', { name: 'Maalit' }).click();
  await page.getByRole('textbox', { name: 'Pelaajahaku' }).click();
  await page.getByRole('textbox', { name: 'Pelaajahaku' }).fill('');
  await page.getByRole('button', { name: 'Maalit' }).click();
  await page.getByRole('button', { name: 'Maalit' }).click();
  await page.getByRole('columnheader', { name: 'Nimi' }).click();
  await page.getByRole('columnheader', { name: 'Ottelut' }).click();
  await page.getByRole('columnheader', { name: 'Maalit' }).click();
  await page.getByRole('cell', { name: 'Jamie Benn' }).click();
  await page.getByRole('cell', { name: 'Ottelut' }).click();
  await page.getByRole('cell', { name: 'Maalit' }).click();
  await page.getByRole('cell', { name: 'Syötöt' }).click();
  await page.getByRole('cell', { name: 'Pisteet' }).click();
  await page.getByRole('cell', { name: '+/-' }).click();
  await page.getByRole('cell', { name: '5' }).nth(1).click();
  await page.getByRole('cell', { name: '16' }).click();
  await page.getByRole('cell', { name: '9' }).click();
  await page.locator('mat-card-title').click();
  await page.locator('mat-icon').click();
  await page.getByRole('button', { name: 'X' }).click();
  await page.getByRole('tab', { name: 'Maalivahdit' }).click();
  await page.getByRole('cell', { name: 'Hunter Shepard' }).click();
  await page.getByRole('button', { name: 'X' }).click();
});
 */
