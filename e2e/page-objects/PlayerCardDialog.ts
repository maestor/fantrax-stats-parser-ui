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
  constructor(private page: Page) { }

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
    const closeButton = this.dialog.getByRole('button', { name: 'Sulje pelaajakortti' });
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
    const checkbox = this.dialog.getByRole('checkbox', { name: seriesName });
    await checkbox.click();
    await this.page.waitForTimeout(300); // Wait for chart update
  }

  /**
   * Switch chart type (line charts vs distribution/radar)
   */
  async switchChartType(type: 'line' | 'radar'): Promise<void> {
    if (type === 'radar') {
      // Switch to distribution/radar view
      const switchButton = this.dialog.getByRole('button', {
        name: /jakauma/i,
      });
      await switchButton.click();
    } else {
      // Switch back to line charts
      const switchButton = this.dialog.getByRole('button', {
        name: /käyr/i,
      });
      await switchButton.click();
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Verify tab content is visible
   */
  async verifyTabContent(tab: 'stats' | 'by-season' | 'graphs'): Promise<void> {
    // Just verify the dialog is open and has content
    await expect(this.dialog).toBeVisible();

    if (tab === 'stats') {
      // Verify stats table exists (use first() since multiple tables may exist in DOM)
      await expect(this.dialog.locator('table').first()).toBeVisible();
    } else if (tab === 'by-season') {
      // Verify by-season table with class
      await expect(this.dialog.locator('table.season-table')).toBeVisible();
    } else if (tab === 'graphs') {
      // Wait for graph content: either checkboxes (line charts) or chart type buttons (radar)
      const graphContent = this.dialog
        .getByRole('checkbox')
        .or(this.dialog.getByRole('button', { name: /jakauma|käyr/i }));
      await expect(graphContent.first()).toBeVisible({ timeout: 10000 });
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
    const linkButton = this.dialog.getByLabel('Kopioi linkki leikepöydälle');
    await linkButton.click();
    // Wait for clipboard operation
    await this.page.waitForTimeout(200);
  }

  /**
   * Get current player name displayed in the card
   */
  async getPlayerName(): Promise<string> {
    const nameEl = this.dialog.locator('.player-card-player-name');
    return (await nameEl.textContent() ?? '').trim();
  }

  /**
   * Navigate to next player via ArrowRight
   */
  async navigateNext(): Promise<void> {
    await this.page.keyboard.press('ArrowRight');
  }

  /**
   * Navigate to previous player via ArrowLeft
   */
  async navigatePrevious(): Promise<void> {
    await this.page.keyboard.press('ArrowLeft');
  }
}
