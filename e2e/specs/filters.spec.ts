import { test, expect } from '../fixtures/test-fixture';
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
    test('season selector and start-from season filter data', async ({ page }) => {
      // Select "Kaikki kaudet" (all seasons)
      await selectSeason(page, 'Kaikki kaudet');
      const allSeasonsData = await getRowCount(page);

      // Select a specific season — should have fewer rows
      const seasonSelector = page.getByRole('combobox', {
        name: 'Kausivalitsin',
      });
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

      // Switch back to all seasons and test start-from filter
      await selectSeason(page, 'Kaikki kaudet');
      const allSeasonsCount = await getRowCount(page);

      const startFromSelector = page.getByRole('combobox', {
        name: 'Alkaen kaudesta',
      });
      await startFromSelector.click();
      await page.getByRole('option').nth(5).click();
      await waitForTableData(page);

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
      const firstTotalGoals = parseFloat(totalGoals[0] || '0');

      await toggleStatsPerGame(page);

      const perGameGoals = await getColumnValues(page, goalsColumnClass);
      const firstPerGameGoals = parseFloat(perGameGoals[0] || '0');

      expect(firstPerGameGoals).toBeLessThanOrEqual(firstTotalGoals);
      expect(firstPerGameGoals).not.toBe(Math.floor(firstPerGameGoals));
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
      await selectSeason(page, 'Kaikki kaudet');
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
      // Single season + position filter
      const seasonSelector = page.getByRole('combobox', {
        name: 'Kausivalitsin',
      });
      await seasonSelector.click();
      await page.getByRole('option').nth(1).click();
      await waitForTableData(page);

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
      await switchToPlayersTab(page);
      await toggleStatsPerGame(page);
      await setMinGames(page, 20);

      const playerStatsToggle = page.getByLabel('Tilastot per ottelu');
      await expect(playerStatsToggle).toBeChecked();

      await switchToGoaliesTab(page);
      await waitForTableData(page);

      const goalieStatsToggle = page.getByLabel('Tilastot per ottelu');
      await expect(goalieStatsToggle).not.toBeChecked();

      await toggleStatsPerGame(page);
      await expect(goalieStatsToggle).toBeChecked();

      await switchToPlayersTab(page);
      await waitForTableData(page);
      await expect(playerStatsToggle).toBeChecked();
    });
  });
});
