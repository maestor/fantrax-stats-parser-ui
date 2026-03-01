# Testing Documentation

## Overview

This project has comprehensive test coverage for all UI behaviors, services, and components. The test suite includes three layers: unit tests (Vitest, for existing/legacy code), behavior tests (Testing Library, for new feature development), and end-to-end tests (Playwright).

## Test Statistics

- **Total Test Files / Tests**: Run `npm test` to see the current count and status
- **Test Framework**: Vitest (jsdom)
- **E2E Framework**: Playwright
- **Coverage**: Enforced gate is >=98% statements/lines/functions and >=96% branches; long-term target is 100% statements/lines/functions/branches
Note: avoid hard-coding a “current test count” in docs; it becomes stale quickly.

## Contribution Requirement: 100% Tested Changes

Every contribution must include tests for all new/changed behavior.

- **Rule**: new/changed logic should be tested to 100% (no uncovered touched lines/branches; include error and edge cases)
- **CI Gate**: the repo’s enforced global coverage thresholds are the minimum bar; they are not a substitute for fully testing your change

## Running Tests

### Unit Tests

```bash
# Run all tests once (no browser window)
npm test

# Run all tests with watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run the same checks CI enforces (coverage thresholds + production build)
npm run verify

# Run a specific test file
npm run test -- --reporter=verbose src/app/services/tests/api.service.spec.ts
```

**Important Notes:**

- ✅ No browser required — tests run in jsdom (no Chrome installation needed)
- 📋 **No tests are currently skipped**

### Behavior Tests (Testing Library)

**Policy: No new unit tests for future feature development.** All new features must be tested with behavior tests using `@testing-library/angular`. Existing unit tests remain and are maintained.

```bash
# Run behavior tests with coverage
npm run test:behavior
```

**Conventions:**

- **File naming**: `*.behavior.spec.ts`
- **Accessible queries only**: Use `getByRole`, `getByText`, `getByLabelText` — no CSS selectors, class names, or `data-testid`
- **Translation keys as text**: Use translation keys directly (e.g., `'myTitle'`) instead of loading Finnish locale files
- **Full rendering**: Render real components with their templates — no shallow rendering or stubs
- **Mock at the service/API boundary**: Provide mock services via Angular DI, not component internals

**Behavior Test Template:**

```typescript
import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { MyComponent } from './my.component';
import { ApiService } from '@services/api.service';

describe('MyComponent — behavior', { timeout: 15_000 }, () => {
  async function setup() {
    const mockApiService = {
      getData: () => of(mockData),
    };

    await render(MyComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        { provide: ApiService, useValue: mockApiService },
      ],
    });
  }

  it('renders the expected content', async () => {
    await setup();

    expect(screen.getByRole('heading', { name: 'myTitle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'a11y.doAction' })).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

The project uses **Playwright Test** for end-to-end (E2E) coverage with a feature-based test organization.

**Prerequisites (local):**

- Playwright browsers installed: `npx playwright install`
- Backend API running on `http://localhost:3000` (see project README and backend repo)

**In CI:** E2E tests run without a live backend. API responses are served from JSON fixtures in `e2e/fixtures/data/` via Playwright's `page.route()` mocking. The production build is served with `npx serve`.

The Playwright config is defined in `playwright.config.ts` and:

- Uses `baseURL` `http://localhost:4200`
- Locally: starts (or reuses) the Angular dev server via `npm start`
- In CI: serves the production build via `npx serve dist/fantrax-stats-parser-ui/browser`
- Runs tests against Chromium, Firefox and WebKit

**Basic commands:**

```bash
# Run all E2E tests (headless, all browsers) — requires backend on :3000
npx playwright test

# Run in headed mode (for debugging)
npx playwright test --headed

# Run specific test file
npx playwright test e2e/specs/smoke.spec.ts

# Run only in a single browser, e.g. Chromium
npx playwright test --project=chromium

# Run with API mocking (simulates CI mode)
CI=true npx playwright test

# Capture/update API fixtures from live backend
npm run e2e:capture-fixtures
```

#### Test Organization

E2E tests are organized into feature-based spec files under `e2e/specs/`:

- **smoke.spec.ts** - Core functionality and navigation
  - Initial page load and UI elements
  - Tab navigation (player/goalie stats)
  - Basic table interactions

- **player-card.spec.ts** - Player detail dialog
  - Opening player cards from table
  - Career tabs (combined/by-season/graphs)
  - Dialog interactions and data verification

