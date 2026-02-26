import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiParams, Goalie } from '@services/api.service';
import { FilterState } from '@services/filter.service';
import { SettingsPanelComponent } from '@shared/settings-panel/settings-panel.component';
import { StatsTableComponent, TableRow } from '@shared/stats-table/stats-table.component';
import { Column } from '@shared/column.types';
import { GOALIE_COLUMNS, GOALIE_SEASON_COLUMNS } from '@shared/table-columns';
import { StatsBaseComponent } from '@base/stats/stats-base.component';

@Component({
  selector: 'app-goalie-stats',
  imports: [AsyncPipe, SettingsPanelComponent, StatsTableComponent],
  templateUrl: './goalie-stats.component.html',
  styleUrl: './goalie-stats.component.scss',
})
export class GoalieStatsComponent extends StatsBaseComponent<Goalie> {
  protected override readonly drawerKey = 'goalie' as const;

  override isRowSelected = (row: TableRow) => this.comparisonService.isSelected(row as Goalie);
  override onRowSelect = (row: TableRow) => this.comparisonService.toggle(row as Goalie);

  protected override get filters$(): Observable<FilterState> {
    return this.filterService.goalieFilters$;
  }

  protected override fetchApi(params: ApiParams) {
    return this.apiService.getGoalieData(params);
  }

  protected override applyPerGame(data: Goalie[]): Goalie[] {
    return this.statsService.getGoalieStatsPerGame(data);
  }

  protected override getColumns(statsPerGame: boolean, season?: number): Column[] {
    const baseColumns = season ? GOALIE_SEASON_COLUMNS : GOALIE_COLUMNS;
    return statsPerGame ? baseColumns.filter((c) => c.field !== 'score') : baseColumns;
  }
}
