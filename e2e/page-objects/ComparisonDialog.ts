import { Page } from '@playwright/test';

/**
 * Page object for the comparison dialog.
 *
 * DOM structure (from comparison-dialog.component.html):
 *   div.comparison-dialog
 *     div.dialog-header > h2, button[aria-label="Sulje"]
 *     div.dialog-ingress > p.ingress-names, p.ingress-team
 *     mat-tab-group > mat-tab ("Tilastot"), mat-tab ("Graafit")
 *
 * Stats tab: div.stat-row-desktop (or .stat-row-mobile on mobile)
 * Graphs tab: canvas (Chart.js radar chart)
 */
export class ComparisonDialog {
  constructor(private page: Page) { }

  private get dialog() {
    return this.page.getByRole('dialog');
  }

  /**
   * Check if the dialog is open.
   */
  async isOpen(): Promise<boolean> {
    return this.dialog.isVisible();
  }

  /**
   * Wait for the dialog to be visible.
   */
  async waitForOpen(): Promise<void> {
    await this.dialog.waitFor({ state: 'visible' });
  }

  /**
   * Get the dialog title (h2 text).
   */
  async getTitle(): Promise<string> {
    return await this.dialog.locator('h2').innerText();
  }

  /**
   * Get the ingress names text (p.ingress-names).
   */
  async getIngress(): Promise<string> {
    return await this.dialog.locator('.ingress-names').innerText();
  }

  /**
   * Get the team name text (p.ingress-team).
   */
  async getTeamName(): Promise<string> {
    return await this.dialog.locator('.ingress-team').innerText();
  }

  /**
   * Close the dialog via the X button.
   * The button has aria-label="Sulje" which takes precedence as the accessible name.
   */
  async close(): Promise<void> {
    const closeButton = this.dialog.getByRole('button', { name: 'Sulje vertailu' });
    await closeButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  /**
   * Close the dialog via Escape key.
   */
  async closeViaEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.dialog.waitFor({ state: 'hidden' });
  }

  /**
   * Switch to a tab by name.
   */
  async switchToTab(tab: 'stats' | 'graphs'): Promise<void> {
    const tabName = tab === 'stats' ? 'Tilastot' : 'Graafit';
    await this.dialog.getByRole('tab', { name: tabName }).click();
    // Allow tab content to render
    await this.page.waitForTimeout(300);
  }

  /**
   * Get the count of stat rows in the stats tab.
   * Uses .stat-row-desktop or .stat-row-mobile depending on viewport.
   */
  async getStatRowCount(): Promise<number> {
    const desktopRows = this.dialog.locator('.stat-row-desktop');
    const mobileRows = this.dialog.locator('.stat-row-mobile');
    const desktopCount = await desktopRows.count();
    const mobileCount = await mobileRows.count();
    return desktopCount + mobileCount;
  }

  /**
   * Check if the radar chart canvas is visible.
   */
  async isRadarChartVisible(): Promise<boolean> {
    return await this.dialog.locator('.comparison-radar canvas').isVisible();
  }
}
