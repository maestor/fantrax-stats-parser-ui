import { OnInit, OnDestroy, Component, inject } from '@angular/core';
import { Subscription } from 'rxjs';
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
  private subscriptions = new Subscription();

  reportType: ReportType = 'regular';
  season?: number;
  statsPerGame: boolean = false;
  tableData: Player[] = [];
  tableColumns = PLAYER_COLUMNS;
  loading = false;

  ngOnInit() {
    this.fetchData();

    this.subscriptions.add(
      this.filterService.reportType$.subscribe((report) => {
        this.changeReport(report);
      })
    );

    this.subscriptions.add(
      this.filterService.season$.subscribe((season) => {
        this.changeSeason(season);
      })
    );

    this.subscriptions.add(
      this.filterService.statsPerGame$.subscribe((statsPerGame) => {
        this.toggleStatsMode(statsPerGame);
      })
    );
  }

  ngOnDestroy(): void {
    this.filterService.updateReportType('regular');
    this.filterService.updateSeason(undefined);
    this.filterService.toggleStatsMode(false);
    this.subscriptions.unsubscribe();
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
    this.apiService.getPlayerData(params).subscribe((data) => {
      this.tableData = this.statsPerGame
        ? this.statsService.getPlayerStatsPerGame(data)
        : data;
      this.loading = false;
    });
  }
}
