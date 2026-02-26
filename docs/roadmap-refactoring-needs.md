# Refactoring Needs

Identified refactoring opportunities grouped into logical batches. Each batch is self-contained and can be tackled independently. Ordered roughly by impact.

---

## Batch 1: Consolidate Player/Goalie Stats Components (~4-6h)

**Problem:** `PlayerStatsComponent` and `GoalieStatsComponent` are ~95% identical — same RxJS pipeline, same filter handling, same loading/error state, same `toApiTeamId()` helper. About 400 lines of near-duplicate code.

**Affected files:**
- `src/app/player-stats/player-stats.component.ts`
- `src/app/goalie-stats/goalie-stats.component.ts`

**Proposed fix:** Extract an abstract base component or shared mixin with the common data-fetching pipeline and let each component only define its type-specific parts (columns, API call, data transform).

---

## Batch 2: Centralize Scattered Utilities (~2-3h)

**Problem:** Small helper functions are copy-pasted across components instead of living in one place.

- `toApiTeamId()` — duplicated in at least 5 files (player-stats, goalie-stats, season-switcher, start-from-season-switcher, player-card)
- `toSeasonNumber()` — duplicated in season-switcher and start-from-season-switcher
- `derivePositions()` — lives in `leaderboards/position-utils.ts` but could belong in a shared utils location
- `toSlug()` — already isolated in `src/app/utils/slug.utils.ts` but the pattern is not followed for other utils

**Affected files:**
- `src/app/shared/top-controls/season-switcher/season-switcher.component.ts`
- `src/app/shared/top-controls/start-from-season-switcher/start-from-season-switcher.component.ts`
- `src/app/player-stats/player-stats.component.ts`
- `src/app/goalie-stats/goalie-stats.component.ts`
- `src/app/shared/player-card/player-card.component.ts`
- `src/app/leaderboards/position-utils.ts`

**Proposed fix:** Create `src/app/shared/utils/` with `season.utils.ts`, `api.utils.ts`, and move/consolidate existing utils there.

---

## Batch 3: Reduce `any` Usage — Improve Type Safety (~3-4h)

**Problem:** Many places use `any` for callback parameters and data, which undermines the value of TypeScript. The most impactful instances:

- `stats-table.component.ts`: `@Input() data: any = []`, callback types `(row: any) => ...`
- `player-stats.component.ts` / `goalie-stats.component.ts`: row callbacks typed as `(row: any)`
- `player-card.component.ts`: `(row as any)?.name` cast
- `comparison-stats.component.ts` / `comparison-dialog.component.ts`: property access via `Record<string, unknown>` cast

**Affected files:**
- `src/app/shared/stats-table/stats-table.component.ts`
- `src/app/player-stats/player-stats.component.ts`
- `src/app/goalie-stats/goalie-stats.component.ts`
- `src/app/shared/player-card/player-card.component.ts`
- `src/app/shared/comparison-dialog/comparison-stats/comparison-stats.component.ts`

**Proposed fix:** Introduce generics on `StatsTableComponent<T extends Player | Goalie>` and properly type all row callbacks. Centralize shared types under `src/app/shared/types/`.

---

## Batch 4: Leaderboard Components Deduplication (~2-3h)

**Problem:** `LeaderboardRegularComponent` and `LeaderboardPlayoffsComponent` are near-identical — same data-fetching pattern (`OnInit` + `takeUntil` + subscribe), same loading/error state, same position derivation logic. They differ only in API call and column definitions.

**Affected files:**
- `src/app/leaderboards/regular/leaderboard-regular.component.ts`
- `src/app/leaderboards/playoffs/leaderboard-playoffs.component.ts`

**Proposed fix:** Merge into a single configurable `LeaderboardComponent` with `@Input()` for data source and columns, instantiated twice with different configs from the parent.

---

## Batch 5: Break Up PlayerCardComponent (~4-6h)

**Problem:** `player-card.component.ts` is 827 lines doing too many unrelated things:

- Swipe / wheel / keyboard navigation logic (~100 lines)
- Tab management and lazy loading (~50 lines)
- Stats building and display ordering (~100 lines)
- Season data setup and career bests calculation (~100 lines)
- Slide animation timing (~50 lines)
- Responsive screen size logic (~30 lines)

**Affected files:**
- `src/app/shared/player-card/player-card.component.ts`
- `src/app/shared/player-card/player-card-graphs/player-card-graphs.component.ts`

**Proposed fix:** Extract navigation and gesture handling into a dedicated service (`PlayerCardNavigationService`), stats building into `PlayerCardStatsService`, and season data setup into `PlayerCardSeasonsService`. Main component becomes a thin orchestrator.

---

## Batch 6: Simplify ReportSwitcher Bidirectional Sync (~1-2h)

**Problem:** `ReportSwitcherComponent` uses a `FormControl` kept manually in sync with the filter service — a fragile bidirectional loop:

```typescript
this.reportType$.subscribe(v => this.reportTypeControl.setValue(...))
this.reportTypeControl.valueChanges.subscribe(v => filterService.update(...))
```

**Affected files:**
- `src/app/shared/top-controls/report-switcher/report-switcher.component.ts`

**Proposed fix:** Remove the `FormControl` and bind directly: reactive observable for display, `(change)` event for updates. Eliminates the sync loop entirely.

---

## Batch 7: Centralize Shared Types (~1-2h)

**Problem:** The string union `'player' | 'goalie'` (used as `@Input() context`) appears in 10+ files with no single source of truth. Other repeated inline types (filter shapes, column definitions) are also scattered.

**Affected files:** Multiple components and services throughout.

**Proposed fix:** Create `src/app/shared/types/` directory with:
- `context.types.ts` — `export type StatsContext = 'player' | 'goalie'`
- `filter.types.ts` — shared filter state interfaces
- `stats.types.ts` — shared stats interfaces not already in API types

---

## Batch 8: Reduce Template Complexity in StatsTable (~1-2h)

**Problem:** `stats-table.component.html` has conditional rendering logic directly in the template that would be clearer as component methods:

- Header icon selection (material vs emoji vs none) — repeated across header cells
- Position cell rendering — 3 levels of nested `@if/@else`
- Complex `[class.*]` bindings with inline boolean expressions

**Affected files:**
- `src/app/shared/stats-table/stats-table.component.html`
- `src/app/shared/stats-table/stats-table.component.ts`

**Proposed fix:** Add helper methods (`getHeaderIconType()`, `getPositionDisplay()`, `getCellClass()`) to the component and call them from the template.

---

## Notes

- Batch 1 and Batch 4 are closely related and could be combined into a single "consolidate data-loading patterns" effort.
- Batch 2 is a good low-risk warm-up — pure moves with no behavioral change.
- Batch 3 (type safety) can be done incrementally, file by file, without touching logic.
- Batches 6, 7, 8 are small and self-contained — good candidates for quick wins.
