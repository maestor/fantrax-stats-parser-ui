import { Injectable } from '@angular/core';
import { Player, Goalie } from '@services/api.service';
import { PositionFilter } from '@services/filter.service';
import { formatSeasonDisplay } from '@shared/utils/season.utils';

export interface StatRow {
  label: string;
  value: string | number;
}

export interface BuildStatsOptions {
  isGoalie: boolean;
  statsPerGame: boolean;
  positionFilter: PositionFilter;
  viewContext: 'combined' | 'season';
}

@Injectable({ providedIn: 'root' })
export class PlayerCardStatsService {
  readonly baseExcludedColumns = [
    'id', 'name', 'seasons', 'scores', 'position',
    'scoresByPosition', 'scoreByPosition', 'scoreByPositionAdjustedByGames',
    '_originalScore', '_originalScoreAdjustedByGames',
  ];

  buildStats(data: Player | Goalie, options: BuildStatsOptions): StatRow[] {
    const { isGoalie, statsPerGame, positionFilter, viewContext } = options;

    const excludedColumns = [...this.baseExcludedColumns];
    if (statsPerGame) excludedColumns.push('score');
    if (viewContext === 'combined') excludedColumns.push('season');

    const usePositionScores = !isGoalie && positionFilter !== 'all';
    const player = data as Player;

    return this.reorderStatsForDisplay(
      Object.keys(data).filter(key => !excludedColumns.includes(key))
    ).map(key => {
      let value: string | number;

      if (key === 'season') {
        value = formatSeasonDisplay(data[key as keyof typeof data] as number);
      } else if (usePositionScores && key === 'score' && player.scoreByPosition != null) {
        value = player.scoreByPosition;
      } else if (usePositionScores && key === 'scoreAdjustedByGames' && player.scoreByPositionAdjustedByGames != null) {
        value = player.scoreByPositionAdjustedByGames;
      } else if (!usePositionScores && key === 'score' && player._originalScore != null) {
        value = player._originalScore;
      } else if (!usePositionScores && key === 'scoreAdjustedByGames' && player._originalScoreAdjustedByGames != null) {
        value = player._originalScoreAdjustedByGames;
      } else {
        value = data[key as keyof typeof data] as string | number;
      }

      return { label: `tableColumn.${key}`, value };
    });
  }

  reorderStatsForDisplay(keys: string[]): string[] {
    const priorityColumns = ['season', 'score', 'scoreAdjustedByGames', 'games'];
    const prioritized = priorityColumns.filter(col => keys.includes(col));
    let result = [...prioritized, ...keys.filter(k => !priorityColumns.includes(k))];

    if (result.includes('gaa') || result.includes('savePercent')) {
      const savesIndex = result.indexOf('saves');
      if (savesIndex !== -1) {
        const temp = result.filter(k => k !== 'gaa' && k !== 'savePercent');
        const insertAt = temp.indexOf('saves') + 1;
        if (result.includes('savePercent')) temp.splice(insertAt, 0, 'savePercent');
        if (result.includes('gaa')) temp.splice(insertAt + (result.includes('savePercent') ? 1 : 0), 0, 'gaa');
        result = temp;
      }
    }

    return result;
  }
}
