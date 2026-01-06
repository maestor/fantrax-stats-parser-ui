import { TestBed } from '@angular/core/testing';
import { StatsService } from '../stats.service';
import { Player, Goalie } from '../api.service';

describe('StatsService', () => {
  let service: StatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StatsService],
    });
    service = TestBed.inject(StatsService);
  });

  describe('getPlayerStatsPerGame', () => {
    it('should calculate per-game stats for single player', () => {
      const players: Player[] = [
        {
          name: 'Player 1',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 82,
          goals: 82,
          assists: 41,
          points: 123,
          plusMinus: 10,
          penalties: 20,
          shots: 246,
          ppp: 41,
          shp: 2,
          hits: 164,
          blocks: 82,
        },
      ];

      const result = service.getPlayerStatsPerGame(players);

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Player 1');
      expect(result[0].games).toBe(82);
      expect(result[0].plusMinus).toBe(10);
      expect(result[0].goals).toBe(1.0);
      expect(result[0].assists).toBe(0.5);
      expect(result[0].points).toBe(1.5);
      expect(result[0].penalties).toBe(0.24);
      expect(result[0].shots).toBe(3.0);
      expect(result[0].ppp).toBe(0.5);
      expect(result[0].shp).toBe(0.02);
      expect(result[0].hits).toBe(2.0);
      expect(result[0].blocks).toBe(1.0);
    });

    it('should calculate per-game stats for multiple players', () => {
      const players: Player[] = [
        {
          name: 'Player 1',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 10,
          goals: 10,
          assists: 10,
          points: 20,
          plusMinus: 5,
          penalties: 5,
          shots: 50,
          ppp: 5,
          shp: 0,
          hits: 20,
          blocks: 10,
        },
        {
          name: 'Player 2',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 20,
          goals: 20,
          assists: 40,
          points: 60,
          plusMinus: -5,
          penalties: 10,
          shots: 100,
          ppp: 10,
          shp: 2,
          hits: 40,
          blocks: 20,
        },
      ];

      const result = service.getPlayerStatsPerGame(players);

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Player 1');
      expect(result[0].goals).toBe(1.0);
      expect(result[1].name).toBe('Player 2');
      expect(result[1].goals).toBe(1.0);
      expect(result[1].assists).toBe(2.0);
    });

    it('should preserve name, games, and plusMinus as fixed fields', () => {
      const players: Player[] = [
        {
          name: 'Test Player',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 50,
          goals: 25,
          assists: 50,
          points: 75,
          plusMinus: 15,
          penalties: 10,
          shots: 150,
          ppp: 20,
          shp: 1,
          hits: 100,
          blocks: 50,
        },
      ];

      const result = service.getPlayerStatsPerGame(players);

      expect(result[0].name).toBe('Test Player');
      expect(result[0].games).toBe(50);
      expect(result[0].plusMinus).toBe(15);
    });

    it('should round stats to 2 decimal places', () => {
      const players: Player[] = [
        {
          name: 'Player',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 3,
          goals: 10,
          assists: 10,
          points: 20,
          plusMinus: 0,
          penalties: 10,
          shots: 10,
          ppp: 10,
          shp: 10,
          hits: 10,
          blocks: 10,
        },
      ];

      const result = service.getPlayerStatsPerGame(players);

      expect(result[0].goals).toBe(3.33);
      expect(result[0].assists).toBe(3.33);
      expect(result[0].points).toBe(6.67);
      expect(result[0].penalties).toBe(3.33);
    });

    it('should handle players with 1 game correctly', () => {
      const players: Player[] = [
        {
          name: 'One Game Player',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 1,
          goals: 2,
          assists: 3,
          points: 5,
          plusMinus: 2,
          penalties: 0,
          shots: 5,
          ppp: 1,
          shp: 0,
          hits: 3,
          blocks: 1,
        },
      ];

      const result = service.getPlayerStatsPerGame(players);

      expect(result[0].goals).toBe(2.0);
      expect(result[0].assists).toBe(3.0);
      expect(result[0].points).toBe(5.0);
    });

    it('should handle zero stats correctly', () => {
      const players: Player[] = [
        {
          name: 'Zero Stats',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 10,
          goals: 0,
          assists: 0,
          points: 0,
          plusMinus: 0,
          penalties: 0,
          shots: 0,
          ppp: 0,
          shp: 0,
          hits: 0,
          blocks: 0,
        },
      ];

      const result = service.getPlayerStatsPerGame(players);

      expect(result[0].goals).toBe(0.0);
      expect(result[0].assists).toBe(0.0);
      expect(result[0].points).toBe(0.0);
      expect(result[0].penalties).toBe(0.0);
    });

    it('should handle empty array', () => {
      const players: Player[] = [];
      const result = service.getPlayerStatsPerGame(players);
      expect(result).toEqual([]);
    });

    it('should handle negative plusMinus correctly', () => {
      const players: Player[] = [
        {
          name: 'Negative Player',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 10,
          goals: 5,
          assists: 5,
          points: 10,
          plusMinus: -15,
          penalties: 2,
          shots: 20,
          ppp: 3,
          shp: 0,
          hits: 10,
          blocks: 5,
        },
      ];

      const result = service.getPlayerStatsPerGame(players);

      expect(result[0].plusMinus).toBe(-15);
      expect(result[0].goals).toBe(0.5);
    });
  });

  describe('getGoalieStatsPerGame', () => {
    it('should calculate per-game stats for single goalie', () => {
      const goalies: Goalie[] = [
        {
          name: 'Goalie 1',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 65,
          wins: 40,
          saves: 1950,
          shutouts: 5,
          goals: 0,
          assists: 3,
          points: 3,
          penalties: 2,
          ppp: 0,
          shp: 0,
          gaa: '2.45',
          savePercent: '0.918',
        },
      ];

      const result = service.getGoalieStatsPerGame(goalies);

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Goalie 1');
      expect(result[0].games).toBe(65);
      expect(result[0].gaa).toBe('2.45');
      expect(result[0].savePercent).toBe('0.918');
      expect(result[0].wins).toBe(0.62);
      expect(result[0].saves).toBe(30.0);
      expect(result[0].shutouts).toBe(0.08);
    });

    it('should calculate per-game stats for multiple goalies', () => {
      const goalies: Goalie[] = [
        {
          name: 'Goalie 1',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 10,
          wins: 8,
          saves: 300,
          shutouts: 2,
          goals: 0,
          assists: 1,
          points: 1,
          penalties: 0,
          ppp: 0,
          shp: 0,
          gaa: '2.00',
          savePercent: '0.920',
        },
        {
          name: 'Goalie 2',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 20,
          wins: 12,
          saves: 600,
          shutouts: 3,
          goals: 0,
          assists: 2,
          points: 2,
          penalties: 1,
          ppp: 0,
          shp: 0,
          gaa: '2.50',
          savePercent: '0.915',
        },
      ];

      const result = service.getGoalieStatsPerGame(goalies);

      expect(result.length).toBe(2);
      expect(result[0].wins).toBe(0.8);
      expect(result[0].saves).toBe(30.0);
      expect(result[1].wins).toBe(0.6);
      expect(result[1].saves).toBe(30.0);
    });

    it('should preserve name, games, gaa, and savePercent as fixed fields', () => {
      const goalies: Goalie[] = [
        {
          name: 'Test Goalie',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 50,
          wins: 30,
          saves: 1500,
          shutouts: 4,
          goals: 0,
          assists: 2,
          points: 2,
          penalties: 1,
          ppp: 0,
          shp: 0,
          gaa: '2.35',
          savePercent: '0.916',
        },
      ];

      const result = service.getGoalieStatsPerGame(goalies);

      expect(result[0].name).toBe('Test Goalie');
      expect(result[0].games).toBe(50);
      expect(result[0].gaa).toBe('2.35');
      expect(result[0].savePercent).toBe('0.916');
    });

    it('should round stats to 2 decimal places', () => {
      const goalies: Goalie[] = [
        {
          name: 'Goalie',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 3,
          wins: 10,
          saves: 100,
          shutouts: 10,
          goals: 3,
          assists: 3,
          points: 6,
          penalties: 3,
          ppp: 3,
          shp: 3,
          gaa: '2.00',
          savePercent: '0.900',
        },
      ];

      const result = service.getGoalieStatsPerGame(goalies);

      expect(result[0].wins).toBe(3.33);
      expect(result[0].saves).toBe(33.33);
      expect(result[0].shutouts).toBe(3.33);
    });

    it('should handle goalies with 1 game correctly', () => {
      const goalies: Goalie[] = [
        {
          name: 'One Game Goalie',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 1,
          wins: 1,
          saves: 35,
          shutouts: 1,
          goals: 0,
          assists: 0,
          points: 0,
          penalties: 0,
          ppp: 0,
          shp: 0,
          gaa: '1.00',
          savePercent: '0.972',
        },
      ];

      const result = service.getGoalieStatsPerGame(goalies);

      expect(result[0].wins).toBe(1.0);
      expect(result[0].saves).toBe(35.0);
      expect(result[0].shutouts).toBe(1.0);
    });

    it('should handle zero stats correctly', () => {
      const goalies: Goalie[] = [
        {
          name: 'Zero Stats',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 10,
          wins: 0,
          saves: 0,
          shutouts: 0,
          goals: 0,
          assists: 0,
          points: 0,
          penalties: 0,
          ppp: 0,
          shp: 0,
          gaa: '0.00',
          savePercent: '0.000',
        },
      ];

      const result = service.getGoalieStatsPerGame(goalies);

      expect(result[0].wins).toBe(0.0);
      expect(result[0].saves).toBe(0.0);
      expect(result[0].shutouts).toBe(0.0);
    });

    it('should handle empty array', () => {
      const goalies: Goalie[] = [];
      const result = service.getGoalieStatsPerGame(goalies);
      expect(result).toEqual([]);
    });

    it('should handle goalies without gaa and savePercent', () => {
      const goalies: Goalie[] = [
        {
          name: 'Goalie Without Stats',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 10,
          wins: 5,
          saves: 300,
          shutouts: 1,
          goals: 0,
          assists: 0,
          points: 0,
          penalties: 0,
          ppp: 0,
          shp: 0,
        },
      ];

      const result = service.getGoalieStatsPerGame(goalies);

      expect(result[0].wins).toBe(0.5);
      expect(result[0].saves).toBe(30.0);
      expect(result[0].gaa).toBeUndefined();
      expect(result[0].savePercent).toBeUndefined();
    });

    it('should preserve scoring stats (goals, assists, points)', () => {
      const goalies: Goalie[] = [
        {
          name: 'Scoring Goalie',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 10,
          wins: 6,
          saves: 300,
          shutouts: 2,
          goals: 1,
          assists: 2,
          points: 3,
          penalties: 0,
          ppp: 1,
          shp: 0,
          gaa: '2.50',
          savePercent: '0.910',
        },
      ];

      const result = service.getGoalieStatsPerGame(goalies);

      expect(result[0].goals).toBe(0.1);
      expect(result[0].assists).toBe(0.2);
      expect(result[0].points).toBe(0.3);
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers correctly', () => {
      const players: Player[] = [
        {
          name: 'High Stats Player',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 1000,
          goals: 500000,
          assists: 750000,
          points: 1250000,
          plusMinus: 100000,
          penalties: 50000,
          shots: 2000000,
          ppp: 150000,
          shp: 25000,
          hits: 500000,
          blocks: 250000,
        },
      ];

      const result = service.getPlayerStatsPerGame(players);

      expect(result[0].goals).toBe(500.0);
      expect(result[0].assists).toBe(750.0);
      expect(result[0].points).toBe(1250.0);
    });

    it('should handle decimal results that round to zero', () => {
      const players: Player[] = [
        {
          name: 'Low Stats',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 100,
          goals: 1,
          assists: 2,
          points: 3,
          plusMinus: 0,
          penalties: 1,
          shots: 5,
          ppp: 1,
          shp: 1,
          hits: 2,
          blocks: 1,
        },
      ];

      const result = service.getPlayerStatsPerGame(players);

      expect(result[0].goals).toBe(0.01);
      expect(result[0].assists).toBe(0.02);
      expect(result[0].points).toBe(0.03);
    });
  });
});
