import { Injectable } from '@angular/core';
import { Player, Goalie } from './api.service';

const COMMON_PER_GAME_FIELDS = [
  'goals',
  'assists',
  'points',
  'penalties',
  'ppp',
  'shp',
] as const;

const PLAYER_PER_GAME_FIELDS = [
  ...COMMON_PER_GAME_FIELDS,
  'plusMinus',
  'shots',
  'hits',
  'blocks',
] as const satisfies readonly (keyof Player)[];

const GOALIE_PER_GAME_FIELDS = [
  ...COMMON_PER_GAME_FIELDS,
  'wins',
  'saves',
  'shutouts',
] as const satisfies readonly (keyof Goalie)[];

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  getPlayerStatsPerGame(data: Player[]): Player[] {
    return this.getStatsPerGame(data, PLAYER_PER_GAME_FIELDS);
  }

  getGoalieStatsPerGame(data: Goalie[]): Goalie[] {
    return this.getStatsPerGame(data, GOALIE_PER_GAME_FIELDS);
  }

  private getStatsPerGame<
    T extends { games: number; score: number; scoreAdjustedByGames: number }
  >(data: T[], statFields: readonly (keyof T)[]): T[] {
    return data.map((item) => {
      const perGameItem = {
        ...item,
        score: item.scoreAdjustedByGames,
      } as T;

      statFields.forEach((field) => {
        const value = item[field];
        if (typeof value === 'number') {
          perGameItem[field] = this.toPerGameValue(value, item.games) as T[keyof T];
        }
      });

      return perGameItem;
    });
  }

  private toPerGameValue(value: number, games: number): number {
    if (games <= 0) {
      return 0;
    }

    return this.format(value / games);
  }

  private format(value: number) {
    return parseFloat(value.toFixed(2));
  }
}
