import { Page } from '@playwright/test';
import { FILTER_LABELS } from '../config/test-data';
import { waitForFilterUpdate } from './wait';

/**
 * Select a team from the dropdown
 */
export async function selectTeam(page: Page, teamName: string): Promise<void> {
  const teamSelector = page.getByRole('combobox', {
    name: FILTER_LABELS.TEAM,
  });
  await teamSelector.click();
  await page.getByRole('option', { name: teamName }).click();
  await waitForFilterUpdate(page);
}

/**
 * Select a season from the dropdown
 */
export async function selectSeason(
  page: Page,
  season: string
): Promise<void> {
  const seasonSelector = page.getByRole('combobox', {
    name: FILTER_LABELS.SEASON,
  });
  await seasonSelector.click();
  await page.getByRole('option', { name: season }).click();
  await waitForFilterUpdate(page);
}

/**
 * Select start-from season
 */
export async function selectStartFromSeason(
  page: Page,
  season: string
): Promise<void> {
  const startFromSelector = page.getByRole('combobox', {
    name: FILTER_LABELS.START_FROM,
  });
  await startFromSelector.click();
  await page.getByRole('option', { name: season }).click();
  await waitForFilterUpdate(page);
}

/**
 * Toggle stats per game switch
 */
export async function toggleStatsPerGame(page: Page): Promise<void> {
  const toggle = page.getByRole('switch', {
    name: FILTER_LABELS.STATS_PER_GAME,
  });
  await toggle.click();
  await waitForFilterUpdate(page);
}

/**
 * Set minimum games slider value
 */
export async function setMinGames(
  page: Page,
  value: number
): Promise<void> {
  const slider = page.locator('#min-games-slider');
  // Click at position to set value (approximate)
  const percentage = value / 100;
  await slider.click({ position: { x: 200 * percentage, y: 10 } });
  await waitForFilterUpdate(page);
}

/**
 * Select position filter
 */
export async function selectPosition(
  page: Page,
  position: 'all' | 'forwards' | 'defense'
): Promise<void> {
  let buttonName: string;
  switch (position) {
    case 'all':
      buttonName = FILTER_LABELS.POSITION_ALL;
      break;
    case 'forwards':
      buttonName = FILTER_LABELS.POSITION_FORWARDS;
      break;
    case 'defense':
      buttonName = FILTER_LABELS.POSITION_DEFENSE;
      break;
  }
  // Use getByRole to be more specific (avoids matching dropdown text)
  await page.getByRole('button', { name: buttonName }).click();
  await waitForFilterUpdate(page);
}

/**
 * Switch report type (regular season vs playoffs)
 */
export async function switchReportType(
  page: Page,
  type: 'regular' | 'playoffs'
): Promise<void> {
  const label =
    type === 'regular'
      ? FILTER_LABELS.REPORT_TYPE_REGULAR
      : FILTER_LABELS.REPORT_TYPE_PLAYOFFS;
  const reportTypeSelector = page.getByRole('combobox', {
    name: 'Stats report type',
  });
  await reportTypeSelector.click();
  await page.getByRole('option', { name: label }).click();
  await waitForFilterUpdate(page);
}
