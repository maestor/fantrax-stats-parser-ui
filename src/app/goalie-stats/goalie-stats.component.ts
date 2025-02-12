import { OnInit, Component, inject } from '@angular/core';
import {
  ApiParams,
  ApiService,
  Goalie,
  ReportType,
} from '@services/api.service';
import { StatsTableComponent } from '@shared/stats-table/stats-table.component';
import { ReportSwitcherComponent } from '@shared/report-switcher/report-switcher.component';
import { SeasonSwitcherComponent } from '@shared/season-switcher/season-switcher.component';
import { GOALIE_COLUMNS, GOALIE_SEASON_COLUMNS } from '@shared/table-columns';

@Component({
  selector: 'app-goalie-stats',
  imports: [
    StatsTableComponent,
    ReportSwitcherComponent,
    SeasonSwitcherComponent,
  ],
  templateUrl: './goalie-stats.component.html',
  styleUrl: './goalie-stats.component.scss',
})
export class GoalieStatsComponent implements OnInit {
  private apiService = inject(ApiService);

  reportType: ReportType = 'regular';
  season?: number;
  tableData: Goalie[] = [];
  tableColumns = GOALIE_COLUMNS;

  ngOnInit() {
    this.fetchPlayers();
  }

  changeReport(reportType: ReportType) {
    this.reportType = reportType;
    this.tableColumns = this.season ? GOALIE_SEASON_COLUMNS : GOALIE_COLUMNS;
    this.fetchPlayers({ reportType, season: this.season });
  }

  changeSeason(season?: number) {
    this.season = season;
    this.tableColumns = this.season ? GOALIE_SEASON_COLUMNS : GOALIE_COLUMNS;
    this.fetchPlayers({ reportType: this.reportType, season });
  }

  fetchPlayers(params: ApiParams = {}) {
    this.apiService.getGoalieData(params).subscribe((data) => {
      this.tableData = data;
    });
  }
}
