import { fireEvent, render, screen, within } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ApiService, CareerHighlightType } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import {
  mostTeamsOwnedHighlightsPage0Fixture,
  mostTeamsPlayedHighlightsPage0Fixture,
  mostTeamsPlayedHighlightsPage1Fixture,
  provideDisabledMaterialAnimations,
  sameTeamSeasonsOwnedHighlightsPage0Fixture,
  sameTeamSeasonsHighlightsPage0Fixture,
} from '../../testing/behavior-test-utils';
import { CareerHighlightsComponent } from './career-highlights.component';

describe('CareerHighlightsComponent', () => {
  it('renders all configured highlight cards and pages the first card forward', async () => {
    const getCareerHighlights = vi.fn(
      (type: CareerHighlightType, skip = 0) => {
        switch (type) {
          case 'most-teams-played':
            return of(
              skip >= 10
                ? mostTeamsPlayedHighlightsPage1Fixture
                : mostTeamsPlayedHighlightsPage0Fixture
            );
          case 'most-teams-owned':
            return of(mostTeamsOwnedHighlightsPage0Fixture);
          case 'same-team-seasons-played':
            return of(sameTeamSeasonsHighlightsPage0Fixture);
          case 'same-team-seasons-owned':
            return of(sameTeamSeasonsOwnedHighlightsPage0Fixture);
        }
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
        name: 'career.highlights.cards.mostTeamsOwned.title',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'career.highlights.cards.sameTeamSeasonsPlayed.title',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'career.highlights.cards.sameTeamSeasonsOwned.title',
      })
    ).toBeInTheDocument();
    const mostTeamsCardTitle = screen.getByRole('heading', {
      name: 'career.highlights.cards.mostTeamsPlayed.title',
    });
    const sameTeamPlayedCardTitle = screen.getByRole('heading', {
      name: 'career.highlights.cards.sameTeamSeasonsPlayed.title',
    });
    const mostTeamsCard = mostTeamsCardTitle.closest('mat-card') as HTMLElement | null;
    const sameTeamPlayedCard = sameTeamPlayedCardTitle.closest('mat-card') as HTMLElement | null;

    expect(mostTeamsCard).not.toBeNull();
    expect(sameTeamPlayedCard).not.toBeNull();
    expect(within(mostTeamsCard!).getByText('F Jamie Benn')).toBeInTheDocument();
    expect(within(sameTeamPlayedCard!).getByText('D Victor Hedman')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'tableCard.nextPage' })[0]);

    expect(await within(mostTeamsCard!).findByText('F Anthony Duclair')).toBeInTheDocument();
    expect(within(mostTeamsCard!).queryByText('F Jamie Benn')).not.toBeInTheDocument();
    expect(getCareerHighlights).toHaveBeenCalledWith('most-teams-played', 10, 10);
  });

  it('shows an error state for a failing card without hiding the successful cards', async () => {
    await render(CareerHighlightsComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        FooterVisibilityService,
        {
          provide: ApiService,
          useValue: {
            getCareerHighlights: (type: CareerHighlightType) =>
              type === 'same-team-seasons-owned'
                ? throwError(() => new Error('same team owned highlights failed'))
                : of(
                  type === 'most-teams-owned'
                    ? mostTeamsOwnedHighlightsPage0Fixture
                    : type === 'same-team-seasons-played'
                      ? sameTeamSeasonsHighlightsPage0Fixture
                      : mostTeamsPlayedHighlightsPage0Fixture
                ),
          },
        },
      ],
    });

    const mostTeamsPlayedCardTitle = await screen.findByRole('heading', {
      name: 'career.highlights.cards.mostTeamsPlayed.title',
    });
    const mostTeamsOwnedCardTitle = screen.getByRole('heading', {
      name: 'career.highlights.cards.mostTeamsOwned.title',
    });
    const sameTeamOwnedCardTitle = screen.getByRole('heading', {
      name: 'career.highlights.cards.sameTeamSeasonsOwned.title',
    });

    const mostTeamsPlayedCard = mostTeamsPlayedCardTitle.closest('mat-card') as HTMLElement | null;
    const mostTeamsOwnedCard = mostTeamsOwnedCardTitle.closest('mat-card') as HTMLElement | null;
    const sameTeamOwnedCard = sameTeamOwnedCardTitle.closest('mat-card') as HTMLElement | null;

    expect(mostTeamsPlayedCard).not.toBeNull();
    expect(mostTeamsOwnedCard).not.toBeNull();
    expect(sameTeamOwnedCard).not.toBeNull();
    expect(within(mostTeamsPlayedCard!).getByText('F Jamie Benn')).toBeInTheDocument();
    expect(within(mostTeamsOwnedCard!).getByText('G Andrei Vasilevskiy')).toBeInTheDocument();
    expect(within(sameTeamOwnedCard!).getByText('tableCard.apiUnavailable')).toBeInTheDocument();
  });
});
