# Roadmap

Planned improvements and future development ideas, roughly ordered by priority.

## Application features

### High priority

#### Startup Performance and Rendering Strategy (conditional follow-up only)

Improve startup performance without defaulting to SSR where it is not worth the complexity.

- The dashboard-shell split, the first startup deferrals, and the main-thread cleanup batch are already in place; keep the roadmap focused on whether any data-path cleanup is still necessary rather than repeating completed implementation detail here.
- Recent build verification reduced the initial estimated transfer budget again and split the footer into its own lazy chunk; preserve those startup wins while validating real-user impact.
- Treat data-path cleanup as optional follow-up only if later perf checks still show meaningful startup headroom on the homepage.
- Track implementation detail in the active local `docs/plans/` plan; keep the roadmap high level and remove finished execution detail from here.

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
