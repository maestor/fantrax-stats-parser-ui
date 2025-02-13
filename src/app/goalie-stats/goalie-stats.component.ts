import { OnInit, Component, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  ApiParams,
  ApiService,
  Goalie,
  ReportType,
} from '@services/api.service';
import { FilterService } from '@services/filter.service';
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
  private subscriptions = new Subscription();

  reportType: ReportType = 'regular';
  season?: number;
  tableData: Goalie[] = [];
  tableColumns = GOALIE_COLUMNS;

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
    this.tableColumns = this.season ? GOALIE_SEASON_COLUMNS : GOALIE_COLUMNS;
    this.fetchData({ reportType, season: this.season });
  }

  changeSeason(season?: number) {
    this.season = season;
    this.tableColumns = this.season ? GOALIE_SEASON_COLUMNS : GOALIE_COLUMNS;
    this.fetchData({ reportType: this.reportType, season });
  }

  fetchData(params: ApiParams = {}) {
    this.apiService.getGoalieData(params).subscribe((data) => {
      this.tableData = data;
    });
  }
}
