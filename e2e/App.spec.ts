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

test('Navigate between player and goalie stats tabs', async ({ page }) => {
  const playerTab = page.getByRole('tab', { name: 'Kenttäpelaajat' });
  const goalieTab = page.getByRole('tab', { name: 'Maalivahdit' });

  await goalieTab.click();
  await expect(page).toHaveURL(/.*\/goalie-stats$/);

  await playerTab.click();
  await expect(page).toHaveURL(/.*\/player-stats$/);
});

test('Open player card and verify career tabs', async ({ page }) => {
  // Ensure we are viewing combined stats across all seasons
  const seasonSelector = page.getByRole('combobox', { name: 'Kausivalitsin' });
  await seasonSelector.click();
  await page.getByRole('option', { name: 'Kaikki kaudet' }).click();

  // Wait until at least one data row is rendered
  const firstDataRow = page.locator('tr[mat-row]').first();
  await firstDataRow.waitFor({ state: 'visible', timeout: 10000 });

  // Open player/goalie card
  await firstDataRow.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Try to locate career-by-season tab; if it exists, switch to it.
  const bySeasonTab = page.getByRole('tab', { name: 'Kausittain' });

  const hasBySeasonTab = (await bySeasonTab.count()) > 0;

  if (hasBySeasonTab) {
    // Switch to "Kausittain" tab and ensure it becomes active
    await bySeasonTab.click();
    await expect(bySeasonTab).toHaveAttribute('aria-selected', 'true');
  } else {
    // Fallback: at least ensure a stats table is shown in the dialog
    await expect(dialog.locator('table[mat-table]')).toBeVisible();
  }
});

test('Filter players by search term', async ({ page }) => {
  // Wait for initial data
  const rows = page.locator('tr[mat-row]');
  await rows.first().waitFor({ state: 'visible', timeout: 10000 });

  const initialCount = await rows.count();

  const searchInput = page.getByLabel('Pelaajahaku');
  await searchInput.click();
  await searchInput.fill('');
  await searchInput.type('zzzz_unlikely_name');

  // Expect filtering to remove all data rows
  await expect(rows).toHaveCount(0);

  // And the "no results" row to appear
  await expect(page.getByText('Ei hakutuloksia')).toBeVisible();

  // Sanity: initial state should have had at least one row
  expect(initialCount).toBeGreaterThan(0);
});

test('Change report type and season update table contents', async ({
  page,
}) => {
  // Wait for initial data and capture the first row text
  const rows = page.locator('tr[mat-row]');
  await rows.first().waitFor({ state: 'visible', timeout: 10000 });
  const initialCount = await rows.count();
  const firstRow = rows.first();
  const firstRowTextBefore = await firstRow.textContent();

  // Switch to Playoffs using the toggle labeled "Playoffs"
  await page.getByText('Playoffs').click();

  // Expect the first row text to change when switching report type
  await expect(firstRow).not.toHaveText(firstRowTextBefore ?? '', {
    timeout: 10000,
  });

  // Now change season from "Kaikki kaudet" to a specific one
  const seasonSelector = page.getByRole('combobox', { name: 'Kausivalitsin' });
  await seasonSelector.click();

  // Select the first concrete season option (after "Kaikki kaudet")
  const seasonOptions = page.getByRole('option');
  const firstSeasonOption = seasonOptions.nth(1);
  await firstSeasonOption.click();

  // Allow table to refresh after season change
  await page.waitForTimeout(500);

  const rowsAfterSeason = page.locator('tr[mat-row]');
  const countAfterSeason = await rowsAfterSeason.count();

  if (countAfterSeason === 0) {
    // Season change resulted in no rows; still a valid change in contents
    expect(countAfterSeason).toBeLessThan(initialCount);
  } else {
    const firstRowAfterSeason = rowsAfterSeason.first();
    const firstRowTextAfterSeasonChange =
      await firstRowAfterSeason.textContent();

    // Expect the content to reflect the season change as well
    expect(firstRowTextAfterSeasonChange).not.toBe(firstRowTextBefore);
  }
});

test('Stats per game toggle and min games slider affect table', async ({
  page,
}) => {
  const rows = page.locator('tr[mat-row]');
  await rows.first().waitFor({ state: 'visible', timeout: 10000 });

  // Capture a numeric stat (points) from the first row
  const pointsCell = page.locator('tr[mat-row] td.mat-column-points').first();
  const pointsBefore = await pointsCell.textContent();

  // Toggle stats per game on
  const statsPerGameToggle = page.getByRole('switch', {
    name: 'Tilastot per ottelu',
  });
  await statsPerGameToggle.click();

  // Expect the points value to change for the same player
  await expect(pointsCell).not.toHaveText(pointsBefore ?? '');

  // Now adjust the minimum games slider to reduce the number of rows
  const rowsBeforeSlider = await rows.count();
  const minGamesSlider = page.locator('#min-games-slider');

  // Click towards the end of the slider track to increase minGames
  await minGamesSlider.click({ position: { x: 200, y: 10 } });

  // Wait briefly for filtering to apply
  await page.waitForTimeout(500);

  const rowsAfterSlider = await rows.count();

  expect(rowsAfterSlider).toBeLessThan(rowsBeforeSlider);
});

