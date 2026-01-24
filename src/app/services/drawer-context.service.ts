import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export type ControlsContext = 'player' | 'goalie';

type DrawerContextState = {
  playerMaxGames: number;
  goalieMaxGames: number;
};

@Injectable({ providedIn: 'root' })
export class DrawerContextService {
  private readonly stateSubject = new BehaviorSubject<DrawerContextState>({
    playerMaxGames: 0,
    goalieMaxGames: 0,
  });

  readonly state$ = this.stateSubject.asObservable();

  readonly playerMaxGames$ = this.state$.pipe(map((s) => s.playerMaxGames));
  readonly goalieMaxGames$ = this.state$.pipe(map((s) => s.goalieMaxGames));

  setMaxGames(context: ControlsContext, maxGames: number): void {
    const normalized = Number.isFinite(maxGames)
      ? Math.max(0, Math.floor(maxGames))
      : 0;

    const current = this.stateSubject.value;

    if (context === 'player') {
      if (current.playerMaxGames === normalized) return;
      this.stateSubject.next({ ...current, playerMaxGames: normalized });
      return;
    }

    if (current.goalieMaxGames === normalized) return;
    this.stateSubject.next({ ...current, goalieMaxGames: normalized });
  }
}
