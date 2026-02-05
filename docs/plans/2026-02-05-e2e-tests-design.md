# E2E Testing Implementation Design

**Date:** 2026-02-05
**Status:** Approved
**Approach:** Lightweight Page Objects + Helpers

## Overview

This document outlines the design for comprehensive end-to-end testing of the FFHL Stats application using Playwright. The tests will cover player card flows, team switching, filter combinations, and mobile-specific features.

## Goals

1. **Expand test coverage** for features not currently tested:
   - Player card: all three tabs, graphs, series selection, direct URLs
   - Team switching: dropdown changes, filter resets, state independence
   - Filter combinations: all filters working together
   - Mobile-specific features: settings drawer, player name display, graph accordion

2. **Improve test organization** using page objects for complex components and feature-based test files

3. **Test against real backend** (localhost:3000) in development

4. **Accessibility-first** selector strategy

## Architecture Decision

**Selected: Approach 2 - Lightweight Page Objects + Helpers**

Balanced structure that provides:
- Page objects only for complex, reusable components
- Helper functions for common patterns
- Feature-based test files for easy navigation
- Tests remain readable without over-engineering

## File Structure

```
e2e/
├── page-objects/
│   ├── PlayerCardDialog.ts      # Player/goalie card interactions
│   ├── StatsTable.ts             # Table search, sort, filtering
│   └── SettingsDrawer.ts         # Mobile drawer (mobile-only)
│
├── helpers/
│   ├── filters.ts                # Filter-related helpers
│   ├── navigation.ts             # Tab switching, team selection
│   ├── table.ts                  # Table data helpers
│   ├── wait.ts                   # Wait utilities
│   └── player-card.ts            # Player card helpers
│
├── fixtures/
│   └── test-fixtures.ts          # Custom fixtures (if needed)
│
├── specs/
│   ├── smoke.spec.ts             # Basic navigation & sanity checks
│   ├── player-card.spec.ts       # All player card flows
│   ├── team-switching.spec.ts    # Team dropdown & filter resets
│   ├── filters.spec.ts           # Filter combinations
│   └── mobile.spec.ts            # Mobile-specific features
│
└── config/
    └── test-data.ts              # Shared test constants
```

## Page Objects

### PlayerCardDialog.ts

**Responsibilities:**
- Opening/closing the card
- Tab navigation (Tilastot, Kausittain, Graafit)
- Graph interactions (series selection, line/radar toggle)
- Copy link functionality
- Compare toggle (Vertaa hyökkääjiin/puolustajiin)
- Direct URL navigation

**Key methods:**
```typescript
- open(playerName: string): Promise<void>
- close(): Promise<void>
- switchToTab(tab: 'stats' | 'by-season' | 'graphs'): Promise<void>
- toggleGraphSeries(seriesName: string): Promise<void>
- switchToRadarChart(): Promise<void>
- switchToLineChart(): Promise<void>
- copyPlayerLink(): Promise<string>
- verifyTabContent(tab: string): Promise<void>
- getAvailableTabs(): Promise<string[]>
- hasLineGraphs(): Promise<boolean>
```

**Important:** Tab availability is conditional:
- **All seasons selected** → 3 tabs (Tilastot, Kausittain, Graafit with line + radar)
- **Single season selected** → 2 tabs (Tilastot, Graafit with radar only)

### StatsTable.ts

**Responsibilities:**
- Search/filter players by name
- Sort by column
- Get row count
- Click player row to open card
- Verify table data updates

**Key methods:**
```typescript
- searchPlayer(name: string): Promise<void>
- clearSearch(): Promise<void>
- sortByColumn(column: string): Promise<void>
- getRowCount(): Promise<number>
- clickPlayerRow(index: number): Promise<void>
- verifyDataLoaded(): Promise<void>
```

### SettingsDrawer.ts (mobile only)

**Responsibilities:**
- Open/close drawer
- Access all controls inside drawer
- Verify drawer state

**Key methods:**
```typescript
- open(): Promise<void>
- close(): Promise<void>
- isOpen(): Promise<boolean>
- selectTeam(teamName: string): Promise<void>
- selectSeason(season: string): Promise<void>
- toggleStatsPerGame(): Promise<void>
- setMinGames(value: number): Promise<void>
- selectPosition(position: 'all' | 'forwards' | 'defense'): Promise<void>
```

## Helper Functions

### helpers/filters.ts
```typescript
// Apply filters (desktop view)
- selectTeam(page, teamName: string)
- selectSeason(page, season: string)
- selectStartFromSeason(page, season: string)
- toggleStatsPerGame(page)
- setMinGames(page, value: number)
- selectPosition(page, position: 'all' | 'forwards' | 'defense')
- switchReportType(page, type: 'regular' | 'playoffs')

// Verify filter state
- verifyFilterApplied(page, filterType: string, expectedValue: any)
- getActiveFilters(page): Promise<FilterState>
```

