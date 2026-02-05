import { Page, expect } from '@playwright/test';
import { TAB_LABELS } from '../config/test-data';
import {
  getAvailableTabs as helperGetAvailableTabs,
  hasLineGraphs as helperHasLineGraphs,
} from '../helpers/player-card';

/**
 * Page object for player/goalie card dialog
 */
export class PlayerCardDialog {
  constructor(private page: Page) {}

  private get dialog() {
    return this.page.getByRole('dialog');
  }

  /**
   * Open player card by clicking a table row
   */
  async open(playerName: string): Promise<void> {
    const row = this.page.locator('tr[mat-row]', { hasText: playerName });
    await row.click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /**
   * Close the dialog via X button
   */
  async close(): Promise<void> {
    const closeButton = this.dialog.getByLabel('Sulje');
    await closeButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  /**
   * Close via Escape key
   */
  async closeViaEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.dialog.waitFor({ state: 'hidden' });
  }

  /**
   * Switch to a specific tab
   */
  async switchToTab(
    tab: 'stats' | 'by-season' | 'graphs'
  ): Promise<void> {
    let tabLabel: string;
    switch (tab) {
      case 'stats':
        tabLabel = TAB_LABELS.PLAYER_CARD_STATS;
        break;
      case 'by-season':
        tabLabel = TAB_LABELS.PLAYER_CARD_BY_SEASON;
        break;
      case 'graphs':
        tabLabel = TAB_LABELS.PLAYER_CARD_GRAPHS;
        break;
    }
    await this.dialog.getByRole('tab', { name: tabLabel }).click();
  }

  /**
   * Toggle a graph series on/off
   */
  async toggleGraphSeries(seriesName: string): Promise<void> {
    // On desktop: direct checkbox
    const checkbox = this.dialog.getByLabel(seriesName);

    // Check if it's in an accordion (mobile)
    const accordion = this.dialog.getByText('Näytettävät tilastot');
    const accordionExists = (await accordion.count()) > 0;

    if (accordionExists) {
      // Open accordion if needed
      const accordionButton = accordion.first();
      const isExpanded = await accordionButton.getAttribute('aria-expanded');
      if (isExpanded !== 'true') {
        await accordionButton.click();
      }
    }

    await checkbox.click();
    await this.page.waitForTimeout(300); // Wait for chart update
  }

  /**
   * Switch to radar chart view
   */
  async switchToRadarChart(): Promise<void> {
    await this.dialog.getByRole('tab', { name: 'Tutkakuvaaja' }).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Switch to line chart view
   */
  async switchToLineChart(): Promise<void> {
    await this.dialog.getByRole('tab', { name: 'Viivakuvaaja' }).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Verify tab content is visible
   */
  async verifyTabContent(tab: 'stats' | 'by-season' | 'graphs'): Promise<void> {
    // Just verify the dialog is open and has content
    await expect(this.dialog).toBeVisible();

    if (tab === 'stats') {
      // Verify stats table headers exist
      await expect(this.dialog.getByText('Kausi')).toBeVisible();
    } else if (tab === 'by-season') {
      // Verify by-season table exists
      await expect(this.dialog.locator('table')).toBeVisible();
    } else if (tab === 'graphs') {
      // Verify graph container exists
      const hasGraphs = await this.hasLineGraphs();
      expect(hasGraphs).toBe(true);
    }
  }

  /**
   * Get available tabs
   */
  async getAvailableTabs(): Promise<string[]> {
    return helperGetAvailableTabs(this.page);
  }

  /**
   * Check if line graphs are present
   */
  async hasLineGraphs(): Promise<boolean> {
    return helperHasLineGraphs(this.page);
  }

  /**
   * Copy player link
   */
  async copyPlayerLink(): Promise<void> {
    const linkButton = this.dialog.getByLabel('Kopioi pelaajan linkki');
    await linkButton.click();
    // Wait for clipboard operation
    await this.page.waitForTimeout(200);
  }
}
