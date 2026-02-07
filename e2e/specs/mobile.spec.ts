import { test, expect } from '../fixtures/test-fixture';
import { SettingsDrawer } from '../page-objects/SettingsDrawer';
import { PlayerCardDialog } from '../page-objects/PlayerCardDialog';
import { MOBILE_VIEWPORT, DEFAULT_TEAM } from '../config/test-data';
import { waitForTableData } from '../helpers/table';
import { waitForTeamChange } from '../helpers/wait';

test.describe('Mobile', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  let settingsDrawer: SettingsDrawer;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    settingsDrawer = new SettingsDrawer(page);
    await waitForTableData(page);
  });

  test('displays team name and updates on team change', async ({ page }) => {
    // Verify initial team name
    const teamName = page.locator('.mobile-team-name');
    await expect(teamName).toBeVisible();
    await expect(teamName).toHaveText(DEFAULT_TEAM);

    // Change team via drawer
    await settingsDrawer.open();
    const newTeam = 'Dallas Stars';
    await settingsDrawer.selectTeam(newTeam);
    await settingsDrawer.close();

    await waitForTeamChange(page, newTeam);
    await expect(teamName).toHaveText(newTeam);
  });

  test('settings drawer opens via gear, closes via button and Escape', async ({ page }) => {
    // Initially closed
    expect(await settingsDrawer.isOpen()).toBe(false);

    // Open and verify controls visible
    await settingsDrawer.open();
    expect(await settingsDrawer.isOpen()).toBe(true);
    await expect(page.getByRole('combobox', { name: 'Joukkue' })).toBeVisible();

    // Close via button
    await settingsDrawer.close();
    expect(await settingsDrawer.isOpen()).toBe(false);

    // Open again, close via Escape
    await settingsDrawer.open();
    expect(await settingsDrawer.isOpen()).toBe(true);
    await settingsDrawer.closeViaEscape();
    expect(await settingsDrawer.isOpen()).toBe(false);
  });

  test('drawer filter changes persist when reopening', async ({ page }) => {
    // Set filters
    await settingsDrawer.open();
    await settingsDrawer.toggleStatsPerGame();
    await settingsDrawer.setMinGames(30);
    await settingsDrawer.close();

    await page.waitForTimeout(500);

    // Reopen and verify filters persisted
    await settingsDrawer.open();
    const statsToggle = page.getByLabel('Tilastot per ottelu');
    await expect(statsToggle).toBeChecked();

    const minGamesSlider = page.locator('#min-games-slider input[type="range"]');
    const sliderValue = await minGamesSlider.inputValue();
    expect(parseInt(sliderValue)).toBeGreaterThanOrEqual(30);
  });

  test('shows last updated timestamp in drawer', async ({ page }) => {
    await settingsDrawer.open();

    const drawer = page.locator('mat-sidenav[position="start"]');
    const lastUpdated = drawer.locator('.settings-drawer-last-modified');
    await expect(lastUpdated).toBeVisible();
    await expect(lastUpdated).toContainText(/Päivitetty/i);
  });

  test('player card graphs and accordion work on mobile', async ({ page }) => {
    // Select all seasons for line graphs
    await settingsDrawer.open();
    await settingsDrawer.selectSeason('Kaikki kaudet');
    await settingsDrawer.close();

    // Open player card and go to graphs tab
    const playerCard = new PlayerCardDialog(page);
    await playerCard.open('Jamie Benn');
    await playerCard.switchToTab('graphs');
    await playerCard.verifyTabContent('graphs');

    const hasLineGraphs = await playerCard.hasLineGraphs();
    expect(hasLineGraphs).toBe(true);

    // Test accordion toggle
    const accordionButton = page.locator('button.graphs-controls-toggle');
    await accordionButton.click();
    await expect(accordionButton).toHaveAttribute('aria-expanded', 'true');

    const controlsList = page.locator('.graphs-controls.visible');
    await expect(controlsList).toBeVisible();

    // Toggle series off and back on
    const checkbox = controlsList.getByRole('checkbox', { name: 'Pisteet' });
    await expect(checkbox).toBeVisible();
    await checkbox.click();
    await page.waitForTimeout(300);
    await checkbox.click();
    await page.waitForTimeout(300);

    // Close accordion via overlay
    const overlay = page.locator('.graphs-controls-overlay.visible');
    await overlay.click();
    await expect(accordionButton).toHaveAttribute('aria-expanded', 'false');
  });
});
