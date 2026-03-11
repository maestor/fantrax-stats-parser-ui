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

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  private target: Element | null = null;

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.target = target;
  }

  disconnect(): void {
    this.target = null;
  }

  unobserve(target: Element): void {
    if (this.target === target) {
      this.target = null;
    }
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(isIntersecting = true, visibleHeight = 260, targetHeight = 320): void {
    if (!this.target) {
      return;
    }

    this.callback(
      [
        {
          isIntersecting,
          intersectionRatio: isIntersecting ? visibleHeight / targetHeight : 0,
          intersectionRect: { height: isIntersecting ? visibleHeight : 0 } as DOMRectReadOnly,
          boundingClientRect: { height: targetHeight } as DOMRectReadOnly,
          target: this.target,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    );
  }
}

describe('CareerHighlightsComponent', () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal(
      'IntersectionObserver',
      FakeIntersectionObserver as unknown as typeof IntersectionObserver,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads only activated cards first and fetches additional cards when they approach the viewport', async () => {
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

    await vi.waitFor(() => {
      expect(FakeIntersectionObserver.instances).toHaveLength(4);
    });

    expect(getCareerHighlights).not.toHaveBeenCalled();
    expect(screen.getAllByText('tableCard.loadWhenVisible')).toHaveLength(4);

    FakeIntersectionObserver.instances[0]?.trigger();
    FakeIntersectionObserver.instances[1]?.trigger();

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
    expect(await within(mostTeamsCard!).findByText('F Jamie Benn')).toBeInTheDocument();
    expect(screen.getByText('G Andrei Vasilevskiy')).toBeInTheDocument();
    expect(getCareerHighlights).toHaveBeenCalledTimes(2);
    expect(getCareerHighlights).toHaveBeenNthCalledWith(1, 'most-teams-played', 0, 10);
    expect(getCareerHighlights).toHaveBeenNthCalledWith(2, 'most-teams-owned', 0, 10);
    expect(within(sameTeamPlayedCard!).queryByText('D Victor Hedman')).not.toBeInTheDocument();

    FakeIntersectionObserver.instances[2]?.trigger();

    expect(await within(sameTeamPlayedCard!).findByText('D Victor Hedman')).toBeInTheDocument();
    expect(getCareerHighlights).toHaveBeenCalledWith('same-team-seasons-played', 0, 10);

    fireEvent.click(screen.getAllByRole('button', { name: 'tableCard.nextPage' })[0]);

    expect(await within(mostTeamsCard!).findByText('F Anthony Duclair')).toBeInTheDocument();
    expect(within(mostTeamsCard!).queryByText('F Jamie Benn')).not.toBeInTheDocument();
    expect(getCareerHighlights).toHaveBeenCalledWith('most-teams-played', 10, 10);
  });

  it('shows an error state for an activated failing card without forcing untouched cards to load', async () => {
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

    await vi.waitFor(() => {
      expect(FakeIntersectionObserver.instances).toHaveLength(4);
    });

    FakeIntersectionObserver.instances[0]?.trigger();
    FakeIntersectionObserver.instances[3]?.trigger();

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
    expect(await within(mostTeamsPlayedCard!).findByText('F Jamie Benn')).toBeInTheDocument();
    expect(within(mostTeamsOwnedCard!).getByText('tableCard.loadWhenVisible')).toBeInTheDocument();
    expect(within(sameTeamOwnedCard!).getByText('tableCard.apiUnavailable')).toBeInTheDocument();
  });
});
