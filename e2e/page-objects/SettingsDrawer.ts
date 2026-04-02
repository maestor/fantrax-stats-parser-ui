import { Locator, Page } from '@playwright/test';
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

  private get settingsButton() {
    return this.page.getByLabel(A11Y_LABELS.OPEN_SETTINGS_DRAWER);
  }

  private get openedDrawerRoot() {
    return this.page.locator('mat-sidenav.settings-drawer.mat-drawer-opened');
  }

  private get openedDrawerContent() {
    return this.openedDrawerRoot.locator('app-settings-drawer');
  }

  private get closeButton() {
    return this.openedDrawerRoot.getByLabel(A11Y_LABELS.CLOSE_SETTINGS_DRAWER).first();
  }

  combobox(name: string): Locator {
    return this.openedDrawerContent.getByRole('combobox', { name });
  }

  radio(name: string): Locator {
    return this.openedDrawerContent.getByRole('radio', { name });
  }

  switch(name: string): Locator {
    return this.openedDrawerContent.getByRole('switch', { name });
  }

  labelledControl(name: string): Locator {
    return this.openedDrawerContent.getByLabel(name);
  }

  locator(selector: string): Locator {
    return this.openedDrawerContent.locator(selector);
  }

  private async waitForOpenState(expectedOpen: boolean): Promise<void> {
    await this.page.waitForFunction(
      (open) => {
        const drawer = document.querySelector('mat-sidenav.settings-drawer');
        return drawer?.classList.contains('mat-drawer-opened') === open;
      },
      expectedOpen,
      { timeout: 5_000 },
    );
  }

  /**
   * Open the shared settings drawer
   */
  async open(): Promise<void> {
    if (await this.isOpen()) {
      return;
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await this.settingsButton.click();

      try {
        await this.waitForOpenState(true);
        await this.closeButton.waitFor({ state: 'visible', timeout: 5000 });
        await this.page.waitForTimeout(150);
        return;
      } catch (error) {
        if (attempt === 1) {
          throw error;
        }
      }
    }
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
        await this.page.waitForTimeout(150);
        return;
      }
    }
    // The close button inside the drawer
    await this.closeButton.click({ timeout: 5000 });
    // Wait for drawer close animation to complete
    await this.waitForOpenState(false).catch(() => {});
    await this.page.waitForTimeout(150);
  }

  /**
   * Close via Escape key
   */
  async closeViaEscape(): Promise<void> {
    // Ensure the drawer is visibly open before pressing Escape.
    await this.closeButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.page.keyboard.press('Escape');
    // Wait for drawer close animation to complete
    await this.waitForOpenState(false).catch(() => {});
    await this.page.waitForTimeout(150);
  }

  /**
   * Check if drawer is open
   */
  async isOpen(): Promise<boolean> {
    return this.page.evaluate(
      () => document.querySelector('mat-sidenav.settings-drawer')?.classList.contains('mat-drawer-opened') ?? false,
    );
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
