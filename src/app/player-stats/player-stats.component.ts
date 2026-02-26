import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiParams, Player } from '@services/api.service';
import { FilterState } from '@services/filter.service';
import { SettingsPanelComponent } from '@shared/settings-panel/settings-panel.component';
import { StatsTableComponent, TableRow } from '@shared/stats-table/stats-table.component';
import { Column } from '@shared/column.types';
import { PLAYER_COLUMNS } from '@shared/table-columns';
import { StatsBaseComponent } from '@base/stats/stats-base.component';

@Component({
  selector: 'app-player-stats',
  imports: [AsyncPipe, StatsTableComponent, SettingsPanelComponent],
  templateUrl: './player-stats.component.html',
  styleUrl: './player-stats.component.scss',
})
export class PlayerStatsComponent extends StatsBaseComponent<Player> {
  protected override readonly drawerKey = 'player' as const;

  override isRowSelected = (row: TableRow) => this.comparisonService.isSelected(row as Player);
  override onRowSelect = (row: TableRow) => this.comparisonService.toggle(row as Player);

  protected override get filters$(): Observable<FilterState> {
    return this.filterService.playerFilters$;
  }

  protected override fetchApi(params: ApiParams) {
    return this.apiService.getPlayerData(params);
  }

  protected override applyPerGame(data: Player[]): Player[] {
    return this.statsService.getPlayerStatsPerGame(data);
  }

  protected override getColumns(statsPerGame: boolean): Column[] {
    if (!statsPerGame) return PLAYER_COLUMNS;
    return PLAYER_COLUMNS.filter((c) => c.field !== 'score');
  }

  protected override extraSameCheck(a: FilterState, b: FilterState): boolean {
    return a.positionFilter === b.positionFilter;
  }

  protected override applyFilters(data: Player[]): Player[] {
    if (this.positionFilter === 'all') return data;
    const filtered = data.filter((player) => player.position === this.positionFilter);
    return this.transformToPositionScores(filtered, this.statsPerGame);
  }

  private transformToPositionScores(data: Player[], statsPerGame: boolean): Player[] {
    return data.map((player) => ({
      ...player,
      // Preserve original scores so player card can access them when toggling filter off
      _originalScore: player.score,
      _originalScoreAdjustedByGames: player.scoreAdjustedByGames,
      // In per-game mode, score was set to scoreAdjustedByGames, so use position-adjusted equivalent
      score: statsPerGame
        ? (player.scoreByPositionAdjustedByGames ?? player.score)
        : (player.scoreByPosition ?? player.score),
      scoreAdjustedByGames: player.scoreByPositionAdjustedByGames ?? player.scoreAdjustedByGames,
    }));
  }
}
