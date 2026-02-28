import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ReportType } from './api.service';
import { SettingsService } from './settings.service';

export type PositionFilter = 'all' | 'F' | 'D';

export interface FilterState {
  reportType: ReportType;
  season?: number;
  statsPerGame: boolean;
  minGames: number;
  positionFilter: PositionFilter;
}

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private readonly settingsService = inject(SettingsService);

  private filters = {
    players: new BehaviorSubject<FilterState>({
      reportType: this.settingsService.reportType,
      season: this.settingsService.season,
      statsPerGame: false,
      minGames: 0,
      positionFilter: 'all',
    }),
    goalies: new BehaviorSubject<FilterState>({
      reportType: this.settingsService.reportType,
      season: this.settingsService.season,
      statsPerGame: false,
      minGames: 0,
      positionFilter: 'all',
    }),
  };

  playerFilters$ = this.filters.players.asObservable();
  goalieFilters$ = this.filters.goalies.asObservable();

  updatePlayerFilters(change: Partial<FilterState>) {
    const current = this.filters.players.value;
    this.filters.players.next({ ...current, ...change });
    this.syncGlobalFilters('players', change);
  }

  updateGoalieFilters(change: Partial<FilterState>) {
    const current = this.filters.goalies.value;
    this.filters.goalies.next({ ...current, ...change });
    this.syncGlobalFilters('goalies', change);
  }

  private syncGlobalFilters(
    source: 'players' | 'goalies',
    change: Partial<FilterState>
  ): void {
    const hasSeason = Object.prototype.hasOwnProperty.call(change, 'season');
    const hasReportType = Object.prototype.hasOwnProperty.call(change, 'reportType');
    if (!hasSeason && !hasReportType) return;

    if (hasSeason) this.settingsService.setSeason(change.season ?? null);
    if (hasReportType) this.settingsService.setReportType(change.reportType!);

    const globalChange: Partial<FilterState> = {};
    if (hasSeason) globalChange.season = change.season;
    if (hasReportType) globalChange.reportType = change.reportType;

    const target = source === 'players' ? this.filters.goalies : this.filters.players;
    const current = target.value;
    target.next({ ...current, ...globalChange });
  }

  resetPlayerFilters() {
    const current = this.filters.players.value;
    this.filters.players.next({
      ...current,
      statsPerGame: false,
      minGames: 0,
      positionFilter: 'all',
    });
  }

  resetGoalieFilters() {
    const current = this.filters.goalies.value;
    this.filters.goalies.next({
      ...current,
      statsPerGame: false,
      minGames: 0,
    });
  }

  resetAll() {
    this.updatePlayerFilters({ reportType: 'regular', season: undefined });
    this.resetPlayerFilters();
    this.resetGoalieFilters();
  }
}
