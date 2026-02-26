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

## Notes

- Batch 1 and Batch 4 are closely related and could be combined into a single "consolidate data-loading patterns" effort.
- Batch 3 (type safety) can be done incrementally, file by file, without touching logic.
