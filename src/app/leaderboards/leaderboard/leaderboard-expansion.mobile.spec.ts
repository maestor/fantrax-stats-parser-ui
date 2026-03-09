import { fireEvent, render, screen } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ApiService } from '@services/api.service';
import { ViewportService } from '@services/viewport.service';
import { provideDisabledMaterialAnimations } from '../../testing/behavior-test-utils';
import { LeaderboardRegularComponent } from '../regular/leaderboard-regular.component';

describe('Leaderboard expansion behavior on mobile', () => {
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
});
