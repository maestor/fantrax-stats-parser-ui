# Roadmap

Planned improvements and future development ideas, roughly ordered by priority.

## Application features

### High priority

#### Favorites / Watchlist (~4-6h)

Star/bookmark players, persisted in localStorage. Add a "Suosikit" filter toggle to quickly view only watched players. No API changes needed.

### Low priority

#### Extend Player Card Navigation (~3-4h)

Additional navigation methods for player card: mouse drag/swipe gestures and optional visible navigation buttons (← →) for mouse-only users. Configurable via settings. Lower priority since keyboard and touch/trackpad already provide full navigation capability.

#### URL-Persisted Filter State (~4-6h)

Encode stats table filter state (team, season, report type, per-game mode, etc.) in URL query parameters so users can share and bookmark specific views. Lower priority since player card deep linking already exists.

#### Manual Dark/Light Mode Toggle (~2-3h)

Override the current auto-only system-preference-based theme. Persist choice in localStorage.

#### Remember Sort Column (~1-2h)

Persist the user's last sort column and direction per table (players/goalies) in localStorage across sessions.

## Modernizing components

### Remaining modernization work

- Revisit the temporary branch-coverage workaround after Angular fixes signal-input coverage accounting, then raise the branch threshold back up.

## E2E Testing

### Test data management

- Add test data builder utilities

### Advanced testing

- Visual regression testing (Playwright screenshot comparison)
- Performance testing (Core Web Vitals)
  Local `npm run perf:audit` now covers the production build with fixture-backed API mocks for the front page and career players entry route.
  The first optimization pass is now in place: overlay-only UI is lazy-loaded, footer rendering waits for route readiness, and route shells no longer flash stats-only controls on `/career` or `/leaderboards`.
  Current local baseline as of `2026-03-09`: desktop `/` `CLS 0.040`, desktop `/career/players` `CLS 0.010`, mobile audited routes `CLS 0.000`.
  Next steps are adding stable leaderboard coverage, comparing lab results against PageSpeed Insights / CrUX field data, and deciding whether the remaining front-page top-controls shift is worth further polish.
