import { Page, expect } from '@playwright/test';
import { waitForTableData } from '../helpers/table';

/**
 * Page object for stats table component
 */
export class StatsTable {
  constructor(private page: Page) {}

  /**
   * Search for a player by name
   */
  async searchPlayer(playerName: string): Promise<void> {
    const searchInput = this.page.getByPlaceholder('Hae pelaajaa');
    await searchInput.clear();
    await searchInput.fill(playerName);
    await this.page.waitForTimeout(300); // Wait for search debounce
  }

  /**
   * Clear search input
   */
  async clearSearch(): Promise<void> {
    const searchInput = this.page.getByPlaceholder('Hae pelaajaa');
    await searchInput.clear();
    await this.page.waitForTimeout(300); // Wait for search debounce
  }

  /**
   * Sort by a column
   */
  async sortByColumn(columnName: string): Promise<void> {
    const header = this.page.getByRole('columnheader', { name: columnName });
    await header.click();
    await this.page.waitForTimeout(300); // Wait for sort animation
  }

  /**
   * Get current row count
   */
  async getRowCount(): Promise<number> {
    const rows = this.page.locator('tr[mat-row]');
    return await rows.count();
  }

  /**
   * Click a player row to open card
   */
  async clickPlayerRow(playerName: string): Promise<void> {
    const row = this.page.locator('tr[mat-row]', { hasText: playerName });
    await row.click();
    // Wait for dialog to open
    await this.page.getByRole('dialog').waitFor({ state: 'visible' });
  }

  /**
   * Verify table has loaded with data
   */
  async verifyDataLoaded(): Promise<void> {
    await waitForTableData(this.page);
    const rowCount = await this.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  }
}
