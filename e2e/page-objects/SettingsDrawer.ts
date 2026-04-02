import { Page } from '@playwright/test';
import { A11Y_LABELS } from '../config/test-data';
import {
  selectTeam as helperSelectTeam,
  selectSeason as helperSelectSeason,
  toggleStatsPerGame as helperToggleStatsPerGame,
  setMinGames as helperSetMinGames,
  selectPosition as helperSelectPosition,
} from '../helpers/filters';

/**
 * Page object for the shared settings drawer
 */
export class SettingsDrawer {
  constructor(private page: Page) {}

  /**
   * Open the shared settings drawer
   */
  async open(): Promise<void> {
    const settingsButton = this.page.getByLabel(A11Y_LABELS.OPEN_SETTINGS_DRAWER);
    await settingsButton.click();
    // Wait for the drawer to be visibly open before interacting with its contents.
    await this.page
      .locator('mat-sidenav.mat-drawer-opened')
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
    const overlayBackdrop = this.page.locator(
      '.cdk-overlay-backdrop.cdk-overlay-backdrop-showing',
    );
    if (await overlayBackdrop.count()) {
      await this.page.keyboard.press('Escape');
      await overlayBackdrop.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
      if (!(await this.isOpen())) {
        await this.page.waitForTimeout(300);
        return;
      }
    }
    // The close button inside the drawer
    const closeButton = this.page.getByLabel(A11Y_LABELS.CLOSE_SETTINGS_DRAWER).first();
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
    // Ensure the drawer is visibly open before pressing Escape.
    await this.page
      .locator('mat-sidenav.mat-drawer-opened')
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
