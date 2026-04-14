import { PLATFORM_ID } from '@angular/core';
import { fireEvent, render, screen, within } from '@testing-library/angular';
import { Observable, of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';

import { LeaderboardFinalsComponent } from './leaderboard-finals.component';
import { ApiService, FinalsLeaderboardCategory, FinalsLeaderboardEntry } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';

describe('LeaderboardFinalsComponent', () => {
  async function setup(options: {
    entries?: FinalsLeaderboardEntry[];
    finals$?: Observable<FinalsLeaderboardEntry[]>;
    platformId?: object | string;
    disableSelectedTeamHighlight?: boolean;
  } = {}) {
    const getLeaderboardFinals = vi.fn(() => options.finals$ ?? of(options.entries ?? []));
    const markReady = vi.fn();

    localStorage.setItem('fantrax.settings', JSON.stringify({
      selectedTeamId: '1',
      startFromSeason: null,
      season: null,
      reportType: 'regular',
      disableSelectedTeamHighlight: options.disableSelectedTeamHighlight ?? false,
    }));

    const result = await render(LeaderboardFinalsComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        {
          provide: MATERIAL_ANIMATIONS,
          useValue: { animationsDisabled: true },
        },
        {
          provide: PLATFORM_ID,
          useValue: options.platformId ?? 'browser',
        },
        {
          provide: ApiService,
          useValue: {
            getLeaderboardFinals,
          },
        },
        {
          provide: FooterVisibilityService,
          useValue: {
            currentCycle: () => 0,
            markReady,
          },
        },
      ],
    });

    return { ...result, getLeaderboardFinals, markReady };
  }

  it('renders newest finals first, starts collapsed, and reveals the summary and breakdown on expand', async () => {
    await setup({
      entries: [
        createFinalsEntry({
          season: 2023,
          winnerTeamId: '2',
          winnerTeamName: 'Dallas Stars',
          homeTeamId: '2',
          homeTeamName: 'Dallas Stars',
          awayTeamId: '7',
          awayTeamName: 'Colorado Avalanche',
        }),
        createFinalsEntry({
          season: 2025,
          winnerTeamId: '1',
          winnerTeamName: 'Carolina Hurricanes',
          homeTeamId: '1',
          homeTeamName: 'Carolina Hurricanes',
          awayTeamId: '9',
          awayTeamName: 'Edmonton Oilers',
        }),
      ],
    });

    const headers = screen.getAllByRole('button');
    const newestHeader = headers[0];

    expect(newestHeader).toHaveTextContent('2025-26');
    expect(newestHeader).toHaveTextContent('Carolina Hurricanes');
    expect(newestHeader).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('leaderboards.finals.selectedTeamBadge')).toBeInTheDocument();
    expect(within(newestHeader).getByText('Carolina Hurricanes', { selector: '.leaderboard-finals-team-name--full' }))
      .toBeInTheDocument();
    expect(within(newestHeader).getByText('Edmonton Oilers', { selector: '.leaderboard-finals-team-name--full' }))
      .toBeInTheDocument();
    expect(within(newestHeader).getByText('CAR', { selector: '.leaderboard-finals-team-name--abbr' }))
      .toHaveAttribute('aria-label', 'Carolina Hurricanes');
    expect(within(newestHeader).getByText('CAR', { selector: '.leaderboard-finals-team-name--abbr' }))
      .toHaveAttribute('title', 'Carolina Hurricanes');
    expect(within(newestHeader).getByText('EDM', { selector: '.leaderboard-finals-team-name--abbr' }))
      .toHaveAttribute('aria-label', 'Edmonton Oilers');
    expect(within(newestHeader).getByText('EDM', { selector: '.leaderboard-finals-team-name--abbr' }))
      .toHaveAttribute('title', 'Edmonton Oilers');

    fireEvent.click(newestHeader);

    expect(newestHeader).toHaveAttribute('aria-expanded', 'true');
    expect((await screen.findAllByText('leaderboards.finals.summaryTitle')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('leaderboards.finals.ratesTitle').length).toBeGreaterThan(0);
    expect(screen.getAllByText('leaderboards.finals.factorsTitle').length).toBeGreaterThan(0);
    expect(screen.getAllByText('leaderboards.finals.summary.loser').length).toBeGreaterThan(0);
    expect(screen.getAllByText('leaderboards.finals.summary.playedGames').length).toBeGreaterThan(0);
    expect(screen.getAllByText('leaderboards.finals.factors.offence').length).toBeGreaterThan(0);
    expect(screen.getAllByText('leaderboards.finals.factors.physical').length).toBeGreaterThan(0);
    expect(screen.getAllByText('leaderboards.finals.factors.goalies').length).toBeGreaterThan(0);
    expect(screen.getAllByText('leaderboards.finals.skaterTotalsTitle').length).toBeGreaterThan(0);
    expect(screen.getAllByText('leaderboards.finals.goalieTotalsTitle').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CAR').length).toBeGreaterThan(0);
    expect(screen.getAllByText('EDM').length).toBeGreaterThan(0);
    expect(screen.getAllByTitle('Carolina Hurricanes')
      .filter((element) => element.textContent?.trim() === 'CAR').length).toBeGreaterThan(1);
    expect(screen.getAllByTitle('Edmonton Oilers')
      .filter((element) => element.textContent?.trim() === 'EDM').length).toBeGreaterThan(1);
    expect(screen.getAllByText('57,0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('43,0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('tableColumnShort.goals').length).toBeGreaterThan(0);
    expect(screen.getAllByText('tableColumnShort.saves').length).toBeGreaterThan(0);
    expect(screen.getAllByTitle('tableColumn.goals').length).toBeGreaterThan(0);
    expect(screen.getAllByTitle('tableColumn.saves').length).toBeGreaterThan(0);
    expect(screen.getAllByTitle('tableColumn.goals')[0]).toHaveAttribute('aria-label', 'tableColumn.goals');
    expect(screen.getAllByText('2.18').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\(\+6,0\)/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('(+6,0)')[0]).toHaveClass('leaderboard-finals-rate-delta-inline--positive');
    expect(screen.getAllByText('57,0')[0].closest('.leaderboard-finals-factor-side'))
      .toHaveClass('leaderboard-finals-factor-side--winner');
    expect(screen.getAllByText('43,0')[0].closest('.leaderboard-finals-factor-side'))
      .not.toHaveClass('leaderboard-finals-factor-side--winner');
  });

  it('shows the API error state and marks the footer ready when the finals request fails', async () => {
    const { markReady } = await setup({
      finals$: throwError(() => new Error('boom')),
    });

    expect(await screen.findByText('leaderboards.apiUnavailable')).toBeInTheDocument();
    expect(markReady).toHaveBeenCalledWith(0);
  });

  it('marks the footer ready on the server without calling the finals endpoint', async () => {
    const { getLeaderboardFinals, markReady } = await setup({
      entries: [createFinalsEntry({
        season: 2025,
        winnerTeamId: '1',
        winnerTeamName: 'A',
        homeTeamId: '1',
        homeTeamName: 'A',
        awayTeamId: '2',
        awayTeamName: 'B',
      })],
      platformId: 'server',
    });

    expect(getLeaderboardFinals).not.toHaveBeenCalled();
    expect(markReady).toHaveBeenCalledWith(0);
  });

  it('covers finals formatting helpers for deltas, null values, goalie decimals, and disabled highlights', async () => {
    const entry = createFinalsEntry({
      season: 2025,
      winnerTeamId: '1',
      winnerTeamName: 'Carolina Hurricanes',
      homeTeamId: '1',
      homeTeamName: 'Carolina Hurricanes',
      awayTeamId: '9',
      awayTeamName: 'Edmonton Oilers',
    });
    const { fixture } = await setup({
      entries: [entry],
      disableSelectedTeamHighlight: true,
    });
    const component = fixture.componentInstance;
    const savePercentCategory: FinalsLeaderboardCategory = {
      statKey: 'savePercent',
      awayValue: 0.914,
      homeValue: 0.925,
      winnerTeamId: '1',
    };
    const gaaCategory: FinalsLeaderboardCategory = {
      statKey: 'gaa',
      awayValue: 2.61,
      homeValue: 2.18,
      winnerTeamId: '1',
    };
    const nullCategory: FinalsLeaderboardCategory = {
      statKey: 'wins',
      awayValue: null,
      homeValue: 5,
      winnerTeamId: '1',
    };
    const negativeDeltaEntry: FinalsLeaderboardEntry = {
      ...entry,
      rates: {
        winRate: 67.3,
        deservedToWinRate: 60,
      },
    };
    const neutralDeltaEntry: FinalsLeaderboardEntry = {
      ...entry,
      rates: {
        winRate: 62,
        deservedToWinRate: 62,
      },
    };

    expect(component.hasSelectedFinalist(entry)).toBe(false);
    expect(component.formatPercent(0.673)).toBe('67,3 %');
    expect(component.formatRateDelta(entry)).toBe('+6,0 %-yks.');
    expect(component.formatRateDeltaCompact(negativeDeltaEntry)).toBe('-7,3');
    expect(component.getRateDeltaTone(entry)).toBe('positive');
    expect(component.getRateDeltaTone(negativeDeltaEntry)).toBe('negative');
    expect(component.getRateDeltaTone(neutralDeltaEntry)).toBe('neutral');
    expect(component.getFactorKeys()).toEqual(['offence', 'physical', 'goalies']);
    expect(component.getFactorValue(entry, 'home', 'offence')).toBe('57,0');
    expect(component.getFactorValue(entry, 'away', 'goalies')).toBe('52,0');
    expect(component.factorLeads(entry, 'home', 'offence')).toBe(true);
    expect(component.factorLeads(entry, 'away', 'offence')).toBe(false);
    expect(component.factorLeads(entry, 'away', 'goalies')).toBe(true);
    expect(component.getCategoryValue(savePercentCategory, 'home')).toBe('0.925');
    expect(component.getCategoryValue(gaaCategory, 'home')).toBe('2.18');
    expect(component.getCategoryValue(nullCategory, 'away')).toBe('—');
  });
});

function createFinalsEntry(options: {
  season: number;
  winnerTeamId: string;
  winnerTeamName: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
}): FinalsLeaderboardEntry {
  return {
    season: options.season,
    wonOnHomeTiebreak: false,
    winnerTeamId: options.winnerTeamId,
    winnerTeamName: options.winnerTeamName,
    homeTeam: {
      teamId: options.homeTeamId,
      teamName: options.homeTeamName,
      score: {
        matchPoints: 8,
        categoriesWon: 8,
        categoriesLost: 5,
        categoriesTied: 2,
      },
      playedGames: {
        total: 28,
        skaters: 20,
        goalies: 8,
      },
      teamAbbr: 'CAR',
      totals: {
        goals: 24,
        assists: 41,
        points: 65,
        plusMinus: 14,
        penalties: 18,
        shots: 161,
        ppp: 12,
        shp: 1,
        hits: 53,
        blocks: 47,
        wins: 3,
        saves: 121,
        shutouts: 1,
        gaa: 2.18,
        savePercent: 0.925,
      },
    },
    awayTeam: {
      teamId: options.awayTeamId,
      teamName: options.awayTeamName,
      score: {
        matchPoints: 7,
        categoriesWon: 5,
        categoriesLost: 8,
        categoriesTied: 2,
      },
      playedGames: {
        total: 26,
        skaters: 18,
        goalies: 8,
      },
      teamAbbr: 'EDM',
      totals: {
        goals: 22,
        assists: 36,
        points: 58,
        plusMinus: 8,
        penalties: 20,
        shots: 148,
        ppp: 9,
        shp: 0,
        hits: 48,
        blocks: 42,
        wins: 2,
        saves: 118,
        shutouts: 0,
        gaa: 2.61,
        savePercent: 0.914,
      },
    },
    categories: [
      {
        statKey: 'goals',
        awayValue: 22,
        homeValue: 24,
        winnerTeamId: options.homeTeamId,
      },
      {
        statKey: 'points',
        awayValue: 58,
        homeValue: 65,
        winnerTeamId: options.homeTeamId,
      },
      {
        statKey: 'saves',
        awayValue: 118,
        homeValue: 121,
        winnerTeamId: options.homeTeamId,
      },
      {
        statKey: 'gaa',
        awayValue: 2.61,
        homeValue: 2.18,
        winnerTeamId: options.homeTeamId,
      },
    ],
    rates: {
      winRate: 0.5,
      deservedToWinRate: 0.56,
    },
    factors: {
      homeTeam: {
        offence: 0.57,
        physical: 0.54,
        goalies: 0.48,
      },
      awayTeam: {
        offence: 0.43,
        physical: 0.46,
        goalies: 0.52,
      },
    },
  };
}
