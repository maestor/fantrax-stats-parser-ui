# fantrax-stats-parser-ui

## Purpose

Once made lightweight API to parse my NHL fantasy league team stats and print combined seasons results by player (regular season &amp; playoffs separately) as JSON, [node-fantrax-stats-parser](https://github.com/maestor/node-fantrax-stats-parser). It have been useful but without UI it's quite tricky to use. So here is one simple UI for those stats. Selected Angular framework as a base because I haven't use it in work related stuff since 2016, and thinking this is better for me learning and developing skills than do it with for example something like React or Vue.js which I have working experience in recent years.

## Features

- 📊 **Player Statistics**: View and analyze player performance across seasons
- 🥅 **Goalie Statistics**: Dedicated view for goalie-specific metrics
- 🔄 **Report Switching**: Toggle between regular season and playoffs
- 📅 **Season Selection**: Filter data by specific seasons or view combined stats
- 📈 **Stats Per Game**: Calculate and display per-game averages
- 🎯 **Minimum Games Filter**: Filter players/goalies by minimum games played
- 🔍 **Search & Sort**: Interactive table with search and column sorting
- 💾 **Smart Caching**: Automatic data caching with 5-minute TTL
- 🌐 **Internationalization**: Multi-language support with ngx-translate
- 🎨 **Material Design**: Clean UI with Angular Material components

## Installation and use

### Prerequisites

Running backend, instructions find from [node-fantrax-stats-parser](https://github.com/maestor/node-fantrax-stats-parser).

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
npm start              # Runs on http://localhost:4200

# Testing
npm test              # Run unit tests with Karma
npm run test:e2e      # Run E2E tests with Playwright

# Production build
npm run build         # Build for production
```

## Testing

This project has comprehensive test coverage with **200+ tests** covering all UI behaviors and services.

📖 **[Read the complete Testing Documentation](TESTING.md)**

Quick test commands:
```bash
# Run all tests
npm test

# Run in headless mode
npm test -- --browsers=ChromeHeadless --watch=false

# Run with coverage
npm test -- --code-coverage

# E2E tests
npx playwright test
```

### Test Coverage Summary

- ✅ **Services**: 100% coverage (ApiService, CacheService, StatsService, FilterService)
- ✅ **Base Components**: 100% coverage (Navigation, Footer)
- ✅ **Shared Components**: 95% coverage (StatsTable, ControlPanel sub-components)
- ⚠️ **Page Components**: Basic coverage (PlayerStats, GoalieStats)

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
│   ├── services/          # Core services (API, cache, stats, filters)
│   │   └── tests/         # Service unit tests
│   ├── shared/            # Shared components
│   │   ├── control-panel/ # Filter controls
│   │   ├── player-card/   # Player detail dialog
│   │   └── stats-table/   # Reusable stats table
│   ├── player-stats/      # Player stats page
│   ├── goalie-stats/      # Goalie stats page
│   └── app.component.ts   # Root component
├── assets/i18n/           # Translation files
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

## Contributing

When contributing, please ensure:
1. All new features have corresponding tests
2. Test coverage remains above 90%
3. Follow existing code style and patterns
4. Run `npm test` before committing
5. Update documentation as needed

## License

This project is for personal use and learning purposes.
