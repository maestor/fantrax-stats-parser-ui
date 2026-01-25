import { AsyncPipe } from '@angular/common';
import { OnInit, OnDestroy, Component, inject } from '@angular/core';
import {
  Subject,
  auditTime,
  catchError,
  combineLatest,
  distinctUntilChanged,
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
import { FilterService } from '@services/filter.service';
import { StatsService } from '@services/stats.service';
import { TeamService } from '@services/team.service';
import { DrawerContextService } from '@services/drawer-context.service';
import { ViewportService } from '@services/viewport.service';
import { SettingsPanelComponent } from '@shared/settings-panel/settings-panel.component';
import { StatsTableComponent } from '@shared/stats-table/stats-table.component';
import { PLAYER_COLUMNS } from '@shared/table-columns';

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
  private drawerContextService = inject(DrawerContextService);
  private destroy$ = new Subject<void>();

  readonly isMobile$ = inject(ViewportService).isMobile$;

  reportType: ReportType = 'regular';
  season?: number;
  statsPerGame: boolean = false;
  minGames: number = 0;
  maxGames: number = 0;
  tableData: Player[] = [];
  tableColumns = PLAYER_COLUMNS;
  defaultSortColumn: 'score' | 'scoreAdjustedByGames' = 'score';
  loading = false;
  apiError = false;

  ngOnInit() {
    combineLatest([
      this.filterService.playerFilters$,
      this.teamService.selectedTeamId$,
    ])
      .pipe(
        // Team switch + filter reset emits multiple times synchronously.
        // Coalesce to the final "settled" state so we only fetch once.
        auditTime(0),
        map(([filters, teamId]) => {
          const apiTeamId = this.toApiTeamId(teamId);
          const params: ApiParams = apiTeamId
            ? { reportType: filters.reportType, season: filters.season, teamId: apiTeamId }
            : { reportType: filters.reportType, season: filters.season };

          return {
            filters,
            params,
            apiTeamId,
          };
        }),
        distinctUntilChanged((a, b) => {
          return (
            a.filters.reportType === b.filters.reportType &&
            a.filters.season === b.filters.season &&
            a.filters.statsPerGame === b.filters.statsPerGame &&
            a.filters.minGames === b.filters.minGames &&
            a.apiTeamId === b.apiTeamId
          );
        }),
        switchMap(({ filters, params }) => {
          const { reportType, season, statsPerGame, minGames } = filters;
          this.reportType = reportType;
          this.season = season;
          this.statsPerGame = statsPerGame;
          this.minGames = minGames;
          this.tableColumns = this.getTableColumns(statsPerGame);
          this.defaultSortColumn = statsPerGame ? 'scoreAdjustedByGames' : 'score';
          this.loading = true;
          this.apiError = false;

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
          const baseData = this.statsPerGame
            ? this.statsService.getPlayerStatsPerGame(data)
            : data;
          this.maxGames = Math.max(0, ...baseData.map(({ games }) => games));
          this.drawerContextService.setMaxGames('player', this.maxGames);
          this.tableData = baseData.filter((g) => g.games >= this.minGames);
          this.loading = false;
        },
        // Stream should not error due to catchError above.
      });
  }

  private getTableColumns(statsPerGame: boolean): string[] {
    if (!statsPerGame) return PLAYER_COLUMNS;
    return PLAYER_COLUMNS.filter((c) => c !== 'score');
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
