import { test, expect } from '@playwright/test';
import { PlayerCardDialog } from '../page-objects/PlayerCardDialog';
import { StatsTable } from '../page-objects/StatsTable';

test.describe('Player Card', () => {
  let playerCard: PlayerCardDialog;
  let statsTable: StatsTable;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    playerCard = new PlayerCardDialog(page);
    statsTable = new StatsTable(page);

    // Wait for table data
    await statsTable.verifyDataLoaded();
  });

  test('opens when clicking a player row', async ({ page }) => {
    await playerCard.open('Jamie Benn');

    // Verify dialog is visible
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });

  test('closes via X button', async ({ page }) => {
    await playerCard.open('Jamie Benn');
    await playerCard.close();

    // Verify dialog is hidden
    const dialog = page.getByRole('dialog');
    await expect(dialog).not.toBeVisible();
  });

  test('closes via Escape key', async ({ page }) => {
    await playerCard.open('Jamie Benn');
    await playerCard.closeViaEscape();

    // Verify dialog is hidden
    const dialog = page.getByRole('dialog');
    await expect(dialog).not.toBeVisible();
  });

  test('switches between tabs when all seasons selected', async ({ page }) => {
    // Ensure "Kaikki kaudet" is selected
    const seasonSelector = page.getByRole('combobox', {
      name: 'Kausivalitsin',
    });
    await seasonSelector.click();
    await page.getByRole('option', { name: 'Kaikki kaudet' }).click();

    await playerCard.open('Jamie Benn');

    // Verify all 3 tabs available
    const tabs = await playerCard.getAvailableTabs();
    expect(tabs.length).toBe(3);

    // Switch to by-season tab
    await playerCard.switchToTab('by-season');
    await playerCard.verifyTabContent('by-season');

    // Switch to graphs tab
    await playerCard.switchToTab('graphs');
    await playerCard.verifyTabContent('graphs');

    // Switch back to stats
    await playerCard.switchToTab('stats');
    await playerCard.verifyTabContent('stats');
  });

  test('shows only 2 tabs when single season selected', async ({ page }) => {
    // Select a specific season
    const seasonSelector = page.getByRole('combobox', {
      name: 'Kausivalitsin',
    });
    await seasonSelector.click();
    const options = page.getByRole('option');
    await options.nth(1).click(); // Select first non-"all" season

    await playerCard.open('Jamie Benn');

    // Verify only 2 tabs available (stats and graphs, no by-season)
    const tabs = await playerCard.getAvailableTabs();
    expect(tabs.length).toBe(2);
    expect(tabs).not.toContain('Kausittain');

    // Verify graphs tab only has radar chart
    await playerCard.switchToTab('graphs');
    const hasLineGraphs = await playerCard.hasLineGraphs();
    expect(hasLineGraphs).toBe(false);
  });

  test('toggles graph series on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await playerCard.open('Jamie Benn');
    await playerCard.switchToTab('graphs');

    // Toggle a series off
    await playerCard.toggleGraphSeries('Pisteet');
    await page.waitForTimeout(500); // Wait for animation

    // Toggle it back on
    await playerCard.toggleGraphSeries('Pisteet');
    await page.waitForTimeout(500);

    // Verify graph still visible
    await playerCard.verifyTabContent('graphs');
  });

  test('switches between line and radar charts', async ({ page }) => {
    // Ensure "Kaikki kaudet" is selected for line graphs
    const seasonSelector = page.getByRole('combobox', {
      name: 'Kausivalitsin',
    });
    await seasonSelector.click();
    await page.getByRole('option', { name: 'Kaikki kaudet' }).click();

    await playerCard.open('Jamie Benn');
    await playerCard.switchToTab('graphs');

    // Verify line graphs are visible
    let hasLineGraphs = await playerCard.hasLineGraphs();
    expect(hasLineGraphs).toBe(true);

    // Switch to radar chart
    await playerCard.switchChartType('radar');
    await page.waitForTimeout(500); // Wait for chart to render

    // Switch back to line chart
    await playerCard.switchChartType('line');
    await page.waitForTimeout(500);

    // Verify line graphs are back
    hasLineGraphs = await playerCard.hasLineGraphs();
    expect(hasLineGraphs).toBe(true);
  });

  test('copy link button copies shareable URL', async ({
    page,
    browserName,
  }) => {
    // Clipboard permissions only supported on Chromium
    test.skip(
      browserName !== 'chromium',
      'Clipboard API permissions not supported'
    );

    await playerCard.open('Jamie Benn');

    // Grant clipboard permissions (Chromium only)
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click copy link button
    await playerCard.copyPlayerLink();

    // Verify clipboard contains the player URL
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toContain('/player/colorado/jamie-benn');
  });

  test('compare toggle state persists across tabs', async ({ page }) => {
    // Ensure "Kaikki kaudet" is selected so all 3 tabs are available
    const seasonSelector = page.getByRole('combobox', {
      name: 'Kausivalitsin',
    });
    await seasonSelector.click();
    await page.getByRole('option', { name: 'Kaikki kaudet' }).click();

    await playerCard.open('Jamie Benn');

    // Find the compare toggle (mat-slide-toggle inside .position-filter-switch)
    const compareToggle = page
      .getByRole('dialog')
      .locator('mat-slide-toggle button[role="switch"]');

    // Toggle should be unchecked initially
    await expect(compareToggle).toHaveAttribute('aria-checked', 'false');

    // Enable the compare toggle
    await compareToggle.dispatchEvent('click');
    await expect(compareToggle).toHaveAttribute('aria-checked', 'true');

    // Switch to by-season tab and back
    await playerCard.switchToTab('by-season');
    await playerCard.switchToTab('stats');

    // Verify toggle state persisted
    await expect(compareToggle).toHaveAttribute('aria-checked', 'true');

    // Switch to graphs tab and back
    await playerCard.switchToTab('graphs');
    await playerCard.switchToTab('stats');

    // Verify toggle state still persisted
    await expect(compareToggle).toHaveAttribute('aria-checked', 'true');
  });

  test('opens player card via direct URL', async ({ page }) => {
    // Navigate directly to player card URL using slug-based routing
    await page.goto('/player/colorado/jamie-benn');

    // Wait for dialog to open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Verify player name in dialog
    await expect(dialog.getByText('Jamie Benn')).toBeVisible();
  });

  test('opens player card with specific tab via query param', async ({
    page,
  }) => {
    // Navigate directly to player card with graphs tab
    await page.goto('/player/colorado/jamie-benn?tab=graphs');

    // Wait for dialog to open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Verify graphs tab is active
    await playerCard.verifyTabContent('graphs');
  });
});
