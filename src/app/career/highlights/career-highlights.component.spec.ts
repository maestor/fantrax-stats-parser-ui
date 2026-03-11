import { fireEvent, render, screen, within } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ApiService, CareerHighlightType } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import {
  mostTeamsPlayedHighlightsPage0Fixture,
  mostTeamsPlayedHighlightsPage1Fixture,
  provideDisabledMaterialAnimations,
  sameTeamSeasonsHighlightsPage0Fixture,
} from '../../testing/behavior-test-utils';
import { CareerHighlightsComponent } from './career-highlights.component';

describe('CareerHighlightsComponent', () => {
  it('renders both highlight cards and pages the first card forward', async () => {
    const getCareerHighlights = vi.fn(
      (type: CareerHighlightType, skip = 0) => {
        if (type === 'most-teams-played') {
          return of(
            skip >= 10
              ? mostTeamsPlayedHighlightsPage1Fixture
              : mostTeamsPlayedHighlightsPage0Fixture
          );
        }

        return of(sameTeamSeasonsHighlightsPage0Fixture);
      }
    );

    await render(CareerHighlightsComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        FooterVisibilityService,
        {
          provide: ApiService,
          useValue: {
            getCareerHighlights,
          },
        },
      ],
    });

    expect(
      await screen.findByRole('heading', { name: 'career.highlights.cards.mostTeamsPlayed.title' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'career.highlights.cards.sameTeamSeasonsPlayed.title',
      })
    ).toBeInTheDocument();
    const mostTeamsCardTitle = screen.getByRole('heading', {
      name: 'career.highlights.cards.mostTeamsPlayed.title',
    });
    const mostTeamsCard = mostTeamsCardTitle.closest('mat-card') as HTMLElement | null;

    expect(mostTeamsCard).not.toBeNull();
    expect(within(mostTeamsCard!).getByText('F Jamie Benn')).toBeInTheDocument();
    expect(screen.getByText('D Victor Hedman')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'tableCard.nextPage' })[0]);

    expect(await within(mostTeamsCard!).findByText('F Anthony Duclair')).toBeInTheDocument();
    expect(within(mostTeamsCard!).queryByText('F Jamie Benn')).not.toBeInTheDocument();
    expect(getCareerHighlights).toHaveBeenCalledWith('most-teams-played', 10, 10);
  });

  it('shows an error state for a failing card without hiding the successful card', async () => {
    await render(CareerHighlightsComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        FooterVisibilityService,
        {
          provide: ApiService,
          useValue: {
            getCareerHighlights: (type: CareerHighlightType) =>
              type === 'same-team-seasons-played'
                ? throwError(() => new Error('same team highlights failed'))
                : of(mostTeamsPlayedHighlightsPage0Fixture),
          },
        },
      ],
    });

    expect(await screen.findByText('F Jamie Benn')).toBeInTheDocument();
    expect(screen.getByText('tableCard.apiUnavailable')).toBeInTheDocument();
  });
});
