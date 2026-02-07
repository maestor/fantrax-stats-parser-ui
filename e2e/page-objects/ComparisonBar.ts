import { Page, expect } from '@playwright/test';

/**
 * Page object for the comparison floating bar at the bottom of the screen.
 * The bar appears when at least one player is selected for comparison.
 */
export class ComparisonBar {
  constructor(private page: Page) {}

  private get bar() {
    return this.page.locator('[role="status"]');
  }

  /**
   * Select a player for comparison by clicking their checkbox in the table row.
   * Uses the aria-label attribute set on each mat-checkbox.
   */
  async selectPlayer(playerName: string): Promise<void> {
    const row = this.page.locator('tr[mat-row]', { hasText: playerName });
    await row.getByRole('checkbox').click();
  }

  /**
   * Deselect a player by clicking their checkbox again.
   */
  async deselectPlayer(playerName: string): Promise<void> {
    await this.selectPlayer(playerName);
  }

  /**
   * Check if the floating bar is visible.
   */
  async isVisible(): Promise<boolean> {
    return this.bar.isVisible();
  }

  /**
   * Get the text content of the bar.
   */
  async getBarText(): Promise<string> {
    return await this.bar.innerText();
  }

  /**
   * Click the compare button ("Vertaile").
   */
  async clickCompare(): Promise<void> {
    await this.page.getByRole('button', { name: 'Vertaile' }).click();
    // Wait for dialog to open
    await this.page.getByRole('dialog').waitFor({ state: 'visible' });
  }

  /**
   * Click the clear button ("Tyhjennä").
   */
  async clickClear(): Promise<void> {
    await this.page.getByRole('button', { name: 'Tyhjennä' }).click();
  }
}
