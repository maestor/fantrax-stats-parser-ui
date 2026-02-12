import { test, expect } from '../fixtures/test-fixture';
import { PlayerCardDialog } from '../page-objects/PlayerCardDialog';
import { StatsTable } from '../page-objects/StatsTable';

test.describe('Player Card', () => {
  let playerCard: PlayerCardDialog;
  let statsTable: StatsTable;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    playerCard = new PlayerCardDialog(page);
    statsTable = new StatsTable(page);
    await statsTable.verifyDataLoaded();
  });

  test('opens on row click, closes via X button and Escape key', async ({ page }) => {
    const dialog = page.getByRole('dialog');

    // Open and close via X button
    await playerCard.open('Jamie Benn');
    await expect(dialog).toBeVisible();
    await playerCard.close();
    await expect(dialog).not.toBeVisible();

    // Open and close via Escape
    await playerCard.open('Jamie Benn');
    await expect(dialog).toBeVisible();
    await playerCard.closeViaEscape();
    await expect(dialog).not.toBeVisible();
  });

  test('tabs: all seasons shows 3 tabs, single season shows 2 tabs without by-season', async ({ page }) => {
    // All seasons: 3 tabs with full navigation
    const seasonSelector = page.getByRole('combobox', {
      name: 'Kausivalitsin',
    });
    await seasonSelector.click();
    await page.getByRole('option', { name: 'Kaikki kaudet' }).click();

    await playerCard.open('Jamie Benn');
    const tabs = await playerCard.getAvailableTabs();
    expect(tabs.length).toBe(3);

    await playerCard.switchToTab('by-season');
    await playerCard.verifyTabContent('by-season');

    // Verify career best highlighting in by-season tab
    const seasonTable = page.locator('.season-table');
    const highlightedCells = seasonTable.locator('td.stat-highlight');
    const highlightCount = await highlightedCells.count();
    expect(highlightCount).toBeGreaterThan(0);

    // Verify tooltip on career best cell
    const firstHighlight = highlightedCells.first();
    await firstHighlight.hover();
    const tooltip = page.locator('.mat-mdc-tooltip');
    await expect(tooltip).toBeVisible({ timeout: 3000 });
    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toContain('uran paras');

    await playerCard.switchToTab('graphs');
    await playerCard.verifyTabContent('graphs');
    await playerCard.switchToTab('stats');
    await playerCard.verifyTabContent('stats');
    await playerCard.close();

    // Single season: 2 tabs, no by-season, no line graphs
    await seasonSelector.click();
    await page.getByRole('option').nth(1).click();

    await playerCard.open('Jamie Benn');
    const singleTabs = await playerCard.getAvailableTabs();
    expect(singleTabs.length).toBe(2);
    expect(singleTabs).not.toContain('Kausittain');

    await playerCard.switchToTab('graphs');
    const hasLineGraphs = await playerCard.hasLineGraphs();
    expect(hasLineGraphs).toBe(false);
  });

  test('graph series toggle and chart type switching', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Ensure all seasons for line graphs
    const seasonSelector = page.getByRole('combobox', {
      name: 'Kausivalitsin',
    });
    await seasonSelector.click();
    await page.getByRole('option', { name: 'Kaikki kaudet' }).click();

    await playerCard.open('Jamie Benn');
    await playerCard.switchToTab('graphs');

    // Toggle series off and back on
    await playerCard.toggleGraphSeries('Pisteet');
    await page.waitForTimeout(500);
    await playerCard.toggleGraphSeries('Pisteet');
    await page.waitForTimeout(500);
    await playerCard.verifyTabContent('graphs');

    // Switch between chart types
    let hasLineGraphs = await playerCard.hasLineGraphs();
    expect(hasLineGraphs).toBe(true);

    await playerCard.switchChartType('radar');
    await page.waitForTimeout(500);
    await playerCard.switchChartType('line');
    await page.waitForTimeout(500);

    hasLineGraphs = await playerCard.hasLineGraphs();
    expect(hasLineGraphs).toBe(true);
  });

  test('copy link button copies shareable URL', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'Clipboard API permissions not supported'
    );

    await playerCard.open('Jamie Benn');
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);
    await playerCard.copyPlayerLink();

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toContain('/player/colorado/jamie-benn');
  });

  test('compare toggle state persists across tabs', async ({ page }) => {
    const seasonSelector = page.getByRole('combobox', {
      name: 'Kausivalitsin',
    });
    await seasonSelector.click();
    await page.getByRole('option', { name: 'Kaikki kaudet' }).click();

    await playerCard.open('Jamie Benn');

    const compareToggle = page
      .getByRole('dialog')
      .locator('mat-slide-toggle button[role="switch"]');

    await expect(compareToggle).toHaveAttribute('aria-checked', 'false');
    await compareToggle.dispatchEvent('click');
    await expect(compareToggle).toHaveAttribute('aria-checked', 'true');

    // Verify persistence across tab switches
    await playerCard.switchToTab('by-season');
    await playerCard.switchToTab('stats');
    await expect(compareToggle).toHaveAttribute('aria-checked', 'true');

    await playerCard.switchToTab('graphs');
    await playerCard.switchToTab('stats');
    await expect(compareToggle).toHaveAttribute('aria-checked', 'true');
  });

  test('opens player card via direct URL and with tab query param', async ({ page }) => {
    // Direct URL opens dialog with correct player
    await page.goto('/player/colorado/jamie-benn');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText('Jamie Benn')).toBeVisible();
    await playerCard.close();

    // Direct URL with tab query param opens correct tab
    await page.goto('/player/colorado/jamie-benn?tab=graphs');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await playerCard.verifyTabContent('graphs');
  });
});