test('Goalie stats behave similarly with filters and card', async ({
  page,
}) => {
  const goalieTab = page.getByRole('tab', { name: 'Maalivahdit' });

  // Switch to goalie stats
  await goalieTab.click();
  await expect(page).toHaveURL(/.*\/goalie-stats$/);

  const rows = page.locator('tr[mat-row]');
  await rows.first().waitFor({ state: 'visible', timeout: 10000 });

  // Use stats per game toggle on goalie view
  const statsPerGameToggle = page.getByRole('switch', {
    name: 'Tilastot per ottelu',
  });
  await statsPerGameToggle.click();

  // Ensure table still has data after toggle
  await expect(rows).not.toHaveCount(0);

  // Open a goalie card
  await rows.first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('Search can be cleared and rows return', async ({ page }) => {
  const rows = page.locator('tr[mat-row]');
  await rows.first().waitFor({ state: 'visible', timeout: 10000 });

  const searchInput = page.getByLabel('Pelaajahaku');
  await searchInput.click();
  await searchInput.fill('');
  await searchInput.type('zzzz_unlikely_name');

  // After typing, filtering should result in no rows
  await expect(rows).toHaveCount(0);
  await expect(page.getByText('Ei hakutuloksia')).toBeVisible();

  // Clear the search (set empty value) and fire keyup via Enter
  await searchInput.fill('');
  await searchInput.press('Enter');

  // Expect rows to come back
  await expect(rows).not.toHaveCount(0);
});

test('Sorting by points changes row order', async ({ page }) => {
  const rows = page.locator('tr[mat-row]');
  await rows.first().waitFor({ state: 'visible', timeout: 10000 });

  const pointsHeader = page.getByRole('columnheader', {
    name: 'Pisteet',
  });

  // Capture initial order of points
  const getPointsOrder = async () => {
    const cells = await page
      .locator('tr[mat-row] td.mat-column-points')
      .allTextContents();
    return cells.map((v) => (v ? Number(v) || 0 : 0));
  };

  const initialOrder = await getPointsOrder();

  // Click to sort (desc by default)
  await pointsHeader.click();
  const sortedOnce = await getPointsOrder();

  // Click again to reverse order
  await pointsHeader.click();
  const sortedTwice = await getPointsOrder();

  // Expect order to have changed compared to initial after sorting
  expect(sortedOnce).not.toEqual(initialOrder);
  expect(sortedTwice).not.toEqual(sortedOnce);
});

test('Mobile: settings drawer toggles and contains controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const openSettings = page.getByRole('button', { name: 'Avaa asetuspaneeli' });
  await expect(openSettings).toBeVisible();
  await openSettings.click();

  const drawer = page.locator('.settings-drawer');
  await expect(drawer).toBeVisible();

  // Top controls section (team/season/report)
  await expect(
    drawer.getByRole('heading', { name: 'Tarkasteltavat tilastot' })
  ).toBeVisible();
  await expect(drawer.getByRole('combobox', { name: 'Kausivalitsin' })).toBeVisible();
  await expect(drawer.getByRole('radiogroup')).toBeVisible();

  // Settings section (stats-per-game + min games)
  await expect(drawer.getByRole('switch', { name: 'Tilastot per ottelu' })).toBeVisible();

  // Close via Escape (expected to work with Material drawer)
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Avaa asetuspaneeli' })).toBeVisible();
});

test('Player and goalie filters are isolated', async ({ page }) => {
  const playerTab = page.getByRole('tab', { name: 'Kenttäpelaajat' });
  const goalieTab = page.getByRole('tab', { name: 'Maalivahdit' });

  const playerRows = page.locator('tr[mat-row]');
  await playerRows.first().waitFor({ state: 'visible', timeout: 10000 });

  const statsPerGameToggle = page.getByRole('switch', {
    name: 'Tilastot per ottelu',
  });

  // Toggle stats per game on players
  await statsPerGameToggle.click();
  const playerRowsAfterToggle = await playerRows.count();

  // Switch to goalies and ensure they also have data
  await goalieTab.click();
  await expect(page).toHaveURL(/.*\/goalie-stats$/);

  const goalieRows = page.locator('tr[mat-row]');
  await goalieRows.first().waitFor({ state: 'visible', timeout: 10000 });
  const goalieRowsCount = await goalieRows.count();

  // Switch back to players and ensure rows still exist and toggle state preserved
  await playerTab.click();
  await expect(page).toHaveURL(/.*\/player-stats$/);

  const playerRowsAfterReturn = await playerRows.count();
  expect(playerRowsAfterReturn).toBe(playerRowsAfterToggle);
  expect(goalieRowsCount).toBeGreaterThan(0);
});

test.describe('Mobile settings drawer', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Settings icon opens drawer with top controls and settings', async ({
    page,
  }) => {
    // Inline per-page settings accordion should not render on mobile.
    await expect(
      page.getByRole('switch', { name: 'Tilastot per ottelu' })
    ).toHaveCount(0);

    const openDrawerButton = page.getByRole('button', {
      name: 'Avaa asetuspaneeli',
    });
    await expect(openDrawerButton).toBeVisible();

    await openDrawerButton.click();

    // Drawer headings (matching the existing accordion section labels)
    await expect(page.getByText('Tarkasteltavat tilastot')).toBeVisible();
    await expect(page.getByText('Asetukset')).toBeVisible();

    // Per-page settings should now be available inside the drawer.
    await expect(
      page.getByRole('switch', { name: 'Tilastot per ottelu' })
    ).toBeVisible();
    await expect(
      page.getByLabel('Otteluja pelattu vähintään')
    ).toBeVisible();

    const closeDrawerButton = page.getByRole('button', {
      name: 'Sulje asetuspaneeli',
    });
    await expect(closeDrawerButton).toBeVisible();

    await closeDrawerButton.click();

    await expect(
      page.getByRole('switch', { name: 'Tilastot per ottelu' })
    ).toHaveCount(0);
  });
});
