import { Injectable, inject } from '@angular/core';
import { Player, Goalie, PlayerSeasonStats, GoalieSeasonStats } from '@services/api.service';
import { PositionFilter } from '@services/filter.service';
import { PlayerCardStatsService } from './player-card-stats.service';

export interface SeasonDataResult {
  seasonColumns: string[];
  seasonDataSource: (PlayerSeasonStats | GoalieSeasonStats)[];
  careerBests: Map<string, Set<number>>;
}

export interface SetupSeasonOptions {
  isGoalie: boolean;
  statsPerGame: boolean;
  positionFilter: PositionFilter;
  isMobile: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlayerCardSeasonsService {
  private statsService = inject(PlayerCardStatsService);

  setupSeasonData(data: Player | Goalie, options: SetupSeasonOptions): SeasonDataResult {
    const emptyResult: SeasonDataResult = {
      seasonColumns: [],
      seasonDataSource: [],
      careerBests: new Map(),
    };

    if (!data.seasons) return emptyResult;

    const { isGoalie, statsPerGame, positionFilter, isMobile } = options;

    // Sort seasons by year, newest first
    const sortedSeasons = [...data.seasons].sort((a, b) => b.season - a.season);

    // Determine if we should use position-based scores for seasons
    const usePositionScores = !isGoalie && positionFilter !== 'all';

    const seasonDataSource = sortedSeasons.map((season) => {
      const playerSeason = season as PlayerSeasonStats;
      const scoreOverrides = usePositionScores ? {
        ...(playerSeason.scoreByPosition != null ? { score: playerSeason.scoreByPosition } : {}),
        ...(playerSeason.scoreByPositionAdjustedByGames != null ? { scoreAdjustedByGames: playerSeason.scoreByPositionAdjustedByGames } : {}),
      } : {};

      return {
        ...season,
        seasonDisplay: isMobile
          ? this.formatSeasonShort(season.season)
          : this.statsService.formatSeasonDisplay(season.season),
        ...scoreOverrides,
      };
    }) as (PlayerSeasonStats | GoalieSeasonStats)[];

    let seasonColumns: string[] = [];

    if (data.seasons.length > 0) {
      const columns = Object.keys(data.seasons[0]);
      const excludedSeasonColumns = [
        'position',
        'scores',
        'scoresByPosition',
        'scoreByPosition',
        'scoreByPositionAdjustedByGames',
      ];

      // Also exclude 'score' in statsPerGame mode
      if (statsPerGame) {
        excludedSeasonColumns.push('score');
      }

      // Replace 'season' with 'seasonDisplay' for display and drop internal columns
      const filteredColumns = columns
        .filter((col) => !excludedSeasonColumns.includes(col))
        .map((col) => (col === 'season' ? 'seasonDisplay' : col));

      // Use statsService to reorder columns (handles goalie savePercent/gaa logic)
      const reordered = this.statsService.reorderStatsForDisplay(filteredColumns);

      // Ensure seasonDisplay first, then score columns in the season table
      const priorityColumns = ['seasonDisplay', 'score', 'scoreAdjustedByGames'];
      seasonColumns = [
        ...priorityColumns.filter((col) => reordered.includes(col)),
        ...reordered.filter((col) => !priorityColumns.includes(col)),
      ];
    }

    const careerBests = this.computeCareerBests(seasonDataSource, seasonColumns);

    return { seasonColumns, seasonDataSource, careerBests };
  }

  isCareerBest(careerBests: Map<string, Set<number>>, column: string, season: number): boolean {
    return careerBests.get(column)?.has(season) ?? false;
  }

  private formatSeasonShort(year: number): string {
    const startShort = String(year).slice(-2);
    const nextYear = year + 1;
    const endShort = String(nextYear).slice(-2);
    return `${startShort}-${endShort}`;
  }

  private parseStatValue(value: unknown): number | null {
    if (value === '' || value === '-' || value === null || value === undefined) {
      return null;
    }
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? null : num;
  }

  private computeCareerBests(
    seasonDataSource: (PlayerSeasonStats | GoalieSeasonStats)[],
    seasonColumns: string[],
  ): Map<string, Set<number>> {
    const careerBests = new Map<string, Set<number>>();

    if (seasonDataSource.length < 2) return careerBests;

    const statColumns = seasonColumns.filter(col => col !== 'seasonDisplay');

    for (const column of statColumns) {
      const values = seasonDataSource.map(s => ({
        season: s.season,
        value: this.parseStatValue((s as Record<string, unknown>)[column])
      })).filter(v => v.value !== null) as { season: number; value: number }[];

      // Skip if no valid values or all zeros
      if (values.length === 0 || values.every(v => v.value === 0)) continue;

      // Find best value (min for GAA, max for others)
      const bestValue = column === 'gaa'
        ? Math.min(...values.map(v => v.value))
        : Math.max(...values.map(v => v.value));

      // Store all seasons with the best value
      const bestSeasons = values
        .filter(v => v.value === bestValue)
        .map(v => v.season);

      careerBests.set(column, new Set(bestSeasons));
    }

    return careerBests;
  }
}
