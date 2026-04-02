import { Locator, Page } from '@playwright/test';
import { FILTER_LABELS } from '../config/test-data';
import { waitForFilterUpdate } from './wait';
import { SettingsDrawer } from '../page-objects/SettingsDrawer';

async function withVisibleControl(
  page: Page,
  resolveControl: (drawer: SettingsDrawer) => Locator,
  action: (control: Locator) => Promise<void>,
): Promise<void> {
  const drawer = new SettingsDrawer(page);
  const wasOpen = await drawer.isOpen();

  if (!wasOpen) {
    await drawer.open();
  }

  const control = resolveControl(drawer);

  try {
    await control.waitFor({ state: 'visible', timeout: 5_000 });
    await control.scrollIntoViewIfNeeded();
    await action(control);
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
  await withVisibleControl(page, (drawer) => drawer.combobox(FILTER_LABELS.TEAM), async (teamSelector) => {
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
  await withVisibleControl(page, (drawer) => drawer.combobox(FILTER_LABELS.SEASON), async (seasonSelector) => {
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
  await withVisibleControl(page, (drawer) => drawer.combobox(FILTER_LABELS.START_FROM), async (startFromSelector) => {
    await startFromSelector.click();
    await page.getByRole('option', { name: season }).click();
    await waitForFilterUpdate(page);
  });
}

/**
 * Toggle stats per game switch
 */
export async function toggleStatsPerGame(page: Page): Promise<void> {
  await withVisibleControl(page, (drawer) => drawer.switch(FILTER_LABELS.STATS_PER_GAME), async (switchButton) => {
    await switchButton.click();
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
  await withVisibleControl(page, (drawer) => drawer.locator('#min-games-slider input[type="range"]'), async (sliderInput) => {
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
  await withVisibleControl(page, (drawer) => drawer.radio(buttonName), async (toggle) => {
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
  await withVisibleControl(page, (drawer) => drawer.combobox(FILTER_LABELS.REPORT_TYPE), async (reportTypeSelector) => {
    await reportTypeSelector.click();
    await page.getByRole('option', { name: label }).click();
    await waitForFilterUpdate(page);
  });
}
