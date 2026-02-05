# E2E Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement comprehensive E2E test suite with page objects, helpers, and feature-based test files covering player cards, team switching, filters, and mobile flows.

**Architecture:** Lightweight page objects for complex components (PlayerCardDialog, StatsTable, SettingsDrawer), helper functions for common patterns, and feature-based test specs. Tests run against real backend (localhost:3000) using accessibility-first selectors.

**Tech Stack:** Playwright, TypeScript, Angular Material locators

---

## Phase 1: Setup & Foundation

### Task 1: Add E2E test commands to package.json

**Files:**
- Modify: `package.json` (scripts section)

**Step 1: Add E2E commands**

Add these scripts after line 19 (after `clean:playwright`):

```json
"e2e": "playwright test",
"e2e:ui": "playwright test --ui",
"e2e:headed": "playwright test --headed",
"e2e:debug": "playwright test --debug",
"e2e:mobile": "playwright test e2e/specs/mobile.spec.ts",
"e2e:smoke": "playwright test e2e/specs/smoke.spec.ts"
```

**Step 2: Verify commands work**

Run: `npm run e2e:smoke`
Expected: Should run existing `e2e/App.spec.ts` tests (for now)

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add E2E test npm scripts"
```

---

### Task 2: Create directory structure

**Files:**
- Create: `e2e/page-objects/` (directory)
- Create: `e2e/helpers/` (directory)
- Create: `e2e/specs/` (directory)
- Create: `e2e/config/` (directory)

**Step 1: Create directories**

```bash
mkdir -p e2e/page-objects e2e/helpers e2e/specs e2e/config
```

**Step 2: Verify structure**

Run: `ls -la e2e/`
Expected: Should see new directories plus existing `App.spec.ts`

**Step 3: Commit**

```bash
git add e2e/
git commit -m "chore: create E2E test directory structure"
```

---

### Task 3: Create test data constants

**Files:**
- Create: `e2e/config/test-data.ts`

**Step 1: Create test data file**

```typescript
/**
 * Shared test constants and configuration
 */

export const DEFAULT_TEAM = 'Colorado Avalanche';

export const MOBILE_VIEWPORT = {
  width: 390,
  height: 844,
};

export const DESKTOP_VIEWPORT = {
  width: 1280,
  height: 720,
};

export const WAIT_TIMEOUT = 10000;

export const FILTER_LABELS = {
  TEAM: 'Joukkue',
  SEASON: 'Kausivalitsin',
  START_FROM: 'Alkaen kaudesta',
  REPORT_TYPE_REGULAR: 'Runkosarja',
  REPORT_TYPE_PLAYOFFS: 'Playoffs',
  STATS_PER_GAME: 'Tilastot per ottelu',
  MIN_GAMES: 'Otteluja pelattu vähintään',
  POSITION_ALL: 'Kaikki',
  POSITION_FORWARDS: 'Hyökkääjät',
  POSITION_DEFENSE: 'Puolustajat',
};

export const TAB_LABELS = {
  PLAYERS: 'Kenttäpelaajat',
  GOALIES: 'Maalivahdit',
  PLAYER_CARD_STATS: 'Tilastot',
  PLAYER_CARD_BY_SEASON: 'Kausittain',
  PLAYER_CARD_GRAPHS: 'Graafit',
};
```

**Step 2: Commit**

```bash
git add e2e/config/test-data.ts
git commit -m "feat: add E2E test constants and labels"
```

---

## Phase 2: Helper Functions

### Task 4: Create wait helpers

**Files:**
- Create: `e2e/helpers/wait.ts`

**Step 1: Create wait helpers**

```typescript
import { Page } from '@playwright/test';

/**
 * Wait for filter updates to complete
 */
export async function waitForFilterUpdate(page: Page): Promise<void> {
  // Wait a bit for Angular to process filter changes
  await page.waitForTimeout(300);
}

/**
 * Wait for team change to complete
 */
export async function waitForTeamChange(
  page: Page,
  expectedTeam: string
): Promise<void> {
  // Wait for heading to update with new team name
  await page
    .getByRole('heading', { name: new RegExp(expectedTeam) })
    .waitFor({ state: 'visible', timeout: 10000 });
}
```

**Step 2: Commit**

```bash
git add e2e/helpers/wait.ts
git commit -m "feat: add wait helper functions"
```

---

### Task 5: Create table helpers

**Files:**
- Create: `e2e/helpers/table.ts`

**Step 1: Create table helpers**

```typescript
import { Page, expect } from '@playwright/test';

/**
 * Wait for table data to load
 */
