import { test, expect } from '../fixtures/test-fixture';
import { DEFAULT_TEAM } from '../config/test-data';
import { selectTeam, toggleStatsPerGame } from '../helpers/filters';
import { waitForTableData, getFirstRowText } from '../helpers/table';

test.describe('Team Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForTableData(page);
  });

  test('changes team and updates data', async ({ page }) => {
    // Verify initial team selected
    const teamSelector = page.getByRole('combobox', { name: 'Joukkue' });
    await expect(teamSelector).toContainText(DEFAULT_TEAM);

    // Get initial table data
    const initialData = await getFirstRowText(page);

    // Switch to different team
    const newTeam = 'Tampa Bay Lightning';
    await selectTeam(page, newTeam);

    // Verify team selector updated
    await expect(teamSelector).toContainText(newTeam);

    // Verify data changed
    const newData = await getFirstRowText(page);
    expect(newData).not.toBe(initialData);
  });

  test('resets filters when team changes', async ({ page }) => {
    // Enable stats per game toggle
    await toggleStatsPerGame(page);

    // Verify toggle is checked
    const statsPerGameToggle = page.getByLabel('Tilastot per ottelu');
    await expect(statsPerGameToggle).toBeChecked();

    // Switch team
    const newTeam = 'Tampa Bay Lightning';
    await selectTeam(page, newTeam);

    // Verify toggle is unchecked (reset)
    await expect(statsPerGameToggle).not.toBeChecked();
  });

  test('does not restore filters when switching back to original team', async ({
    page,
  }) => {
    // Enable stats per game toggle
    await toggleStatsPerGame(page);

    // Verify toggle is checked
    const statsPerGameToggle = page.getByLabel('Tilastot per ottelu');
    await expect(statsPerGameToggle).toBeChecked();

    // Switch to different team
    const newTeam = 'Tampa Bay Lightning';
    await selectTeam(page, newTeam);

    // Switch back to original team
    await selectTeam(page, DEFAULT_TEAM);

    // Verify toggle is still unchecked (not restored)
    await expect(statsPerGameToggle).not.toBeChecked();
  });
});
