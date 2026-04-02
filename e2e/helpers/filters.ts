import { Locator, Page } from '@playwright/test';
import { FILTER_LABELS } from '../config/test-data';
import { waitForFilterUpdate } from './wait';
import { SettingsDrawer } from '../page-objects/SettingsDrawer';

async function withVisibleControl(
  page: Page,
  control: Locator,
  action: () => Promise<void>,
): Promise<void> {
  const drawer = new SettingsDrawer(page);
  const wasOpen = await drawer.isOpen();

  if (!wasOpen) {
    await drawer.open();
  }

  try {
    await control.waitFor({ state: 'visible', timeout: 5_000 });
    await control.scrollIntoViewIfNeeded();
    await action();
  } finally {
    if (!wasOpen) {
      await drawer.close();
    }
  }
}

/**
 * Select a team from the dropdown
 */
export async function selectTeam(page: Page, teamName: string): Promise<void> {
  const teamSelector = page.getByRole('combobox', {
    name: FILTER_LABELS.TEAM,
  });
  await withVisibleControl(page, teamSelector, async () => {
    await teamSelector.click();
    await page.getByRole('option', { name: teamName }).click();
    await waitForFilterUpdate(page);
  });
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
  await withVisibleControl(page, seasonSelector, async () => {
    await seasonSelector.click();
    await page.getByRole('option', { name: season }).click();
    await waitForFilterUpdate(page);
  });
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
  await withVisibleControl(page, startFromSelector, async () => {
    await startFromSelector.click();
    await page.getByRole('option', { name: season }).click();
    await waitForFilterUpdate(page);
  });
}

/**
 * Toggle stats per game switch
 */
export async function toggleStatsPerGame(page: Page): Promise<void> {
  const switchButton = page.locator('mat-slide-toggle button[role="switch"]');
  await withVisibleControl(page, switchButton, async () => {
    await switchButton.dispatchEvent('click');
    await waitForFilterUpdate(page);
  });
}

/**
 * Set minimum games slider value
 */
export async function setMinGames(
  page: Page,
  value: number
): Promise<void> {
  const sliderInput = page.locator('#min-games-slider input[type="range"]');
  await withVisibleControl(page, sliderInput, async () => {
    await sliderInput.fill(String(value));
    await waitForFilterUpdate(page);
  });
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
  const toggle = page.getByRole('radio', { name: buttonName });

  await withVisibleControl(page, toggle, async () => {
    await toggle.click();
    await waitForFilterUpdate(page);
  });
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
    name: FILTER_LABELS.REPORT_TYPE,
  });
  await withVisibleControl(page, reportTypeSelector, async () => {
    await reportTypeSelector.click();
    await page.getByRole('option', { name: label }).click();
    await waitForFilterUpdate(page);
  });
}