export async function waitForTableData(page: Page): Promise<void> {
  const rows = page.locator('tr[mat-row]');
  await rows.first().waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Get current row count
 */
export async function getRowCount(page: Page): Promise<number> {
  const rows = page.locator('tr[mat-row]');
  return await rows.count();
}

/**
 * Get text content of first row
 */
export async function getFirstRowText(page: Page): Promise<string> {
  const firstRow = page.locator('tr[mat-row]').first();
  return (await firstRow.textContent()) || '';
}

/**
 * Verify no results message is visible
 */
export async function verifyNoResults(page: Page): Promise<void> {
  await expect(page.getByText('Ei hakutuloksia')).toBeVisible();
}

/**
 * Get all values from a specific column
 */
export async function getColumnValues(
  page: Page,
  columnClass: string
): Promise<string[]> {
  const cells = page.locator(`tr[mat-row] td.${columnClass}`);
  return await cells.allTextContents();
}
```

**Step 2: Commit**

```bash
git add e2e/helpers/table.ts
git commit -m "feat: add table helper functions"
```

---

### Task 6: Create navigation helpers

**Files:**
- Create: `e2e/helpers/navigation.ts`

**Step 1: Create navigation helpers**

```typescript
import { Page } from '@playwright/test';
import { TAB_LABELS } from '../config/test-data';

/**
 * Switch to Players tab
 */
export async function switchToPlayersTab(page: Page): Promise<void> {
  await page.getByRole('tab', { name: TAB_LABELS.PLAYERS }).click();
}

/**
 * Switch to Goalies tab
 */
export async function switchToGoaliesTab(page: Page): Promise<void> {
  await page.getByRole('tab', { name: TAB_LABELS.GOALIES }).click();
}

/**
 * Check if currently on Players view
 */
export async function isOnPlayersView(page: Page): Promise<boolean> {
  return page.url().includes('/player-stats');
}

/**
 * Check if currently on Goalies view
 */
export async function isOnGoaliesView(page: Page): Promise<boolean> {
  return page.url().includes('/goalie-stats');
}
```

**Step 2: Commit**

```bash
git add e2e/helpers/navigation.ts
git commit -m "feat: add navigation helper functions"
```

---

### Task 7: Create filter helpers

**Files:**
- Create: `e2e/helpers/filters.ts`

**Step 1: Create filter helpers (part 1 - basic filters)**

```typescript
import { Page } from '@playwright/test';
import { FILTER_LABELS } from '../config/test-data';
import { waitForFilterUpdate } from './wait';

/**
 * Select a team from the dropdown
 */
export async function selectTeam(page: Page, teamName: string): Promise<void> {
  const teamSelector = page.getByRole('combobox', {
    name: FILTER_LABELS.TEAM,
  });
  await teamSelector.click();
  await page.getByRole('option', { name: teamName }).click();
  await waitForFilterUpdate(page);
}

/**
 * Select a season from the dropdown
 */
export async function selectSeason(
  page: Page,
  season: string
): Promise<void> {
  const seasonSelector = page.getByRole('combobox', {
    name: FILTER_LABELS.SEASON,
  });
  await seasonSelector.click();
  await page.getByRole('option', { name: season }).click();
  await waitForFilterUpdate(page);
}

/**
 * Select start-from season
 */
export async function selectStartFromSeason(
  page: Page,
  season: string
): Promise<void> {
  const startFromSelector = page.getByRole('combobox', {
    name: FILTER_LABELS.START_FROM,
  });
  await startFromSelector.click();
  await page.getByRole('option', { name: season }).click();
  await waitForFilterUpdate(page);
}

/**
 * Toggle stats per game switch
 */
export async function toggleStatsPerGame(page: Page): Promise<void> {
  const toggle = page.getByRole('switch', {
    name: FILTER_LABELS.STATS_PER_GAME,
  });
  await toggle.click();
  await waitForFilterUpdate(page);
}
```

**Step 2: Create filter helpers (part 2 - advanced filters)**

Add to the same file:

```typescript
/**
 * Set minimum games slider value
 */
export async function setMinGames(
  page: Page,
  value: number
): Promise<void> {
  const slider = page.locator('#min-games-slider');
  // Click at position to set value (approximate)
  const percentage = value / 100;
  await slider.click({ position: { x: 200 * percentage, y: 10 } });
  await waitForFilterUpdate(page);
}

/**
 * Select position filter
 */
export async function selectPosition(
  page: Page,
  position: 'all' | 'forwards' | 'defense'
): Promise<void> {
  let buttonName: string;
  switch (position) {
    case 'all':
      buttonName = FILTER_LABELS.POSITION_ALL;
      break;
    case 'forwards':
      buttonName = FILTER_LABELS.POSITION_FORWARDS;
      break;
    case 'defense':
      buttonName = FILTER_LABELS.POSITION_DEFENSE;
      break;
  }
  await page.getByText(buttonName).click();
  await waitForFilterUpdate(page);
}

/**
 * Switch report type (regular season vs playoffs)
 */
export async function switchReportType(
  page: Page,
  type: 'regular' | 'playoffs'
): Promise<void> {
  const label =
    type === 'regular'
      ? FILTER_LABELS.REPORT_TYPE_REGULAR
      : FILTER_LABELS.REPORT_TYPE_PLAYOFFS;
  await page.getByText(label).click();
  await waitForFilterUpdate(page);
}
```

**Step 3: Commit**

```bash
git add e2e/helpers/filters.ts
git commit -m "feat: add filter helper functions"
```

---

### Task 8: Create player card helpers

**Files:**
- Create: `e2e/helpers/player-card.ts`

**Step 1: Create player card helpers**

```typescript
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
```

**Step 2: Commit**

```bash
git add e2e/helpers/player-card.ts
git commit -m "feat: add player card helper functions"
```

---

## Phase 3: Page Objects

### Task 9: Create StatsTable page object

**Files:**
- Create: `e2e/page-objects/StatsTable.ts`

**Step 1: Create StatsTable class**

```typescript
import { Page, expect } from '@playwright/test';

export class StatsTable {
  constructor(private page: Page) {}

  /**
   * Search for player by name
   */
  async searchPlayer(name: string): Promise<void> {
    const searchInput = this.page.getByLabel('Pelaajahaku');
    await searchInput.click();
    await searchInput.fill(name);
  }

  /**
   * Clear search input
   */
  async clearSearch(): Promise<void> {
    const searchInput = this.page.getByLabel('Pelaajahaku');
    await searchInput.fill('');
    await searchInput.press('Enter');
  }

  /**
   * Sort by column
   */
  async sortByColumn(columnName: string): Promise<void> {
    const header = this.page.getByRole('columnheader', { name: columnName });
    await header.click();
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
  async clickPlayerRow(index: number = 0): Promise<void> {
    const row = this.page.locator('tr[mat-row]').nth(index);
    await row.click();
  }

  /**
   * Verify table has loaded with data
   */
  async verifyDataLoaded(): Promise<void> {
    const rows = this.page.locator('tr[mat-row]');
    await rows.first().waitFor({ state: 'visible', timeout: 10000 });
    await expect(rows).not.toHaveCount(0);
  }
}
```

**Step 2: Commit**

```bash
git add e2e/page-objects/StatsTable.ts
git commit -m "feat: add StatsTable page object"
```

---

### Task 10: Create PlayerCardDialog page object (part 1)

**Files:**
- Create: `e2e/page-objects/PlayerCardDialog.ts`

**Step 1: Create PlayerCardDialog class structure and basic methods**

```typescript
import { Page, expect } from '@playwright/test';
import { TAB_LABELS } from '../config/test-data';

export class PlayerCardDialog {
  private dialog = this.page.getByRole('dialog');

  constructor(private page: Page) {}

  /**
   * Open player card by clicking a table row
   */
  async open(rowIndex: number = 0): Promise<void> {
    const row = this.page.locator('tr[mat-row]').nth(rowIndex);
    await row.click();
    await this.dialog.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Close the dialog via X button
   */
  async close(): Promise<void> {
    // Try to find close button (usually an X or close icon)
    const closeButton = this.dialog.locator('button').filter({ hasText: /[×X]/ }).first();
    if (await closeButton.count() > 0) {
      await closeButton.click();
    } else {
      // Fallback: press Escape
      await this.page.keyboard.press('Escape');
    }
    await this.dialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Close via Escape key
   */
  async closeViaEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.dialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Switch to a specific tab
   */
  async switchToTab(tab: 'stats' | 'by-season' | 'graphs'): Promise<void> {
    let tabName: string;
    switch (tab) {
      case 'stats':
        tabName = TAB_LABELS.PLAYER_CARD_STATS;
        break;
      case 'by-season':
        tabName = TAB_LABELS.PLAYER_CARD_BY_SEASON;
        break;
      case 'graphs':
        tabName = TAB_LABELS.PLAYER_CARD_GRAPHS;
        break;
    }
    await this.dialog.getByRole('tab', { name: tabName }).click();
    await this.page.waitForTimeout(300); // Wait for tab content to render
  }
```

**Step 2: Add graph interaction methods**

Add to the same file:

```typescript
  /**
   * Toggle a graph series on/off (desktop view with checkboxes)
   */
  async toggleGraphSeries(seriesName: string): Promise<void> {
    const checkbox = this.dialog.getByRole('checkbox', { name: seriesName });
    await checkbox.click();
    await this.page.waitForTimeout(300); // Wait for chart update
  }

  /**
   * Switch to radar chart view
   */
  async switchToRadarChart(): Promise<void> {
    const radarButton = this.dialog.getByText('Fantasy-ranking jakauma');
    await radarButton.click();
    await this.page.waitForTimeout(500); // Wait for chart transition
  }

  /**
   * Switch to line chart view (from radar)
   */
  async switchToLineChart(): Promise<void> {
    // Click the same button again to toggle back
    const radarButton = this.dialog.getByText('Fantasy-ranking jakauma');
    await radarButton.click();
    await this.page.waitForTimeout(500);
  }
```

**Step 3: Add verification and utility methods**

Add to the same file:

```typescript
  /**
   * Verify tab content is visible
   */
  async verifyTabContent(tab: 'stats' | 'by-season' | 'graphs'): Promise<void> {
    if (tab === 'stats' || tab === 'by-season') {
      // Verify table is visible
      await expect(this.dialog.locator('table[mat-table]')).toBeVisible();
    } else if (tab === 'graphs') {
      // Verify chart canvas or svg is visible
      const chart = this.dialog.locator('canvas, svg').first();
      await expect(chart).toBeVisible();
    }
  }

  /**
   * Get available tabs
   */
  async getAvailableTabs(): Promise<string[]> {
    const tabs = this.dialog.getByRole('tab');
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
   * Check if line graphs are present
   */
  async hasLineGraphs(): Promise<boolean> {
    const checkboxes = this.dialog.locator('input[type="checkbox"]');
    const accordion = this.dialog.getByText('Näytettävät tilastot');

    const hasCheckboxes = (await checkboxes.count()) > 0;
    const hasAccordion = (await accordion.count()) > 0;

    return hasCheckboxes || hasAccordion;
  }

  /**
   * Copy player link (assumes clipboard API works in test)
   */
  async copyPlayerLink(): Promise<string> {
    const copyButton = this.dialog.locator('button[aria-label*="Kopioi"]').first();
    await copyButton.click();
    // Note: Actual clipboard access may not work in tests
    // This is a placeholder - real implementation may need different approach
    return this.page.url();
  }
}
```

**Step 4: Commit**

```bash
git add e2e/page-objects/PlayerCardDialog.ts
git commit -m "feat: add PlayerCardDialog page object"
```

---

### Task 11: Create SettingsDrawer page object

**Files:**
- Create: `e2e/page-objects/SettingsDrawer.ts`

**Step 1: Create SettingsDrawer class**

```typescript
import { Page } from '@playwright/test';
import { FILTER_LABELS } from '../config/test-data';
import { waitForFilterUpdate } from '../helpers/wait';

export class SettingsDrawer {
  constructor(private page: Page) {}

  /**
   * Open settings drawer (mobile)
   */
  async open(): Promise<void> {
    const openButton = this.page.getByRole('button', {
      name: 'Avaa asetuspaneeli',
    });
    await openButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Close settings drawer via button
   */
  async close(): Promise<void> {
    const closeButton = this.page.getByRole('button', {
      name: 'Sulje asetuspaneeli',
    });
    await closeButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Close via Escape key
   */
  async closeViaEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if drawer is open
   */
  async isOpen(): Promise<boolean> {
    const drawer = this.page.locator('.settings-drawer');
    return await drawer.isVisible();
  }

  /**
   * Select team from drawer
   */
  async selectTeam(teamName: string): Promise<void> {
    const drawer = this.page.locator('.settings-drawer');
    const teamSelector = drawer.getByRole('combobox', {
      name: FILTER_LABELS.TEAM,
    });
    await teamSelector.click();
    await this.page.getByRole('option', { name: teamName }).click();
    await waitForFilterUpdate(this.page);
  }

  /**
   * Select season from drawer
   */
  async selectSeason(season: string): Promise<void> {
    const drawer = this.page.locator('.settings-drawer');
    const seasonSelector = drawer.getByRole('combobox', {
      name: FILTER_LABELS.SEASON,
    });
    await seasonSelector.click();
    await this.page.getByRole('option', { name: season }).click();
    await waitForFilterUpdate(this.page);
  }

  /**
   * Toggle stats per game from drawer
   */
  async toggleStatsPerGame(): Promise<void> {
    const drawer = this.page.locator('.settings-drawer');
    const toggle = drawer.getByRole('switch', {
      name: FILTER_LABELS.STATS_PER_GAME,
    });
    await toggle.click();
    await waitForFilterUpdate(this.page);
  }

  /**
   * Set min games from drawer
   */
  async setMinGames(value: number): Promise<void> {
    const drawer = this.page.locator('.settings-drawer');
    const slider = drawer.locator('#min-games-slider');
    const percentage = value / 100;
    await slider.click({ position: { x: 200 * percentage, y: 10 } });
    await waitForFilterUpdate(this.page);
  }

  /**
   * Select position filter from drawer
   */
  async selectPosition(
    position: 'all' | 'forwards' | 'defense'
  ): Promise<void> {
    const drawer = this.page.locator('.settings-drawer');
    let buttonName: string;
    switch (position) {
      case 'all':
        buttonName = FILTER_LABELS.POSITION_ALL;
        break;
      case 'forwards':
        buttonName = FILTER_LABELS.POSITION_FORWARDS;
        break;
      case 'defense':
        buttonName = FILTER_LABELS.POSITION_DEFENSE;
        break;
    }
    await drawer.getByText(buttonName).click();
    await waitForFilterUpdate(this.page);
  }
}
```

**Step 2: Commit**

```bash
git add e2e/page-objects/SettingsDrawer.ts
git commit -m "feat: add SettingsDrawer page object for mobile"
```

---

## Phase 4: Test Specs - Smoke Tests

### Task 12: Create smoke test spec

**Files:**
- Create: `e2e/specs/smoke.spec.ts`

**Step 1: Write smoke tests**

```typescript
import { test, expect } from '@playwright/test';
import { DEFAULT_TEAM, TAB_LABELS } from '../config/test-data';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with correct title and heading', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/FFHL tilastopalvelu/);

    // Check main heading contains default team
    await expect(
      page.getByRole('heading', { name: new RegExp(DEFAULT_TEAM) })
    ).toBeVisible();
  });

  test('navigation tabs are visible', async ({ page }) => {
    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(
      page.getByRole('tab', { name: TAB_LABELS.PLAYERS })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: TAB_LABELS.GOALIES })
    ).toBeVisible();
  });

  test('top controls are visible', async ({ page }) => {
    // Team selector
    await expect(page.getByRole('combobox', { name: 'Joukkue' })).toBeVisible();

    // Season selector
    await expect(
      page.getByRole('combobox', { name: 'Kausivalitsin' })
    ).toBeVisible();

    // Report type toggle
    await expect(page.getByRole('radiogroup')).toBeVisible();
  });

  test('table renders with data', async ({ page }) => {
    // Search input visible
    await expect(page.getByLabel('Pelaajahaku')).toBeVisible();

    // Table visible
    await expect(page.getByRole('table')).toBeVisible();

    // At least one data row
    const rows = page.locator('tr[mat-row]');
    await rows.first().waitFor({ state: 'visible', timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('basic tab switching works', async ({ page }) => {
    const playerTab = page.getByRole('tab', { name: TAB_LABELS.PLAYERS });
    const goalieTab = page.getByRole('tab', { name: TAB_LABELS.GOALIES });

    // Switch to goalies
    await goalieTab.click();
    await expect(page).toHaveURL(/.*\/goalie-stats$/);

    // Switch back to players
    await playerTab.click();
    await expect(page).toHaveURL(/.*\/player-stats$/);
  });
});
```

**Step 2: Run smoke tests**

Run: `npm run e2e:smoke`
Expected: All 5 tests should pass

**Step 3: Commit**

```bash
git add e2e/specs/smoke.spec.ts
git commit -m "test: add smoke tests for basic functionality"
```

---

## Phase 5: Player Card Tests

### Task 13: Create player card opening/closing tests

**Files:**
- Create: `e2e/specs/player-card.spec.ts`

**Step 1: Write basic player card tests**

```typescript
import { test, expect } from '@playwright/test';
import { PlayerCardDialog } from '../page-objects/PlayerCardDialog';
import { StatsTable } from '../page-objects/StatsTable';

test.describe('Player Card', () => {
  let playerCard: PlayerCardDialog;
  let statsTable: StatsTable;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    playerCard = new PlayerCardDialog(page);
    statsTable = new StatsTable(page);

    // Wait for table data
    await statsTable.verifyDataLoaded();
  });

  test('opens when clicking a player row', async ({ page }) => {
    await playerCard.open();

    // Verify dialog is visible
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });

  test('closes via X button', async ({ page }) => {
    await playerCard.open();
    await playerCard.close();

    // Verify dialog is hidden
    const dialog = page.getByRole('dialog');
    await expect(dialog).not.toBeVisible();
  });

  test('closes via Escape key', async ({ page }) => {
    await playerCard.open();
    await playerCard.closeViaEscape();

    // Verify dialog is hidden
    const dialog = page.getByRole('dialog');
    await expect(dialog).not.toBeVisible();
  });
});
```

**Step 2: Run player card tests**

Run: `npx playwright test e2e/specs/player-card.spec.ts`
Expected: 3 tests should pass

**Step 3: Commit**

```bash
git add e2e/specs/player-card.spec.ts
git commit -m "test: add player card open/close tests"
```

---

### Task 14: Add player card tab navigation tests

**Files:**
- Modify: `e2e/specs/player-card.spec.ts`

**Step 1: Add tab navigation tests (all seasons)**

Add these tests to the describe block:

```typescript
  test('switches between tabs when all seasons selected', async ({ page }) => {
    // Ensure "Kaikki kaudet" is selected
    const seasonSelector = page.getByRole('combobox', {
      name: 'Kausivalitsin',
    });
    await seasonSelector.click();
    await page.getByRole('option', { name: 'Kaikki kaudet' }).click();

    await playerCard.open();

    // Verify all 3 tabs available
    const tabs = await playerCard.getAvailableTabs();
    expect(tabs.length).toBe(3);

    // Switch to by-season tab
    await playerCard.switchToTab('by-season');
    await playerCard.verifyTabContent('by-season');

    // Switch to graphs tab
    await playerCard.switchToTab('graphs');
    await playerCard.verifyTabContent('graphs');

    // Switch back to stats
    await playerCard.switchToTab('stats');
    await playerCard.verifyTabContent('stats');
  });

  test('shows only 2 tabs when single season selected', async ({ page }) => {
    // Select a specific season
    const seasonSelector = page.getByRole('combobox', {
      name: 'Kausivalitsin',
    });
    await seasonSelector.click();
    const options = page.getByRole('option');
    await options.nth(1).click(); // Select first non-"all" season

    await playerCard.open();

    // Verify only 2 tabs available (stats and graphs, no by-season)
    const tabs = await playerCard.getAvailableTabs();
    expect(tabs.length).toBe(2);
    expect(tabs).not.toContain('Kausittain');

    // Verify graphs tab only has radar chart
    await playerCard.switchToTab('graphs');
    const hasLineGraphs = await playerCard.hasLineGraphs();
    expect(hasLineGraphs).toBe(false);
  });
```

**Step 2: Run updated tests**

Run: `npx playwright test e2e/specs/player-card.spec.ts`
Expected: 5 tests should pass

**Step 3: Commit**

```bash
git add e2e/specs/player-card.spec.ts
git commit -m "test: add player card tab navigation tests"
```

---

### Task 15: Add graph interaction tests

**Files:**
- Modify: `e2e/specs/player-card.spec.ts`

**Step 1: Add graph interaction tests**

Add these tests to the describe block:

```typescript
  test('toggles graph series on desktop', async ({ page }) => {
    // Ensure all seasons selected
    const seasonSelector = page.getByRole('combobox', {
      name: 'Kausivalitsin',
    });
    await seasonSelector.click();
    await page.getByRole('option', { name: 'Kaikki kaudet' }).click();

    await playerCard.open();
    await playerCard.switchToTab('graphs');

    // Verify checkboxes are visible (desktop)
    const dialog = page.getByRole('dialog');
    const checkboxes = dialog.locator('input[type="checkbox"]');
    expect(await checkboxes.count()).toBeGreaterThan(0);

    // Toggle a series off
    await playerCard.toggleGraphSeries('Maalit');

    // Toggle it back on
    await playerCard.toggleGraphSeries('Maalit');
  });

  test('switches between line and radar charts', async ({ page }) => {
    // Ensure all seasons selected
    const seasonSelector = page.getByRole('combobox', {
      name: 'Kausivalitsin',
    });
    await seasonSelector.click();
    await page.getByRole('option', { name: 'Kaikki kaudet' }).click();

    await playerCard.open();
    await playerCard.switchToTab('graphs');

    // Switch to radar chart
    await playerCard.switchToRadarChart();

    // Verify radar chart visible (different structure than line chart)
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('canvas, svg')).toBeVisible();

    // Switch back to line chart
    await playerCard.switchToLineChart();

    // Verify line chart visible
    await expect(dialog.locator('canvas, svg')).toBeVisible();
  });
```

**Step 2: Run updated tests**

Run: `npx playwright test e2e/specs/player-card.spec.ts`
Expected: 7 tests should pass

**Step 3: Commit**

```bash
git add e2e/specs/player-card.spec.ts
git commit -m "test: add graph interaction tests"
```

---

### Task 16: Add direct URL routing tests

**Files:**
- Modify: `e2e/specs/player-card.spec.ts`

**Step 1: Add URL routing tests**

Add these tests to the describe block:

```typescript
  test('opens player card via direct URL', async ({ page }) => {
    // Navigate directly to a player URL
    await page.goto('/player/colorado/jamie-benn');

    // Verify dialog opens automatically
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Verify player name in dialog
    await expect(dialog.getByText('Jamie Benn')).toBeVisible();
  });

  test('opens player card with specific tab via query param', async ({
    page,
  }) => {
    // Navigate with tab query param
    await page.goto('/player/colorado/jamie-benn?tab=graphs');

    // Verify dialog opens with graphs tab active
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Verify graphs tab is active (has aria-selected="true")
    const graphsTab = dialog.getByRole('tab', { name: 'Graafit' });
    await expect(graphsTab).toHaveAttribute('aria-selected', 'true');
  });
```

**Step 2: Run updated tests**

Run: `npx playwright test e2e/specs/player-card.spec.ts`
Expected: 9 tests should pass

**Step 3: Commit**

```bash
git add e2e/specs/player-card.spec.ts
git commit -m "test: add direct URL routing tests for player cards"
```

---

## Phase 6: Team Switching Tests

### Task 17: Create team switching tests

**Files:**
- Create: `e2e/specs/team-switching.spec.ts`

**Step 1: Write team switching tests**

```typescript
import { test, expect } from '@playwright/test';
import { selectTeam, selectSeason, toggleStatsPerGame } from '../helpers/filters';
import { waitForTeamChange } from '../helpers/wait';
import { getRowCount } from '../helpers/table';
import { StatsTable } from '../page-objects/StatsTable';

test.describe('Team Switching', () => {
  let statsTable: StatsTable;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    statsTable = new StatsTable(page);
    await statsTable.verifyDataLoaded();
  });

  test('changes team and updates title and data', async ({ page }) => {
    // Get initial row count
    const initialCount = await getRowCount(page);

    // Change team
    await selectTeam(page, 'Tampa Bay Lightning');
    await waitForTeamChange(page, 'Tampa Bay Lightning');

    // Verify title updated
    await expect(
      page.getByRole('heading', { name: /Tampa Bay Lightning/ })
    ).toBeVisible();

    // Verify table data changed (different row count)
    const newCount = await getRowCount(page);
    expect(newCount).not.toBe(initialCount);
  });

  test('resets filters when team changes', async ({ page }) => {
    // Apply some filters
    await selectSeason(page, '2023-2024');
    await toggleStatsPerGame(page);

    // Verify filter applied (different row count)
    const filteredCount = await getRowCount(page);

    // Change team
    await selectTeam(page, 'Tampa Bay Lightning');
    await waitForTeamChange(page, 'Tampa Bay Lightning');

    // Verify filters reset (season back to "all", stats per game off)
    const seasonSelector = page.getByRole('combobox', {
      name: 'Kausivalitsin',
    });
    await expect(seasonSelector).toContainText('Kaikki kaudet');

    const statsToggle = page.getByRole('switch', {
      name: 'Tilastot per ottelu',
    });
    await expect(statsToggle).not.toBeChecked();
  });

  test('does not restore filters when switching back to original team', async ({
    page,
  }) => {
    const originalTeam = 'Colorado Avalanche';

    // Apply filters on Team A
    await selectSeason(page, '2023-2024');
    await toggleStatsPerGame(page);

    // Switch to Team B
    await selectTeam(page, 'Tampa Bay Lightning');
    await waitForTeamChange(page, 'Tampa Bay Lightning');

    // Apply different filters on Team B
    await selectSeason(page, '2022-2023');

    // Switch back to Team A
    await selectTeam(page, originalTeam);
    await waitForTeamChange(page, originalTeam);

    // Verify filters are reset to defaults (NOT restored to previous Team A state)
    const seasonSelector = page.getByRole('combobox', {
      name: 'Kausivalitsin',
    });
    await expect(seasonSelector).toContainText('Kaikki kaudet');

    const statsToggle = page.getByRole('switch', {
      name: 'Tilastot per ottelu',
    });
    await expect(statsToggle).not.toBeChecked();
  });
});
```

**Step 2: Run team switching tests**

Run: `npx playwright test e2e/specs/team-switching.spec.ts`
Expected: 3 tests should pass

**Step 3: Commit**

```bash
git add e2e/specs/team-switching.spec.ts
git commit -m "test: add team switching and filter reset tests"
```

---

## Phase 7: Filter Tests

### Task 18: Create filter combination tests (part 1)

**Files:**
- Create: `e2e/specs/filters.spec.ts`

**Step 1: Write individual filter tests**

```typescript
import { test, expect } from '@playwright/test';
import {
  selectSeason,
  selectStartFromSeason,
  switchReportType,
  selectPosition,
  toggleStatsPerGame,
  setMinGames,
} from '../helpers/filters';
import { getRowCount, getFirstRowText } from '../helpers/table';
import { StatsTable } from '../page-objects/StatsTable';

