# Component Guide

This guide is intentionally project-specific.

Use the installed `angular-developer` skill and the official Angular docs for generic component syntax, lifecycle details, signal APIs, routing primitives, and framework-wide best practices.

Use this file for the component patterns that are specific to this app: shell boundaries, shared UI responsibilities, and behavior that is easy to regress.

Before editing a component, read the real implementation and nearby specs first. This guide summarizes durable patterns; it does not try to mirror every current input or internal property.

## Shell Structure

### `AppComponent`

- Lightweight root shell rendered on every route
- Owns the skip link, footer visibility, route subtitles, global keyboard shortcuts, help/navigation overlays, and PWA update UX
- Keep dashboard-only UI out of this shell so browse routes stay lighter

### `DashboardShellComponent`

- Used only by `/`, `/player-stats`, `/goalie-stats`, and direct player/goalie routes
- Owns the title row, last-modified metadata, top controls, mobile settings drawer, dashboard tabs, and comparison bar
- Do not move career, draft, or leaderboard-only UI into this shell unless it is truly dashboard-specific

### Browse Route Shells

- Career, draft, and leaderboard routes render under the root shell without dashboard controls, comparison state, or the heavier dashboard startup cost
- Preserve that split when adding new browse routes or shared UI

## Feature Families

### Stats Pages

- `player-stats/` and `goalie-stats/` are route-level containers
- They compose services, filter state, tables, and shared controls
- Keep page-specific data orchestration here rather than inside shared UI components

### Direct Card Routes

- `player-route/` and `goalie-route/` resolve deep links, sync background state, and open the dialog over the dashboard background
- Preserve season/tab syncing when changing direct-link behavior

### Browse Features

- `career/`, `draft/`, and `leaderboards/` are browse-oriented surfaces
- They intentionally avoid dashboard-only controls and comparison behavior

## Shared Component Patterns

### Shared Controls May Inject Services Directly

In this repo, shared controls such as team, season, report, and settings controls are allowed to inject project state/services directly.

- Do not add extra `@Input()` / `@Output()` plumbing only to satisfy a generic "dumb component" rule
- Favor the existing service-backed control pattern when the control is tightly coupled to global or per-page state

### Prefer Real Contracts Over Defensive Optionality

- Use signal inputs and `input.required()` when the parent always provides the value
- Remove impossible contexts instead of preserving optional APIs with fake fallback states
- If a component has only one real usage pattern, simplify it instead of documenting theoretical variants

### Preserve Drawer And Inline Parity

- `TopControlsComponent` and `SettingsPanelComponent` support a `contentOnly` mode for the mobile settings drawer
- When editing either component, keep desktop inline behavior and drawer behavior aligned

### Keep The Table Components Separate

- `StatsTableComponent` is the interactive dashboard/leaderboard table
- `VirtualTableComponent` is the read-only virtualized career table
- `TableCardComponent` is the compact paged card/table presentation for highlight and draft statistics views

Do not collapse these into a single "universal" table component unless the product behavior truly becomes the same.

## High-Value Components To Understand

### `StatsTableComponent`

- Shared interactive table for player/goalie stats and leaderboard tables
- Carries keyboard navigation, search, sorting, optional comparison selection, optional expandable rows, and player-card opening
- Changes here usually need behavior tests and accessibility review

### `VirtualTableComponent`

- Career-only virtualized table
- Preserve row-focus keyboard behavior, sort behavior, and virtualization assumptions

### `TableCardComponent`

- Shared compact read-only card/table used by highlight and draft statistics views
- Keep loading, empty, error, tooltip, tied-rank prefix, and paging behavior consistent across consumers
- Preserve its semantic table labeling, optional row emphasis hooks, and accessible emoji-header help when extending browse-oriented ranking views

### `SectionJumpNavComponent`

- Shared sticky pill navigation used by browse-route section jump bars
- Keep overflow-fade hints, screen-reader scroll guidance, and item-click behavior consistent across consumers
- Prefer feeding it route-specific section metadata plus a click handler instead of re-implementing horizontal-scroll cue logic in each page

### `StartFromSeasonSwitcherComponent` And `StartFromSeasonSyncService`

- The switcher UI is thin
- Cross-team defaults, season normalization, and persistence live in the sync service
- If behavior changes, update the UI, service logic, tests, and docs together

### `PlayerCardComponent`

- Complex dialog with tab switching, graphs, deep-link tab selection, navigation context, keyboard/swipe/trackpad navigation, and row-sync back to the table
- Protect focus return, reduced-motion behavior, and accessibility announcements when editing it

### `TopControlsComponent` And `SettingsPanelComponent`

- Shared between desktop inline rendering and the mobile drawer
- Preserve context-specific behavior (`player` vs `goalie`) and drawer/inline parity

## Project-Specific Constraints

### Accessibility Is Part Of Component Design

- Skip links, roving row focus, collapsible content, dialog focus return, and keyboard shortcuts are product requirements, not optional polish
- See `docs/accessibility.md` when touching navigation, dialogs, tables, or collapsible UI

### Dark Mode Is Part Of Component Completion

- Any UI/styling change must be checked in both light mode and dark mode before review
- Shared components are reused broadly, so even small visual changes can have wide impact

### Test The Real User Path

- Behavior tests should usually cover component work through rendered user flows
- Keep project testing preferences from `docs/project-testing.md` above generic Angular testing examples

## When To Update This Guide

Update this file when:

- shell boundaries change
- a shared component takes on a new durable responsibility
- a project-specific component pattern becomes important enough to standardize

Do not use this file as a full Angular component manual. For exact current APIs, read the component code.
