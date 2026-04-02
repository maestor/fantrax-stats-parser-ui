import { fireEvent, render, screen, within } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ApiService } from '@services/api.service';
import { ViewportService } from '@services/viewport.service';
import { provideDisabledMaterialAnimations } from '../../testing/behavior-test-utils';
import { LeaderboardPlayoffsComponent } from '../playoffs/leaderboard-playoffs.component';
import { LeaderboardRegularComponent } from '../regular/leaderboard-regular.component';
import { LeaderboardTransactionsComponent } from '../transactions/leaderboard-transactions.component';

describe('Leaderboard expansion behavior', () => {
  beforeEach(() => {
    localStorage.setItem('fantrax.settings', JSON.stringify({
      selectedTeamId: '99',
      startFromSeason: null,
      season: null,
      reportType: 'regular',
      disableSelectedTeamHighlight: true,
    }));
  });

  it('renders regular season expansion with percent formatting and trophy mapping', async () => {
    await render(LeaderboardRegularComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        {
          provide: ViewportService,
          useValue: {
            isMobile$: of(false),
          },
        },
        {
          provide: ApiService,
          useValue: {
            getLeaderboardRegular: () => of([
              {
                teamId: '1',
                teamName: 'Colorado Avalanche',
                regularTrophies: 2,
                points: 1000,
                wins: 500,
                losses: 200,
                ties: 50,
                pointsPercent: 0.7,
                winPercent: 0.65,
                divWins: 0,
                divLosses: 0,
                divTies: 0,
                divWinPercent: 0.5,
                tieRank: false,
                seasons: [
                  {
                    season: 2024,
                    regularTrophy: true,
                    points: 823,
                    wins: 380,
                    losses: 127,
                    ties: 63,
                    pointsPercent: 0.722,
                    winPercent: 0.667,
                    divWins: 0,
                    divLosses: 0,
                    divTies: 0,
                    divWinPercent: 0.5,
                  },
                  {
                    season: 2023,
                    regularTrophy: true,
                    points: 900,
                    wins: 390,
                    losses: 120,
                    ties: 60,
                    pointsPercent: 0.731,
                    winPercent: 0.671,
                    divWins: 0,
                    divLosses: 0,
                    divTies: 0,
                    divWinPercent: 0.5,
                  },
                  {
                    season: 2022,
                    regularTrophy: false,
                    points: 700,
                    wins: 320,
                    losses: 150,
                    ties: 50,
                    pointsPercent: 0.61,
                    winPercent: 0.59,
                    divWins: 0,
                    divLosses: 0,
                    divTies: 0,
                    divWinPercent: 0.5,
                  },
                ],
              },
            ]),
            getLeaderboardPlayoffs: () => of([]),
          },
        },
      ],
    });

    const team = await screen.findByText('Colorado Avalanche');
    fireEvent.click(team.closest('tr') as HTMLElement);

    await screen.findByText('2024-25');
    expect(screen.getByText(/P%: 72,2/)).toBeInTheDocument();

    const detailRow = document.querySelector('tr.expanded-detail-row') as HTMLElement;
    expect(detailRow).toBeTruthy();
    const trophies = detailRow.textContent?.match(/🏆/g) ?? [];
    expect(trophies.length).toBe(2);
  });

  it('renders playoffs expansion with trophy only for championship seasons', async () => {
    await render(LeaderboardPlayoffsComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        {
          provide: ViewportService,
          useValue: {
            isMobile$: of(false),
          },
        },
        {
          provide: ApiService,
          useValue: {
            getLeaderboardRegular: () => of([]),
            getLeaderboardPlayoffs: () => of([
              {
                teamId: '1',
                teamName: 'Colorado Avalanche',
                championships: 1,
                finals: 2,
                conferenceFinals: 3,
                secondRound: 4,
                firstRound: 5,
                appearances: 6,
                tieRank: false,
                seasons: [
                  { season: 2024, round: 5, key: 'championship' },
                  { season: 2023, round: 2, key: 'secondRound' },
                ],
              },
            ]),
          },
        },
      ],
    });

    const team = await screen.findByText('Colorado Avalanche');
    fireEvent.click(team.closest('tr') as HTMLElement);

    await screen.findByText('leaderboards.round.championship');
    await screen.findByText('leaderboards.round.secondRound');

    const detailRow = document.querySelector('tr.expanded-detail-row') as HTMLElement;
    expect(detailRow).toBeTruthy();
    const trophies = detailRow.textContent?.match(/🏆/g) ?? [];
    expect(trophies.length).toBe(1);
  });

  it('leaves the displayed rank blank for tied playoff rows', async () => {
    await render(LeaderboardPlayoffsComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        {
          provide: ViewportService,
          useValue: {
            isMobile$: of(false),
          },
        },
        {
          provide: ApiService,
          useValue: {
            getLeaderboardRegular: () => of([]),
            getLeaderboardPlayoffs: () => of([
              {
                teamId: '1',
                teamName: 'Colorado Avalanche',
                championships: 3,
                finals: 3,
                conferenceFinals: 3,
                secondRound: 3,
                firstRound: 3,
                appearances: 3,
                tieRank: false,
                seasons: [],
              },
              {
                teamId: '2',
                teamName: 'Dallas Stars',
                championships: 2,
                finals: 2,
                conferenceFinals: 2,
                secondRound: 2,
                firstRound: 2,
                appearances: 2,
                tieRank: true,
                seasons: [],
              },
              {
                teamId: '3',
                teamName: 'Edmonton Oilers',
                championships: 1,
                finals: 1,
                conferenceFinals: 1,
                secondRound: 1,
                firstRound: 1,
                appearances: 1,
                tieRank: false,
                seasons: [],
              },
            ]),
          },
        },
      ],
    });

    await screen.findByText('Colorado Avalanche');

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);

    const [firstRank, secondRank, thirdRank] = rows.map((row) =>
      within(row).getAllByRole('cell')[0]?.textContent?.trim() ?? ''
    );

    expect(firstRank).toBe('1');
    expect(secondRank).toBe('');
    expect(thirdRank).toBe('3');
  });

  it('renders transactions expansion with incremental ranks even when the API marks a tie', async () => {
    await render(LeaderboardTransactionsComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        {
          provide: ViewportService,
          useValue: {
            isMobile$: of(false),
          },
        },
        {
          provide: ApiService,
          useValue: {
            getLeaderboardRegular: () => of([]),
            getLeaderboardPlayoffs: () => of([]),
            getLeaderboardTransactions: () => of([
              {
                teamId: '1',
                teamName: 'Colorado Avalanche',
                players: 77,
                goalies: 10,
                trades: 18,
                claims: 42,
                drops: 39,
                tieRank: false,
                seasons: [
                  { season: 2024, trades: 7, claims: 15, drops: 13, players: 31, goalies: 4 },
                  { season: 2023, trades: 6, claims: 14, drops: 13, players: 25, goalies: 3 },
                ],
              },
              {
                teamId: '2',
                teamName: 'Dallas Stars',
                players: 79,
                goalies: 11,
                trades: 18,
                claims: 42,
                drops: 39,
                tieRank: true,
                seasons: [
                  { season: 2024, trades: 8, claims: 16, drops: 15, players: 33, goalies: 4 },
                ],
              },
              {
                teamId: '3',
                teamName: 'Edmonton Oilers',
                players: 60,
                goalies: 8,
                trades: 11,
                claims: 29,
                drops: 25,
                tieRank: false,
                seasons: [
                  { season: 2024, trades: 5, claims: 12, drops: 10, players: 25, goalies: 3 },
                ],
              },
            ]),
          },
        },
      ],
    });

    await screen.findByText('Colorado Avalanche');
    const headerTexts = screen.getAllByRole('columnheader').map((header) =>
      header.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    );
    expect(headerTexts).toEqual([
      'tableColumnShort.displayPosition',
      'tableColumnShort.teamName',
      '🤝 tableColumnShort.trades',
      '✅ tableColumnShort.claims',
      '❌ tableColumnShort.drops',
      '🏒 tableColumnShort.players',
      '🥅 tableColumnShort.goalies',
    ]);

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);

    const [firstRank, secondRank, thirdRank] = rows.map((row) =>
      within(row).getAllByRole('cell')[0]?.textContent?.trim() ?? ''
    );

    expect(firstRank).toBe('1');
    expect(secondRank).toBe('2');
    expect(thirdRank).toBe('3');

    const team = screen.getByText('Dallas Stars');
    fireEvent.click(team.closest('tr') as HTMLElement);

    await screen.findByText('2024-25');
    expect(screen.getByText('🤝 8 | ✅ 16 | ❌ 15 | 🏒 33 | 🥅 4')).toBeInTheDocument();
  });

  it('focuses the shared selected team without auto-expanding it when team highlighting is enabled', async () => {
    localStorage.setItem('fantrax.settings', JSON.stringify({
      selectedTeamId: '2',
      startFromSeason: null,
      season: null,
      reportType: 'regular',
      disableSelectedTeamHighlight: false,
    }));

    await render(LeaderboardRegularComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        {
          provide: ViewportService,
          useValue: {
            isMobile$: of(false),
          },
        },
        {
          provide: ApiService,
          useValue: {
            getLeaderboardRegular: () => of([
              {
                teamId: '1',
                teamName: 'Colorado Avalanche',
                regularTrophies: 2,
                points: 1000,
                wins: 500,
                losses: 200,
                ties: 50,
                pointsPercent: 0.7,
                winPercent: 0.65,
                divWins: 0,
                divLosses: 0,
                divTies: 0,
                divWinPercent: 0.5,
                tieRank: false,
                seasons: [],
              },
              {
                teamId: '2',
                teamName: 'Dallas Stars',
                regularTrophies: 1,
                points: 950,
                wins: 480,
                losses: 210,
                ties: 45,
                pointsPercent: 0.68,
                winPercent: 0.62,
                divWins: 0,
                divLosses: 0,
                divTies: 0,
                divWinPercent: 0.5,
                tieRank: false,
                seasons: [
                  {
                    season: 2024,
                    regularTrophy: false,
                    points: 500,
                    wins: 250,
                    losses: 100,
                    ties: 20,
                    pointsPercent: 0.7,
                    winPercent: 0.68,
                    divWins: 0,
                    divLosses: 0,
                    divTies: 0,
                    divWinPercent: 0.5,
                  },
                ],
              },
            ]),
            getLeaderboardPlayoffs: () => of([]),
          },
        },
      ],
    });

    await vi.waitFor(() => {
      const dallasRow = screen.getByText('Dallas Stars').closest('tr');

      expect(dallasRow).not.toBeNull();
      expect(dallasRow).toHaveAttribute('aria-expanded', 'false');
      expect(dallasRow).toHaveAttribute('tabindex', '0');
      expect(dallasRow).toHaveClass('a11y-active');
    });
    expect(screen.queryByText('2024-25')).toBeNull();
  });
});
