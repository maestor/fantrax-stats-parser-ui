import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { fireEvent, render, screen } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ApiService } from '@services/api.service';
import { ViewportService } from '@services/viewport.service';
import { LeaderboardPlayoffsComponent } from '../playoffs/leaderboard-playoffs.component';
import { LeaderboardRegularComponent } from '../regular/leaderboard-regular.component';

describe('Leaderboard expansion behavior', () => {
  it('renders regular season expansion with percent formatting and trophy mapping', async () => {
    await render(LeaderboardRegularComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideNoopAnimations(),
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
        provideNoopAnimations(),
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
});
