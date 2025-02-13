import { Injectable } from '@angular/core';
import { Player, Goalie } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  getPlayerStatsPerGame(data: Player[]): Player[] {
    return this.getStatsPerGame(data, ['name', 'games', 'plusMinus']);
  }

  getGoalieStatsPerGame(data: Goalie[]): Goalie[] {
    return this.getStatsPerGame(data, ['name', 'games', 'gaa', 'savePercent']);
  }

  private getStatsPerGame<T extends { games: number }>(
    data: T[],
    fixedFields: (keyof T)[]
  ): T[] {
    return data.map((item) => {
      const { games, ...rest } = item;
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
        ...Object.fromEntries(fixedFields.map((field) => [field, item[field]])),
      } as unknown as T;
    });
  }

  private format(value: number) {
    return parseFloat(value.toFixed(2));
  }
}
