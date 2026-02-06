import { test, expect } from '@playwright/test';
import {
  selectSeason,
  switchReportType,
  selectPosition,
  toggleStatsPerGame,
  setMinGames,
} from '../helpers/filters';
import {
  waitForTableData,
  getRowCount,
  getColumnValues,
} from '../helpers/table';
import { switchToPlayersTab, switchToGoaliesTab } from '../helpers/navigation';

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForTableData(page);
  });

  test.describe('Individual Filters', () => {
    test('season selector changes data', async ({ page }) => {
      // Select "Kaikki kaudet" (all seasons)
      await selectSeason(page, 'Kaikki kaudet');
      const allSeasonsData = await getRowCount(page);

      // Select a specific season
      const seasonSelector = page.getByRole('combobox', {
        name: 'Kausivalitsin',
      });
      await seasonSelector.click();
      const options = page.getByRole('option');
      const firstSeasonText = await options.nth(1).textContent();
      await options.nth(1).click();
      await waitForTableData(page);

      const singleSeasonData = await getRowCount(page);

      // All seasons should have more or equal rows than single season
      expect(allSeasonsData).toBeGreaterThanOrEqual(singleSeasonData);

      // Verify season selector shows selected season
      if (firstSeasonText) {
        await expect(seasonSelector).toContainText(firstSeasonText);
      }
    });

    test('start-from season filters data', async ({ page }) => {
      // Get row count with all seasons
      await selectSeason(page, 'Kaikki kaudet');
      const allSeasonsCount = await getRowCount(page);

      // Select start-from season (e.g., 2018-19)
      const startFromSelector = page.getByRole('combobox', {
        name: 'Alkaen kaudesta',
      });
      await startFromSelector.click();
      const options = page.getByRole('option');
      // Select a season that's not the oldest (e.g., 5th option)
      await options.nth(5).click();
      await waitForTableData(page);

      const filteredCount = await getRowCount(page);

      // Filtered should have fewer or equal rows
      expect(filteredCount).toBeLessThanOrEqual(allSeasonsCount);
    });

    test('report type toggle changes data', async ({ page }) => {
      // Get regular season data
      await switchReportType(page, 'regular');
      const regularData = await getRowCount(page);

      // Switch to playoffs
      await switchReportType(page, 'playoffs');
      const playoffsData = await getRowCount(page);

      // Data should be different (playoffs typically has fewer rows)
      expect(playoffsData).not.toBe(regularData);
    });

    test('position filter reduces row count', async ({ page }) => {
      // Get count with all positions
      await selectPosition(page, 'all');
      const allCount = await getRowCount(page);

      // Filter by forwards
      await selectPosition(page, 'forwards');
      const forwardsCount = await getRowCount(page);

      // Forwards should be less than all
      expect(forwardsCount).toBeLessThan(allCount);

      // Filter by defense
      await selectPosition(page, 'defense');
      const defenseCount = await getRowCount(page);

      // Defense should be less than all
      expect(defenseCount).toBeLessThan(allCount);

      // All should equal forwards + defense (approximately)
      expect(allCount).toBeGreaterThanOrEqual(forwardsCount);
      expect(allCount).toBeGreaterThanOrEqual(defenseCount);
    });

    test('stats per game toggle changes values', async ({ page }) => {
      // Get goals value from first row (total stats)
      const goalsColumnClass = 'mat-column-goals';
      const totalGoals = await getColumnValues(page, goalsColumnClass);
      const firstTotalGoals = parseFloat(totalGoals[0] || '0');

      // Enable stats per game
      await toggleStatsPerGame(page);

      // Get goals value from first row (per game stats)
      const perGameGoals = await getColumnValues(page, goalsColumnClass);
      const firstPerGameGoals = parseFloat(perGameGoals[0] || '0');

      // Per game should be less than total (for players with >1 game)
      expect(firstPerGameGoals).toBeLessThanOrEqual(firstTotalGoals);

      // Per game should be a decimal value (not integer)
      expect(firstPerGameGoals).not.toBe(Math.floor(firstPerGameGoals));
    });

    test('min games slider filters players', async ({ page }) => {
      // Get count with min games = 0
      const initialCount = await getRowCount(page);

      // Set min games to 20
      await setMinGames(page, 20);

      // Get new count
      const filteredCount = await getRowCount(page);

      // Filtered should have fewer rows
      expect(filteredCount).toBeLessThan(initialCount);
    });
  });

  test.describe('Filter Combinations', () => {
    test('all seasons + stats per game + min games combination', async ({
      page,
    }) => {
      // Apply combination of filters
      await selectSeason(page, 'Kaikki kaudet');
      await toggleStatsPerGame(page);
      await setMinGames(page, 50);

      // Verify table has data
      const count = await getRowCount(page);
      expect(count).toBeGreaterThan(0);

      // Verify per game stats are shown
      const goalsColumnClass = 'mat-column-goals';
      const goals = await getColumnValues(page, goalsColumnClass);
      const firstGoals = parseFloat(goals[0] || '0');

      // Should be decimal (per game)
      expect(firstGoals).not.toBe(Math.floor(firstGoals));
    });

    test('single season + position filter combination', async ({ page }) => {
      // Select a specific season
      const seasonSelector = page.getByRole('combobox', {
        name: 'Kausivalitsin',
      });
      await seasonSelector.click();
      await page.getByRole('option').nth(1).click();
      await waitForTableData(page);

      // Filter by forwards
      await selectPosition(page, 'forwards');

      // Verify table has data
      const count = await getRowCount(page);
      expect(count).toBeGreaterThan(0);
    });

    test('playoffs + min games + stats per game combination', async ({
      page,
    }) => {
      // Apply combination
      await switchReportType(page, 'playoffs');
      await setMinGames(page, 5);
      await toggleStatsPerGame(page);

      // Verify table has data
      const count = await getRowCount(page);
      expect(count).toBeGreaterThan(0);

      // Verify per game stats
      const goalsColumnClass = 'mat-column-goals';
      const goals = await getColumnValues(page, goalsColumnClass);
      const firstGoals = parseFloat(goals[0] || '0');

      // Should be decimal
      expect(firstGoals).not.toBe(Math.floor(firstGoals));
    });

    test('start from season + position filter combination', async ({
      page,
    }) => {
      // Select all seasons first
      await selectSeason(page, 'Kaikki kaudet');

      // Set start-from season
      const startFromSelector = page.getByRole('combobox', {
        name: 'Alkaen kaudesta',
      });
      await startFromSelector.click();
      await page.getByRole('option').nth(3).click();
      await waitForTableData(page);

      // Filter by defense
      await selectPosition(page, 'defense');

      // Verify table has data
      const count = await getRowCount(page);
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Filter Isolation', () => {
    test('player and goalie filters are independent', async ({ page }) => {
      // On players tab, set filters
      await switchToPlayersTab(page);
      await toggleStatsPerGame(page);
      await setMinGames(page, 20);

      // Verify player filters applied
      const playerStatsToggle = page.getByLabel('Tilastot per ottelu');
      await expect(playerStatsToggle).toBeChecked();

      // Switch to goalies
      await switchToGoaliesTab(page);
      await waitForTableData(page);

      // Verify goalie filters are independent (not affected by player filters)
      const goalieStatsToggle = page.getByLabel('Tilastot per ottelu');
      await expect(goalieStatsToggle).not.toBeChecked();

      // Apply goalie filters
      await toggleStatsPerGame(page);
      await expect(goalieStatsToggle).toBeChecked();

      // Switch back to players
      await switchToPlayersTab(page);
      await waitForTableData(page);

      // Verify player filters still applied
      await expect(playerStatsToggle).toBeChecked();
    });
  });
});
