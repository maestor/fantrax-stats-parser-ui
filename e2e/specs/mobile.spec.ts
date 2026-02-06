import { test, expect } from '@playwright/test';
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

  test.describe('Basic Mobile Features', () => {
    test('displays team name under title', async ({ page }) => {
      // Verify team name is visible below title in mobile team summary
      const teamName = page.locator('.mobile-team-name');
      await expect(teamName).toBeVisible();
      await expect(teamName).toHaveText(DEFAULT_TEAM);
    });

    test('team name updates when team changes', async ({ page }) => {
      // Open settings drawer
      await settingsDrawer.open();

      // Change team
      const newTeam = 'Dallas Stars';
      await settingsDrawer.selectTeam(newTeam);

      // Close drawer
      await settingsDrawer.close();

      // Wait for team change to complete
      await waitForTeamChange(page, newTeam);

      // Verify team name updated in mobile team summary
      const teamName = page.locator('.mobile-team-name');
      await expect(teamName).toHaveText(newTeam);
    });
  });

  test.describe('Settings Drawer - Basic Interactions', () => {
    test('opens settings drawer via gear icon', async ({ page }) => {
      // Verify drawer is closed initially
      const isOpenBefore = await settingsDrawer.isOpen();
      expect(isOpenBefore).toBe(false);

      // Open drawer
      await settingsDrawer.open();

      // Verify drawer is now open
      const isOpenAfter = await settingsDrawer.isOpen();
      expect(isOpenAfter).toBe(true);

      // Verify settings controls are visible
      const teamSelector = page.getByRole('combobox', { name: 'Joukkue' });
      await expect(teamSelector).toBeVisible();
    });

    test('closes drawer via button', async () => {
      // Open drawer first
      await settingsDrawer.open();
      const isOpenBefore = await settingsDrawer.isOpen();
      expect(isOpenBefore).toBe(true);

      // Close via button
      await settingsDrawer.close();

      // Verify drawer is closed
      const isOpenAfter = await settingsDrawer.isOpen();
      expect(isOpenAfter).toBe(false);
    });

    test('closes drawer via Escape key', async () => {
      // Open drawer
      await settingsDrawer.open();
      const isOpenBefore = await settingsDrawer.isOpen();
      expect(isOpenBefore).toBe(true);

      // Close via Escape
      await settingsDrawer.closeViaEscape();

      // Verify drawer is closed (check class instead of visibility)
      const isOpenAfter = await settingsDrawer.isOpen();
      expect(isOpenAfter).toBe(false);
    });
  });

  test.describe('Settings Drawer - Controls & State', () => {
    test('changes filters via drawer controls', async ({ page }) => {
      // Open drawer
      await settingsDrawer.open();

      // Change filters
      await settingsDrawer.toggleStatsPerGame();
      await settingsDrawer.setMinGames(20);

      // Close drawer
      await settingsDrawer.close();

      // Verify filters were applied (check stats per game toggle is checked)
      await page.waitForTimeout(500);
      await settingsDrawer.open();

      const statsToggle = page.getByLabel('Tilastot per ottelu');
      await expect(statsToggle).toBeChecked();

      await settingsDrawer.close();
    });

    test('preserves filter state when reopening drawer', async ({ page }) => {
      // Open drawer and set filters
      await settingsDrawer.open();
      await settingsDrawer.toggleStatsPerGame();
      await settingsDrawer.setMinGames(30);
      await settingsDrawer.close();

      // Wait for drawer to fully close
      await page.waitForTimeout(500);

      // Reopen drawer
      await settingsDrawer.open();

      // Verify filters are still set
      const statsToggle = page.getByLabel('Tilastot per ottelu');
      await expect(statsToggle).toBeChecked();

      const minGamesSlider = page.locator('#min-games-slider input[type="range"]');
      const sliderValue = await minGamesSlider.inputValue();
      expect(parseInt(sliderValue)).toBeGreaterThanOrEqual(30);
    });

    test('shows last updated timestamp in drawer', async ({ page }) => {
      // Open drawer
      await settingsDrawer.open();

      // Verify last updated text is visible in the drawer
      const drawer = page.locator('mat-sidenav[position="start"]');
      const lastUpdated = drawer.locator('.settings-drawer-last-modified');
      await expect(lastUpdated).toBeVisible();
      await expect(lastUpdated).toContainText(/Päivitetty/i);
    });
  });

  test.describe('Mobile Player Card', () => {
    test('player card shows graphs on mobile', async ({ page }) => {
      // Ensure "Kaikki kaudet" is selected for line graphs
      await settingsDrawer.open();
      await settingsDrawer.selectSeason('Kaikki kaudet');
      await settingsDrawer.close();

      // Open player card
      const playerCard = new PlayerCardDialog(page);
      await playerCard.open('Jamie Benn');

      // Switch to graphs tab
      await playerCard.switchToTab('graphs');

      // Verify graphs are visible (accordion feature not yet implemented)
      await playerCard.verifyTabContent('graphs');

      // Verify line graphs are visible
      const hasLineGraphs = await playerCard.hasLineGraphs();
      expect(hasLineGraphs).toBe(true);
    });
  });
});
