import { fireEvent, render, screen, within } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ApiService, CareerHighlightType } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import {
  mostClaimsHighlightsPage0Fixture,
  mostDropsHighlightsPage0Fixture,
  mostTradesHighlightsPage0Fixture,
  mostStanleyCupsHighlightsPage0Fixture,
  mostTeamsOwnedHighlightsPage0Fixture,
  mostTeamsPlayedHighlightsPage0Fixture,
  mostTeamsPlayedHighlightsPage1Fixture,
  provideDisabledMaterialAnimations,
  regularGrinderWithoutPlayoffsHighlightsPage0Fixture,
  stashKingHighlightsPage0Fixture,
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
          case 'most-stanley-cups':
            return of(mostStanleyCupsHighlightsPage0Fixture);
          case 'regular-grinder-without-playoffs':
            return of(regularGrinderWithoutPlayoffsHighlightsPage0Fixture);
          case 'stash-king':
            return of(stashKingHighlightsPage0Fixture);
          case 'most-trades':
            return of(mostTradesHighlightsPage0Fixture);
          case 'most-claims':
            return of(mostClaimsHighlightsPage0Fixture);
          case 'most-drops':
            return of(mostDropsHighlightsPage0Fixture);
          case 'reunion-king':
            throw new Error('reunion-king should not be requested by the UI');
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
        name: 'career.highlights.cards.mostStanleyCups.title',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'career.highlights.cards.regularGrinderWithoutPlayoffs.title',
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
    expect(
      screen.getByRole('heading', {
        name: 'career.highlights.cards.stashKing.title',
      })
    ).toBeInTheDocument();

    await vi.waitFor(() => {
      expect(FakeIntersectionObserver.instances).toHaveLength(7);
    });

    expect(getCareerHighlights).not.toHaveBeenCalled();
    expect(screen.getAllByText('tableCard.loadWhenVisible')).toHaveLength(7);

    FakeIntersectionObserver.instances[0]?.trigger();
    FakeIntersectionObserver.instances[2]?.trigger();

    const mostTeamsCardTitle = screen.getByRole('heading', {
      name: 'career.highlights.cards.mostTeamsPlayed.title',
    });
    const stanleyCupCardTitle = screen.getByRole('heading', {
      name: 'career.highlights.cards.mostStanleyCups.title',
    });
    const mostTeamsCard = mostTeamsCardTitle.closest('mat-card') as HTMLElement | null;
    const stanleyCupCard = stanleyCupCardTitle.closest('mat-card') as HTMLElement | null;

    expect(mostTeamsCard).not.toBeNull();
    expect(stanleyCupCard).not.toBeNull();
    expect(await within(mostTeamsCard!).findByText('F Jamie Benn')).toBeInTheDocument();
    expect(await within(stanleyCupCard!).findByText('F Patrick Maroon')).toBeInTheDocument();
    expect(getCareerHighlights).toHaveBeenCalledTimes(2);
    expect(getCareerHighlights).toHaveBeenNthCalledWith(1, 'most-stanley-cups', 0, 10);
    expect(getCareerHighlights).toHaveBeenNthCalledWith(2, 'most-teams-played', 0, 10);
    expect(within(stanleyCupCard!).getByText('💍')).toBeInTheDocument();
    expect(within(stanleyCupCard!).getByText('3')).toBeInTheDocument();
    expect(within(stanleyCupCard!).queryByText('D Victor Hedman')).not.toBeInTheDocument();

    FakeIntersectionObserver.instances[4]?.trigger();

    const sameTeamPlayedCardTitle = screen.getByRole('heading', {
      name: 'career.highlights.cards.sameTeamSeasonsPlayed.title',
    });
    const sameTeamPlayedCard = sameTeamPlayedCardTitle.closest('mat-card') as HTMLElement | null;

    expect(sameTeamPlayedCard).not.toBeNull();
    expect(await within(sameTeamPlayedCard!).findByText('D Victor Hedman')).toBeInTheDocument();
    expect(getCareerHighlights).toHaveBeenCalledWith('same-team-seasons-played', 0, 10);

    fireEvent.click(within(mostTeamsCard!).getByRole('button', { name: 'tableCard.nextPage' }));

    expect(await within(mostTeamsCard!).findByText('F Anthony Duclair')).toBeInTheDocument();
    expect(within(mostTeamsCard!).queryByText('F Jamie Benn')).not.toBeInTheDocument();
    expect(getCareerHighlights).toHaveBeenCalledWith('most-teams-played', 10, 10);
  });

  it('switches to transactions and preserves per-team tooltip lines in API order', async () => {
    const getCareerHighlights = vi.fn((type: CareerHighlightType) => {
      switch (type) {
        case 'most-teams-played':
          return of(mostTeamsPlayedHighlightsPage0Fixture);
        case 'most-teams-owned':
          return of(mostTeamsOwnedHighlightsPage0Fixture);
        case 'same-team-seasons-played':
          return of(sameTeamSeasonsHighlightsPage0Fixture);
        case 'same-team-seasons-owned':
          return of(sameTeamSeasonsOwnedHighlightsPage0Fixture);
        case 'most-stanley-cups':
          return of(mostStanleyCupsHighlightsPage0Fixture);
        case 'regular-grinder-without-playoffs':
          return of(regularGrinderWithoutPlayoffsHighlightsPage0Fixture);
        case 'stash-king':
          return of(stashKingHighlightsPage0Fixture);
        case 'most-trades':
          return of(mostTradesHighlightsPage0Fixture);
        case 'most-claims':
          return of(mostClaimsHighlightsPage0Fixture);
        case 'most-drops':
          return of(mostDropsHighlightsPage0Fixture);
        case 'reunion-king':
          throw new Error('reunion-king should not be requested by the UI');
      }
    });

    const view = await render(CareerHighlightsComponent, {
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

    await vi.waitFor(() => {
      expect(FakeIntersectionObserver.instances).toHaveLength(7);
    });

    fireEvent.click(
      screen.getByRole('radio', {
        name: 'career.highlights.sections.transactions',
      }),
    );

    expect(
      screen.queryByRole('heading', {
        name: 'career.highlights.cards.mostTeamsPlayed.title',
      }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        name: 'career.highlights.cards.mostTrades.title',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'career.highlights.cards.mostClaims.title',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'career.highlights.cards.mostDrops.title',
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('tableCard.loadWhenVisible')).toHaveLength(3);

    const transactionObservers = FakeIntersectionObserver.instances.slice(-3);
    transactionObservers[0]?.trigger();

    const tradesCardTitle = screen.getByRole('heading', {
      name: 'career.highlights.cards.mostTrades.title',
    });
    const tradesCard = tradesCardTitle.closest('mat-card') as HTMLElement | null;

    expect(tradesCard).not.toBeNull();
    expect(await within(tradesCard!).findByText('F Mike Hoffman')).toBeInTheDocument();
    expect(within(tradesCard!).getByText('6')).toBeInTheDocument();
    expect(getCareerHighlights).toHaveBeenCalledWith('most-trades', 0, 10);

    const tradesState = view.fixture.componentInstance
      .cards()
      .find((card) => card.type === 'most-trades')?.state;

    expect(tradesState?.rows[0]?.detailLines).toEqual([
      'Colorado Avalanche 3',
      'Dallas Stars 2',
      'Carolina Hurricanes 1',
    ]);
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
                    : type === 'most-stanley-cups'
                      ? mostStanleyCupsHighlightsPage0Fixture
                      : type === 'regular-grinder-without-playoffs'
                        ? regularGrinderWithoutPlayoffsHighlightsPage0Fixture
                        : type === 'stash-king'
                          ? stashKingHighlightsPage0Fixture
                          : type === 'most-trades'
                            ? mostTradesHighlightsPage0Fixture
                            : type === 'most-claims'
                              ? mostClaimsHighlightsPage0Fixture
                              : type === 'most-drops'
                                ? mostDropsHighlightsPage0Fixture
                    : type === 'same-team-seasons-played'
                      ? sameTeamSeasonsHighlightsPage0Fixture
                      : mostTeamsPlayedHighlightsPage0Fixture
                ),
          },
        },
      ],
    });

    await vi.waitFor(() => {
      expect(FakeIntersectionObserver.instances).toHaveLength(7);
    });

    FakeIntersectionObserver.instances[2]?.trigger();
    FakeIntersectionObserver.instances[5]?.trigger();

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