test.describe('Filters', () => {
  let statsTable: StatsTable;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    statsTable = new StatsTable(page);
    await statsTable.verifyDataLoaded();
  });

  test('season selector changes data', async ({ page }) => {
    const initialText = await getFirstRowText(page);

    // Select a specific season
    await selectSeason(page, '2023-2024');

    // Verify data changed
    const newText = await getFirstRowText(page);
    expect(newText).not.toBe(initialText);
  });

  test('start-from season filters data', async ({ page }) => {
    const initialCount = await getRowCount(page);

    // Set start-from season
    await selectStartFromSeason(page, '2015-2016');

    // Verify row count changed (may increase or decrease)
    const newCount = await getRowCount(page);
    expect(newCount).not.toBe(initialCount);
  });

  test('report type toggle changes data', async ({ page }) => {
    const initialText = await getFirstRowText(page);

    // Switch to playoffs
    await switchReportType(page, 'playoffs');

    // Verify data changed
    const newText = await getFirstRowText(page);
    expect(newText).not.toBe(initialText);
  });

  test('position filter reduces row count', async ({ page }) => {
    const initialCount = await getRowCount(page);

    // Filter to forwards only
    await selectPosition(page, 'forwards');

    // Verify row count decreased (not all players are forwards)
    const newCount = await getRowCount(page);
    expect(newCount).toBeLessThan(initialCount);
  });

  test('stats per game toggle changes values', async ({ page }) => {
    const initialText = await getFirstRowText(page);

    // Toggle stats per game
    await toggleStatsPerGame(page);

    // Verify values changed (per-game stats are different)
    const newText = await getFirstRowText(page);
    expect(newText).not.toBe(initialText);
  });

  test('min games slider filters players', async ({ page }) => {
    const initialCount = await getRowCount(page);

    // Set min games to higher value
    await setMinGames(page, 50);

    // Verify row count decreased
    const newCount = await getRowCount(page);
    expect(newCount).toBeLessThan(initialCount);
  });
});
```

**Step 2: Run filter tests**

Run: `npx playwright test e2e/specs/filters.spec.ts`
Expected: 6 tests should pass

**Step 3: Commit**

```bash
git add e2e/specs/filters.spec.ts
git commit -m "test: add individual filter tests"
```

---

### Task 19: Add filter combination tests

**Files:**
- Modify: `e2e/specs/filters.spec.ts`

**Step 1: Add combination tests**

Add these tests to the describe block:

```typescript
  test('all seasons + stats per game + min games combination', async ({
    page,
  }) => {
    // Ensure all seasons selected
    await selectSeason(page, 'Kaikki kaudet');

    const initialCount = await getRowCount(page);

    // Apply stats per game
    await toggleStatsPerGame(page);

    // Apply min games filter
    await setMinGames(page, 10);

    // Verify filters work together
    const filteredCount = await getRowCount(page);
    expect(filteredCount).toBeLessThan(initialCount);
  });

  test('single season + position filter combination', async ({ page }) => {
    // Select specific season
    await selectSeason(page, '2023-2024');

    const seasonCount = await getRowCount(page);

    // Apply position filter
    await selectPosition(page, 'defense');

    // Verify both filters applied
    const filteredCount = await getRowCount(page);
    expect(filteredCount).toBeLessThan(seasonCount);
  });

  test('playoffs + min games + stats per game combination', async ({
    page,
  }) => {
    // Switch to playoffs
    await switchReportType(page, 'playoffs');

    const playoffsCount = await getRowCount(page);

    // Apply min games
    await setMinGames(page, 20);

    // Apply stats per game
    await toggleStatsPerGame(page);

    // Verify all filters applied
    const filteredCount = await getRowCount(page);
    expect(filteredCount).toBeLessThan(playoffsCount);
  });

  test('start from season + position filter combination', async ({ page }) => {
    // Set start from season
    await selectStartFromSeason(page, '2015-2016');

    const startFromCount = await getRowCount(page);

    // Apply position filter
    await selectPosition(page, 'forwards');

    // Verify both filters applied
    const filteredCount = await getRowCount(page);
    expect(filteredCount).toBeLessThan(startFromCount);
  });
