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

## Batch 2: Break Up PlayerCardComponent (~4-6h)

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
