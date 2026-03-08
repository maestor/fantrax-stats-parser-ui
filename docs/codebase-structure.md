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
│   │   ├── career/            # Career listings feature (shell + players and goalies child components)
│   │   ├── goalie-stats/     # Goalie stats page
│   │   ├── goalie-route/     # Direct goalie card route handler
│   │   ├── leaderboards/     # Leaderboards feature (shell + regular and playoffs child components)
│   │   │   ├── regular/      # Regular season leaderboard table
│   │   │   └── playoffs/     # Playoffs leaderboard table
│   │   ├── player-stats/     # Player stats page
│   │   ├── player-route/     # Direct player card route handler
│   │   ├── utils/            # Utility functions (slug generation)
│   │   ├── services/         # Application services
│   │   │   ├── api.service.ts
│   │   │   ├── cache.service.ts
│   │   │   ├── comparison.service.ts
│   │   │   ├── drawer-context.service.ts
│   │   │   ├── filter.service.ts
│   │   │   ├── stats.service.ts
│   │   │   ├── team.service.ts
│   │   │   └── viewport.service.ts
│   │   ├── shared/           # Shared components
│   │   │   ├── comparison-bar/
│   │   │   ├── comparison-dialog/
│   │   │   │   ├── comparison-stats/
│   │   │   │   └── comparison-radar/
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

### `/src/app/career/`
Route shell and smart components for career listings:
- Handles `/career/players` and `/career/goalies`
- Renders tab navigation between career skaters and goalies
- Uses dedicated backend endpoints and a virtualized read-only table

### `/src/app/player-route/`
Route handler for direct player card URLs:
- Handles `/player/:teamSlug/:playerSlug` and `/player/:teamSlug/:playerSlug/:season` routes
- Opens player card modal with optional tab selection (`?tab=all|by-season|graphs`)
- Season in URL sets the season switcher in background
- Shows player stats page as background

### `/src/app/goalie-route/`
Route handler for direct goalie card URLs:
- Handles `/goalie/:teamSlug/:goalieSlug` and `/goalie/:teamSlug/:goalieSlug/:season` routes
- Opens goalie card modal with optional tab selection
- Shows goalie stats page as background

### `/src/app/utils/`
Utility functions:
- **slug.utils.ts** - URL slug generation from names (e.g., "Jamie Benn" → "jamie-benn")

### `/src/app/services/`
Application-wide services:

- **api.service.ts** - HTTP client wrapper for backend API
- **stats.service.ts** - Business logic for stats data transformation
- **filter.service.ts** - Reactive UI filter state (season/report/statsPerGame/minGames)
- **cache.service.ts** - In-memory caching for API responses
- **team.service.ts** - Selected team state (used by top controls + pages)
- **comparison.service.ts** - 2-player selection state for comparison feature (auto-clears on filter/team changes)
- **viewport.service.ts** - Viewport breakpoint detection (mobile vs desktop)
- **drawer-context.service.ts** - Provides per-page context (e.g. max games) to the mobile settings drawer

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

#### `comparison-bar/`
Floating bottom bar showing comparison selection state (0-2 players). Shows "Vertaa" button when 2 selected.

#### `comparison-dialog/`
Side-by-side comparison dialog with two tabs:
- **comparison-stats/** - Stat rows with bold highlighting for better values
- **comparison-radar/** - Chart.js radar chart overlay comparing normalized scores

#### `help-dialog/`
Help/instructions dialog opened from the info icon (and `?` shortcut). Global `/` shortcut focuses the search field.

#### `stats-table/`
Main data table component:
- Material table with sorting
- Column configuration
- Row selection
- Also contains `VirtualTableComponent`, used by career listings for virtualized rendering with shared table styling

#### `player-card/`
Individual player information card display

#### `table-columns.ts`
Column definitions for stats tables

#### `column.types.ts`
`Column` and `ColumnIcon` type definitions shared by all table consumers

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

- **Component/behavior tests**: `*.spec.ts` files using Testing Library (`@testing-library/angular`)
- **E2E tests**: `/e2e/` directory with Playwright tests
- **Test utilities**: `/src/app/testing/` (behavior test helpers)