- **team-switching.spec.ts** - Team selector behavior
  - Team selection dropdown
  - Filter reset on team change
  - URL updates and state persistence

- **filters.spec.ts** - Report type, season, and stats filters
  - Report type switching (regular/playoffs)
  - Season selection
  - Stats per game toggle
  - Minimum games slider
  - Search filtering
  - Filter isolation between player/goalie views

- **mobile.spec.ts** - Mobile-responsive UI
  - Settings drawer on mobile viewports
  - Collapsible controls
  - Touch interactions

**Supporting files:**

- `e2e/page-objects/` - Page Object Model classes for reusable interactions
- `e2e/helpers/` - Utility functions (viewport helpers, wait utilities)
- `e2e/fixtures/test-fixture.ts` - Custom Playwright fixture that activates API mocking in CI
- `e2e/fixtures/data/` - JSON API response fixtures captured from the live backend
- `e2e/mocks/api-mock.ts` - Route mocking helper using `page.route()`
- `e2e/scripts/capture-fixtures.ts` - Script to capture fixtures from the live backend

#### Best Practices

**1. Accessibility-First Selectors**

Use semantic selectors that reflect how users interact with the UI:

```typescript
// ✅ Good - Accessibility-first
await page.getByRole('button', { name: 'Avaa asetuspaneeli' });
await page.getByRole('combobox', { name: 'Kausivalitsin' });
await page.getByLabel('Pelaajahaku');

// ❌ Avoid - Brittle CSS selectors
await page.locator('.settings-button');
await page.locator('#season-select');
```

**2. Wait for Stable State**

Always wait for data to load before assertions:

```typescript
// Wait for first row to be visible
const rows = page.locator('tr[mat-row]');
await rows.first().waitFor({ state: 'visible', timeout: 10000 });

// Then verify data
expect(await rows.count()).toBeGreaterThan(0);
```

**3. Test User Flows, Not Implementation**

Focus on what users do, not how the code works:

```typescript
// ✅ Good - Tests user behavior
test('User can filter players by name', async ({ page }) => {
  await page.getByLabel('Pelaajahaku').fill('Gretzky');
  await expect(page.locator('tr[mat-row]')).toHaveCount(1);
});

// ❌ Avoid - Tests implementation details
test('filterItems() updates dataSource.filter property', async ({ page }) => {
  // Don't test internal component methods in E2E tests
});
```

**4. Use Page Objects for Reusability**

```typescript
import { PlayerStatsPage } from '../page-objects/player-stats.page';

test('Filter by season', async ({ page }) => {
  const playerStats = new PlayerStatsPage(page);
  await playerStats.goto();
  await playerStats.selectSeason('2023-24');
  await playerStats.expectTableHasRows();
});
```

#### Current E2E Coverage

**Core Functionality:**
- ✅ Front page rendering and initial UI state
- ✅ Navigation between Kenttäpelaajat and Maalivahdit tabs
- ✅ Opening Player Card dialog with career tabs
- ✅ Search filtering with "no results" state
- ✅ Report type switching (Runkosarja ↔ Playoffs)
- ✅ Season selection and data updates
- ✅ Stats per game toggle
- ✅ Minimum games slider
- ✅ Table sorting by columns
- ✅ Filter isolation between player/goalie views

**Mobile:**
- ✅ Settings drawer toggle
- ✅ Collapsible controls
- ✅ Touch-friendly interactions

**Team Switching:**
- ✅ Team selector dropdown
- ✅ Filter reset on team change
- ✅ Start season selection

For contributor-oriented notes and architectural context, see the docs under `docs/`.

## Test Structure

### Services (`src/app/services/tests/`)

#### ApiService (25 tests)

Tests HTTP API interactions and caching:

- ✅ `getSeasons()` - Fetches available seasons
- ✅ `getTeams()` - Fetches available teams
- ✅ `getSeasons(reportType?: 'regular' | 'playoffs', teamId?: string)` - Fetches available seasons for the selected report type (and optionally a team)
- ✅ `getPlayerData()` - Fetches player statistics (combined & seasonal)
- ✅ `getGoalieData()` - Fetches goalie statistics (combined & seasonal)
- ✅ Caching behavior validation
- ✅ Error handling with proper error propagation
- ✅ HTTP request verification

**Key Test Scenarios:**

```typescript
// Example: Testing API caching
it("should return cached data on subsequent requests", (done) => {
  const mockSeasons: Season[] = [{ season: 2024, text: "2024-25" }];
  cacheService.set("seasons-regular", mockSeasons);

  service.getSeasons('regular').subscribe((seasons) => {
    expect(seasons).toEqual(mockSeasons);
    done();
  });

  httpMock.expectNone(`${API_URL}/seasons/regular`); // No HTTP call made
});
```

