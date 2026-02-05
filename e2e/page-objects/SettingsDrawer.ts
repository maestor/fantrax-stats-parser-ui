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
    // Wait for drawer animation
    await this.page.waitForTimeout(300);
  }

  /**
   * Close settings drawer via button
   */
  async close(): Promise<void> {
    // Wait a moment for any ongoing animations
    await this.page.waitForTimeout(300);

    // Click the settings icon to toggle (close) the drawer
    const settingsIcon = this.page.locator('mat-sidenav-content button[aria-label*="Sulje"]');
    await settingsIcon.waitFor({ state: 'visible', timeout: 5000 });
    await settingsIcon.click({ force: true, timeout: 5000 });

    // Wait for drawer to close
    await this.page.waitForTimeout(800);
  }

  /**
   * Close via Escape key
   */
  async closeViaEscape(): Promise<void> {
    // Press Escape key
    await this.page.keyboard.press('Escape');
    // Wait for drawer to close
    await this.page.waitForTimeout(800);
  }

  /**
   * Check if drawer is open
   */
  async isOpen(): Promise<boolean> {
    // Check if drawer container is visible (mobile drawer is position="start")
    const drawer = this.page.locator('mat-sidenav[position="start"]');
    const classes = await drawer.getAttribute('class');
    return classes?.includes('mat-drawer-opened') || false;
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
