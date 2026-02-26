import { TestBed } from '@angular/core/testing';
import { PlayerCardStatsService } from './player-card-stats.service';
import { Player, Goalie } from '@services/api.service';

const baseGoalie: Goalie = {
  name: 'G', score: 10, scoreAdjustedByGames: 1, games: 5,
  wins: 3, saves: 100, shutouts: 1, goals: 0, assists: 0,
  points: 0, penalties: 0, ppp: 0, shp: 0, gaa: '2.50', savePercent: '0.910',
};

const basePlayer: Player = {
  name: 'P', score: 20, scoreAdjustedByGames: 2, games: 10,
  goals: 5, assists: 10, points: 15, penalties: 2, ppp: 1, shp: 0,
  position: 'F',
} as unknown as Player;

describe('PlayerCardStatsService', () => {
  let service: PlayerCardStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlayerCardStatsService);
  });

  describe('buildStats', () => {
    it('returns StatRow[] for goalie data — excludes internal fields', () => {
      const rows = service.buildStats(baseGoalie, {
        isGoalie: true, statsPerGame: false, positionFilter: 'all', viewContext: 'season',
      });
      const labels = rows.map(r => r.label);
      expect(labels).toContain('tableColumn.score');
      expect(labels).toContain('tableColumn.wins');
      expect(labels).not.toContain('tableColumn.name');
      expect(labels).not.toContain('tableColumn.seasons');
      expect(labels).not.toContain('tableColumn.position');
    });

    it('excludes "score" when statsPerGame is true', () => {
      const rows = service.buildStats(baseGoalie, {
        isGoalie: true, statsPerGame: true, positionFilter: 'all', viewContext: 'season',
      });
      expect(rows.map(r => r.label)).not.toContain('tableColumn.score');
    });

    it('excludes "season" when viewContext is combined', () => {
      const data = { ...baseGoalie, season: 2024 };
      const rows = service.buildStats(data, {
        isGoalie: true, statsPerGame: false, positionFilter: 'all', viewContext: 'combined',
      });
      expect(rows.map(r => r.label)).not.toContain('tableColumn.season');
    });

    it('uses scoreByPosition when positionFilter is active for a player', () => {
      const player = { ...basePlayer, scoreByPosition: 99, scoreByPositionAdjustedByGames: 9 };
      const rows = service.buildStats(player as unknown as Player, {
        isGoalie: false, statsPerGame: false, positionFilter: 'F', viewContext: 'season',
      });
      const scoreRow = rows.find(r => r.label === 'tableColumn.score');
      expect(scoreRow?.value).toBe(99);
    });

    it('uses scoreByPositionAdjustedByGames when positionFilter is active for a player', () => {
      const player = { ...basePlayer, scoreByPosition: 99, scoreByPositionAdjustedByGames: 9 };
      const rows = service.buildStats(player as unknown as Player, {
        isGoalie: false, statsPerGame: false, positionFilter: 'F', viewContext: 'season',
      });
      const adjRow = rows.find(r => r.label === 'tableColumn.scoreAdjustedByGames');
      expect(adjRow?.value).toBe(9);
    });

    it('uses _originalScore when positionFilter is "all" and _originalScore present', () => {
      const player = { ...basePlayer, score: 20, _originalScore: 77 };
      const rows = service.buildStats(player as unknown as Player, {
        isGoalie: false, statsPerGame: false, positionFilter: 'all', viewContext: 'season',
      });
      const scoreRow = rows.find(r => r.label === 'tableColumn.score');
      expect(scoreRow?.value).toBe(77);
    });

    it('uses _originalScoreAdjustedByGames when positionFilter is "all" and it is present', () => {
      const player = { ...basePlayer, scoreAdjustedByGames: 2, _originalScoreAdjustedByGames: 88 };
      const rows = service.buildStats(player as unknown as Player, {
        isGoalie: false, statsPerGame: false, positionFilter: 'all', viewContext: 'season',
      });
      const adjRow = rows.find(r => r.label === 'tableColumn.scoreAdjustedByGames');
      expect(adjRow?.value).toBe(88);
    });
  });

  describe('reorderStatsForDisplay', () => {
    it('places score columns first', () => {
      const keys = ['games', 'goals', 'score', 'scoreAdjustedByGames'];
      const result = service.reorderStatsForDisplay(keys);
      expect(result.indexOf('score')).toBeLessThan(result.indexOf('games'));
    });

    it('places savePercent and gaa after saves for goalie data', () => {
      const keys = ['gaa', 'savePercent', 'wins', 'saves', 'score'];
      const result = service.reorderStatsForDisplay(keys);
      const savesIdx = result.indexOf('saves');
      expect(result.indexOf('savePercent')).toBe(savesIdx + 1);
      expect(result.indexOf('gaa')).toBe(savesIdx + 2);
    });
  });

  describe('formatSeasonDisplay', () => {
    it('returns "YYYY-YY" format', () => {
      expect(service.formatSeasonDisplay(2024)).toBe('2024-25');
      expect(service.formatSeasonDisplay(2019)).toBe('2019-20');
    });
  });
});
