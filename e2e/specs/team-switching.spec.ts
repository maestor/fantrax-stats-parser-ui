import { test, expect } from '../fixtures/test-fixture';
import {
  DEFAULT_TEAM,
  FILTER_LABELS,
  ROUTE_LABELS,
  SEARCH_LABELS,
} from '../config/test-data';
import { selectTeam, toggleStatsPerGame } from '../helpers/filters';
import { waitForTableData, getFirstRowText } from '../helpers/table';
import { SettingsDrawer } from '../page-objects/SettingsDrawer';
import type { Request } from '@playwright/test';

function normalizeApiUrl(request: Request): string {
  const url = new URL(request.url());
  const normalizedPath = url.pathname.replace(/^\/api/, '');
  return `${normalizedPath}${url.search}`;
}

function requestMatches(
  requestUrl: string,
  path: string,
  expectedParams: Record<string, string>,
): boolean {
  const url = new URL(`http://placeholder${requestUrl}`);
  if (url.pathname !== path) {
    return false;
  }

  return Object.entries(expectedParams).every(
    ([key, value]) => url.searchParams.get(key) === value,
  );
}

test.describe('Team Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForTableData(page);
  });

  test('changes team and updates data', async ({ page }) => {
    const settingsDrawer = new SettingsDrawer(page);
    const subtitle = page.getByRole('heading', {
      level: 2,
      name: `${ROUTE_LABELS.PLAYER_STATS}: ${DEFAULT_TEAM}`,
    });
    await expect(subtitle).toBeVisible();

    const initialData = await getFirstRowText(page);
    const newTeam = 'Tampa Bay Lightning';

    await settingsDrawer.open();
    await selectTeam(page, newTeam);

    await expect(page.getByRole('combobox', { name: FILTER_LABELS.TEAM })).toContainText(
      newTeam,
    );
    await expect(page.locator('mat-sidenav.mat-drawer-opened')).toBeVisible();
    await expect
      .poll(() => getFirstRowText(page), { timeout: 10_000 })
      .not.toBe(initialData);
  });

  test('keeps goalie stats active while switching teams', async ({ page }) => {
    const settingsDrawer = new SettingsDrawer(page);

    await page.goto('/goalie-stats');
    await waitForTableData(page);

    const initialData = await getFirstRowText(page);
    const newTeam = 'Tampa Bay Lightning';

    await settingsDrawer.open();
    await selectTeam(page, newTeam);

    await expect(page).toHaveURL(/.*\/goalie-stats$/);
    await expect(page.getByRole('combobox', { name: FILTER_LABELS.TEAM })).toContainText(
      newTeam,
    );
    await expect(page.locator('mat-sidenav.mat-drawer-opened')).toBeVisible();
    await expect
      .poll(() => getFirstRowText(page), { timeout: 10_000 })
      .not.toBe(initialData);
  });

  test('resets filters on team change and does not restore when switching back', async ({ page }) => {
    const settingsDrawer = new SettingsDrawer(page);

    // Enable stats per game toggle
    await toggleStatsPerGame(page);
    await settingsDrawer.open();
    const statsPerGameToggle = page.getByLabel(FILTER_LABELS.STATS_PER_GAME);
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

  test('defers seasons and stats requests when team changes on a browse route until returning to stats', async ({ page }) => {
    const settingsDrawer = new SettingsDrawer(page);
    const seasonRequests: string[] = [];
    const statsRequests: string[] = [];
    const recordRequest = (request: Request) => {
      const normalizedUrl = normalizeApiUrl(request);

      if (normalizedUrl.startsWith('/seasons/')) {
        seasonRequests.push(normalizedUrl);
      }

      if (
        normalizedUrl.startsWith('/players/combined/')
        || normalizedUrl.startsWith('/players/season/')
        || normalizedUrl.startsWith('/goalies/combined/')
        || normalizedUrl.startsWith('/goalies/season/')
      ) {
        statsRequests.push(normalizedUrl);
      }
    };

    page.on('request', recordRequest);

    try {
      await page.goto('/career/players');
      await expect(page).toHaveURL(/\/career\/players$/);
      await expect(page.getByLabel(SEARCH_LABELS.CAREER_PLAYER)).toBeVisible();

      await settingsDrawer.open();
      await expect(page.getByRole('combobox', { name: FILTER_LABELS.TEAM })).toBeVisible();
      await expect(page.getByRole('combobox', { name: FILTER_LABELS.SEASON })).toHaveCount(0);

      seasonRequests.length = 0;
      statsRequests.length = 0;

      await settingsDrawer.selectTeam('Tampa Bay Lightning');
      await expect(page).toHaveURL(/\/career\/players$/);
      await expect(page.getByRole('combobox', { name: FILTER_LABELS.TEAM })).toContainText(
        'Tampa Bay Lightning',
      );
      await page.waitForTimeout(500);

      expect(seasonRequests).toEqual([]);
      expect(statsRequests).toEqual([]);

      await page.goto('/player-stats');
      await waitForTableData(page);
      await expect(
        page.getByRole('heading', {
          level: 2,
          name: `${ROUTE_LABELS.PLAYER_STATS}: Tampa Bay Lightning`,
        }),
      ).toBeVisible();

      await expect
        .poll(() =>
          seasonRequests.some((url) =>
            requestMatches(url, '/seasons/regular', { teamId: '16' })
          )
        )
        .toBe(true);
      await expect
        .poll(() =>
          statsRequests.some((url) =>
            requestMatches(url, '/players/combined/regular', {
              startFrom: '2012',
              teamId: '16',
            })
          )
        )
        .toBe(true);
    } finally {
      page.off('request', recordRequest);
    }
  });
});
