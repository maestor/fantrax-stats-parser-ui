# fantrax-stats-parser-ui

## Purpose

Once made lightweight API to parse my NHL fantasy league team stats and print combined seasons results by player (regular season &amp; playoffs separately) as JSON, [node-fantrax-stats-parser](https://github.com/maestor/node-fantrax-stats-parser). It have been useful but without UI it's quite tricky to use. So here is one simple UI for those stats. Selected Angular framework as a base because I haven't use it in work related stuff since 2016, and thinking this is better for me learning and developing skills than do it with for example something like React or Vue.js which I have working experience in recent years.

Live showcase: https://ffhl-stats.vercel.app/

## Features

- 📊 **Player Statistics**: View and analyze player performance across seasons
- 🥅 **Goalie Statistics**: Dedicated view for goalie-specific metrics
- 🏒 **Team Selector**: Choose a team (defaults to Colorado, id `1`). Selection is remembered across reloads, and changing team resets filters
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
- 💾 **Smart Caching**: Automatic data caching with 5-minute TTL
- 🌐 **Internationalization**: Multi-language support with ngx-translate
- 🎨 **Material Design**: Clean UI with Angular Material components
- 📱 **Mobile Responsive**: Optimized for all screen sizes with adaptive layouts and collapsible controls

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
1. Install Node.js (version 22.x or higher recommended)
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

# E2E tests (Playwright)
npx playwright test

# Production build
npm run build           # Build for production
```

## Testing

This project has comprehensive unit test coverage (Jasmine + Karma). Run `npm test` to see the current test count and status.

📖 **[Read the complete Testing Documentation](TESTING.md)**

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

# E2E tests (Playwright)
npx playwright test
```

E2E tests use **Playwright** to cover the main user flows (landing page layout, navigation between player/goalie stats, and opening the Player Card with its career view). See TESTING.md for detailed E2E scenarios and options.

For AI assistants working on this repo, additional E2E-focused context is available in the Claude docs under [.claude/testing-implementation-summary.md](.claude/testing-implementation-summary.md) and [.claude/TEST-STATUS-FINAL.md](.claude/TEST-STATUS-FINAL.md).

### Test Coverage Summary

- ✅ **Services**: 100% coverage (ApiService, CacheService, StatsService, FilterService, TeamService)
- ✅ **Base Components**: 100% coverage (Navigation, Footer)
- ✅ **Shared Components**: 95% coverage (StatsTable, ControlPanel sub-components)
- ✅ **Page Components**: Integration-style coverage (PlayerStats, GoalieStats, PlayerCard)

See [TESTING.md](TESTING.md) for detailed information about test patterns, best practices, and coverage.

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
src/
├── app/
│   ├── base/              # Base components (navigation, footer)
│   ├── services/          # Core services (API, cache, stats, filters, team)
│   │   └── tests/         # Service unit tests
│   ├── shared/            # Shared components
│   │   ├── control-panel/ # Filter controls
│   │   ├── team-selector/  # Team selector under header
│   │   ├── player-card/   # Player detail dialog
│   │   └── stats-table/   # Reusable stats table
│   ├── player-stats/      # Player stats page
│   ├── goalie-stats/      # Goalie stats page
│   └── app.component.ts   # Root component
├── public/i18n/           # Translation files (served from public root)
└── e2e/                   # End-to-end tests
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

1. All new features have corresponding tests
2. Test coverage remains above 90%
3. Follow existing code style and patterns
4. Run `npm test` before committing
5. Update documentation as needed

## License

This project is for personal use and learning purposes.
