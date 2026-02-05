import { Page } from '@playwright/test';
import { TAB_LABELS } from '../config/test-data';

/**
 * Get available tabs in player card dialog
 */
export async function getAvailableTabs(page: Page): Promise<string[]> {
  const dialog = page.getByRole('dialog');
  const tabs = dialog.getByRole('tab');
  const count = await tabs.count();
  const tabNames: string[] = [];

  for (let i = 0; i < count; i++) {
    const text = await tabs.nth(i).textContent();
    if (text) {
      tabNames.push(text.trim());
    }
  }

  return tabNames;
}

/**
 * Check if line graphs are present in graphs tab
 */
export async function hasLineGraphs(page: Page): Promise<boolean> {
  const dialog = page.getByRole('dialog');
  // Look for graph series selection checkboxes (desktop) or accordion (mobile)
  const checkboxes = dialog.locator('input[type="checkbox"]');
  const accordion = dialog.getByText('Näytettävät tilastot');

  const hasCheckboxes = (await checkboxes.count()) > 0;
  const hasAccordion = (await accordion.count()) > 0;

  return hasCheckboxes || hasAccordion;
}

/**
 * Check if by-season tab exists
 */
export async function hasBySeasonTab(page: Page): Promise<boolean> {
  const tabs = await getAvailableTabs(page);
  return tabs.includes(TAB_LABELS.PLAYER_CARD_BY_SEASON);
}
