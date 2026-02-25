import { Injectable } from '@angular/core';
import { Player, Goalie } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  getPlayerStatsPerGame(data: Player[]): Player[] {
    return this.getStatsPerGame(data, [
      'name',
      'season',
      'games',
      'plusMinus',
      'position',
      'scoreByPosition',
      'scoreByPositionAdjustedByGames',
      'scoresByPosition',
    ]);
  }

  getGoalieStatsPerGame(data: Goalie[]): Goalie[] {
    return this.getStatsPerGame(data, ['name', 'season', 'games', 'gaa', 'savePercent']);
  }

  private getStatsPerGame<
    T extends { games: number; scoreAdjustedByGames: number, season?: number }
  >(data: T[], fixedFields: string[]): T[] {
    return data.map((item) => {
      const { games, scoreAdjustedByGames, season, ...rest } = item;
      // Create the per-game stats for the dynamic fields
      const perGameStats = Object.fromEntries(
        Object.entries(rest).map(([key, value]) => [
          key,
          this.format((value as number) / games),
        ])
      );

      // Combine the fixed fields with the per-game stats
      return {
        ...perGameStats,
        score: scoreAdjustedByGames,
        scoreAdjustedByGames: scoreAdjustedByGames,
        seasons: (item as any).seasons, // Preserve seasons if they exist
        ...Object.fromEntries(fixedFields.map((field) => [field, (item as Record<string, unknown>)[field]])),
      } as unknown as T;
    });
  }

  private format(value: number) {
    return parseFloat(value.toFixed(2));
  }
}
