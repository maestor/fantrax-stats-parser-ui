import { OnInit, OnDestroy, Component, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  ApiService,
  ApiParams,
  Player,
  ReportType,
} from '@services/api.service';
import { FilterService } from '@services/filter.service';
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
  private subscriptions = new Subscription();

  reportType: ReportType = 'regular';
  season?: number;
  tableData: Player[] = [];
  tableColumns = PLAYER_COLUMNS;

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
  }

  ngOnDestroy(): void {
    this.filterService.updateReportType('regular');
    this.filterService.updateSeason(undefined);
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

  fetchData(params: ApiParams = {}) {
    this.apiService.getPlayerData(params).subscribe((data) => {
      this.tableData = data;
    });
  }
}
