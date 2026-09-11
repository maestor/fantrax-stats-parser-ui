# Components

Read implementations and nearby specs for exact APIs. [Architecture](architecture.md) owns shell/route boundaries; [coding standards](coding-standards.md) owns Angular conventions.

## Shared contracts

- Stats containers own data orchestration. Shared team/season/report/settings controls may inject project state directly; do not add input/output plumbing solely to enforce a generic presentational-component pattern.
- Browse tab shells use `RouterLinkActive`; query parameters/fragments do not change selected tabs. Career player/goalie containers expose loading/data/error through signals while retaining API cache and navigation-cycle-aware footer readiness.
- Direct player/goalie routes preserve background team/season state and dialog tab selection.
- Required parent values use required inputs; remove optional APIs/fallback states without real consumers.

## Settings drawer

[settings-drawer.component.html](../src/app/shared/settings-drawer/settings-drawer.component.html) is the shared extension point on every route:

| Block | Responsibility |
| --- | --- |
| Base | Team switcher and last-updated metadata |
| Draft/leaderboard extension | Selected-team-highlight toggle, after the team selector |
| Stats ranges | `TopControlsComponent`: start-from, season, report |
| Stats filters | `SettingsPanelComponent`: per-page per-game/minimum-games/player position |

Add logical groups as sibling `.settings-drawer-section` wrappers. Use the shared padding/borders before adding a scoped modifier; do not recreate dividers in children. Preserve player/goalie context and grouping order. Global slide-toggle spacing is owned by global styles; avoid per-control label-padding hacks.

Drawer content initializes on first open. `StartFromSeasonSwitcherComponent` stays thin; its sync service resolves seasons only in stats mode, deferring browse-route team changes until the next stats visit.

## Reusable UI

| Component | Behavior to preserve |
| --- | --- |
| `StatsTableComponent` | Interactive dashboard/leaderboard search, sort, roving focus, optional comparison/expanded rows/card opening |
| `VirtualTableComponent` | Read-only career virtualization, row focus and sort; displayed position must not change plain-name sorting |
| `TableCardComponent` | Compact highlight/draft statistics tables: loading/empty/error, tooltips, tied-rank prefixes, paging, row emphasis, labeled tables/pagers, accessible emoji-header help |
| `SectionJumpNavComponent` | Sticky browse pills with overflow fades and screen-reader scroll instructions; consumers supply section metadata and click behavior |
| `PlayerCardComponent` | Combined/season/graphs tabs, dynamic width, deep links, circular player navigation, table-row synchronization, focus return and reduced motion |

Keep the three table components distinct while their interaction models differ. Highlights lazy-load API pages near the viewport. Draft team accordions scroll inside a bounded route region, align opened headers, and support keyboard entry/exit; see [accessibility](accessibility.md).

Player-card chart data uses computed signals. Metric selections persist across players of the same type and chart-mode switches. Theme reads/canvas resize and section-jump overflow measurement run after rendering.

Shared component changes can affect multiple routes. Use [testing](testing.md), [accessibility](accessibility.md), and [styling](styling.md) for relevant validation rather than duplicating their rules here.
