import { OnInit, Component, inject } from '@angular/core';
import {
  ApiService,
  ApiParams,
  Player,
  ReportType,
} from '@services/api.service';
import { StatsTableComponent } from '@shared/stats-table/stats-table.component';
import { ReportSwitcherComponent } from '@shared/report-switcher/report-switcher.component';
import { SeasonSwitcherComponent } from '@shared/season-switcher/season-switcher.component';
import { PLAYER_COLUMNS } from '@shared/table-columns';

@Component({
  selector: 'app-player-stats',
  imports: [
    StatsTableComponent,
    ReportSwitcherComponent,
    SeasonSwitcherComponent,
  ],
  templateUrl: './player-stats.component.html',
  styleUrl: './player-stats.component.scss',
})
export class PlayerStatsComponent implements OnInit {
  private apiService = inject(ApiService);

  reportType: ReportType = 'regular';
  season?: number;
  tableData: Player[] = [];
  tableColumns = PLAYER_COLUMNS;

  ngOnInit() {
    this.fetchPlayers();
  }

  changeReport(reportType: ReportType) {
    this.reportType = reportType;
    this.fetchPlayers({ reportType, season: this.season });
  }

  changeSeason(season?: number) {
    this.season = season;
    this.fetchPlayers({ reportType: this.reportType, season });
  }

  fetchPlayers(params: ApiParams = {}) {
    this.apiService.getPlayerData(params).subscribe((data) => {
      this.tableData = data;
    });
  }
}
