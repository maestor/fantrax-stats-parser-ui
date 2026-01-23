import { OnInit, OnDestroy, Component, inject } from '@angular/core';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import {
  ApiService,
  ApiParams,
  Player,
  ReportType,
} from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { StatsService } from '@services/stats.service';
import { TeamService } from '@services/team.service';
import { SettingsPanelComponent } from '@shared/settings-panel/settings-panel.component';
import { StatsTableComponent } from '@shared/stats-table/stats-table.component';
import { PLAYER_COLUMNS } from '@shared/table-columns';

@Component({
  selector: 'app-player-stats',
  imports: [StatsTableComponent, SettingsPanelComponent],
  templateUrl: './player-stats.component.html',
  styleUrl: './player-stats.component.scss',
})
export class PlayerStatsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private filterService = inject(FilterService);
  private statsService = inject(StatsService);
  private teamService = inject(TeamService);
  private destroy$ = new Subject<void>();

  reportType: ReportType = 'regular';
  season?: number;
  statsPerGame: boolean = false;
  minGames: number = 0;
  maxGames: number = 0;
  tableData: Player[] = [];
  tableColumns = PLAYER_COLUMNS;
  loading = false;
  apiError = false;

  ngOnInit() {
    combineLatest([
      this.filterService.playerFilters$,
      this.teamService.selectedTeamId$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([filters, teamId]) => {
        const { reportType, season, statsPerGame, minGames } = filters;
        this.reportType = reportType;
        this.season = season;
        this.statsPerGame = statsPerGame;
        this.minGames = minGames;
        const apiTeamId = this.toApiTeamId(teamId);
        this.fetchData(apiTeamId ? { reportType, season, teamId: apiTeamId } : { reportType, season });
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
      .getPlayerData(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const baseData = this.statsPerGame
            ? this.statsService.getPlayerStatsPerGame(data)
            : data;
          this.maxGames = Math.max(0, ...baseData.map(({ games }) => games));
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
