import { AsyncPipe } from '@angular/common';
import { OnInit, Component, inject, OnDestroy } from '@angular/core';
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
  ApiParams,
  ApiService,
  Goalie,
  ReportType,
} from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { StatsService } from '@services/stats.service';
import { TeamService } from '@services/team.service';
import { SettingsService } from '@services/settings.service';
import { DrawerContextService } from '@services/drawer-context.service';
import { ViewportService } from '@services/viewport.service';
import { SettingsPanelComponent } from '@shared/settings-panel/settings-panel.component';
import { StatsTableComponent } from '@shared/stats-table/stats-table.component';
import { GOALIE_COLUMNS, GOALIE_SEASON_COLUMNS } from '@shared/table-columns';

@Component({
  selector: 'app-goalie-stats',
  imports: [AsyncPipe, SettingsPanelComponent, StatsTableComponent],
  templateUrl: './goalie-stats.component.html',
  styleUrl: './goalie-stats.component.scss',
})
export class GoalieStatsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private filterService = inject(FilterService);
  private statsService = inject(StatsService);
  private teamService = inject(TeamService);
  private settingsService = inject(SettingsService);
  private drawerContextService = inject(DrawerContextService);
  private destroy$ = new Subject<void>();

  readonly isMobile$ = inject(ViewportService).isMobile$;

  reportType: ReportType = 'regular';
  season?: number;
  statsPerGame: boolean = false;
  minGames: number = 0;
  maxGames: number = 0;
  tableData: Goalie[] = [];
  tableColumns = GOALIE_COLUMNS;
  defaultSortColumn: 'score' | 'scoreAdjustedByGames' = 'score';
  loading = false;
  apiError = false;

  ngOnInit() {
    combineLatest([
      this.filterService.goalieFilters$,
      this.teamService.selectedTeamId$,
      this.settingsService.startFromSeason$,
    ])
      .pipe(
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
            a.apiTeamId === b.apiTeamId &&
            a.startFrom === b.startFrom
          );
        }),
        switchMap(({ filters, params }) => {
          const { reportType, season, statsPerGame, minGames } = filters;
          this.reportType = reportType;
          this.season = season;
          this.statsPerGame = statsPerGame;
          this.minGames = minGames;

          const baseColumns = this.season ? GOALIE_SEASON_COLUMNS : GOALIE_COLUMNS;
          this.tableColumns = statsPerGame
            ? baseColumns.filter((c) => c !== 'score')
            : baseColumns;
          this.defaultSortColumn = statsPerGame ? 'scoreAdjustedByGames' : 'score';
          this.loading = true;
          this.apiError = false;

          // During team changes, startFromSeason is briefly cleared so we don't fetch with the
          // previous team's value. Wait until StartFromSeasonSwitcher resolves the new team's
          // oldest season.
          if (filters.season === undefined && (params as any).startFrom === undefined) {
            this.tableData = [];
            this.maxGames = 0;
            this.drawerContextService.setMaxGames('goalie', 0);
            return EMPTY;
          }

          return this.apiService.getGoalieData(params).pipe(
            map((data) => ({ data, isError: false as const })),
            catchError(() => of({ data: [] as Goalie[], isError: true as const }))
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
          const baseData = this.statsPerGame
            ? this.statsService.getGoalieStatsPerGame(data)
            : data;
          this.maxGames = Math.max(0, ...baseData.map(({ games }) => games));
          this.drawerContextService.setMaxGames('goalie', this.maxGames);
          this.tableData = baseData.filter((g) => g.games >= this.minGames);
          this.loading = false;
        },
        // Stream should not error due to catchError above.
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchData(params: ApiParams = {}) {
    this.loading = true;
    this.apiError = false;

    this.apiService
      .getGoalieData(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const baseData = this.statsPerGame
            ? this.statsService.getGoalieStatsPerGame(data)
            : data;
          this.maxGames = Math.max(0, ...baseData.map(({ games }) => games));
          this.drawerContextService.setMaxGames('goalie', this.maxGames);
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
