import { OnInit, Component, inject } from '@angular/core';
import {
  ApiParams,
  ApiService,
  Goalie,
  ReportType,
} from '@services/api.service';
import { StatsTableComponent } from '@shared/stats-table/stats-table.component';
import { ReportSwitcherComponent } from '@shared/report-switcher/report-switcher.component';
import { GOALIE_COLUMNS } from '@shared/table-columns';

@Component({
  selector: 'app-goalie-stats',
  imports: [StatsTableComponent, ReportSwitcherComponent],
  templateUrl: './goalie-stats.component.html',
  styleUrl: './goalie-stats.component.scss',
})
export class GoalieStatsComponent implements OnInit {
  private apiService = inject(ApiService);

  tableData: Goalie[] = [];
  tableColumns = GOALIE_COLUMNS;

  ngOnInit() {
    this.fetchPlayers();
  }

  changeReport(reportType: ReportType) {
    this.fetchPlayers({ reportType });
  }

  fetchPlayers(params: ApiParams = {}) {
    this.apiService.getGoalieData(params).subscribe((data) => {
      this.tableData = data;
    });
  }
}
