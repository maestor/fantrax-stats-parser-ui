import { fireEvent, render, screen } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ApiService } from '@services/api.service';
import { ViewportService } from '@services/viewport.service';
import { provideDisabledMaterialAnimations } from '../../testing/behavior-test-utils';
import { LeaderboardPlayoffsComponent } from '../playoffs/leaderboard-playoffs.component';
import { LeaderboardRegularComponent } from '../regular/leaderboard-regular.component';
import { LeaderboardTransactionsComponent } from '../transactions/leaderboard-transactions.component';

describe('Leaderboard expansion behavior on mobile', () => {
  beforeEach(() => {
    localStorage.setItem('fantrax.settings', JSON.stringify({
      selectedTeamId: '99',
      startFromSeason: null,
      season: null,
      reportType: 'regular',
      disableSelectedTeamHighlight: true,
    }));
  });

  it('uses short season labels', async () => {
    await render(LeaderboardRegularComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        {
          provide: ViewportService,
          useValue: {
            isMobile$: of(true),
          },
        },
        {
          provide: ApiService,
          useValue: {
            getLeaderboardRegular: () => of([
              {
                teamId: '1',
                teamName: 'Colorado Avalanche',
                regularTrophies: 1,
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

    await screen.findByText('24-25');
  });

  it('uses short season labels for playoff details', async () => {
    await render(LeaderboardPlayoffsComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        {
          provide: ViewportService,
          useValue: {
            isMobile$: of(true),
          },
        },
        {
          provide: ApiService,
          useValue: {
            getLeaderboardPlayoffs: () => of([
              {
                teamId: '1',
                teamName: 'Colorado Avalanche',
                championships: 1,
                finals: 1,
                conferenceFinals: 1,
                secondRound: 1,
                firstRound: 1,
                appearances: 1,
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

    await screen.findByText('24-25');
    expect(screen.getByText('leaderboards.round.championship')).toBeInTheDocument();
  });

  it('uses short season labels for transaction details and keeps newest seasons first', async () => {
    await render(LeaderboardTransactionsComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        {
          provide: ViewportService,
          useValue: {
            isMobile$: of(true),
          },
        },
        {
          provide: ApiService,
          useValue: {
            getLeaderboardTransactions: () => of([
              {
                teamId: '1',
                teamName: 'Colorado Avalanche',
                players: 56,
                goalies: 8,
                trades: 11,
                claims: 29,
                drops: 25,
                tieRank: false,
                seasons: [
                  { season: 2023, trades: 4, claims: 14, drops: 12, players: 25, goalies: 3 },
                  { season: 2024, trades: 7, claims: 15, drops: 13, players: 31, goalies: 5 },
                ],
              },
            ]),
          },
        },
      ],
    });

    const team = await screen.findByText('Colorado Avalanche');
    fireEvent.click(team.closest('tr') as HTMLElement);

    const seasonLabels = await screen.findAllByText(/\d{2}-\d{2}/);
    expect(seasonLabels.map((label) => label.textContent)).toEqual(['24-25', '23-24']);
    expect(screen.getByText('🤝 7 | ✅ 15 | ❌ 13 | 🏒 31 | 🥅 5')).toBeInTheDocument();
  });
});
