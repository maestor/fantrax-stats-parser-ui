import { Directive, OnInit, OnDestroy, inject } from '@angular/core';
import {
  Subject,
  Observable,
  auditTime,
  catchError,
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  map,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ApiParams, ApiService, Player, Goalie, ReportType } from '@services/api.service';
import { FilterService, FilterState, PositionFilter } from '@services/filter.service';
import { StatsService } from '@services/stats.service';
import { TeamService } from '@services/team.service';
import { SettingsService } from '@services/settings.service';
import { DrawerContextService } from '@services/drawer-context.service';
import { ViewportService } from '@services/viewport.service';
import { TableRow } from '@shared/stats-table/stats-table.component';
import { Column } from '@shared/column.types';
import { ComparisonService } from '@services/comparison.service';
import { toApiTeamId } from '@shared/utils/api.utils';

@Directive()
export abstract class StatsBaseComponent<T extends Player | Goalie> implements OnInit, OnDestroy {
  protected apiService = inject(ApiService);
  protected filterService = inject(FilterService);
  protected statsService = inject(StatsService);
  protected teamService = inject(TeamService);
  protected settingsService = inject(SettingsService);
  protected drawerContextService = inject(DrawerContextService);
  protected destroy$ = new Subject<void>();

  readonly isMobile$ = inject(ViewportService).isMobile$;
  readonly comparisonService = inject(ComparisonService);
  readonly canSelectRow$ = this.comparisonService.canSelectMore$;

  abstract isRowSelected: (row: TableRow) => boolean;
  abstract onRowSelect: (row: TableRow) => void;

  reportType: ReportType = 'regular';
  season?: number;
  statsPerGame: boolean = false;
  minGames: number = 0;
  maxGames: number = 0;
  positionFilter: PositionFilter = 'all';
  tableData: T[] = [];
  tableColumns: Column[] = [];
  defaultSortColumn: 'score' | 'scoreAdjustedByGames' = 'score';
  loading = false;
  apiError = false;

  protected abstract get filters$(): Observable<FilterState>;
  protected abstract fetchApi(params: ApiParams): Observable<T[]>;
  protected abstract applyPerGame(data: T[]): T[];
  protected abstract getColumns(statsPerGame: boolean, season?: number): Column[];
  protected abstract readonly drawerKey: 'player' | 'goalie';

  /** Override to add extra fields to the distinctUntilChanged check (e.g. positionFilter). */
  protected extraSameCheck(_a: FilterState, _b: FilterState): boolean {
    return true;
  }

  /** Override to apply post-fetch filtering (e.g. position filtering for players). */
  protected applyFilters(data: T[]): T[] {
    return data;
  }

  ngOnInit(): void {
    combineLatest([
      this.filters$,
      this.teamService.selectedTeamId$,
      this.settingsService.startFromSeason$,
    ])
      .pipe(
        // Team switch + filter reset emits multiple times synchronously.
        // Coalesce to the final "settled" state so we only fetch once.
        auditTime(0),
        map(([filters, teamId, startFromSeason]) => {
          const apiTeamId = toApiTeamId(teamId);
          const startFrom = filters.season === undefined ? startFromSeason : undefined;

          const params: ApiParams = apiTeamId
            ? {
                reportType: filters.reportType,
                season: filters.season,
                teamId: apiTeamId,
                ...(startFrom === undefined ? {} : { startFrom }),
              }
            : {
                reportType: filters.reportType,
                season: filters.season,
                ...(startFrom === undefined ? {} : { startFrom }),
              };

          return { filters, params, apiTeamId, startFrom };
        }),
        distinctUntilChanged(
          (a, b) =>
            a.filters.reportType === b.filters.reportType &&
            a.filters.season === b.filters.season &&
            a.filters.statsPerGame === b.filters.statsPerGame &&
            a.filters.minGames === b.filters.minGames &&
            a.apiTeamId === b.apiTeamId &&
            a.startFrom === b.startFrom &&
            this.extraSameCheck(a.filters, b.filters)
        ),
        switchMap(({ filters, params }) => {
          this.reportType = filters.reportType;
          this.season = filters.season;
          this.statsPerGame = filters.statsPerGame;
          this.minGames = filters.minGames;
          this.positionFilter = filters.positionFilter;
          this.tableColumns = this.getColumns(filters.statsPerGame, filters.season);
          this.defaultSortColumn = filters.statsPerGame ? 'scoreAdjustedByGames' : 'score';
          this.loading = true;
          this.apiError = false;

          // During team changes, startFromSeason is briefly cleared so we don't fetch with the
          // previous team's value. Wait until StartFromSeasonSwitcher resolves the new team's
          // oldest season.
          if (filters.season === undefined && params.startFrom === undefined) {
            this.tableData = [];
            this.maxGames = 0;
            this.drawerContextService.setMaxGames(this.drawerKey, 0);
            return EMPTY;
          }

          return this.fetchApi(params).pipe(
            map((data) => ({ data, isError: false as const })),
            // Keep stream alive on error so subsequent changes still work.
            catchError(() => of({ data: [] as T[], isError: true as const }))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ data, isError }) => {
          if (isError) {
            this.tableData = [];
            this.maxGames = 0;
            this.loading = false;
            this.apiError = true;
            return;
          }
          let processedData = this.statsPerGame ? this.applyPerGame(data) : data;
          processedData = this.applyFilters(processedData);
          this.maxGames = Math.max(0, ...processedData.map(({ games }) => games));
          this.drawerContextService.setMaxGames(this.drawerKey, this.maxGames);
          this.tableData = processedData.filter((g) => g.games >= this.minGames);
          this.loading = false;
        },
        // Stream should not error due to catchError above.
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
