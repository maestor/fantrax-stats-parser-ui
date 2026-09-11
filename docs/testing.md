# Testing

Use `intelligence-testing` to choose realistic behavior coverage, then apply these repository rules. [AGENTS.md](../AGENTS.md) owns review acceptance and final-gate exceptions.

## Commands and configuration

| Command | Scope |
| --- | --- |
| `npm test` | All Vitest/jsdom tests, once |
| `npm run test:watch` | Watch component/service tests |
| `npm run test:coverage` | Istanbul coverage through Angular's unit-test builder |
| `npm run e2e` | Full Chromium Playwright suite |
| `npx playwright test e2e/specs/<spec>.ts` | Relevant E2E spec while iterating |
| `npm run e2e:capture-fixtures` | Capture API responses from local backend |
| `npm run verify` | Lint + coverage tests + production build, after acceptance |

[angular.json](../angular.json) → `architect.test.options.coverageThresholds` owns exact coverage gates. Cover changed behavior, including realistic error/edge cases; aim for full coverage of touched logic. Do not preserve dead branches just to test them. Tests/config own current counts and exclusions.

## Local execution rules

- Component/service tests normally use full-suite commands. Isolated unit debugging requires an explicit user request; focused E2E iteration is allowed above.
- Run one heavy suite at a time. Allow about two minutes between repeated verify runs; coordinate competing servers/system load.
- Local Playwright uses the user's API at `localhost:3000`. If unavailable, ask the user to start it; do not substitute CI fixtures.
- Prefer local Playwright runs outside the sandbox. Playwright starts/reuses `npm start` on `localhost:4200`; headed mode still uses this webServer setup.
- Do not set `CI=true` for routine local E2E. For explicit CI reproduction, port 4200 must be free; ask the user to stop their frontend if it occupies that port.
- Use `agent-browser` only for manual inspection with real styling/theming risk; close it afterward. Playwright owns automated E2E/performance coverage. See [styling](styling.md) for the visual matrix.

## Component behavior

- Specs live beside source as `*.spec.ts`. Render real templates with Testing Library and accessible queries (`getByRole`, `getByText`, `getByLabelText`, async `findBy*`). Do not add test IDs or use CSS/class selectors for routine assertions.
- Keep `FilterService`, `SettingsService`, `TeamService`, and other app state real. Mock only external/platform boundaries such as `ApiService`, `ViewportService`, `PwaUpdateService`.
- Import `TranslateTestingModule` from `@testing/translate-testing`; assertions use translation keys rather than loading Finnish strings.
- Use one render per scenario with related assertions grouped together. Avoid repeated renders for the same state, shallow stubs, and partial control harnesses built from mocked state.
- Cover small UI-only formatters/tooltips/view-model helpers through their owning behavior test. Dedicated helper specs need reusable domain behavior, unrelated consumers, or no realistic higher-level path.
- Disable Material transitions with `MATERIAL_ANIMATIONS` and `{ animationsDisabled: true }`, not deprecated animation providers.
- Remove proven-unused implementation paths after refactors. Do not invent impossible contexts to meet coverage.

## Service boundaries

Use focused tests for logic bypassed by UI tests; do not replace real UI flow coverage to raise percentages.

| Subject | Boundary |
| --- | --- |
| `ApiService` | Real service with `provideHttpClientTesting()` / `HttpTestingController`; request construction, deduplication, cache behavior |
| `CacheService` | Direct tests with controlled time; no component render |
| `PwaUpdateService` | Injected `SwUpdate`, `DOCUMENT`, `PLATFORM_ID` fakes |

Use adjacent specs as working examples rather than copying generic templates.

## Playwright and fixtures

[playwright.config.ts](../playwright.config.ts) owns browser/server settings. Install Chromium with `npx playwright install chromium` when needed.

- Feature specs: `e2e/specs/`; reusable interactions: `e2e/page-objects/` and `e2e/helpers/`.
- CI fixture activation: `e2e/fixtures/test-fixture.ts`; responses: `e2e/fixtures/data/`; URL matching: `e2e/mocks/api-mock.ts`.
- Finnish visible labels come from `fi('...')` in `e2e/config/i18n.ts` or `e2e/config/test-data.ts`. Use exact roles/narrow containers for ambiguous words rather than hard-coded translations.
- Persisted/default settings can auto-open draft panels or focus selected leaderboard teams. Establish the intended starting state instead of assuming everything is collapsed.
- CI serves built output with `serve -s` and blocks service workers so API mocks receive requests. The [workflow](../.github/workflows/ci.yml) currently builds the E2E app in development configuration; verify separately builds production.
- CI runs verify for PRs to main and gates E2E on changed `src/**` paths. Do not rely on CI alone to validate E2E-only edits. Reports/results are retained seven days.

When routes, pagination, filters, report types, or request parameters change:

1. Check `buildFixtureList()` in `e2e/scripts/capture-fixtures.ts` alongside `e2e/mocks/api-mock.ts`.
2. Prefer capturing the exact request combination; compatibility logic is appropriate only for genuine aggregation of existing pages.
3. Recapture from the live backend and commit relevant fixtures with the change. Capture also resolves new season indices dynamically.
4. Validate affected coverage in explicit CI fixture mode when possible, respecting port ownership above; report any gap.

Performance auditing is documented in [development](development.md#build-and-performance); it does not replace behavior/E2E coverage.