```

**Step 2: Run updated tests**

Run: `npx playwright test e2e/specs/filters.spec.ts`
Expected: 10 tests should pass

**Step 3: Commit**

```bash
git add e2e/specs/filters.spec.ts
git commit -m "test: add filter combination tests"
```

---

### Task 20: Add filter isolation test

**Files:**
- Modify: `e2e/specs/filters.spec.ts`

**Step 1: Add filter isolation test**

Add this test to the describe block:

```typescript
  test('player and goalie filters are independent', async ({ page }) => {
    const playerTab = page.getByRole('tab', { name: 'Kenttäpelaajat' });
    const goalieTab = page.getByRole('tab', { name: 'Maalivahdit' });

    // Apply filters on players
    await toggleStatsPerGame(page);
    await setMinGames(page, 10);

    const playerRowCount = await getRowCount(page);

    // Switch to goalies
    await goalieTab.click();
    await statsTable.verifyDataLoaded();

    // Verify goalies have different row count (filters independent)
    const goalieRowCount = await getRowCount(page);
    expect(goalieRowCount).not.toBe(playerRowCount);

    // Apply different filter on goalies
    await setMinGames(page, 5);

    // Switch back to players
    await playerTab.click();
    await statsTable.verifyDataLoaded();

    // Verify player filters preserved
    const returnedPlayerCount = await getRowCount(page);
    expect(returnedPlayerCount).toBe(playerRowCount);
  });
