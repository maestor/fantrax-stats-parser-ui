# Project Overview

## Purpose

This Angular application provides a user-friendly interface for viewing NHL fantasy league statistics parsed from Fantrax. It displays player and goalie statistics across different seasons and game types (regular season vs playoffs).

Accessibility is a core requirement: the UI is designed to remain usable via keyboard and assistive technologies.

## Architecture

### Frontend Stack
- **Framework**: Angular 21 (standalone components)
- **UI Library**: Angular Material
- **State Management**: Signals-first services with RxJS used for async composition and compatibility streams
- **Internationalization**: ngx-translate
- **Testing**: Vitest + Testing Library (component), Playwright (E2E)

### Backend Dependency
- Requires [node-fantrax-stats-parser](https://github.com/maestor/node-fantrax-stats-parser) running
- API endpoint configurable via environment

### SEO & Sharing
- `src/index.html` provides the default title, description, canonical URL, and Open Graph/Twitter tags that crawlers see before Angular boots
- `SeoService` updates the browser title, canonical URL, and social metadata after navigation using route metadata from `src/app/app.routes.ts`
- Route titles reuse existing translated section/tab labels instead of maintaining separate title strings:
  - `/` → `FFHL tilastopalvelu`
  - fixed routes such as `/career/goalies` → `FFHL tilastopalvelu | Pelaajaurat | Maalivahdit`
- Crawl helpers live in `public/robots.txt` and `public/sitemap.xml`

### Route Shells
- **Root shell (`AppComponent`)**: stays lightweight and owns the skip link, footer, route subtitle, global keyboard shortcuts, update snackbar, and help/navigation overlays.
  It also owns the shared page header and settings drawer entry point for every route. The footer still loads as a deferred chunk only when route readiness makes it visible, and the overlay services are resolved lazily on interaction.
- **Dashboard shell (`DashboardShellComponent`)**: lazy-loaded only for the interactive dashboard routes (`/`, `/player-stats`, `/goalie-stats`, and direct player/goalie links). It now focuses on stats-only shell UI such as route tabs and the comparison bar.
- **Browse routes**: career, draft, and leaderboard pages still render directly under the root shell so they avoid stats-only tabs/comparison UI and keep their lighter route structure.

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
    The drawer groups controls into three areas:

    - **Base settings**
       - Team selector
       - Draft routes only: toggle for disabling selected-team highlight/open-by-default behavior
       - Last updated timestamp
    - **Stats ranges**
       - Start-from-season selector (lower bound for combined stats)
       - Season selector
       - Report type selector (regular/playoffs)
    - **Stats filters (per page)**
       - Stats per game toggle
       - Minimum games slider

    On every route, the left-side **settings drawer** opens from the shared page-header settings button.
    The base settings are always available, while the stats-only sections render only on player/goalie stats routes.
    The drawer initializes its visible content on first open so closed routes avoid that hidden startup work. Stats routes still resolve start-from-season state eagerly when they are active, while browse-route team changes defer that seasons lookup until the next stats visit.

5. **Team Leaderboards** (`/leaderboards`)
   - All-time regular season ranking table: position, wins, points, win percentage, regular season titles
   - All-time playoffs ranking table: position, championships, finals, conference finals, round results, appearances
   - All-time transactions ranking table: position, team, trades, claims, drops, rostered skaters, rostered goalies
   - Tab navigation between Runkosarja, Playoffs, and Siirrot views (default route: Runkosarja)
   - Column sorting via `mat-sort`; regular/playoff position ties stay blank after the first tied team, while transactions always show incremental positions
   - Expandable season breakdown rows per team (regular, playoffs, and transactions) by clicking a team row, with multiple expanded rows allowed
   - Season breakdown rows can show trophy markers for winner/championship seasons or emoji-prefixed transaction and roster counts per season

6. **Career Listings & Highlights** (`/career/players`, `/career/goalies`, `/career/highlights`)
   - Dedicated all-time career tables for players and goalies
   - Searchable and sortable without the stats-page controls/drawer/comparison bar
   - Player position is rendered inline with player name while sorting still uses the underlying plain `name`
   - Uses a virtualized table implementation to keep large result sets responsive
   - The highlights tab groups compact paged table cards into sticky-jump sections (`Urateot`, `Seurapolut`, `Pitkät pestit`, `Siirrot`) while keeping transaction leaders for most trades, claims, drops, and same-team reunions
   - Highlight rows show tied ranks inline before player position when multiple players share the same value
   - Highlight cards lazy-load their API data as they enter or near the viewport so the route scales better as more cards are added

7. **Draft Pages** (`/draft/entry-drafts`, `/draft/opening-draft`, `/draft/statistics`)
   - Dedicated browse-route shell for FFHL draft history
   - Shares the lighter root-shell treatment used by other browse routes
   - Batch 1 provides the route family, tab navigation, subtitle/SEO integration, and browse-shell wiring
   - Batch 2 renders `/draft/opening-draft` as a Material accordion grouped by drafting team, with simple per-pick rows and a traded-owner suffix when the original pick came from another team
   - Batch 3 renders `/draft/entry-drafts` as a matching team-grouped accordion, with per-team summary cards, played-status totals plus played percentages, highest-pick highlights, and season-by-season pick lists that preserve null legacy player rows
   - Entry-draft pick rows add `🟢` / `🟡` played-status markers to show whether a drafted player reached the drafting team or played elsewhere in the league
   - Expanded draft panels auto-align their sticky header to the top of the viewport when opened, while `ArrowDown` still explicitly enters the panel body; once inside, `ArrowUp` / `ArrowDown` / `Home` / `End` / `PageUp` / `PageDown` browse within it and `Escape` collapses the panel while returning focus to the team header
   - `/draft/statistics` reuses the shared card-table UI to rank teams across entry-draft summary metrics, including separate played-percentage rankings, with local 10-row paging
   - By default, all three draft views follow the shared selected-team setting: entry/opening draft expand that team automatically and draft statistics emphasizes it plus jumps each card to the matching page
   - Draft routes expose a drawer-only toggle that disables that selected-team emphasis/auto-open behavior without affecting the actual shared team selection

8. **Data Management**
   - Caching service to reduce API calls
   - Filter service for reactive UI filter state
   - Stats service for data transformation
   - Support for optional season breakdown data

## User Flow

1. User opens app at http://localhost:4200
2. App loads default view (player stats, combined season view) for the default team (configured team id, e.g. `"1"`)
3. User can:
   - Change team from the shared settings drawer team selector (selection is persisted)
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
- **SeoService**: Route-aware title/canonical/social metadata updates in the browser

### Routing
- Route families are split by interaction model:
   - Dashboard routes:
     - `/` - Default player statistics view
     - `/player-stats` - Player statistics view
     - `/goalie-stats` - Goalie statistics view
     - `/player/:teamSlug/:playerSlug[/:season]` - Direct player card route over the dashboard background
     - `/goalie/:teamSlug/:goalieSlug[/:season]` - Direct goalie card route over the dashboard background
   - Browse routes:
     - `/career/players` - Player career listing
     - `/career/goalies` - Goalie career listing
     - `/career/highlights` - Compact career highlight cards
     - `/draft/entry-drafts` - Entry draft browse view
     - `/draft/opening-draft` - Opening draft browse view
     - `/draft/statistics` - Draft statistics card grid
     - `/leaderboards/regular` - Regular season all-time ranking table
     - `/leaderboards/playoffs` - Playoffs all-time ranking table
     - `/leaderboards/transactions` - Transaction leaderboard with roster counts, trades, claims, and drops

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
