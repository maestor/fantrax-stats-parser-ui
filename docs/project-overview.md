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
- **Testing**: Jasmine/Karma (unit), Playwright (E2E)

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
   - **Tab Navigation**: "All" tab shows combined career stats, "By Season" tab shows season-by-season breakdown, "Graphs" tab shows line charts of per-season trends
   - **Dynamic Layout**: Card width adjusts based on active tab (wider for season table and graphs)
   - **Season View**: Displays all seasons from newest to oldest (e.g., 2025-26, 2024-25)
   - **Sticky Headers**: Column headers remain visible while scrolling through seasons
   - **Responsive Design**: Adapts to viewport size (max 95vw)

4. **Control Panel**
   - Season switcher (multiple seasons)
   - Report type switcher (regular/playoffs)
   - Stats mode toggle (combined/separate views)
   - Minimum games filter slider

5. **Data Management**
   - Caching service to reduce API calls
   - Filter service for table data
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

## Data Flow

```
Backend API → ApiService → Component → Template
         ↓
      CacheService

TeamService → Component
FilterService → Component → Table Display
```

## Build & Deployment

- Development: `npm start` (port 4200)
- Production: `npm run build` (outputs to dist/)
- Testing: `npm test` (unit tests)
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
