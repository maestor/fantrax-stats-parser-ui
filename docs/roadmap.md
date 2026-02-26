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

## Refactoring

See [roadmap-refactoring-needs.md](roadmap-refactoring-needs.md) for a detailed breakdown of identified refactoring batches.

Quick summary of areas identified:

1. **Player/Goalie stats components** — ~95% duplicate, extract shared base (~4-6h)
2. **Scattered utility functions** — `toApiTeamId`, `toSeasonNumber` etc. copied in 5+ places (~2-3h)
3. **Type safety** — widespread `any` usage, especially in stats-table callbacks (~3-4h)
4. **Leaderboard components** — regular/playoffs are near-identical, could be one component (~2-3h)
5. **PlayerCardComponent** — 827 lines, multiple unrelated concerns, should be split (~4-6h)
6. **ReportSwitcher bidirectional sync** — fragile FormControl loop, can be simplified (~1-2h)
7. **Shared types** — `'player' | 'goalie'` union and other inline types duplicated across 10+ files (~1-2h)
8. **StatsTable template complexity** — nested conditionals belong in component methods (~1-2h)

## E2E Testing

### Test data management

- Add test data builder utilities

### Advanced testing

- Visual regression testing (Playwright screenshot comparison)
- Performance testing (Core Web Vitals)
