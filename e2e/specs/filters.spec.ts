import { test, expect } from '../fixtures/test-fixture';
import {
  selectSeason,
  switchReportType,
  selectPosition,
  toggleStatsPerGame,
  setMinGames,
} from '../helpers/filters';
import { FILTER_LABELS, FILTER_VALUES } from '../config/test-data';
import {
  waitForTableData,
  getRowCount,
  getColumnValues,
} from '../helpers/table';
import { switchToPlayersTab, switchToGoaliesTab } from '../helpers/navigation';
import { SettingsDrawer } from '../page-objects/SettingsDrawer';

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForTableData(page);
  });

  test.describe('Individual Filters', () => {
    test('season selector and start-from season filter data', async ({ page }) => {
      const settingsDrawer = new SettingsDrawer(page);

      // Select all seasons
      await selectSeason(page, FILTER_VALUES.ALL_SEASONS);
      const allSeasonsData = await getRowCount(page);

      // Select a specific season — should have fewer rows
      await settingsDrawer.open();
      const seasonSelector = settingsDrawer.combobox(FILTER_LABELS.SEASON);
      await seasonSelector.click();
      const options = page.getByRole('option');
      const firstSeasonText = await options.nth(1).textContent();
      await options.nth(1).click();
      await waitForTableData(page);
      const singleSeasonData = await getRowCount(page);
      expect(allSeasonsData).toBeGreaterThanOrEqual(singleSeasonData);

      if (firstSeasonText) {
        await expect(seasonSelector).toContainText(firstSeasonText);
      }

      await settingsDrawer.close();

      // Switch back to all seasons and test start-from filter
      await selectSeason(page, FILTER_VALUES.ALL_SEASONS);
      const allSeasonsCount = await getRowCount(page);

      await settingsDrawer.open();
      const startFromSelector = settingsDrawer.combobox(FILTER_LABELS.START_FROM);
      await startFromSelector.click();
      const startFromOptions = page.getByRole('option');
      const startFromOption = startFromOptions.nth(5);
      const startFromSeason = await startFromOption.textContent();

      expect(startFromSeason).toBeTruthy();
      await startFromOption.click();
      await waitForTableData(page);
      await settingsDrawer.close();

      const filteredCount = await getRowCount(page);
      expect(filteredCount).toBeLessThanOrEqual(allSeasonsCount);
    });

    test('report type toggle and stats per game change data', async ({ page }) => {
      // Report type toggle
      await switchReportType(page, 'regular');
      const regularData = await getRowCount(page);

      await switchReportType(page, 'playoffs');
      const playoffsData = await getRowCount(page);
      expect(playoffsData).not.toBe(regularData);

      // Switch back to regular for per-game test
      await switchReportType(page, 'regular');

      // Stats per game toggle
      const goalsColumnClass = 'mat-column-goals';
      const totalGoals = await getColumnValues(page, goalsColumnClass);

      await toggleStatsPerGame(page);

      const perGameGoals = await getColumnValues(page, goalsColumnClass);
      expect(perGameGoals.slice(0, 10)).not.toEqual(totalGoals.slice(0, 10));
      expect(perGameGoals.some((value) => /\d+[.,]\d+/.test(value))).toBe(true);
    });

    test('position filter and min games slider reduce row count', async ({ page }) => {
      // Position filter
      await selectPosition(page, 'all');
      const allCount = await getRowCount(page);

      await selectPosition(page, 'forwards');
      const forwardsCount = await getRowCount(page);
      expect(forwardsCount).toBeLessThan(allCount);

      await selectPosition(page, 'defense');
      const defenseCount = await getRowCount(page);
      expect(defenseCount).toBeLessThan(allCount);

      // Reset to all positions for min games test
      await selectPosition(page, 'all');

      // Min games slider
      const initialCount = await getRowCount(page);
      await setMinGames(page, 20);
      const filteredCount = await getRowCount(page);
      expect(filteredCount).toBeLessThan(initialCount);
    });
  });

  test.describe('Filter Combinations', () => {
    test('all seasons + stats per game + min games combination', async ({ page }) => {
      await selectSeason(page, FILTER_VALUES.ALL_SEASONS);
      await toggleStatsPerGame(page);
      await setMinGames(page, 50);

      const count = await getRowCount(page);
      expect(count).toBeGreaterThan(0);

      const goalsColumnClass = 'mat-column-goals';
      const goals = await getColumnValues(page, goalsColumnClass);
      const firstGoals = parseFloat(goals[0] || '0');
      expect(firstGoals).not.toBe(Math.floor(firstGoals));
    });

    test('season + position + report type combinations', async ({ page }) => {
      const settingsDrawer = new SettingsDrawer(page);

      // Single season + position filter
      await settingsDrawer.open();
      const seasonSelector = settingsDrawer.combobox(FILTER_LABELS.SEASON);
      await seasonSelector.click();
      await page.getByRole('option').nth(1).click();
      await waitForTableData(page);
      await settingsDrawer.close();

      await selectPosition(page, 'forwards');
      let count = await getRowCount(page);
      expect(count).toBeGreaterThan(0);

      // Playoffs + min games + stats per game
      await selectPosition(page, 'all');
      await switchReportType(page, 'playoffs');
      await setMinGames(page, 5);
      await toggleStatsPerGame(page);

      count = await getRowCount(page);
      expect(count).toBeGreaterThan(0);

      const goalsColumnClass = 'mat-column-goals';
      const goals = await getColumnValues(page, goalsColumnClass);
      const firstGoals = parseFloat(goals[0] || '0');
      expect(firstGoals).not.toBe(Math.floor(firstGoals));
    });
  });

  test.describe('Filter Isolation', () => {
    test('player and goalie filters are independent', async ({ page }) => {
      const settingsDrawer = new SettingsDrawer(page);

      await switchToPlayersTab(page);
      await toggleStatsPerGame(page);
      await setMinGames(page, 20);

      await settingsDrawer.open();
      const playerStatsToggle = settingsDrawer.switch(FILTER_LABELS.STATS_PER_GAME);
      await expect(playerStatsToggle).toHaveAttribute('aria-checked', 'true');
      await settingsDrawer.close();

      await switchToGoaliesTab(page);
      await waitForTableData(page);

      await settingsDrawer.open();
      const goalieStatsToggle = settingsDrawer.switch(FILTER_LABELS.STATS_PER_GAME);
      await expect(goalieStatsToggle).toHaveAttribute('aria-checked', 'false');
      await settingsDrawer.close();

      await toggleStatsPerGame(page);
      await settingsDrawer.open();
      await expect(goalieStatsToggle).toHaveAttribute('aria-checked', 'true');
      await settingsDrawer.close();

      await switchToPlayersTab(page);
      await waitForTableData(page);
      await settingsDrawer.open();
      await expect(playerStatsToggle).toHaveAttribute('aria-checked', 'true');
    });
  });
});