```

**Step 2: Run updated tests**

Run: `npx playwright test e2e/specs/filters.spec.ts`
Expected: 11 tests should pass

**Step 3: Commit**

```bash
git add e2e/specs/filters.spec.ts
git commit -m "test: add filter isolation between players and goalies"
```

---

## Phase 8: Mobile Tests

### Task 21: Create mobile tests (part 1 - drawer basics)

**Files:**
- Create: `e2e/specs/mobile.spec.ts`

**Step 1: Write mobile drawer basic tests**

```typescript
import { test, expect } from '@playwright/test';
import { SettingsDrawer } from '../page-objects/SettingsDrawer';
import { MOBILE_VIEWPORT } from '../config/test-data';

test.describe('Mobile Features', () => {
  let drawer: SettingsDrawer;

  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/');
    drawer = new SettingsDrawer(page);

    // Wait for page to load
    await page.locator('tr[mat-row]').first().waitFor({ state: 'visible' });
  });

  test('displays team name under title', async ({ page }) => {
    // Verify "Joukkue: [team name]" visible
    await expect(page.getByText(/Joukkue:/)).toBeVisible();
    await expect(page.getByText(/Colorado Avalanche/)).toBeVisible();
  });

  test('team name updates when team changes', async ({ page }) => {
    await drawer.open();
    await drawer.selectTeam('Tampa Bay Lightning');
    await drawer.close();

    // Verify team name updated
    await expect(page.getByText(/Tampa Bay Lightning/)).toBeVisible();
  });

  test('opens settings drawer via gear icon', async ({ page }) => {
    await drawer.open();

    // Verify drawer is open
    const isOpen = await drawer.isOpen();
    expect(isOpen).toBe(true);

    // Verify sections visible
    await expect(page.getByText('Tarkasteltavat tilastot')).toBeVisible();
    await expect(page.getByText('Asetukset')).toBeVisible();
  });

  test('closes drawer via button', async ({ page }) => {
    await drawer.open();
    await drawer.close();

    // Verify drawer is closed
    const isOpen = await drawer.isOpen();
    expect(isOpen).toBe(false);
  });

  test('closes drawer via Escape key', async ({ page }) => {
    await drawer.open();
    await drawer.closeViaEscape();

    // Verify drawer is closed
    const isOpen = await drawer.isOpen();
    expect(isOpen).toBe(false);
  });
});
```

**Step 2: Run mobile tests**

Run: `npm run e2e:mobile`
Expected: 5 tests should pass

**Step 3: Commit**

```bash
git add e2e/specs/mobile.spec.ts
git commit -m "test: add mobile drawer basic interaction tests"
```

---

### Task 22: Add mobile drawer control tests

**Files:**
- Modify: `e2e/specs/mobile.spec.ts`

**Step 1: Add drawer control tests**

Add these tests to the describe block:

```typescript
  test('changes filters via drawer controls', async ({ page }) => {
    await drawer.open();

    // Change season
    await drawer.selectSeason('2023-2024');

    // Toggle stats per game
    await drawer.toggleStatsPerGame();

    // Close drawer
    await drawer.close();

    // Verify filters applied to table
    const rows = page.locator('tr[mat-row]');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('preserves filter state when reopening drawer', async ({ page }) => {
    await drawer.open();

    // Toggle stats per game
    await drawer.toggleStatsPerGame();

    // Close drawer
    await drawer.close();

    // Reopen drawer
    await drawer.open();

    // Verify toggle still checked
    const statsToggle = page
      .locator('.settings-drawer')
      .getByRole('switch', { name: 'Tilastot per ottelu' });
    await expect(statsToggle).toBeChecked();
  });

  test('shows last updated timestamp in drawer', async ({ page }) => {
    await drawer.open();

    // Verify timestamp visible (format: "Tilastot päivitetty: DD.MM.YYYY klo HH.MM")
    await expect(page.getByText(/Tilastot päivitetty:/)).toBeVisible();
  });
```

**Step 2: Run mobile tests**

Run: `npm run e2e:mobile`
Expected: 8 tests should pass

**Step 3: Commit**

```bash
git add e2e/specs/mobile.spec.ts
git commit -m "test: add mobile drawer control and state tests"
```

---

### Task 23: Add mobile player card graph accordion test

**Files:**
- Modify: `e2e/specs/mobile.spec.ts`

**Step 1: Add mobile graph accordion test**

Add this test to the describe block:

```typescript
  test('player card has graph series accordion on mobile', async ({ page }) => {
    // Ensure all seasons selected
    await drawer.open();
    await drawer.selectSeason('Kaikki kaudet');
    await drawer.close();

    // Open player card
    const firstRow = page.locator('tr[mat-row]').first();
    await firstRow.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Navigate to graphs tab
    await dialog.getByRole('tab', { name: 'Graafit' }).click();

    // Verify accordion visible (collapsed)
    await expect(dialog.getByText('Näytettävät tilastot')).toBeVisible();

    // Expand accordion
    await dialog.getByText('Näytettävät tilastot').click();

    // Verify checkboxes now visible
    const checkboxes = dialog.locator('input[type="checkbox"]');
    expect(await checkboxes.count()).toBeGreaterThan(0);

    // Toggle a series
    await checkboxes.first().click();
    await page.waitForTimeout(300);
  });
```

**Step 2: Run mobile tests**

Run: `npm run e2e:mobile`
Expected: 9 tests should pass

**Step 3: Commit**

```bash
git add e2e/specs/mobile.spec.ts
git commit -m "test: add mobile player card graph accordion test"
```

---

## Phase 9: Cleanup & Documentation

### Task 24: Move existing tests to smoke spec

**Files:**
- Modify: `e2e/specs/smoke.spec.ts`
- Modify: `e2e/App.spec.ts`

**Step 1: Review existing tests in App.spec.ts**

Identify tests that overlap with new specs:
- Tests already covered by new specs should be removed
- Unique useful tests should be migrated to appropriate spec files

**Step 2: Migrate or consolidate tests**

Move any unique valuable tests from `App.spec.ts` to the appropriate new spec file.

**Step 3: Update App.spec.ts with deprecation notice**

Add comment at top:

```typescript
/**
 * DEPRECATED: Tests are being migrated to feature-based spec files.
 * See e2e/specs/ directory for new test organization.
 * This file will be removed once migration is complete.
 */
```

**Step 4: Commit**

```bash
git add e2e/specs/smoke.spec.ts e2e/App.spec.ts
git commit -m "refactor: consolidate tests and deprecate App.spec.ts"
```

---

### Task 25: Run all E2E tests and verify

**Step 1: Run complete test suite**

Run: `npm run e2e`
Expected: All ~35 tests should pass

**Step 2: Check test execution time**

Verify tests complete in < 5 minutes

**Step 3: Generate HTML report**

Run: `npx playwright show-report`
Review coverage across all specs

**Step 4: Commit any final adjustments**

```bash
git add .
git commit -m "test: verify all E2E tests pass"
```

---

### Task 26: Update documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/project-testing.md`

**Step 1: Update README E2E section**

Replace existing E2E section with:

```markdown
## E2E Testing

This project has comprehensive Playwright E2E tests organized by feature.

**Test Organization:**
- `e2e/specs/smoke.spec.ts` - Basic sanity checks
- `e2e/specs/player-card.spec.ts` - Player card flows (tabs, graphs, URLs)
- `e2e/specs/team-switching.spec.ts` - Team changes and filter resets
- `e2e/specs/filters.spec.ts` - Filter combinations
- `e2e/specs/mobile.spec.ts` - Mobile-specific features

**Run E2E tests:**

```bash
# Run all E2E tests
npm run e2e

# Run with UI mode (recommended for development)
npm run e2e:ui

# Run specific test file
npm run e2e:smoke
npm run e2e:mobile

# Debug mode
npm run e2e:debug
```

**Prerequisites:**
- Backend must be running at `localhost:3000`
- Frontend dev server will start automatically

**Architecture:**
- Page objects for complex components
- Helper functions for common patterns
- Accessibility-first selectors
- ~35 comprehensive tests
```

**Step 2: Update project-testing.md with E2E details**

Add section about E2E test architecture, page objects, and best practices.

**Step 3: Commit documentation**

```bash
git add README.md docs/project-testing.md
git commit -m "docs: update E2E testing documentation"
```

---

### Task 27: Final verification and plan completion

**Step 1: Run full test suite one more time**

Run: `npm run e2e`
Expected: All tests pass

**Step 2: Verify all files created**

Check that all these exist:
- `e2e/page-objects/` (3 files)
- `e2e/helpers/` (5 files)
- `e2e/specs/` (5 spec files)
- `e2e/config/test-data.ts`

**Step 3: Review git log**

Run: `git log --oneline -20`
Verify all commits are logical and well-described

**Step 4: Create final summary commit**

```bash
git commit --allow-empty -m "feat: complete E2E testing implementation

Implemented comprehensive E2E test suite with:
- 3 page objects (PlayerCardDialog, StatsTable, SettingsDrawer)
- 5 helper modules (filters, navigation, table, wait, player-card)
- 5 test spec files (~35 tests total)
- Mobile and desktop coverage
- Accessibility-first selectors

All tests passing against real backend."
```

---

## Success Criteria

✅ All 32-36 E2E tests pass consistently
✅ Tests run in < 5 minutes locally
✅ Page objects provide clear, reusable APIs
✅ Helper functions reduce duplication
✅ Tests use accessibility-first selectors
✅ Mobile and desktop scenarios covered
✅ Documentation complete and up-to-date

## Notes

- **Real backend required:** Tests assume backend is running at localhost:3000
- **Conditional tabs:** Player card shows 2-3 tabs depending on season selection
- **Filter state:** Players/Goalies have independent filter states
- **Mobile viewport:** Set to 390x844 for mobile tests
- **Accessibility:** If selector not accessible, improve UI first before using class/CSS selectors
