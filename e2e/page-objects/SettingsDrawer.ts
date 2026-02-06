import { Page } from '@playwright/test';
import {
  selectTeam as helperSelectTeam,
  selectSeason as helperSelectSeason,
  toggleStatsPerGame as helperToggleStatsPerGame,
  setMinGames as helperSetMinGames,
  selectPosition as helperSelectPosition,
} from '../helpers/filters';

/**
 * Page object for mobile settings drawer
 */
export class SettingsDrawer {
  constructor(private page: Page) {}

  /**
   * Open settings drawer (mobile)
   */
  async open(): Promise<void> {
    const settingsButton = this.page.getByLabel('Avaa asetuspaneeli');
    await settingsButton.click();
    // Wait for drawer open animation to complete (not just start)
    await this.page
      .locator('mat-sidenav.mat-drawer-opened:not(.mat-drawer-animating)')
      .waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Close settings drawer via button
   */
  async close(): Promise<void> {
    // Wait for any pending operations before closing
    await this.page.waitForTimeout(300);
    // Check if drawer is already closed (e.g. auto-closed on route change)
    const isCurrentlyOpen = await this.isOpen();
    if (!isCurrentlyOpen) {
      return;
    }
    // The close button inside the drawer
    const closeButton = this.page.getByLabel('Sulje asetuspaneeli').first();
    await closeButton.click({ timeout: 5000 });
    // Wait for drawer close animation to complete
    await this.page
      .locator('mat-sidenav.mat-drawer-opened')
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {});
    await this.page.waitForTimeout(300);
  }

  /**
   * Close via Escape key
   */
  async closeViaEscape(): Promise<void> {
    // Ensure open animation is complete before pressing Escape
    await this.page
      .locator('mat-sidenav.mat-drawer-opened:not(.mat-drawer-animating)')
      .waitFor({ state: 'visible', timeout: 5000 });
    await this.page.keyboard.press('Escape');
    // Wait for drawer close animation to complete
    await this.page
      .locator('mat-sidenav.mat-drawer-opened')
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {});
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if drawer is open
   */
  async isOpen(): Promise<boolean> {
    const openDrawer = this.page.locator('mat-sidenav.mat-drawer-opened');
    return (await openDrawer.count()) > 0;
  }

  /**
   * Select team from drawer
   */
  async selectTeam(teamName: string): Promise<void> {
    await helperSelectTeam(this.page, teamName);
  }

  /**
   * Select season from drawer
   */
  async selectSeason(season: string): Promise<void> {
    await helperSelectSeason(this.page, season);
  }

  /**
   * Toggle stats per game from drawer
   */
  async toggleStatsPerGame(): Promise<void> {
    await helperToggleStatsPerGame(this.page);
  }

  /**
   * Set min games from drawer
   */
  async setMinGames(value: number): Promise<void> {
    await helperSetMinGames(this.page, value);
  }

  /**
   * Select position filter from drawer
   */
  async selectPosition(
    position: 'all' | 'forwards' | 'defense'
  ): Promise<void> {
    await helperSelectPosition(this.page, position);
  }
}
