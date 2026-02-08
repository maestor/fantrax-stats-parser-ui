import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, map, skip } from 'rxjs/operators';
import { Player, Goalie } from './api.service';
import { TeamService } from './team.service';
import { FilterService } from './filter.service';
import { SettingsService } from './settings.service';
import { StatsService } from './stats.service';

export type OrderedComparison = {
  playerA: Player | Goalie;
  playerB: Player | Goalie;
};

@Injectable({ providedIn: 'root' })
export class ComparisonService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly teamService = inject(TeamService);
  private readonly filterService = inject(FilterService);
  private readonly settingsService = inject(SettingsService);
  private readonly statsService = inject(StatsService);

  private selectedPlayers = new BehaviorSubject<(Player | Goalie)[]>([]);

  readonly selection$ = this.selectedPlayers.asObservable();

  readonly canSelectMore$ = this.selection$.pipe(
    map((selection) => selection.length < 2),
  );

  readonly orderedSelection$ = combineLatest([
    this.selection$,
    this.filterService.playerFilters$,
    this.filterService.goalieFilters$,
  ]).pipe(
    map(([selection, playerFilters, goalieFilters]): OrderedComparison | null => {
      if (selection.length < 2) {
        return null;
      }
      let [a, b] = selection;

      // Check if we should use per-game stats
      const isGoalie = (p: Player | Goalie): p is Goalie => 'wins' in p;
      const aIsGoalie = isGoalie(a);
      const bIsGoalie = isGoalie(b);
      const statsPerGame = aIsGoalie ? goalieFilters.statsPerGame : playerFilters.statsPerGame;

      if (statsPerGame) {
        // Transform to per-game stats
        a = aIsGoalie
          ? this.statsService.getGoalieStatsPerGame([a as Goalie])[0]
          : this.statsService.getPlayerStatsPerGame([a as Player])[0];
        b = bIsGoalie
          ? this.statsService.getGoalieStatsPerGame([b as Goalie])[0]
          : this.statsService.getPlayerStatsPerGame([b as Player])[0];
      }

      return a.score >= b.score
        ? { playerA: a, playerB: b }
        : { playerA: b, playerB: a };
    }),
  );

  constructor() {
    // Clear on team change
    this.teamService.selectedTeamId$
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.clear());

    // Clear on report type or season change (player filters)
    this.filterService.playerFilters$
      .pipe(
        map((f) => `${f.reportType}-${f.season ?? ''}`),
        distinctUntilChanged(),
        skip(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.clear());

    // Clear on report type or season change (goalie filters)
    this.filterService.goalieFilters$
      .pipe(
        map((f) => `${f.reportType}-${f.season ?? ''}`),
        distinctUntilChanged(),
        skip(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.clear());

    // Clear on start-from-season change
    this.settingsService.startFromSeason$
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.clear());
  }

  toggle(player: Player | Goalie): void {
    const current = this.selectedPlayers.value;
    const index = current.findIndex((p) => p.name === player.name);
    if (index >= 0) {
      this.selectedPlayers.next(current.filter((_, i) => i !== index));
    } else if (current.length < 2) {
      this.selectedPlayers.next([...current, player]);
    }
  }

  isSelected(player: Player | Goalie): boolean {
    return this.selectedPlayers.value.some((p) => p.name === player.name);
  }

  clear(): void {
    this.selectedPlayers.next([]);
  }
}