#### CacheService (21 tests)

Tests in-memory caching with TTL:

- ✅ `set()` - Store data with custom or default TTL
- ✅ `get()` - Retrieve cached data
- ✅ `clear()` - Remove specific cache entry
- ✅ `clearAll()` - Clear all cached data
- ✅ TTL expiration handling
- ✅ Multiple data type support

#### StatsService (18 tests)

Tests statistical calculations:

- ✅ `getPlayerStatsPerGame()` - Calculate per-game player stats
- ✅ `getGoalieStatsPerGame()` - Calculate per-game goalie stats
- ✅ Decimal rounding to 2 places
- ✅ Preservation of fixed fields (name, games, plusMinus for players; gaa, savePercent for goalies)
- ✅ Edge cases (zero stats, single game, large numbers)

#### FilterService (27 tests)

Tests reactive state management:

- ✅ Independent player/goalie filter streams
- ✅ `updatePlayerFilters()` / `updateGoalieFilters()`
- ✅ `resetPlayerFilters()` / `resetGoalieFilters()`
- ✅ Observable emissions tracking
- ✅ Multiple subscribers support
- ✅ Proper state merging

### Base Components (`src/app/base/`)

#### NavigationComponent (12 tests)

Tests navigation and routing:

- ✅ Router integration
- ✅ Active tab tracking via `setActiveTab()`
- ✅ URL change detection
- ✅ Template rendering verification

**Note**: 3 tests were removed because they tested Angular framework internals (change detection) rather than component behavior.

#### FooterComponent (3 tests)

Basic component tests:

- ✅ Component creation
- ✅ Template rendering

### Shared Components (`src/app/shared/`)

#### StatsTableComponent (~31 tests, all passing)

Tests table functionality:

- ✅ Data binding with `MatTableDataSource`
- ✅ Sorting configuration via `MatSort` (component wires sort to the table and applies default column/direction, defaulting to the `score` column)
- ✅ Filtering with `filterItems()`
- ✅ Dialog opening via `selectItem()`
- ✅ Column management (static vs dynamic)
- ✅ Loading states
- ✅ Data transformation handling

Additional UI behavior covered by tests:

- Compact stat headers (from `tableColumnShort.*`) with tooltips showing full labels (`tableColumn.*`)
- Consistent alignment for numeric/stat columns, while keeping the name column left-aligned

**Example: Testing table filtering**

```typescript
it("should filter dataSource based on input value", () => {
  component.dataSource.data = mockPlayerData as any;
  const event = { target: { value: "Player 1" } } as unknown as Event;

  component.filterItems(event);

  expect(component.dataSource.filter).toBe("player 1");
});
```

#### Control Panel Components

**MinGamesSliderComponent (27 tests)**

- ✅ Player/goalie context switching
- ✅ Filter synchronization
- ✅ `onValueChange()` updates
- ✅ `ngOnChanges()` constraint enforcement (minGames ≤ maxGames)
- ✅ Subscription cleanup with `ngOnDestroy()`
- ✅ Subscription cleanup with `ngOnDestroy()`

**ReportSwitcherComponent (20 tests)**

- ✅ Regular/Playoffs toggle
- ✅ Observable stream with `reportType$`
- ✅ Context-specific filter updates
- ✅ Fixed async subscription timing (subscribe before action)

**SeasonSwitcherComponent (12 tests)**

- ✅ Season loading from API
- ✅ Reversed order (newest first)
- ✅ Season selection handling
- ✅ Undefined season support
- ✅ Fixed async subscription timing (subscribe before action)

**StatsModeToggleComponent (10 tests)**

- ✅ Stats per game toggle
- ✅ Filter synchronization
- ✅ Boolean state management
- ✅ Fixed async subscription timing (subscribe before action)

## Test Patterns & Best Practices

### 1. Async Testing with BehaviorSubjects

**CRITICAL**: Always subscribe **before** calling the action when testing BehaviorSubjects:

```typescript
// ❌ WRONG - Subscribe after action (will miss synchronous emission)
it("should update filters when changed", () => {
  component.changeValue(10);

  filterService.playerFilters$.subscribe((filters) => {
    expect(filters.minGames).toBe(10); // This will fail!
  });
});

// ✅ CORRECT - Subscribe before action
it("should update filters when changed", () => {
  let result: number | undefined;
  filterService.playerFilters$.subscribe((filters) => {
    result = filters.minGames;
  });

  component.changeValue(10);

  expect(result).toBe(10); // This works!
});
```

