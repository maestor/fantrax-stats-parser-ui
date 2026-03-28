# Codebase Structure

This guide documents the durable structure of the repo.

Generated and transient directories such as `.angular/`, `dist/`, `node_modules/`, and local editor/system files are intentionally omitted.

## Top-Level Layout

```text
fantrax-stats-parser-ui/
├── api/                # Vercel proxy/serverless API entrypoints
├── docs/               # Project-specific documentation
├── e2e/                # Playwright tests, helpers, fixtures, capture scripts
├── public/             # Static assets, i18n, manifest, robots.txt, sitemap.xml
├── scripts/            # Local helper scripts such as perf tooling
├── src/                # Application source
├── AGENTS.md           # Repo workflow and agent rules
├── CLAUDE.md           # Claude-facing mirror of repo workflow rules
├── README.md           # Project overview and contributor entrypoint
├── angular.json        # Angular workspace configuration
├── package.json        # Scripts and dependencies
├── playwright.config.ts
└── tsconfig*.json
```

## `src/app` Layout

```text
src/app/
├── base/               # Root-level layout primitives (navigation, footer)
├── career/             # Career browse routes
├── dashboard-shell/    # Lazy shell for interactive dashboard routes
├── draft/              # Draft browse routes
├── goalie-route/       # Direct goalie-card deep-link handling
├── goalie-stats/       # Goalie stats route container
├── leaderboards/       # Leaderboard browse routes
├── player-route/       # Direct player-card deep-link handling
├── player-stats/       # Player stats route container
├── services/           # Shared state, API, SEO, platform, and persistence services
├── shared/             # Shared UI building blocks and shared utilities/styles
├── utils/              # App-level utility helpers
├── app.component.ts
├── app.config*.ts
└── app.routes*.ts
```

## Route Families And Shells

### Dashboard Routes

- `/`
- `/player-stats`
- `/goalie-stats`
- direct `/player/...` and `/goalie/...` routes

These routes use `DashboardShellComponent` and carry the heavier interactive shell: title row, metadata, controls, mobile drawer, tabs, and comparison bar.

### Browse Routes

- `/career/*`
- `/draft/*`
- `/leaderboards/*`

These routes render under the lighter root shell and intentionally avoid dashboard-only UI.

## Shared UI Building Blocks

### `src/app/shared/top-controls/`

- team, start-from-season, season, and report controls
- used in the dashboard shell and reused in drawer mode through `contentOnly`

### `src/app/shared/settings-panel/`

- stats mode, min games, and player-only position filtering
- reused inline and in the mobile settings drawer

### `src/app/shared/stats-table/`

- `StatsTableComponent` for interactive dashboard/leaderboard tables
- `VirtualTableComponent` for read-only virtualized career lists

### `src/app/shared/table-card/`

- compact paged card/table presentation for highlight and draft statistics views

### `src/app/shared/player-card/`

- player/goalie dialog, tabbed details, graphs, deep-link support, and in-dialog navigation

## Service Layer

The service layer is broader than just API and filters. Important services include:

- `api.service.ts`
- `cache.service.ts`
- `comparison.service.ts`
- `drawer-context.service.ts`
- `filter.service.ts`
- `footer-visibility.service.ts`
- `pwa-update.service.ts`
- `seo.service.ts`
- `server-translate.loader.ts`
- `settings.service.ts`
- `stats.service.ts`
- `team.service.ts`
- `viewport.service.ts`

For service responsibilities and behavior notes, see `docs/service-guide.md`.

## Tests And Tooling

- App behavior and service specs mostly live next to source under `src/app/**`
- End-to-end coverage lives under `e2e/`
- `e2e/page-objects/`, `e2e/helpers/`, `e2e/fixtures/`, and `e2e/scripts/` support the Playwright workflow

## Reading Order For Contributors And Agents

When orienting yourself in the repo, this order is usually fastest:

1. `README.md`
2. `docs/README.md`
3. `src/app/app.routes.ts`
4. `src/app/app.component.ts`
5. `src/app/dashboard-shell/`
6. The relevant feature route/container
7. `docs/project-testing.md` and `docs/accessibility.md` before changing behavior or UI

## Maintenance Rule

Update this file when the durable structure changes.

Do not expand it into a file-by-file inventory or a list of generated folders that contributors do not need for orientation.
