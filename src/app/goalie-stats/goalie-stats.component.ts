import { OnInit, Component, inject, OnDestroy } from '@angular/core';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import {
  ApiParams,
  ApiService,
  Goalie,
  ReportType,
} from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { StatsService } from '@services/stats.service';
import { ControlPanelComponent } from '@shared/control-panel/control-panel.component';
import { StatsTableComponent } from '@shared/stats-table/stats-table.component';
import { GOALIE_COLUMNS, GOALIE_SEASON_COLUMNS } from '@shared/table-columns';

@Component({
  selector: 'app-goalie-stats',
  imports: [ControlPanelComponent, StatsTableComponent],
  templateUrl: './goalie-stats.component.html',
  styleUrl: './goalie-stats.component.scss',
})
export class GoalieStatsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private filterService = inject(FilterService);
  private statsService = inject(StatsService);
  private destroy$ = new Subject<void>();

  reportType: ReportType = 'regular';
  season?: number;
  statsPerGame: boolean = false;
  minGames: number = 0;
  maxGames: number = 0;
  tableData: Goalie[] = [];
  tableColumns = GOALIE_COLUMNS;
  loading = false;

  ngOnInit() {
    combineLatest([this.filterService.goalieFilters$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([filters]) => {
        const { reportType, season, statsPerGame, minGames } = filters;
        this.reportType = reportType;
        this.season = season;
        this.statsPerGame = statsPerGame;
        this.minGames = minGames;
        this.tableColumns = this.season
          ? GOALIE_SEASON_COLUMNS
          : GOALIE_COLUMNS;
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
      .getGoalieData(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const baseData = this.statsPerGame
          ? this.statsService.getGoalieStatsPerGame(data)
          : data;
        this.maxGames = Math.max(...baseData.map(({ games }) => games));
        this.tableData = baseData.filter((g) => g.games >= this.minGames);
        this.loading = false;
      });
  }
}
