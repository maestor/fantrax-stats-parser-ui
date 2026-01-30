# FFHL Stats application

## Purpose

Once made lightweight API to parse my NHL fantasy league team stats and print combined seasons results by player (regular season &amp; playoffs separately) as JSON, [node-fantrax-stats-parser](https://github.com/maestor/node-fantrax-stats-parser). It have been useful but without UI it's quite tricky to use. So here is one simple UI for those stats. Selected Angular framework as a base because I haven't use it in work related stuff since 2016, and thinking this is better for me learning and developing skills than do it with for example something like React or Vue.js which I have working experience in recent years.

Live showcase: https://ffhl-stats.vercel.app/

## Features

- 📊 **Player Statistics**: View and analyze player performance across seasons
- 🥅 **Goalie Statistics**: Dedicated view for goalie-specific metrics
- 🏒 **Team Selector**: Choose a team (defaults to Colorado, id `1`) via the header controls. Selection is remembered across reloads, and changing team resets filters
- ⏳ **Start From Season**: Lower bound for combined stats (defaults to the team's oldest season; affects seasons list + combined stats endpoints via `startFrom`)
- 🔄 **Report Switching**: Toggle between regular season and playoffs
- 📅 **Season Selection**: Filter data by specific seasons or view combined stats
- 📈 **Stats Per Game**: Calculate and display per-game averages
- 🎯 **Minimum Games Filter**: Filter players/goalies by minimum games played
- 🔍 **Search & Sort**: Interactive table with search and column sorting
- 📌 **Sticky Headers**: Table headers remain visible while scrolling with full horizontal scroll support
- 🧮 **Score Ranking**: Default sort by a composite `score` column to surface highest-impact players and goalies first
- 🏷️ **Compact Headers**: Short stat abbreviations in the table header with tooltips showing full localized labels
- 📇 **Player Card**: Dialog with per-player / per-goalie details, including combined career stats, season-by-season breakdown, and a graphs tab in separate tabs, using the same stat keys (including `score`) as the main tables
	- 📉 Graphs tab shows per-season line charts for key stats (games, goals, assists, points, shots, penalties, hits, blocks for skaters; games, wins, saves, shutouts for goalies) with selectable series and sensible axis scaling
	- 🎯 Radar chart view showing 0-100 normalized score breakdown for individual stats, toggleable with line charts
- 💾 **Smart Caching**: Automatic data caching with 5-minute TTL
- 🌐 **Internationalization**: i18n support with ngx-translate (currently ships with Finnish UI; additional languages can be added under `public/i18n/`)
- 🎨 **Material Design**: Clean UI with Angular Material components
- 🌓 **Automatic Dark Mode**: Follows device/browser `prefers-color-scheme` (no manual toggle)
- 📦 **Installable PWA**: Installable on desktop/mobile; app shell is cached for offline-friendly reloads (live stats still require the backend)
- 📱 **Mobile Responsive**: Optimized for all screen sizes with adaptive layouts and collapsible controls
- 🕒 **Last Updated Indicator**: Shows backend data last-modified timestamp under the title (desktop) and in the settings drawer (mobile)

More details:

- **Theming / Automatic Dark Mode**: [docs/project-overview.md](docs/project-overview.md)
- **PWA / Installable App**: [docs/project-overview.md](docs/project-overview.md)

## Installation and use

### Prerequisites

Running backend, instructions find from [node-fantrax-stats-parser](https://github.com/maestor/node-fantrax-stats-parser).

### Backend API URL configuration

This UI talks to a separate backend (see [node-fantrax-stats-parser](https://github.com/maestor/node-fantrax-stats-parser)).

**Development**

- Angular calls the backend directly:
	- `src/environments/environment.ts` → `apiUrl: 'http://localhost:3000'`

**Production / “Showcase” (Vercel)**

- The UI is deployed at https://ffhl-stats.vercel.app/
- Angular does **not** call the backend directly in production. Instead it calls `'/api'`:
	- `src/environments/environment.production.ts` → `apiUrl: '/api'`
- Vercel rewrites `/api/<path>` to a Serverless Function (`/api/proxy`) which:
	- forwards the request to your real backend (`API_URL`)
	- injects a secret `x-api-key` header (`API_KEY`) so the browser never sees the key

**Vercel environment variables (required)**

- `API_URL` = absolute backend base URL (e.g. `https://your-backend.example.com`)
- `API_KEY` = backend API key (kept server-side)
- `ALLOWED_ORIGINS` = comma-separated allowed origins for browser requests (e.g. `https://ffhl-stats.vercel.app`)

**Vercel environment variables (optional)**

- `RATE_LIMIT_MAX` (default `120`) and `RATE_LIMIT_WINDOW_SEC` (default `60`) for best-effort per-IP rate limiting

After changing Vercel env vars, redeploy so they take effect.

```bash
1. Install Node.js (version 24.x)
2. Clone this repository
3. npm install
4. npm start
5. Navigate to http://localhost:4200
```

### Available Scripts

```bash
# Development server
npm start               # Runs on http://localhost:4200

# Unit tests (Jasmine + Karma)
npm test                # Run all tests once (Chrome)
npm run test:watch      # Run tests in watch mode
npm run test:headless   # Run tests in headless Chrome (may be flaky)
npm run test:coverage   # Run unit tests with coverage

# CI/local verification
npm run verify           # Headless tests + production build

# E2E tests (Playwright)
npx playwright test

# Production build
npm run build           # Build for production
```

## Testing

This project has comprehensive unit test coverage (Jasmine + Karma). Run `npm test` to see the current test count and status.

📖 **[Read the complete Testing Documentation](docs/project-testing.md)**

Quick test commands:

```bash
# Run all unit tests (single run, Chrome)
npm test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests in headless mode (may be flaky due to Karma infra)
npm run test:headless

# Run unit tests with coverage report
npm run test:coverage

# Verify (what CI runs: headless unit tests + production build)
npm run verify

# E2E tests (Playwright)
npx playwright test
```

E2E tests use **Playwright** to cover the main user flows (landing page layout, navigation between player/goalie stats, and opening the Player Card with its career view). See docs/project-testing.md for detailed E2E scenarios and options.

### Test Coverage Summary

Coverage is enforced in CI via `npm run verify` (headless unit tests with coverage + production build).

In addition: every contribution must include tests for all new/changed logic (aim for **100% coverage for touched code paths**, including error/edge cases).

- **Enforced coverage gate** (implementation under `src/`, test files excluded):
	- >= 98% statements
	- >= 98% lines
	- >= 98% functions
	- >= 96% branches
- **Long-term target**: 100% statements/lines/functions/branches

See [docs/project-testing.md](docs/project-testing.md) for detailed information about test patterns, best practices, and coverage.

## Accessibility

Accessibility is a core requirement of this project (not optional).

- Keyboard-only users must be able to use every feature
- Focus must be visible and predictable
- Collapsed/hidden content must not be tabbable

📖 **[Read the Accessibility Guide](docs/accessibility.md)**

## Technology Stack

- **Framework**: Angular 21
- **UI Library**: Angular Material 21
- **Language**: TypeScript 5.9
- **State Management**: RxJS 7.8 (BehaviorSubjects)
- **HTTP Client**: Angular HttpClient with caching
- **Testing**: Jasmine + Karma (unit), Playwright (E2E)
- **i18n**: ngx-translate 17

## Project Structure

```
api/                       # Vercel API proxy
docs/                      # Project docs (guides, standards)
e2e/                       # Playwright end-to-end tests
public/i18n/               # Translation files
scripts/                   # Helper scripts (coverage, etc.)
src/
├── app/
│   ├── base/              # Base components (navigation, footer)
│   ├── services/          # Core services (API, cache, stats, filters, team)
│   │   └── tests/         # Service unit tests
│   ├── shared/            # Shared components
│   │   ├── player-card/   # Player detail dialog
│   │   ├── settings-panel/# Settings UI (toggles/sliders)
│   │   ├── stats-table/   # Reusable stats table
│   │   ├── top-controls/  # Header controls (team/season/report switchers)
│   │   └── table-columns.ts
│   ├── player-stats/      # Player stats page
│   ├── goalie-stats/      # Goalie stats page
│   └── app.component.ts   # Root component
└── environments/          # Build-time environment config
```

## Development Notes

This project was originally generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.6 and has been upgraded to Angular 21.

### Key Architectural Decisions

1. **Standalone Components**: All components use Angular's standalone API (no modules)
2. **Reactive Patterns**: RxJS observables for state management
3. **Type Safety**: Strict TypeScript configuration enforced
4. **Immutable State**: Filter state updates create new objects
5. **Path Aliases**: `@base/*`, `@services/*`, `@shared/*` for clean imports

### Mobile Responsiveness

The application is fully responsive with optimized layouts for all screen sizes:

- **Desktop (>960px)**: Full horizontal layout with all controls visible
- **Tablet (768px-960px)**: Wrapped controls with optimized spacing
- **Mobile (<768px)**: Collapsible filter panels and graph controls for better space utilization
- **Small Mobile (<480px)**: Stacked layouts with adjusted font sizes and padding

**Key mobile features:**
- Control panel filters have a collapsible toggle button on all screen sizes (collapsed by default)
- Table headers remain sticky during vertical scrolling while maintaining horizontal scroll capability
- Player card graph controls collapse into a toggle button on mobile (<768px)
- Horizontal scrolling enabled for wide tables (bySeason view)
- Optimized table font sizes and padding for small screens
- All interactive elements remain accessible and touch-friendly

## Contributing

When contributing, please ensure:

1. All new/changed code has corresponding tests (aim 100% coverage for the code you touched)
2. `npm run verify` passes (includes coverage gate + production build)
3. Follow existing code style and patterns
4. Run `npm run verify` before committing
5. Update documentation when changes affect usage/behavior, scripts/workflows, or project standards

In addition, treat accessibility as a hard requirement for every change. If a feature is not keyboard-accessible and properly labeled, it is not considered done.

## License

This project is for personal use and learning purposes.
