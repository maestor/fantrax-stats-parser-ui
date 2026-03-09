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

- Audit the remaining `@Input`-based shared components and convert only the inputs that are truly required/optional instead of preserving defensive flexibility by default.
- Revisit the temporary branch-coverage workaround after Angular fixes signal-input coverage accounting, then raise the branch threshold back up.

## E2E Testing

### Test data management

- Add test data builder utilities

### Advanced testing

- Visual regression testing (Playwright screenshot comparison)
- Performance testing (Core Web Vitals)
