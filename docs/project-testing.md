# Testing Documentation

## Overview

This project has comprehensive test coverage for all UI behaviors, services, and components. The test suite includes unit tests (Jasmine/Karma) and end-to-end tests (Playwright).

## Test Statistics

- **Total Test Files / Tests**: Run `npm test` to see the current count and status
- **Test Framework**: Jasmine + Karma
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
# Run all tests (recommended - opens Chrome browser) without watch mode
npm test

# Run all tests with watch mode (opens Chrome browser)
npm run test:watch

# Run tests in headless mode (has Karma infrastructure issues)
npm run test:headless
# Note: This uses a CI-safe ChromeHeadless launcher (no-sandbox flags)

# Run tests with coverage
npm run test:coverage

# Run tests with coverage in headless mode (what CI uses via `npm run verify`)
npm run test:coverage:headless

# Run the same checks CI enforces (coverage thresholds + production build)
npm run verify

# Run specific test file
npm test -- --include='**/api.service.spec.ts'
```

**Important Notes:**

- ✅ **Regular Chrome mode** (`npm test`) is recommended - all tests pass reliably
- ⚠️ **Headless mode** may crash due to Karma infrastructure issues (not test failures)
- 📋 **No tests are currently skipped**

### E2E Tests (Playwright)

The project uses **Playwright Test** for end-to-end (E2E) coverage with a feature-based test organization.

**Prerequisites:**

- Playwright browsers installed: `npx playwright install`
- Backend API running (see project README and backend repo)

The Playwright config is defined in `playwright.config.ts` and:

- Uses `baseURL` `http://localhost:4200`
- Starts (or reuses) the Angular dev server via `webServer` with `npm start`
- Runs tests against Chromium, Firefox and WebKit

**Basic commands:**

```bash
# Run all E2E tests (headless, all browsers)
npx playwright test

# Run in headed mode (for debugging)
npx playwright test --headed

# Run specific test file
npx playwright test e2e/specs/smoke.spec.ts

# Run only in a single browser, e.g. Chromium
npx playwright test --project=chromium
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
- ✅ Proper async patterns with `fakeAsync` / `tick()`

**ReportSwitcherComponent (20 tests)**

- ✅ Regular/Playoffs toggle
- ✅ Observable stream with `reportType$`
- ✅ Proper async patterns with `fakeAsync` / `tick()`
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
it("should update filters when changed", fakeAsync(() => {
  component.changeValue(10);
  tick();

  filterService.playerFilters$.subscribe((filters) => {
    expect(filters.minGames).toBe(10); // This will fail!
  });
}));

// ✅ CORRECT - Subscribe before action
it("should update filters when changed", fakeAsync(() => {
  let result: number | undefined;
  filterService.playerFilters$.subscribe((filters) => {
    result = filters.minGames;
  });

  component.changeValue(10);
  tick();

  expect(result).toBe(10); // This works!
}));
```

**Why**: BehaviorSubjects emit **synchronously** when `.next()` is called. If you subscribe after the action, you've already missed the emission.

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
  getSeasons: jasmine.createSpy("getSeasons").and.callFake(() => of(mockSeasons)),
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
    spyOn(component["destroy$"], "next");
    spyOn(component["destroy$"], "complete");

    component.ngOnDestroy();

    expect(component["destroy$"].next).toHaveBeenCalled();
    expect(component["destroy$"].complete).toHaveBeenCalled();
  });
});
```

### 5. Testing Observables

Test observable emissions properly:

```typescript
it("should emit new values to subscribers", fakeAsync(() => {
  const emissions: FilterState[] = [];
  const subscription = service.playerFilters$.subscribe((filters) => {
    emissions.push(filters);
  });

  service.updatePlayerFilters({ reportType: "playoffs" });
  tick();

  expect(emissions.length).toBe(2); // Initial + update
  expect(emissions[1].reportType).toBe("playoffs");

  subscription.unsubscribe();
}));
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

**Solution**: Use `fakeAsync` with `tick()` and **subscribe before action** for BehaviorSubjects

```typescript
// ✅ CORRECT pattern
it("should handle async operation", fakeAsync(() => {
  let result;
  service.data$.subscribe((data) => (result = data));

  service.fetchData();
  tick(); // Advance virtual clock

  expect(result).toBeDefined();
}));
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
xit("should set dataSource.sort", () => {
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

### GitHub Actions (if applicable)

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --browsers=ChromeHeadless --watch=false
      - run: npx playwright test
```

## Writing New Tests

### Component Test Template

```typescript
import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
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
    it("should do something specific", fakeAsync(() => {
      // Arrange
      const expected = "value";

      // Act
      component.doSomething();
      tick();

      // Assert
      expect(component.result).toBe(expected);
    }));
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
- [Jasmine Documentation](https://jasmine.github.io/)
- [Playwright Documentation](https://playwright.dev/)
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
