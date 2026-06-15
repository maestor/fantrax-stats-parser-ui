import { PlayerCardStatsService } from './player-card-stats.service';

describe('PlayerCardStatsService', () => {
  let service: PlayerCardStatsService;

  beforeEach(() => {
    service = new PlayerCardStatsService();
  });

  it('uses position-adjusted skater scores when a position filter is active', () => {
    const rows = service.buildStats({
      score: 10,
      scoreAdjustedByGames: 8,
      scoreByPosition: 14,
      scoreByPositionAdjustedByGames: 11,
      games: 20,
      goals: 7,
    } as never, {
      isGoalie: false,
      statsPerGame: false,
      positionFilter: 'F',
      viewContext: 'season',
    });

    expect(rows).toEqual([
      { label: 'tableColumn.score', value: 14 },
      { label: 'tableColumn.scoreAdjustedByGames', value: 11 },
      { label: 'tableColumn.games', value: 20 },
      { label: 'tableColumn.goals', value: 7 },
    ]);
  });

  it('uses original combined scores when position filtering is not active', () => {
    const rows = service.buildStats({
      season: 2024,
      score: 12,
      scoreAdjustedByGames: 9,
      _originalScore: 18,
      _originalScoreAdjustedByGames: 15,
      games: 22,
      assists: 19,
    } as never, {
      isGoalie: false,
      statsPerGame: false,
      positionFilter: 'all',
      viewContext: 'season',
    });

    expect(rows).toEqual([
      { label: 'tableColumn.season', value: '2024-25' },
      { label: 'tableColumn.score', value: 18 },
      { label: 'tableColumn.scoreAdjustedByGames', value: 15 },
      { label: 'tableColumn.games', value: 22 },
      { label: 'tableColumn.assists', value: 19 },
    ]);
  });

  it('drops score in stats-per-game mode and season in combined view', () => {
    const rows = service.buildStats({
      season: 2024,
      score: 12,
      scoreAdjustedByGames: 9,
      games: 22,
      points: 31,
    } as never, {
      isGoalie: false,
      statsPerGame: true,
      positionFilter: 'all',
      viewContext: 'combined',
    });

    expect(rows).toEqual([
      { label: 'tableColumn.scoreAdjustedByGames', value: 9 },
      { label: 'tableColumn.games', value: 22 },
      { label: 'tableColumn.points', value: 31 },
    ]);
  });

  it('keeps goalie stats in saves-savePercent-gaa order when saves are present', () => {
    expect(service.reorderStatsForDisplay([
      'gaa',
      'wins',
      'savePercent',
      'saves',
      'games',
    ])).toEqual([
      'games',
      'wins',
      'saves',
      'savePercent',
      'gaa',
    ]);
  });

  it('leaves goalie rate stats in place when saves are absent', () => {
    expect(service.reorderStatsForDisplay([
      'gaa',
      'savePercent',
      'wins',
    ])).toEqual([
      'gaa',
      'savePercent',
      'wins',
    ]);
  });
});
