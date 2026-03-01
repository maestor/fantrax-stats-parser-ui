import { TestBed } from '@angular/core/testing';
import { PlayerCardSeasonsService } from './player-card-seasons.service';
import { Goalie, GoalieSeasonStats } from '@services/api.service';

const season2024: GoalieSeasonStats = {
    name: '', season: 2024, games: 10, score: 50, scoreAdjustedByGames: 5,
    wins: 8, saves: 300, shutouts: 2, goals: 0, assists: 1, points: 1,
    penalties: 0, ppp: 0, shp: 0, gaa: '2.00', savePercent: '0.920',
};
const season2023: GoalieSeasonStats = {
    name: '', season: 2023, games: 15, score: 40, scoreAdjustedByGames: 4,
    wins: 6, saves: 200, shutouts: 1, goals: 0, assists: 0, points: 0,
    penalties: 0, ppp: 0, shp: 0, gaa: '3.00', savePercent: '0.900',
};
const goalie = {
    name: 'G', score: 0, scoreAdjustedByGames: 0, games: 25, wins: 14,
    saves: 500, shutouts: 3, goals: 0, assists: 1, points: 1, penalties: 0, ppp: 0,
    shp: 0, gaa: '2.40', savePercent: '0.912', seasons: [season2024, season2023],
} as unknown as Goalie;

describe('PlayerCardSeasonsService', () => {
    let service: PlayerCardSeasonsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PlayerCardSeasonsService);
    });

    it('sorts seasons newest first', () => {
        const result = service.setupSeasonData(goalie, {
            isGoalie: true, statsPerGame: false, positionFilter: 'all', isMobile: false,
        });
        expect(result.seasonDataSource[0].season).toBe(2024);
        expect(result.seasonDataSource[1].season).toBe(2023);
    });

    it('builds seasonColumns with seasonDisplay first, then score columns', () => {
        const result = service.setupSeasonData(goalie, {
            isGoalie: true, statsPerGame: false, positionFilter: 'all', isMobile: false,
        });
        expect(result.seasonColumns[0]).toBe('seasonDisplay');
        expect(result.seasonColumns[1]).toBe('score');
        expect(result.seasonColumns[2]).toBe('scoreAdjustedByGames');
    });

    it('excludes "score" when statsPerGame is true', () => {
        const result = service.setupSeasonData(goalie, {
            isGoalie: true, statsPerGame: true, positionFilter: 'all', isMobile: false,
        });
        expect(result.seasonColumns).not.toContain('score');
    });

    it('reorders goalie columns so savePercent and gaa follow saves', () => {
        const result = service.setupSeasonData(goalie, {
            isGoalie: true, statsPerGame: false, positionFilter: 'all', isMobile: false,
        });
        const cols = result.seasonColumns;
        const savesIdx = cols.indexOf('saves');
        expect(cols[savesIdx + 1]).toBe('savePercent');
        expect(cols[savesIdx + 2]).toBe('gaa');
    });

    it('uses short season format on mobile', () => {
        const result = service.setupSeasonData(goalie, {
            isGoalie: true, statsPerGame: false, positionFilter: 'all', isMobile: true,
        });
        const seasonDisplay = (result.seasonDataSource[0] as Record<string, unknown>)['seasonDisplay'];
        expect(seasonDisplay).toBe('24-25');
    });

    it('computes careerBests — max for saves, min for gaa', () => {
        const result = service.setupSeasonData(goalie, {
            isGoalie: true, statsPerGame: false, positionFilter: 'all', isMobile: false,
        });
        expect(result.careerBests.get('saves')?.has(2024)).toBe(true);
        expect(result.careerBests.get('saves')?.has(2023)).toBe(false);
        expect(result.careerBests.get('gaa')?.has(2024)).toBe(true);
    });

    it('returns empty result when data has no seasons', () => {
        const noSeasons = { ...goalie, seasons: undefined } as unknown as Goalie;
        const result = service.setupSeasonData(noSeasons, {
            isGoalie: true, statsPerGame: false, positionFilter: 'all', isMobile: false,
        });
        expect(result.seasonColumns).toEqual([]);
        expect(result.seasonDataSource).toEqual([]);
        expect(result.careerBests.size).toBe(0);
    });

    it('applies scoreByPosition overrides when positionFilter is active for a skater', () => {
        const playerSeason = {
            name: '', season: 2024, games: 10, score: 20, scoreAdjustedByGames: 2,
            goals: 5, assists: 10, points: 15, penalties: 2, ppp: 1, shp: 0, position: 'F',
            scoreByPosition: 99, scoreByPositionAdjustedByGames: 9,
        };
        const player = {
            name: 'P', score: 0, scoreAdjustedByGames: 0, games: 10, goals: 5,
            assists: 10, points: 15, penalties: 2, ppp: 1, shp: 0, position: 'F',
            seasons: [playerSeason],
        };
        // Need a second season to compute careerBests (and to not hit the < 2 seasons guard)
        const playerSeason2 = { ...playerSeason, season: 2023, scoreByPosition: 50, scoreByPositionAdjustedByGames: 5 };
        player.seasons = [playerSeason, playerSeason2];

        const result = service.setupSeasonData(player as any, {
            isGoalie: false, statsPerGame: false, positionFilter: 'F', isMobile: false,
        });

        const row2024 = result.seasonDataSource.find(s => s.season === 2024) as Record<string, unknown>;
        expect(row2024?.['score']).toBe(99);
        expect(row2024?.['scoreAdjustedByGames']).toBe(9);
    });

    it('returns empty result when seasons is an empty array', () => {
        const noSeasons = { ...goalie, seasons: [] } as any;
        const result = service.setupSeasonData(noSeasons, {
            isGoalie: true, statsPerGame: false, positionFilter: 'all', isMobile: false,
        });
        expect(result.seasonColumns).toEqual([]);
        expect(result.seasonDataSource).toEqual([]);
        expect(result.careerBests.size).toBe(0);
    });

    describe('isCareerBest', () => {
        it('returns true when season has the best value for that column', () => {
            const bests = new Map<string, Set<number>>([['saves', new Set([2024])]]);
            expect(service.isCareerBest(bests, 'saves', 2024)).toBe(true);
            expect(service.isCareerBest(bests, 'saves', 2023)).toBe(false);
        });

        it('returns false for unknown column', () => {
            expect(service.isCareerBest(new Map(), 'unknown', 2024)).toBe(false);
        });
    });
});
