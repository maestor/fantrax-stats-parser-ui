import { Page } from '@playwright/test';
import { TAB_LABELS } from '../config/test-data';

/**
 * Switch to Players tab
 */
export async function switchToPlayersTab(page: Page): Promise<void> {
  await page.getByRole('tab', { name: TAB_LABELS.PLAYERS }).click();
}

/**
 * Switch to Goalies tab
 */
export async function switchToGoaliesTab(page: Page): Promise<void> {
  await page.getByRole('tab', { name: TAB_LABELS.GOALIES }).click();
}

/**
 * Check if currently on Players view
 */
export async function isOnPlayersView(page: Page): Promise<boolean> {
  return page.url().includes('/player-stats');
}

/**
 * Check if currently on Goalies view
 */
export async function isOnGoaliesView(page: Page): Promise<boolean> {
  return page.url().includes('/goalie-stats');
}
