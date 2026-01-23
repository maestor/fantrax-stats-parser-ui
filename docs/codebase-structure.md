# Codebase Structure

## Directory Layout

```
fantrax-stats-parser-ui/
├── .angular/           # Angular build cache
├── docs/               # Project documentation
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
│   │   │   ├── stats.service.ts
│   │   │   └── team.service.ts
│   │   ├── shared/           # Shared components
│   │   │   ├── help-dialog/
│   │   │   ├── player-card/
│   │   │   ├── settings-panel/
│   │   │   │   ├── min-games-slider/
│   │   │   │   └── stats-mode-toggle/
│   │   │   ├── stats-table/
│   │   │   ├── top-controls/
│   │   │   │   ├── report-switcher/
│   │   │   │   ├── season-switcher/
│   │   │   │   └── team-switcher/
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
- **team.service.ts** - Selected team state (used by top controls + pages)

### `/src/app/shared/`
Reusable presentational components:

#### `top-controls/`
Header control strip shown under the app title:
- **team-switcher/** - Select team
- **season-switcher/** - Select season
- **report-switcher/** - Regular vs playoffs

#### `settings-panel/`
Expandable per-page settings area:
- **min-games-slider/** - Minimum games filter
- **stats-mode-toggle/** - Toggle per-game stats mode

#### `help-dialog/`
Help/instructions dialog opened from the info icon (and `?` shortcut)

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
