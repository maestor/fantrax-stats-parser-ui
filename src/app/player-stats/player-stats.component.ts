import { OnInit, OnDestroy, Component, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
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
  tableData: Player[] = [];
  tableColumns = PLAYER_COLUMNS;
  loading = false;

  ngOnInit() {
    this.fetchData();

    this.filterService.reportType$
      .pipe(takeUntil(this.destroy$))
      .subscribe((report) => this.changeReport(report));

    this.filterService.season$
      .pipe(takeUntil(this.destroy$))
      .subscribe((season) => this.changeSeason(season));

    this.filterService.statsPerGame$
      .pipe(takeUntil(this.destroy$))
      .subscribe((statsPerGame) => this.toggleStatsMode(statsPerGame));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.filterService.updateReportType('regular');
    this.filterService.updateSeason(undefined);
    this.filterService.toggleStatsMode(false);
  }

  changeReport(reportType: ReportType) {
    this.reportType = reportType;
    this.fetchData({ reportType, season: this.season });
  }

  changeSeason(season?: number) {
    this.season = season;
    this.fetchData({ reportType: this.reportType, season });
  }

  toggleStatsMode(statsPerGame: boolean) {
    this.statsPerGame = statsPerGame;
    this.fetchData({ reportType: this.reportType, season: this.season });
  }

  fetchData(params: ApiParams = {}) {
    this.loading = true;

    this.apiService
      .getPlayerData(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.tableData = this.statsPerGame
          ? this.statsService.getPlayerStatsPerGame(data)
          : data;
        this.loading = false;
      });
  }
}
