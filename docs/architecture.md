# Architecture

## Routes and shells

[app.routes.ts](../src/app/app.routes.ts) owns exact routes, redirects, and SEO metadata.

| Surface | Responsibility |
| --- | --- |
| `AppComponent` | Shared header/settings drawer, skip link, subtitle, footer readiness, global shortcuts, lazy help/navigation overlays, PWA update UX |
| `DashboardShellComponent` | Lazy stats-only tabs and comparison bar for `/`, `/player-stats`, `/goalie-stats`, and direct player/goalie links |
| Browse routes | `/career/*`, `/draft/*`, `/leaderboards/*` render under the root shell with the base drawer and without dashboard startup work |
| Direct cards | `/player/:teamSlug/:playerSlug[/:season]` and goalie equivalent synchronize background stats and dialog state |

Career includes virtualized player/goalie lists and paged highlights. Draft includes entry/opening history and statistics. Leaderboards include regular season, playoffs, transactions, and finals. Preserve the lighter browse-route boundary when adding features.

## Where code belongs

| Path | Owns |
| --- | --- |
| `src/app/base/` | Navigation and footer primitives |
| `src/app/{player-stats,goalie-stats}/` | Stats-page data orchestration |
| `src/app/{career,draft,leaderboards}/` | Browse features |
| `src/app/{player-route,goalie-route}/` | Direct-card route resolution |
| `src/app/services/` | Shared state, HTTP/cache, platform, SEO, persistence |
| `src/app/shared/` | Reusable UI, utilities, component Sass mixins |
| `src/styles/`, `src/theme.scss` | Global style partials and theme tokens |
| `api/proxy.js` | Production Vercel API proxy |
| `public/` | Finnish translations, PWA assets, robots and sitemap |
| `e2e/` | Playwright specs, page objects, fixtures and capture tooling |
| `scripts/` | Performance/style audits and maintenance tools |

Specs live near app source. Consult [components](components.md) and [services](services.md) for responsibilities; read implementations for exact APIs. Runtime configuration is in `src/environments/`, Angular build/test configuration in `angular.json`.

Data flows from the backend through `ApiService`/`CacheService` into feature containers. Team/filter/settings signals drive synchronous UI reads; RxJS handles asynchronous composition and compatibility streams. `StatsService` transforms fetched totals into per-game values.
