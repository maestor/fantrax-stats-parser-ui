import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
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

  private readonly playerFiltersState = signal<FilterState>(this.buildInitialFilterState());
  private readonly goalieFiltersState = signal<FilterState>(this.buildInitialFilterState());

  readonly playerFiltersSignal = this.playerFiltersState.asReadonly();
  readonly goalieFiltersSignal = this.goalieFiltersState.asReadonly();
  readonly playerFilters$ = toObservable(this.playerFiltersSignal);
  readonly goalieFilters$ = toObservable(this.goalieFiltersSignal);

  updatePlayerFilters(change: Partial<FilterState>): void {
    this.playerFiltersState.update((current) => ({ ...current, ...change }));
    this.syncGlobalFilters('players', change);
  }

  updateGoalieFilters(change: Partial<FilterState>): void {
    this.goalieFiltersState.update((current) => ({ ...current, ...change }));
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

    const targetState = source === 'players' ? this.goalieFiltersState : this.playerFiltersState;
    targetState.update((current) => ({ ...current, ...globalChange }));
  }

  resetPlayerFilters(): void {
    this.playerFiltersState.update((current) => ({
      ...current,
      statsPerGame: false,
      minGames: 0,
      positionFilter: 'all',
    }));
  }

  resetGoalieFilters(): void {
    this.goalieFiltersState.update((current) => ({
      ...current,
      statsPerGame: false,
      minGames: 0,
    }));
  }

  resetAll(): void {
    this.updatePlayerFilters({ reportType: 'regular', season: undefined });
    this.resetPlayerFilters();
    this.resetGoalieFilters();
  }

  private buildInitialFilterState(): FilterState {
    return {
      reportType: this.settingsService.reportType,
      season: this.settingsService.season,
      statsPerGame: false,
      minGames: 0,
      positionFilter: 'all',
    };
  }
}
