import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ReportType } from './api.service';

export interface FilterState {
  reportType: ReportType;
  season?: number;
  statsPerGame: boolean;
  minGames: number;
}

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private filters = {
    players: new BehaviorSubject<FilterState>({
      reportType: 'regular',
      season: undefined,
      statsPerGame: false,
      minGames: 0,
    }),
    goalies: new BehaviorSubject<FilterState>({
      reportType: 'regular',
      season: undefined,
      statsPerGame: false,
      minGames: 0,
    }),
  };

  playerFilters$ = this.filters.players.asObservable();
  goalieFilters$ = this.filters.goalies.asObservable();

  updatePlayerFilters(change: Partial<FilterState>) {
    const current = this.filters.players.value;
    this.filters.players.next({ ...current, ...change });
  }

  updateGoalieFilters(change: Partial<FilterState>) {
    const current = this.filters.goalies.value;
    this.filters.goalies.next({ ...current, ...change });
  }

  resetPlayerFilters() {
    this.filters.players.next({
      reportType: 'regular',
      season: undefined,
      statsPerGame: false,
      minGames: 0,
    });
  }

  resetGoalieFilters() {
    this.filters.goalies.next({
      reportType: 'regular',
      season: undefined,
      statsPerGame: false,
      minGames: 0,
    });
  }

  resetAll() {
    this.resetPlayerFilters();
    this.resetGoalieFilters();
  }
}
