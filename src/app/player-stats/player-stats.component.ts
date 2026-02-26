import { AsyncPipe } from '@angular/common';
import { OnInit, OnDestroy, Component, inject } from '@angular/core';
import {
  Subject,
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
import {
  ApiService,
  ApiParams,
  Player,
  ReportType,
} from '@services/api.service';
import { FilterService, PositionFilter } from '@services/filter.service';
import { StatsService } from '@services/stats.service';
import { TeamService } from '@services/team.service';
import { SettingsService } from '@services/settings.service';
import { DrawerContextService } from '@services/drawer-context.service';
import { ViewportService } from '@services/viewport.service';
import { SettingsPanelComponent } from '@shared/settings-panel/settings-panel.component';
import { StatsTableComponent } from '@shared/stats-table/stats-table.component';
import { Column } from '@shared/column.types';
import { PLAYER_COLUMNS } from '@shared/table-columns';
import { ComparisonService } from '@services/comparison.service';

@Component({
  selector: 'app-player-stats',
  imports: [AsyncPipe, StatsTableComponent, SettingsPanelComponent],
  templateUrl: './player-stats.component.html',
  styleUrl: './player-stats.component.scss',
})
export class PlayerStatsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private filterService = inject(FilterService);
  private statsService = inject(StatsService);
  private teamService = inject(TeamService);
  private settingsService = inject(SettingsService);
  private drawerContextService = inject(DrawerContextService);
  private destroy$ = new Subject<void>();

  readonly isMobile$ = inject(ViewportService).isMobile$;
  readonly comparisonService = inject(ComparisonService);
  readonly canSelectRow$ = this.comparisonService.canSelectMore$;

  isRowSelected = (row: any) => this.comparisonService.isSelected(row);
  onRowSelect = (row: any) => this.comparisonService.toggle(row);

  reportType: ReportType = 'regular';
  season?: number;
  statsPerGame: boolean = false;
  minGames: number = 0;
  maxGames: number = 0;
  positionFilter: PositionFilter = 'all';
  tableData: Player[] = [];
  tableColumns = PLAYER_COLUMNS;
  defaultSortColumn: 'score' | 'scoreAdjustedByGames' = 'score';
  loading = false;
  apiError = false;

  ngOnInit() {
    combineLatest([
      this.filterService.playerFilters$,
      this.teamService.selectedTeamId$,
      this.settingsService.startFromSeason$,
    ])
      .pipe(
        // Team switch + filter reset emits multiple times synchronously.
        // Coalesce to the final "settled" state so we only fetch once.
        auditTime(0),
        map(([filters, teamId, startFromSeason]) => {
          const apiTeamId = this.toApiTeamId(teamId);
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

          return {
            filters,
            params,
            apiTeamId,
            startFrom,
          };
        }),
        distinctUntilChanged((a, b) => {
          return (
            a.filters.reportType === b.filters.reportType &&
            a.filters.season === b.filters.season &&
            a.filters.statsPerGame === b.filters.statsPerGame &&
            a.filters.minGames === b.filters.minGames &&
            a.filters.positionFilter === b.filters.positionFilter &&
            a.apiTeamId === b.apiTeamId &&
            a.startFrom === b.startFrom
          );
        }),
        switchMap(({ filters, params }) => {
          const { reportType, season, statsPerGame, minGames, positionFilter } = filters;
          this.reportType = reportType;
          this.season = season;
          this.statsPerGame = statsPerGame;
          this.minGames = minGames;
          this.positionFilter = positionFilter;
          this.tableColumns = this.getTableColumns(statsPerGame);
          this.defaultSortColumn = statsPerGame ? 'scoreAdjustedByGames' : 'score';
          this.loading = true;
          this.apiError = false;

          // During team changes, startFromSeason is briefly cleared so we don't fetch with the
          // previous team's value. Wait until StartFromSeasonSwitcher resolves the new team's
          // oldest season.
          if (filters.season === undefined && (params as any).startFrom === undefined) {
            this.tableData = [];
            this.maxGames = 0;
            this.drawerContextService.setMaxGames('player', 0);
            return EMPTY;
          }

          return this.apiService.getPlayerData(params).pipe(
            map((data) => ({ data, isError: false as const })),
            // Keep stream alive on error so subsequent changes still work.
            catchError(() => of({ data: [] as Player[], isError: true as const }))
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
          let processedData = this.statsPerGame
            ? this.statsService.getPlayerStatsPerGame(data)
            : data;

          // Filter by position if position filter is active
          if (this.positionFilter !== 'all') {
            processedData = processedData.filter(
              (player) => player.position === this.positionFilter
            );
            // Transform scores to position-based values
            processedData = this.transformToPositionScores(processedData, this.statsPerGame);
          }

          this.maxGames = Math.max(0, ...processedData.map(({ games }) => games));
          this.drawerContextService.setMaxGames('player', this.maxGames);
          this.tableData = processedData.filter((g) => g.games >= this.minGames);
          this.loading = false;
        },
        // Stream should not error due to catchError above.
      });
  }

  private getTableColumns(statsPerGame: boolean): Column[] {
    if (!statsPerGame) return PLAYER_COLUMNS;
    return PLAYER_COLUMNS.filter((c) => c.field !== 'score');
  }

  private transformToPositionScores(data: Player[], statsPerGame: boolean): Player[] {
    return data.map((player) => ({
      ...player,
      // Preserve original scores so player card can access them when toggling filter off
      _originalScore: player.score,
      _originalScoreAdjustedByGames: player.scoreAdjustedByGames,
      // In per-game mode, score was set to scoreAdjustedByGames, so use position-adjusted equivalent
      score: statsPerGame
        ? (player.scoreByPositionAdjustedByGames ?? player.score)
        : (player.scoreByPosition ?? player.score),
      scoreAdjustedByGames: player.scoreByPositionAdjustedByGames ?? player.scoreAdjustedByGames,
    }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchData(params: ApiParams = {}) {
    this.loading = true;
    this.apiError = false;

    this.apiService
      .getPlayerData(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const baseData = this.statsPerGame
            ? this.statsService.getPlayerStatsPerGame(data)
            : data;
          this.maxGames = Math.max(0, ...baseData.map(({ games }) => games));
          this.drawerContextService.setMaxGames('player', this.maxGames);
          this.tableData = baseData.filter((g) => g.games >= this.minGames);
          this.loading = false;
        },
        error: () => {
          this.tableData = [];
          this.maxGames = 0;
          this.loading = false;
          this.apiError = true;
        },
      });
  }

  private toApiTeamId(teamId: string): string | undefined {
    return teamId === '1' ? undefined : teamId;
  }
}
