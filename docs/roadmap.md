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

## E2E Testing

### Test data management

- Add test data builder utilities

### Advanced testing

- Visual regression testing (Playwright screenshot comparison)

## Codebase health and refactoring

These topics came from the 2026-04 codebase audit. They are intentionally scoped so a future session can pick one priority band, read the linked local plan, and implement it without needing the original audit conversation.

Detailed implementation notes live in local working memory at `docs/plans/2026-04-29-codebase-health-refactor-plan.md`.

### High priority

#### Harden the Vercel API proxy (~4-8h)

The production proxy is intentionally server-side, but its forwarding surface is broader than the current UI appears to need: it accepts common mutation methods, forwards arbitrary paths, and passes through client `Authorization` while also injecting the server-side API key.

Expected direction:
- Restrict allowed methods and paths to the public read endpoints used by this UI.
- Stop forwarding client authorization unless a documented use case requires it.
- Keep CORS and rate-limit behavior covered with focused proxy tests or script-level checks.

### Medium priority

#### Decompose `StatsTableComponent` (~1-3 days)

`StatsTableComponent` owns too many responsibilities: table rendering, filtering, sorting, loading progress, expansion, keyboard navigation, player-card lazy opening, prefetching, and focus restoration. It is well covered but high blast radius.

Expected direction:
- Extract behavior by responsibility rather than by line count.
- Keep existing accessibility behavior protected before moving code.
- Prefer helpers/directives/services that match the current table split instead of building a universal table abstraction.

#### Move chart colors to shared theme tokens (~2-4h)

Player-card graph code still hard-codes chart colors. Future chart work should use shared app/theme chart tokens so light and dark mode stay consistent.

Expected direction:
- Define a small shared chart palette through theme/app tokens.
- Read those tokens where Chart.js datasets are built.
- Validate player-card graphs in light and dark mode.

### Low priority

#### Track dev/build dependency advisories (~1-2h)

`npm audit` reports a moderate PostCSS advisory through the Angular build toolchain. It is not a runtime app dependency, but it should be cleared when Angular/Vite/PostCSS updates make that safe.

#### Make local perf tooling fully explicit (~1-2h)

`npm run perf:audit` uses `npx tsx`, which may download `tsx` in a fresh environment. Add `tsx` as a dev dependency or replace the command with already-installed tooling so performance audits are reproducible offline after install.
