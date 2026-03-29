import { test, expect } from '../fixtures/test-fixture';
import { DEFAULT_TEAM } from '../config/test-data';
import { selectTeam, toggleStatsPerGame } from '../helpers/filters';
import { waitForTableData, getFirstRowText } from '../helpers/table';
import { waitForTeamChange } from '../helpers/wait';
import { SettingsDrawer } from '../page-objects/SettingsDrawer';

test.describe('Team Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForTableData(page);
  });

  test('changes team and updates data', async ({ page }) => {
    const subtitle = page.getByRole('heading', {
      level: 2,
      name: `Pelaajatilastot: ${DEFAULT_TEAM}`,
    });
    await expect(subtitle).toBeVisible();

    const initialData = await getFirstRowText(page);

    const newTeam = 'Tampa Bay Lightning';
    await selectTeam(page, newTeam);

    await waitForTeamChange(page, newTeam);
    const newData = await getFirstRowText(page);
    expect(newData).not.toBe(initialData);
  });

  test('keeps goalie stats active while switching teams', async ({ page }) => {
    await page.goto('/goalie-stats');
    await waitForTableData(page);

    const initialData = await getFirstRowText(page);
    const newTeam = 'Tampa Bay Lightning';

    await selectTeam(page, newTeam);

    await waitForTeamChange(page, newTeam);
    await expect(page).toHaveURL(/.*\/goalie-stats$/);
    const newData = await getFirstRowText(page);
    expect(newData).not.toBe(initialData);
  });

  test('resets filters on team change and does not restore when switching back', async ({ page }) => {
    const settingsDrawer = new SettingsDrawer(page);

    // Enable stats per game toggle
    await toggleStatsPerGame(page);
    await settingsDrawer.open();
    const statsPerGameToggle = page.getByLabel('Tilastot per ottelu');
    await expect(statsPerGameToggle).toBeChecked();
    await settingsDrawer.close();

    // Switch team — toggle should reset
    const newTeam = 'Tampa Bay Lightning';
    await selectTeam(page, newTeam);
    await settingsDrawer.open();
    await expect(statsPerGameToggle).not.toBeChecked();
    await settingsDrawer.close();

    // Switch back to original team — toggle should still be unchecked (not restored)
    await selectTeam(page, DEFAULT_TEAM);
    await settingsDrawer.open();
    await expect(statsPerGameToggle).not.toBeChecked();
  });
});
