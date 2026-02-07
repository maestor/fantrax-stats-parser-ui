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
    const teamSelector = page.getByRole('combobox', { name: 'Joukkue' });
    await expect(teamSelector).toContainText(DEFAULT_TEAM);

    const initialData = await getFirstRowText(page);

    const newTeam = 'Tampa Bay Lightning';
    await selectTeam(page, newTeam);

    await expect(teamSelector).toContainText(newTeam);
    const newData = await getFirstRowText(page);
    expect(newData).not.toBe(initialData);
  });

  test('resets filters on team change and does not restore when switching back', async ({ page }) => {
    // Enable stats per game toggle
    await toggleStatsPerGame(page);
    const statsPerGameToggle = page.getByLabel('Tilastot per ottelu');
    await expect(statsPerGameToggle).toBeChecked();

    // Switch team — toggle should reset
    const newTeam = 'Tampa Bay Lightning';
    await selectTeam(page, newTeam);
    await expect(statsPerGameToggle).not.toBeChecked();

    // Switch back to original team — toggle should still be unchecked (not restored)
    await selectTeam(page, DEFAULT_TEAM);
    await expect(statsPerGameToggle).not.toBeChecked();
  });
});
