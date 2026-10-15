# Components

Read implementations and nearby specs for exact APIs. [Architecture](architecture.md) owns shell/route boundaries; [coding standards](coding-standards.md) owns Angular conventions.

## Shared contracts

- Stats containers own data orchestration. Shared team/season/report/settings controls may inject project state directly; do not add input/output plumbing solely to enforce a generic presentational-component pattern.
- Browse tab shells use `RouterLinkActive`; query parameters/fragments do not change selected tabs. Career player/goalie containers expose loading/data/error through signals while retaining API cache and navigation-cycle-aware footer readiness.
- The third player/goalie stats tab at `/category-stats` loads one regular-season category response for all teams, reads the shared selected team, and keeps season and comparison team local to the page. It displays totals only and must not initialize player/goalie table requests or use their global season/report filters. It uses centered Material selectors and `StatsTableComponent` for the shared expandable contributor rows.
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
| `VirtualTableComponent` | Career virtualization, row focus/search/sort, optional native career links and return-state capture/restore; displayed position must not change plain-name sorting |
| `TableCardComponent` | Compact highlight/draft statistics tables: loading/empty/error, tooltips, tied-rank prefixes, paging, row emphasis, labeled tables/pagers, accessible emoji-header help |
| `SectionJumpNavComponent` | Sticky browse pills with overflow fades and screen-reader scroll instructions; consumers supply section metadata and click behavior |
| `PlayerCardComponent` | Combined/season/graphs tabs, dynamic width, deep links, circular player navigation, table-row synchronization, focus return and reduced motion |

Keep the three table components distinct while their interaction models differ. Each highlight card loads its complete list once near the viewport using `take=all`, reuses the API cache, and calculates tied ranks once. Its ten-row pages use the loaded rows without further requests; untouched cards stay deferred. Draft team accordions scroll inside a bounded route region, align opened headers, and support keyboard entry/exit; see [accessibility](accessibility.md).

Player-card chart data uses computed signals. Metric selections persist across players of the same type and chart-mode switches. Theme reads/canvas resize and section-jump overflow measurement run after rendering.

Shared component changes can affect multiple routes. Use [testing](testing.md), [accessibility](accessibility.md), and [styling](styling.md) for relevant validation rather than duplicating their rules here.

Player-card popups expose a native FFHL-ura history-icon link for the currently displayed identity. Opening a career page closes the popup with an explicit career-navigation result; direct-card hosts skip their usual close-to-statistics redirect for that result.

## Career profiles

Known Fantrax identities without statistical rows have a restricted profile: canonical name, position and copy link in the hero, followed by Siirrot. They have no statistical summary, statistical tables, or section navigation. Career lists include them with zero statistical counters and dashes for unavailable statistical seasons; identities with zero-game statistical rows retain full profiles.

`CareerDetailComponent` owns identity-scoped profile loading, page focus, a copy-link icon with temporary tooltip/live-region feedback, and section navigation. `CareerStatisticsComponent` owns a local regular/playoff/combined scope and season/team tables; changing scope leaves lifetime metadata and history untouched. Goalie rates appear only on source season/team rows, never as averages of row rates.

`CareerHistoryComponent` loads independently of statistics and groups linked draft/transaction events by recorded season. Undated expansion selections show source team → expansion team at the bottom of their season. Trade details show received packages by team immediately on desktop; mobile uses a lazy disclosure. Failures have independent retries. The section disclaimer covers timestamp-based reconstruction; undated drafts and unlinked assets remain explicit. Profile links are offered for stats-backed careers and known Fantrax identities with a player/goalie position. The sibling API's [importing guide](../../node-fantrax-stats-parser/docs/importing.md#career-history-consumers) owns source interpretation.

Within each received trade package, draft picks sort by round, then earlier draft year, then original team name alphabetically. Sorting spans all source blocks in that package and preserves the positions of players and other assets. Picks with an unresolved original team use the team name in their source label for the alphabetical tie-break; labels remain as supplied by the API.

`CareerListStateService` retains transient search, sort, scroll offset, and originating identity when opening a profile, separately for player and goalie lists. Returning restores row focus, including repeated browser Back/Forward navigation; direct profile visits have a normal list-link fallback. This state does not change persisted dashboard settings.

Career pages opened from statistics carry a `from=player-stats` or `from=goalie-stats` return context, preserved through trade-profile links. The back link also accepts career highlights, category stats, and entry/opening/expansion draft origins; other entries return to the corresponding career list. Copied career URLs omit return context.
