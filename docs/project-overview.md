# Project Overview

## Purpose

This Angular application provides a user-friendly interface for viewing NHL fantasy league statistics parsed from Fantrax. It displays player and goalie statistics across different seasons and game types (regular season vs playoffs).

Accessibility is a core requirement: the UI is designed to remain usable via keyboard and assistive technologies.

## Architecture

### Frontend Stack
- **Framework**: Angular 21 (standalone components)
- **UI Library**: Angular Material
- **State Management**: RxJS + Services
- **Internationalization**: ngx-translate
- **Testing**: Vitest + Testing Library (component), Playwright (E2E)

### Backend Dependency
- Requires [node-fantrax-stats-parser](https://github.com/maestor/node-fantrax-stats-parser) running
- API endpoint configurable via environment

## Key Features

1. **Player Statistics Display**
   - Combined season results by player
   - Regular season and playoff stats separated
   - Filterable and sortable tables
   - Click on any player to view detailed stats card

2. **Goalie Statistics Display**
   - Separate view for goalie-specific stats
   - Same filtering and sorting capabilities
   - Click on any goalie to view detailed stats card

3. **Player/Goalie Detail Cards** (Dialog)
   - **Tab Navigation**: "All" tab shows combined career stats, "By Season" tab shows season-by-season breakdown, "Graphs" tab shows visual analysis
   - **Graphs Tab**:
     - Line charts showing per-season trends (multi-series, selectable stats)
     - 🎯 **Radar charts** showing per-stat score breakdown (0-100 normalized rankings)
     - Toggle button to switch between line and radar views
   - **Dynamic Layout**: Card width adjusts based on active tab (wider for season table and graphs)
   - **Season View**: Displays all seasons from newest to oldest (e.g., 2025-26, 2024-25)
   - **Sticky Headers**: Column headers remain visible while scrolling through seasons
   - **Responsive Design**: Adapts to viewport size (max 95vw)

4. **Control Panel**
    The controls are split into two areas:

    - **Top controls (header)**
       - Team selector
       - Start-from-season selector (lower bound for combined stats)
       - Season selector
       - Report type selector (regular/playoffs)
    - **Settings panel (per page)**
       - Stats per game toggle
       - Minimum games slider

    On **mobile**, these controls are accessed via a left-side **settings drawer** (opened from the settings icon next to the title). Desktop layout remains unchanged.

5. **Team Leaderboards** (`/leaderboards`)
   - All-time regular season ranking table: position, wins, points, win percentage, regular season titles
   - All-time playoffs ranking table: position, championships, finals, conference finals, round results, appearances
   - Tab navigation between Runkosarja and Playoffs views (default: Playoffs)
   - Column sorting via `mat-sort`; position ties handled correctly (first tied team shows number, subsequent show blank)
   - Expandable season breakdown rows per team (regular and playoffs) by clicking a team row, with multiple expanded rows allowed
   - Season breakdown rows can show trophy markers for winner/championship seasons

6. **Career Listings** (`/career/players`, `/career/goalies`)
   - Dedicated all-time career tables for players and goalies
   - Searchable and sortable without the stats-page controls/drawer/comparison bar
   - Player position is rendered inline with player name while sorting still uses the underlying plain `name`
   - Uses a virtualized table implementation to keep large result sets responsive

7. **Data Management**
   - Caching service to reduce API calls
   - Filter service for reactive UI filter state
   - Stats service for data transformation
   - Support for optional season breakdown data

## User Flow

1. User opens app at http://localhost:4200
2. App loads default view (player stats, combined season view) for the default team (configured team id, e.g. `"1"`)
3. User can:
   - Change team from the team selector under the header (selection is persisted)
   - Switch between players and goalies tabs
   - Select different seasons
   - Toggle between regular season and playoffs
   - Adjust minimum games filter
   - Click on any player/goalie row to open detailed stats dialog
   - In detail dialog:
   - View combined career stats in "All" tab
   - Switch to "By Season" tab to see season-by-season breakdown
   - Switch to "Graphs" tab to see visual trend lines by season with selectable stats
     - Scroll through seasons with sticky headers
   - Sort and filter table data

## Design Patterns

### Component Architecture
- **Standalone Components**: All components use Angular's standalone API
- **Smart/Dumb Pattern**:
  - Smart: player-stats, goalie-stats (data fetching)
  - Dumb: stats-table, player-card, control-panel components (presentation)

### Service Layer
- **ApiService**: HTTP communication with backend
- **StatsService**: Data transformation and business logic
- **FilterService**: Table filtering logic
- **CacheService**: In-memory caching

### Routing
- Simple routing with two main routes:
   - `/player-stats` - Player statistics view
   - `/goalie-stats` - Goalie statistics view
   - `/career/players` - Player career listing
   - `/career/goalies` - Goalie career listing
   - `/leaderboards/regular` — Regular season all-time ranking table
   - `/leaderboards/playoffs` — Playoffs all-time ranking table (default)

## Data Flow

```
Backend API → ApiService → Component → Template
         ↓
      CacheService

TeamService / FilterService / SettingsService signals → Component → Template
                                         ↓
                             observable APIs for async composition
```

## Build & Deployment

- Development: `npm start` (port 4200)
- Production: `npm run build` (outputs to dist/)
- Testing: `npm test` (component tests)
- E2E: Playwright tests in e2e/

### Theming / Automatic Dark Mode

The UI uses Angular Material theming with automatic light/dark mode based on the device/browser preference.

- Theme entrypoint: `src/theme.scss`
- Global styles + a few component overrides: `src/styles.scss`
- Build/test wiring: `angular.json` includes `src/theme.scss` in the `styles` array.

Implementation notes:

- Uses Material `theme-type: color-scheme` which emits CSS `light-dark(...)` tokens.
- `src/theme.scss` sets `color-scheme` to match `prefers-color-scheme` so the browser resolves `light-dark(...)` correctly.
- Visual consistency in dark mode relies on Material system tokens like `--mat-sys-surface` / `--mat-sys-on-surface`.

### PWA / Installable App

The production build is configured as a Progressive Web App (PWA):

- Web app manifest: `public/manifest.webmanifest`
- Service worker: Angular service worker (`@angular/service-worker`) using `ngsw-config.json`
- Icons: `public/icons/` (used for install + iOS)
- Favicon: `public/favicon.svg` (plus PNG fallbacks under `public/icons/`)

Notes:

- The service worker is only registered in production builds.
- After changing icons/manifest, installed PWAs may keep old assets due to caching. If an icon doesn’t update, uninstall/reinstall the PWA or clear site data.

## Browser Support

Modern browsers supporting ES2022+ (Chrome, Firefox, Safari, Edge)
