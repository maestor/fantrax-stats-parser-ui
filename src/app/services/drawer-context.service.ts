import { computed, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { StatsContext } from '@shared/types/context.types';

export type ControlsContext = StatsContext;

type DrawerContextState = {
  playerMaxGames: number;
  goalieMaxGames: number;
};

@Injectable({ providedIn: 'root' })
export class DrawerContextService {
  private readonly state = signal<DrawerContextState>({
    playerMaxGames: 0,
    goalieMaxGames: 0,
  });

  readonly stateSignal = this.state.asReadonly();
  readonly state$ = toObservable(this.stateSignal);
  readonly playerMaxGamesSignal = computed(() => this.stateSignal().playerMaxGames);
  readonly goalieMaxGamesSignal = computed(() => this.stateSignal().goalieMaxGames);
  readonly playerMaxGames$ = toObservable(this.playerMaxGamesSignal);
  readonly goalieMaxGames$ = toObservable(this.goalieMaxGamesSignal);

  setMaxGames(context: ControlsContext, maxGames: number): void {
    const normalized = Number.isFinite(maxGames)
      ? Math.max(0, Math.floor(maxGames))
      : 0;

    const current = this.stateSignal();

    if (context === 'player') {
      if (current.playerMaxGames === normalized) return;
      this.state.set({ ...current, playerMaxGames: normalized });
      return;
    }

    if (current.goalieMaxGames === normalized) return;
    this.state.set({ ...current, goalieMaxGames: normalized });
  }
}