**Why**: BehaviorSubjects emit **synchronously** when `.next()` is called. If you subscribe after the action, you've already missed the emission. No `fakeAsync`/`tick()` needed — BehaviorSubject emissions are always synchronous.

### 2. Testing MatTableDataSource with MatSort

When testing Angular Material table components, avoid testing framework internals:

```typescript
// ❌ AVOID - Testing framework internals
it("should set dataSource.sort", () => {
  const mockSort = { sortChange: of({}) } as any;
  component.dataSource.sort = mockSort;
  expect(component.dataSource.sort).toBe(mockSort);
});

// ✅ BETTER - Test user-facing behavior
it("should filter table data", () => {
  component.dataSource.data = mockData;
  const event = { target: { value: "search" } } as unknown as Event;

  component.filterItems(event);

  expect(component.dataSource.filter).toBe("search");
});
```

**Why**: MatTableDataSource + MatSort integration is already tested by Angular Material. Focus on testing your component's logic and user interactions.

### 3. Service Mocking

Mock dependencies properly in tests:

```typescript
const apiServiceMock = {
  getSeasons: vi.fn().mockReturnValue(of(mockSeasons)),
};

await TestBed.configureTestingModule({
  providers: [{ provide: ApiService, useValue: apiServiceMock }],
}).compileComponents();
```

### 4. Cleanup

Always clean up subscriptions and reset state:

```typescript
afterEach(() => {
  filterService.resetPlayerFilters();
  filterService.resetGoalieFilters();
});

describe("ngOnDestroy", () => {
  it("should complete destroy$ subject", () => {
    vi.spyOn(component["destroy$"], "next");
    vi.spyOn(component["destroy$"], "complete");

    component.ngOnDestroy();

    expect(component["destroy$"].next).toHaveBeenCalled();
    expect(component["destroy$"].complete).toHaveBeenCalled();
  });
});
```

### 5. Testing Observables

Test observable emissions properly:

```typescript
it("should emit new values to subscribers", () => {
  const emissions: FilterState[] = [];
  const subscription = service.playerFilters$.subscribe((filters) => {
    emissions.push(filters);
  });

  service.updatePlayerFilters({ reportType: "playoffs" });

  expect(emissions.length).toBe(2); // Initial + update
  expect(emissions[1].reportType).toBe("playoffs");

  subscription.unsubscribe();
});
```

### 6. HTTP Testing

HTTP interactions are covered in depth in the ApiService tests using `HttpTestingController`, including happy paths, caching behavior and error handling.

## Common Test Failures & Solutions

### Issue: TranslateService not provided

**Solution**: Import `TranslateModule.forRoot()` in test configuration

```typescript
await TestBed.configureTestingModule({
  imports: [YourComponent, TranslateModule.forRoot()],
}).compileComponents();
```

### Issue: MatTableDataSource typing errors

**Solution**: Use `as any` for test data assignments

```typescript
component.dataSource.data = mockPlayerData as any;
```

### Issue: Async tests timing out or failing

**Solution**: Subscribe before action for BehaviorSubjects — they emit synchronously. For real `setTimeout`/`Promise` code, use `vi.useFakeTimers()` + `vi.advanceTimersByTime()` or `await Promise.resolve()`.

```typescript
// ✅ CORRECT pattern for BehaviorSubjects (no fakeAsync needed)
it("should handle async operation", () => {
  let result;
  service.data$.subscribe((data) => (result = data));

  service.fetchData();

  expect(result).toBeDefined();
});

// ✅ CORRECT pattern for real setTimeout
it("should call callback after delay", () => {
  vi.useFakeTimers();
  const cb = vi.fn();
  service.scheduleCallback(cb, 1000);

  vi.advanceTimersByTime(1000);
  expect(cb).toHaveBeenCalled();
  vi.useRealTimers();
});
```

### Issue: "You provided 'undefined' where a stream was expected"

**Problem**: Mock MatSort objects are missing required observables when testing MatTableDataSource

**Solution**: Either mock all required properties or skip tests that test framework internals:

```typescript
// Option 1: More complete mock (still may not work)
const mockSort = {
  active: "games",
  direction: "desc",
  sortChange: of({}),
  // May need more properties...
} as any;

// Option 2: Skip and focus on user behavior tests (recommended)
it.skip("should set dataSource.sort", () => {
  // Test framework internals - skip this
});

it("should filter table when user types", () => {
  // Test user-facing behavior instead
});
```

