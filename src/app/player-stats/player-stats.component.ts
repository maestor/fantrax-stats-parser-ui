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
import { ControlPanelComponent } from '@shared/control-panel/control-panel.component';
import { StatsTableComponent } from '@shared/stats-table/stats-table.component';
import { PLAYER_COLUMNS } from '@shared/table-columns';

@Component({
  selector: 'app-player-stats',
  imports: [StatsTableComponent, ControlPanelComponent],
  templateUrl: './player-stats.component.html',
  styleUrl: './player-stats.component.scss',
})
export class PlayerStatsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private filterService = inject(FilterService);
  private statsService = inject(StatsService);
  private destroy$ = new Subject<void>();

  reportType: ReportType = 'regular';
  season?: number;
  statsPerGame: boolean = false;
  minGames = 0;
  tableData: Player[] = [];
  tableColumns = PLAYER_COLUMNS;
  loading = false;
  maxGames = 0;

  ngOnInit() {
    combineLatest([this.filterService.playerFilters$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([filters]) => {
        const { reportType, season, statsPerGame, minGames } = filters;
        this.reportType = reportType;
        this.season = season;
        this.statsPerGame = statsPerGame;
        this.minGames = minGames;
        this.fetchData({ reportType, season });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchData(params: ApiParams = {}) {
    this.loading = true;

    this.apiService
      .getPlayerData(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const transformed = this.statsPerGame
          ? this.statsService.getPlayerStatsPerGame(data)
          : data;
        this.maxGames = transformed.reduce(
          (max, p) => (p.games > max ? p.games : max),
          0
        );
        this.tableData =
          this.minGames > 0
            ? transformed.filter((p) => p.games >= this.minGames)
            : transformed;
        this.loading = false;
      });
  }
}
