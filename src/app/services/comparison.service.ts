import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, skip } from 'rxjs';
import { Player, Goalie } from './api.service';
import { FilterService } from './filter.service';
import { TeamService } from './team.service';
import { SettingsService } from './settings.service';

export type OrderedComparison = {
  playerA: Player | Goalie;
  playerB: Player | Goalie;
};

@Injectable({ providedIn: 'root' })
export class ComparisonService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly filterService = inject(FilterService);
  private readonly teamService = inject(TeamService);
  private readonly settingsService = inject(SettingsService);

  private readonly selectedPlayersState = signal<(Player | Goalie)[]>([]);
  readonly selectionSignal = this.selectedPlayersState.asReadonly();

  readonly selection$ = toObservable(this.selectionSignal);
  readonly canSelectMoreSignal = computed(() => this.selectionSignal().length < 2);
  readonly canSelectMore$ = toObservable(this.canSelectMoreSignal);

  readonly orderedSelectionSignal = computed<OrderedComparison | null>(() => {
    const selection = this.selectionSignal();

    if (selection.length < 2) {
      return null;
    }
    const [a, b] = selection;

    return a.score >= b.score
      ? { playerA: a, playerB: b }
      : { playerA: b, playerB: a };
  });

  readonly orderedSelection$ = toObservable(this.orderedSelectionSignal);

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
    const current = this.selectionSignal();
    const key = this.playerKey(player);
    const index = current.findIndex((p) => this.playerKey(p) === key);
    if (index >= 0) {
      this.selectedPlayersState.set(current.filter((_, i) => i !== index));
    } else if (current.length < 2) {
      this.selectedPlayersState.set([...current, player]);
    }
  }

  isSelected(player: Player | Goalie): boolean {
    const key = this.playerKey(player);
    return this.selectionSignal().some((p) => this.playerKey(p) === key);
  }

  clear(): void {
    this.selectedPlayersState.set([]);
  }

  private playerKey(player: Player | Goalie): string {
    const context = 'wins' in player ? 'goalie' : 'player';
    return `${context}:${player.id}`;
  }
}