### helpers/navigation.ts
```typescript
- switchToPlayersTab(page)
- switchToGoaliesTab(page)
- isOnPlayersView(page): Promise<boolean>
- isOnGoaliesView(page): Promise<boolean>
```

### helpers/table.ts
```typescript
- waitForTableData(page): Promise<void>
- getRowCount(page): Promise<number>
- getFirstRowText(page): Promise<string>
- verifyNoResults(page): Promise<void>
- getColumnValues(page, column: string): Promise<string[]>
```

### helpers/wait.ts
```typescript
- waitForFilterUpdate(page): Promise<void>
- waitForTeamChange(page, expectedTeam: string): Promise<void>
```

### helpers/player-card.ts
```typescript
- getAvailableTabs(page): Promise<string[]>
- hasLineGraphs(page): Promise<boolean>
- hasBySeasonTab(page): Promise<boolean>
```

## Test Files Breakdown

### specs/smoke.spec.ts
**Purpose:** Fast sanity checks

**Tests (~5):**
- Page loads with correct title and heading
- Navigation tabs visible
- Top controls visible
- Table renders with data
- Basic tab switching

### specs/player-card.spec.ts
**Purpose:** All player card flows (highest priority)

**Tests (~8-10):**

1. **Opening & closing**
   - Click row → card opens
   - Close via X button and Escape key

2. **Tab navigation (all seasons)**
   - Switch to Tilastot → verify stats table
   - Switch to Kausittain → verify by-season table
   - Switch to Graafit → verify line graphs

3. **Tab navigation (single season)**
   - Verify only Tilastot and Graafit tabs appear
   - Verify Graafit shows only radar chart

4. **Graph interactions (desktop)**
   - Toggle series on/off via checkboxes
   - Verify chart updates
   - Switch between line/radar charts

5. **Graph interactions (mobile)**
   - Open "Näytettävät tilastot" accordion
   - Toggle series from accordion
   - Verify chart updates

6. **Direct URL routing**
   - Navigate to `/player/:teamSlug/:playerSlug`
   - Navigate with `?tab=graphs` and `?tab=by-season`
   - Verify correct tab opens

7. **Copy link**
   - Click copy link button
   - Verify URL copied

8. **Compare toggle**
   - Toggle state persists across tabs

### specs/team-switching.spec.ts
**Purpose:** Team dropdown changes and filter reset behavior

**Tests (~3):**

1. **Basic team switching**
   - Change team via dropdown
   - Verify title, table data updates

2. **Filter reset on team change**
   - Apply filters → switch team → verify filters reset

3. **Independent filter state per team**
   - Team A: apply filters
   - Switch to Team B: verify fresh defaults
   - Apply different filters
   - Switch back to Team A: verify fresh defaults (not restored)

### specs/filters.spec.ts
**Purpose:** Filter combinations working together

**Tests (~8-10):**

1. **Individual filters** (one test per filter)
   - Season selector
   - Start-from season
   - Report type
   - Position filter
   - Stats per game toggle
   - Min games slider

2. **Filter combinations** (realistic scenarios)
   - All seasons + stats per game + min 10 games
   - Single season + position filter
   - Playoffs + min 20 games + stats per game
   - Start from 2015 + all seasons + position filter

3. **Filter isolation**
   - Players tab filters independent from Goalies tab

### specs/mobile.spec.ts
**Purpose:** Mobile-specific layouts and behaviors

**Tests (~8):**

1. **Team name display**
   - "Joukkue: [team name]" appears under title
   - Updates when team changes

2. **Settings drawer - basic interactions**
   - Open/close via gear icon
   - Close via button and ESC key
   - All sections visible

3. **Settings drawer - controls**
   - Change team, season, report type
   - Apply filters (stats per game, min games, position)

4. **Settings drawer - state persistence**
   - Change filters → close → verify applied
   - Reopen → verify states preserved

5. **Player card - graph accordion**
   - "Näytettävät tilastot" accordion visible
   - Expand and toggle series
   - Verify chart updates

6. **Last updated indicator**
   - Timestamp visible in drawer

## Testing Approach

### Mobile vs Desktop

**Strategy:** Inline viewport switching
- Most tests run in desktop viewport (default 1280x720)
- `mobile.spec.ts` sets viewport to 390x844 at test level
- Simpler than separate projects, all tests run together

### Test Data Strategy

**Avoid hardcoded data:**
- Don't assume specific player names (backend data changes)
- Use relative selectors: "first player", "second row"
- Data-independent assertions: "row count decreased" vs "row count = 5"

**Constants (config/test-data.ts):**
```typescript
export const DEFAULT_TEAM = 'Colorado Avalanche';
export const MOBILE_VIEWPORT = { width: 390, height: 844 };
export const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
export const WAIT_TIMEOUT = 10000;
```