## E2E Test Examples

Located in `/e2e/App.spec.ts`:

```typescript
test("should navigate between player and goalie stats", async ({ page }) => {
  await page.goto("/");

  // Check initial route
  await expect(page).toHaveURL("/player-stats");

  // Navigate to goalie stats
  await page.click("text=Goalie Stats");
  await expect(page).toHaveURL("/goalie-stats");

  // Verify table is displayed
  await expect(page.locator("table")).toBeVisible();
});
```

## Continuous Integration

The CI pipeline (`.github/workflows/ci.yml`) runs two parallel jobs on every PR and push to main:

1. **Verify** — unit tests with coverage + production build (`npm run verify`)
2. **E2E Tests** — builds the app, then runs Playwright tests against the production build with API fixtures (no live backend needed)

E2E tests upload the Playwright HTML report and test results as GitHub Actions artifacts when tests fail (retained for 7 days).

### Updating API Fixtures

Re-capture fixtures when:

1. **New E2E tests** need API endpoints or parameter combinations not yet captured — add matching entries to `buildFixtureList()` in `e2e/scripts/capture-fixtures.ts`, then re-run
2. **New season starts** (regular or playoffs) — the capture script resolves season indices dynamically, so a re-run picks up the new data automatically

```bash
# Requires backend running on localhost:3000
npm run e2e:capture-fixtures
```

This fetches the API responses the E2E tests depend on and saves them as JSON files in `e2e/fixtures/data/`. Commit the updated fixtures alongside your changes.

## Writing New Tests

### Component Test Template

> **Note**: For new feature development, use the **Behavior Test Template** (Testing Library) in the "Behavior Tests" section above. The TestBed-based template below is for maintaining existing unit tests only.

```typescript
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { YourComponent } from "./your.component";
import { TranslateModule } from "@ngx-translate/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("YourComponent", () => {
  let component: YourComponent;
  let fixture: ComponentFixture<YourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YourComponent, TranslateModule.forRoot(), NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(YourComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("feature name", () => {
    it("should do something specific", () => {
      // Arrange
      const expected = "value";

      // Act
      component.doSomething();

      // Assert
      expect(component.result).toBe(expected);
    });
  });
});
```

### Service Test Template

```typescript
import { TestBed } from "@angular/core/testing";
import { YourService } from "./your.service";

describe("YourService", () => {
  let service: YourService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [YourService],
    });
    service = TestBed.inject(YourService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should perform operation", (done) => {
    service.operation().subscribe((result) => {
      expect(result).toBeDefined();
      done();
    });
  });
});
```

## Next Steps

To achieve 100% coverage:

1. **Add integration tests** for page components (PlayerStatsComponent, GoalieStatsComponent)
2. **Expand E2E tests** to cover all user flows
3. **Add visual regression tests** with Playwright screenshots
4. **Test error boundaries** and edge cases
5. **Add performance tests** for large datasets

## Resources

- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library for Angular](https://testing-library.com/docs/angular-testing-library/intro)
- [@testing-library/jest-dom](https://github.com/testing-library/jest-dom)
- [RxJS Testing](https://rxjs.dev/guide/testing)

## Recent Updates (January 2026)

### Features Added

1. **Sticky Table Headers** - Headers remain visible during vertical scrolling while maintaining horizontal scroll
2. **Filter Toggle (All Screens)** - Collapsible filter panel available on all screen sizes, collapsed by default
3. **Bug Fix: scoreAdjustedByGames** - Fixed issue where Fantasy ranking / Game values disappeared with points per game filter

### Test Fixes

1. **Async Subscription Timing** - Fixed 7 tests across control panel components by subscribing before actions
2. **NavigationComponent** - Removed 3 tests that tested Angular framework internals
3. **StatsTableComponent** - Added guard for undefined MatSort, disabled 5 framework integration tests
4. **Subscription Cleanup** - Added proper `ngOnDestroy()` calls in test cleanup

### Key Learnings

- BehaviorSubjects emit synchronously - always subscribe before calling actions in tests
- Don't test framework internals (Angular Material, Angular change detection)
- Focus on testing component logic and user-facing behavior
- Proper cleanup prevents memory leaks and test pollution

### Documentation

- [docs/README.md](./README.md) - Index of internal docs

---

## Maintained By

This testing suite was created and is maintained by the development team. For questions or issues, please refer to the project's main README or open an issue in the repository.
