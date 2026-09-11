# Services

Source: [src/app/services](../src/app/services). Read actual signatures and adjacent specs rather than copying API examples from docs. Components use signal-facing state reads; observables serve asynchronous composition/interop.

| Service | Responsibility and constraints |
| --- | --- |
| `ApiService` | Typed HTTP, cache keys, in-flight deduplication, and error propagation; skips live HTTP during prerendering |
| `CacheService` | In-memory Map, expiration only; default TTL 300,000 ms, no size/LRU eviction; callers own keys |
| `StatsService` | Converts fetched counting totals to per-game values (two decimals), preserves fixed fields, uses `scoreAdjustedByGames` as per-game score |
| `SettingsService` | Field-validated preferences in `localStorage` key `fantrax.settings`; ignores storage failures |
| `TeamService` | Selected-team state shared across routes and persisted through settings |
| `FilterService` | Independent player/goalie filters; globally synchronized season/report type |
| `StartFromSeasonSyncService` | Team-specific oldest-season default, normalization and persistence; season lookups only while stats mode is active |
| `ComparisonService` | Up to two selections; clears on team, season, report type, or start-from-season changes |
| `DrawerContextService` | Route-specific drawer mode |
| `FooterVisibilityService` | Navigation-cycle-aware readiness for deferred footer |
| `SeoService` / `ServerTranslateLoader` | Browser metadata and bundled prerender translations; see [development](development.md#seo-and-prerendering) |
| `PwaUpdateService` / `ViewportService` | Service-worker update and viewport/platform boundaries |

## Persistence and filters

- `season` defaults to all seasons (`null` in settings); `reportType` defaults to `regular`. Both persist and are shared across player/goalie contexts.
- `statsPerGame`, `minGames`, and player `positionFilter` are per-context and not persisted.
- Team changes clear start-from-season immediately. Stats mode resolves the selected team's oldest available season; browse-route changes defer that request until the next stats visit.
- `disableSelectedTeamHighlight` defaults to false. Enabling it suppresses draft auto-open/emphasis and leaderboard auto-focus while preserving the actual selected team.
- Position defaults to `all`; `F`/`D` filters use position-relative score columns and radar `scoresByPosition`. Resetting player filters restores `all`.

Feature containers combine API data and state; keep fetching out of `StatsService`. Shared controls may inject state directly. See [testing](testing.md) for real-state UI tests and HTTP/cache/platform test boundaries.