### Backend Strategy

**Development:** Real backend (localhost:3000)
- Backend must be running before tests
- Uses real data
- Full integration testing

**CI:** Skipped for now (see Future Enhancements)

### Accessibility-First Selectors

**Philosophy:** If you can't find an accessible selector, improve the UI.

**Selector priority:**
1. `getByRole('button', { name: 'Label' })` ✅
2. `getByLabel('Label')` ✅
3. `getByTestId('id')` ⚠️ (if added)
4. `locator('.class')` ❌ (last resort)

**Process:**
1. Try accessible selector first
2. If none exists → pause, add accessibility attributes to component
3. Update test to use accessible selector
4. Improves tests AND user experience

## Running Tests

### Commands

```json
{
  "e2e": "playwright test",
  "e2e:ui": "playwright test --ui",
  "e2e:headed": "playwright test --headed",
  "e2e:debug": "playwright test --debug",
  "e2e:mobile": "playwright test specs/mobile.spec.ts",
  "e2e:smoke": "playwright test specs/smoke.spec.ts"
}
```

### Development Workflow

1. Start backend: `cd ../node-fantrax-stats-parser && npm start`
2. Start frontend: `npm start`
3. Run tests: `npm run e2e` or `npm run e2e:ui`

### Best Practices

**1. Stable selectors** (accessibility-first)

**2. Explicit waits**
```typescript
// Good
await page.locator('tr[mat-row]').first().waitFor({ state: 'visible' });

// Avoid
await page.waitForTimeout(500);  // Use only when necessary
```

**3. Test independence**
- Each test works in isolation
- Don't rely on execution order
- Reset state in `beforeEach`

**4. Specific assertions**
```typescript
await expect(rows).toHaveCount(10);
await expect.soft(tab1).toBeVisible();  // Soft assertions for multiple checks
```

## Implementation Tasks

### Setup Tasks

1. **Configure Playwright MCP screenshots** (Priority 1)
   - Issue: Screenshots currently save to project root instead of `.playwright-mcp/`
   - Solution: Always use full path in Playwright MCP: `.playwright-mcp/filename.png`
   - Verify `.playwright-mcp/` is in `.gitignore` ✅ (already there)

2. **Add test commands to package.json**

3. **Create directory structure** (`e2e/page-objects/`, `e2e/helpers/`, etc.)

### Implementation Order

**Phase 1: Foundation**
1. Create page objects (PlayerCardDialog, StatsTable, SettingsDrawer)
2. Create helper functions (filters, navigation, table, wait, player-card)
3. Create test data constants

**Phase 2: Core Tests**
1. `smoke.spec.ts` - basic sanity checks
2. `player-card.spec.ts` - highest priority flows
3. `team-switching.spec.ts`
4. `filters.spec.ts`

**Phase 3: Mobile**
1. `mobile.spec.ts` - mobile-specific features

**Phase 4: Cleanup**
1. Migrate/consolidate existing `App.spec.ts` tests
2. Verify all tests pass
3. Documentation updates

## Test Coverage Summary

**Total estimated tests:** 32-36 comprehensive E2E tests

- **Smoke:** ~5 tests
- **Player Card:** ~8-10 tests
- **Team Switching:** ~3 tests
- **Filters:** ~8-10 tests
- **Mobile:** ~8 tests

## Future Enhancements

### Priority 1: CI/CD Integration
- **Option A (Recommended):** Mock backend with MSW (Mock Service Worker) for CI
- Add E2E tests to GitHub Actions workflow
- Generate HTML reports on failure
- Fast, reliable, no external dependencies

### Priority 2: Test Data Management
- Create fixture data for consistent assertions
- Add test data builder utilities

### Priority 3: Advanced Features
- Visual regression testing (Playwright screenshots)
- Performance testing (Core Web Vitals)
- Cross-browser testing (chromium, firefox, webkit)

## Explicitly Excluded (For Now)

- CI/CD integration (added to future enhancements)
- Backend mocking (real backend for development)
- Visual regression testing
- Performance testing

## Success Criteria

✅ All 32-36 tests pass consistently
✅ Tests run in < 5 minutes locally
✅ Page objects provide clear, reusable APIs
✅ Helper functions reduce duplication
✅ Tests use accessibility-first selectors
✅ Mobile and desktop scenarios covered
✅ Documentation complete

## Notes

- **Conditional player card behavior:** When single season selected, only 2 tabs appear (Tilastot, Graafit), and only radar chart (no line graphs). This must be tested.
- **Filter state:** Players and Goalies have independent filter states. Team switching resets all filters to defaults.
- **Mobile accordion:** Graph series selection is in an accordion on mobile (`Näytettävät tilastot`), checkboxes on desktop.
- **Real backend required:** Tests assume backend is running and serving real data.
