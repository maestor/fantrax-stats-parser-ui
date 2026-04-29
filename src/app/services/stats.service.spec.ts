import { TestBed } from '@angular/core/testing';

import type { Goalie, Player } from './api.service';
import { StatsService } from './stats.service';

import playersFixture from '../../../e2e/fixtures/data/players--combined--regular.json';
import goaliesFixtureData from '../../../e2e/fixtures/data/goalies--combined--regular--startFrom=2012.json';

describe('StatsService', () => {
  let service: StatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StatsService],
    });

    service = TestBed.inject(StatsService);
  });

  it('preserves player identity fields while converting numeric stats to per-game values', () => {
    const player = (playersFixture as Player[])[0];

    const [result] = service.getPlayerStatsPerGame([player]);

    expect(result.id).toBe(player.id);
    expect(result.name).toBe(player.name);
    expect(result.position).toBe(player.position);
    expect(result.games).toBe(player.games);
    expect(result.seasons).toBe(player.seasons);
    expect(result.scores).toEqual(player.scores);
    expect(result.score).toBe(player.scoreAdjustedByGames);
    expect(result.scoreAdjustedByGames).toBe(player.scoreAdjustedByGames);
    expect(result.goals).toBe(Number((player.goals / player.games).toFixed(2)));
    expect(result.blocks).toBe(Number((player.blocks / player.games).toFixed(2)));
  });

  it('keeps goalie rate fields intact and avoids NaN/Infinity when games are zero', () => {
    const goalieSeason = {
      ...(goaliesFixtureData as Goalie[])[0].seasons?.[0],
      name: 'Jake Oettinger',
      games: 0,
      wins: 6,
      saves: 396,
      shutouts: 1,
      goals: 0,
      assists: 0,
      points: 0,
      penalties: 2,
      ppp: 0,
      shp: 0,
    } as Goalie;

    const [result] = service.getGoalieStatsPerGame([goalieSeason]);

    expect(result.id).toBe(goalieSeason.id);
    expect(result.gaa).toBe(goalieSeason.gaa);
    expect(result.savePercent).toBe(goalieSeason.savePercent);
    expect(result.wins).toBe(0);
    expect(result.saves).toBe(0);
    expect(result.shutouts).toBe(0);
    expect(result.penalties).toBe(0);
    expect(result.score).toBe(goalieSeason.scoreAdjustedByGames);
  });
});
