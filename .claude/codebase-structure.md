# Codebase Structure

## Directory Layout

```
fantrax-stats-parser-ui/
├── .angular/           # Angular build cache
├── .claude/            # Claude documentation (this directory)
├── .vscode/            # VSCode configuration
├── dist/               # Production build output
├── e2e/                # Playwright E2E tests
├── node_modules/       # Dependencies
├── public/             # Static assets
├── src/                # Source code
│   ├── app/            # Application code
│   │   ├── base/       # Base layout components
│   │   │   ├── footer/
│   │   │   └── navigation/
│   │   ├── goalie-stats/     # Goalie stats page
│   │   ├── player-stats/     # Player stats page
│   │   ├── services/         # Application services
│   │   │   ├── api.service.ts
│   │   │   ├── cache.service.ts
│   │   │   ├── filter.service.ts
│   │   │   └── stats.service.ts
│   │   ├── shared/           # Shared components
│   │   │   ├── control-panel/
│   │   │   │   ├── min-games-slider/
│   │   │   │   ├── report-switcher/
│   │   │   │   ├── season-switcher/
│   │   │   │   └── stats-mode-toggle/
│   │   │   ├── player-card/
│   │   │   ├── stats-table/
│   │   │   └── table-columns.ts
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── main.ts         # Application bootstrap
│   └── index.html      # HTML entry point
├── angular.json        # Angular workspace configuration
├── package.json        # Dependencies and scripts
├── playwright.config.ts # E2E test configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # Project README
```

## Source Code Organization

### `/src/app/base/`
Layout components that appear on all pages:
- **footer/** - Footer component with links/info
- **navigation/** - Top navigation with tabs

### `/src/app/player-stats/`
Smart component for player statistics view:
- Fetches player data from API
- Manages player-specific state
- Renders stats table and controls

### `/src/app/goalie-stats/`
Smart component for goalie statistics view:
- Fetches goalie data from API
- Manages goalie-specific state
- Renders stats table and controls

### `/src/app/services/`
Application-wide services:

- **api.service.ts** - HTTP client wrapper for backend API
- **stats.service.ts** - Business logic for stats data transformation
- **filter.service.ts** - Table filtering and sorting logic
- **cache.service.ts** - In-memory caching for API responses

### `/src/app/shared/`
Reusable presentational components:

#### `control-panel/`
Container for all filter controls:
- **min-games-slider/** - Material slider for minimum games filter
- **report-switcher/** - Toggle between regular season/playoffs
- **season-switcher/** - Dropdown for season selection
- **stats-mode-toggle/** - Toggle for combined/separate stats view

#### `stats-table/`
Main data table component:
- Material table with sorting
- Pagination
- Column configuration
- Row selection

#### `player-card/`
Individual player information card display

#### `table-columns.ts`
Column definitions for stats tables

## File Naming Conventions

- **Components**: `component-name.component.ts`
- **Services**: `service-name.service.ts`
- **Specs**: `*.spec.ts`
- **Styles**: `*.component.scss`
- **Templates**: `*.component.html`

## Component Structure

Each component typically includes:
```
component-name/
├── component-name.component.ts      # Component logic
├── component-name.component.html    # Template
├── component-name.component.scss    # Styles
└── component-name.component.spec.ts # Unit tests
```

## Configuration Files

- **angular.json** - Angular CLI configuration, build options
- **tsconfig.json** - TypeScript compiler options
- **tsconfig.app.json** - App-specific TypeScript config
- **tsconfig.spec.json** - Test-specific TypeScript config
- **playwright.config.ts** - E2E test configuration
- **package.json** - Dependencies, scripts, metadata

## Asset Organization

Static assets (images, fonts, etc.) go in:
- `/public/` - Publicly accessible assets
- Component-specific assets co-located with components

## Test Organization

- **Unit tests**: `*.spec.ts` files alongside components/services
- **E2E tests**: `/e2e/` directory with Playwright tests
- **Test utilities**: `/src/app/services/tests/`
