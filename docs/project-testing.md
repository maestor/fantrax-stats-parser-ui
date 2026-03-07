# Testing Documentation

## Overview

This project uses **Testing Library** (`@testing-library/angular`) with **Vitest** for component/behavior tests, targeted **service-layer tests** for HTTP/cache/platform integrations, and **Playwright** for end-to-end tests. UI tests follow a user-centric, accessible-query approach — testing what the user sees and does, not implementation details.

## Test Statistics

- **Total Test Files / Tests**: Run `npm test` to see the current count and status
- **Test Framework**: Vitest (jsdom) + Testing Library
- **E2E Framework**: Playwright
- **Service-layer tests**: Angular `TestBed` with HTTP/platform fakes where needed

Note: avoid hard-coding a "current test count" in docs; it becomes stale quickly.

## Contribution Requirement: Tested Changes

Every contribution must include tests for all new/changed behavior.

- **Rule**: new/changed logic should be tested (include error and edge cases)
- **CI Gate**: `npm run verify` must pass (tests + production build)
- **Coverage thresholds**: `npm run verify` enforces minimum coverage of 92% statements, 82% branches, 93% functions, and 94% lines via `angular.json` (`architect.test.options.coverageThresholds`)
- **Planning-heavy changes**: save the approved implementation plan locally under gitignored `docs/plans/YYYY-MM-DD-*.md` before editing code so behavior-test work can resume cleanly in a later session

## Running Tests

### Component Tests

```bash
# Run all tests once (no browser window)
npm test

# Run all tests with watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run the same checks CI enforces (tests + production build)
npm run verify

# Run a specific test file
npm run test -- --reporter=verbose src/app/app.component.spec.ts
```

The coverage gate used by `npm run test:coverage` and `npm run verify` is configured in `angular.json`, not `vitest.config.ts`, because the project runs tests through Angular's `@angular/build:unit-test` builder.

**Important Notes:**

- ✅ No browser required — tests run in jsdom (no Chrome installation needed)
- 📋 **No tests are currently skipped**

### Test Conventions

- **File naming**: `*.spec.ts`
- **Accessible queries only**: Use `getByRole`, `getByText`, `getByLabelText` — no CSS selectors, class names, or `data-testid`
- **Translation keys as text**: Use translation keys directly (e.g., `'myTitle'`) instead of loading Finnish locale files
- **Full rendering**: Render real components with their templates — no shallow rendering or stubs
- **Mock at the service/API boundary**: Provide mock services via Angular DI, not component internals
- **Minimize renders**: Full-render tests are expensive. Group all assertions for a given scenario into a single test with one `render()` call. Use comments to separate logical assertion groups. Do NOT create separate `it()` blocks that each call `render()` for the same component state

### Service-Layer Tests

Use service-layer tests when the thing being verified is not a user flow, but the service's own transport/platform logic:

- **`ApiService`**: run the real service with `provideHttpClientTesting()` and `HttpTestingController`
- **`CacheService`**: direct unit tests are fine; no component render needed
- **`PwaUpdateService`**: use injected `SwUpdate`, `DOCUMENT`, and `PLATFORM_ID` fakes

Rules:

- Prefer behavior tests for UI work and user paths
- Prefer service-layer tests only for logic that behavior tests intentionally bypass, such as HTTP request construction, caching, in-flight deduping, service worker update plumbing, or browser/platform APIs
- In service-layer tests, mock at the lowest useful boundary:
  - HTTP boundary for `ApiService`
  - clock/time boundary for `CacheService`
  - browser/service worker boundary for `PwaUpdateService`
- Do not rewrite UI behavior tests into service tests just to raise coverage

### Test Template

```typescript
import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { MyComponent } from './my.component';
import { ApiService } from '@services/api.service';

describe('MyComponent', { timeout: 15_000 }, () => {
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

### Service Test Template

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ApiService } from './api.service';
import { CacheService } from './cache.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        ApiService,
        CacheService,
      ],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });
});
```

### E2E Tests (Playwright)

The project uses **Playwright Test** for end-to-end (E2E) coverage with a feature-based test organization.

**Prerequisites (local):**

- Playwright browser installed: `npx playwright install chromium`
- Backend API running on `http://localhost:3000` (see project README and backend repo)

**In CI:** E2E tests run without a live backend. API responses are served from JSON fixtures in `e2e/fixtures/data/` via Playwright's `page.route()` mocking. The production build is served with `npx serve`.

The Playwright config is defined in `playwright.config.ts` and:

- Uses `baseURL` `http://localhost:4200`
- Locally: starts (or reuses) the Angular dev server via `npm start`
- In CI: serves the production build via `npx serve dist/fantrax-stats-parser-ui/browser`
- Runs tests against Chromium only

**Basic commands:**

```bash
# Run all E2E tests (headless, Chromium) — requires backend on :3000
npx playwright test

# Run in headed mode (for debugging)
npx playwright test --headed

# Run specific test file
npx playwright test e2e/specs/smoke.spec.ts

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

## Test Patterns & Best Practices

### 1. Accessible Queries

Always use accessible queries that reflect how users interact with the UI:

```typescript
// ✅ Good - Accessible queries
screen.getByRole('button', { name: 'a11y.doAction' });
screen.getByRole('heading', { name: 'myTitle' });
screen.getByText('some visible text');

// ❌ Avoid - Implementation details
document.querySelector('.my-class');
fixture.nativeElement.querySelector('#my-id');
```

### 2. Service Mocking

Mock dependencies at the service boundary via Angular DI:

```typescript
const mockApiService = {
  getSeasons: () => of(mockSeasons),
  getPlayerData: () => of(mockPlayers),
};

await render(MyComponent, {
  providers: [
    { provide: ApiService, useValue: mockApiService },
  ],
});
```

### 3. User Interactions

Use `fireEvent` or `userEvent` for user interactions:

```typescript
import { fireEvent, screen } from '@testing-library/angular';

// Click a button
fireEvent.click(screen.getByRole('button', { name: 'a11y.doAction' }));

// Type in a field
fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'search term' } });
```

## Common Test Failures & Solutions

### Issue: TranslateService not provided

**Solution**: Import `TranslateModule.forRoot()` in test configuration

```typescript
await render(MyComponent, {
  imports: [TranslateModule.forRoot()],
});
```

### Issue: Async tests timing out

**Solution**: Increase timeout and use `findBy*` queries for async content:

```typescript
describe('MyComponent', { timeout: 15_000 }, () => {
  it('loads async data', async () => {
    await render(MyComponent, { /* ... */ });

    // findBy* waits for the element to appear
    await screen.findByText('expected text', {}, { timeout: 5000 });
  });
});
```

## Continuous Integration

The CI pipeline (`.github/workflows/ci.yml`) runs two parallel jobs on every PR and push to main:

1. **Verify** — tests with coverage + production build (`npm run verify`)
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

All new tests should use Testing Library with accessible queries. See the Test Template section above for the standard pattern.

## Resources

- [Testing Library for Angular](https://testing-library.com/docs/angular-testing-library/intro)
- [@testing-library/jest-dom](https://github.com/testing-library/jest-dom)
- [Vitest Documentation](https://vitest.dev)
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Playwright Documentation](https://playwright.dev/)

---

## Maintained By

This testing suite was created and is maintained by the development team. For questions or issues, please refer to the project's main README or open an issue in the repository.
