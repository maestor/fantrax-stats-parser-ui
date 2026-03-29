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
  reunionKingHighlightsPage0Fixture,
  stashKingHighlightsPage0Fixture,
  sameTeamSeasonsOwnedHighlightsPage0Fixture,
  sameTeamSeasonsHighlightsPage0Fixture,
} from '../../testing/behavior-test-utils';
import {
  CAREER_HIGHLIGHT_CARD_TYPES,
  CAREER_HIGHLIGHT_SECTIONS,
} from './career-highlights.constants';
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

const mostTeamsPlayedHighlightsFullFixture = {
  ...mostTeamsPlayedHighlightsPage0Fixture,
  skip: 0,
  take: 21,
  items: [
    ...mostTeamsPlayedHighlightsPage0Fixture.items,
    ...mostTeamsPlayedHighlightsPage1Fixture.items,
  ],
};

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

  it('renders grouped sections, lazy-loads cards on viewport entry, and applies tied ranks across paged career rows', async () => {
    const getCareerHighlights = vi.fn(
      (type: CareerHighlightType, _skip = 0, take = 10) => {
        switch (type) {
          case 'most-teams-played':
            return of(
              take > 11
                ? mostTeamsPlayedHighlightsFullFixture
                : mostTeamsPlayedHighlightsPage0Fixture,
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
            return of(reunionKingHighlightsPage0Fixture);
        }
      },
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
      await screen.findByRole('button', {
        name: 'career.highlights.sections.achievements.title',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'career.highlights.sections.journeys.title',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'career.highlights.sections.longStays.title',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'career.highlights.sections.transactions.title',
      }),
    ).toBeInTheDocument();

    await vi.waitFor(() => {
      expect(FakeIntersectionObserver.instances).toHaveLength(CAREER_HIGHLIGHT_CARD_TYPES.length);
    });

    expect(getCareerHighlights).not.toHaveBeenCalled();
    expect(screen.getAllByText('tableCard.loadWhenVisible')).toHaveLength(
      CAREER_HIGHLIGHT_CARD_TYPES.length,
    );

    FakeIntersectionObserver.instances[0]?.trigger();
    FakeIntersectionObserver.instances[9]?.trigger();

    const mostTeamsCard = screen.getByRole('heading', {
      name: 'career.highlights.cards.mostTeamsPlayed.title',
    }).closest('mat-card') as HTMLElement | null;
    const stanleyCupCard = screen.getByRole('heading', {
      name: 'career.highlights.cards.mostStanleyCups.title',
    }).closest('mat-card') as HTMLElement | null;

    expect(mostTeamsCard).not.toBeNull();
    expect(stanleyCupCard).not.toBeNull();
    expect(await within(mostTeamsCard!).findByText('F Jamie Benn')).toBeInTheDocument();
    expect(within(mostTeamsCard!).getAllByText('T1.')).toHaveLength(2);
    expect(await within(stanleyCupCard!).findByText('F Patrick Maroon')).toBeInTheDocument();
    expect(within(stanleyCupCard!).getByLabelText('career.highlights.columnHelp.cups')).toBeInTheDocument();

    expect(getCareerHighlights).toHaveBeenNthCalledWith(1, 'most-stanley-cups', 0, 11);
    expect(getCareerHighlights).toHaveBeenNthCalledWith(2, 'most-teams-played', 0, 11);

    fireEvent.click(within(mostTeamsCard!).getByRole('button', {
      name: /career\.highlights\.cards\.mostTeamsPlayed\.title.*tableCard\.next/,
    }));

    expect(await within(mostTeamsCard!).findByText('F Anthony Duclair')).toBeInTheDocument();
    expect(within(mostTeamsCard!).queryByText('F Jamie Benn')).not.toBeInTheDocument();
    expect(within(mostTeamsCard!).getAllByText('T7.')).toHaveLength(2);
    expect(getCareerHighlights).toHaveBeenLastCalledWith('most-teams-played', 0, 21);
  });

  it('keeps all grouped sections visible, scrolls jump navigation to the target section, and preserves transaction tooltip ordering', async () => {
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
          return of(reunionKingHighlightsPage0Fixture);
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
      expect(FakeIntersectionObserver.instances).toHaveLength(CAREER_HIGHLIGHT_CARD_TYPES.length);
    });

    expect(
      screen.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent?.trim()),
    ).toEqual(CAREER_HIGHLIGHT_SECTIONS.map((section) => section.titleKey));

    const transactionsSection = view.fixture.nativeElement.querySelector(
      '#career-highlights-section-transactions',
    ) as HTMLElement | null;

    expect(transactionsSection).not.toBeNull();

    const scrollIntoView = vi.fn();
    Object.defineProperty(transactionsSection, 'scrollIntoView', {
      value: scrollIntoView,
      configurable: true,
    });

    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    fireEvent.click(screen.getByRole('button', {
      name: 'career.highlights.sections.transactions.title',
    }));

    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      '',
      `${window.location.pathname}${window.location.search}#career-highlights-section-transactions`,
    );
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'start',
      inline: 'nearest',
      behavior: 'smooth',
    });

    FakeIntersectionObserver.instances[2]?.trigger();
    FakeIntersectionObserver.instances[5]?.trigger();

    const tradesCard = screen.getByRole('heading', {
      name: 'career.highlights.cards.mostTrades.title',
    }).closest('mat-card') as HTMLElement | null;

    expect(tradesCard).not.toBeNull();
    expect(await within(tradesCard!).findByText('F Mike Hoffman')).toBeInTheDocument();
    expect(within(tradesCard!).getByText('6')).toBeInTheDocument();
    expect(getCareerHighlights).toHaveBeenCalledWith('most-trades', 0, 11);
    expect(getCareerHighlights).toHaveBeenCalledWith('reunion-king', 0, 11);

    const transactionSection = view.fixture.componentInstance.sections().find(
      (section) => section.id === 'transactions',
    );
    const tradesState = transactionSection?.cards.find((card) => card.type === 'most-trades')?.state;
    const reunionState = transactionSection?.cards.find((card) => card.type === 'reunion-king')?.state;

    expect(tradesState?.rows[0]?.detailLines).toEqual([
      'Colorado Avalanche 3',
      'Dallas Stars 2',
      'Carolina Hurricanes 1',
    ]);
    expect(reunionState?.descriptionParams).toEqual({ minAllowed: 2 });
    expect(reunionState?.rows[0]).toMatchObject({
      primaryText: 'F Mikael Granlund',
      value: 2,
      detailHeader: 'Colorado Avalanche',
      detailLines: [
        '1. 18.12.2013 career.highlights.reunionTypes.trade',
        '2. 10.8.2016 career.highlights.reunionTypes.claim',
      ],
      detailTooltipClass: 'table-card-tooltip--with-header',
    });
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
                                : type === 'reunion-king'
                                  ? reunionKingHighlightsPage0Fixture
                                  : type === 'same-team-seasons-played'
                                    ? sameTeamSeasonsHighlightsPage0Fixture
                                    : mostTeamsPlayedHighlightsPage0Fixture,
                ),
          },
        },
      ],
    });

    await vi.waitFor(() => {
      expect(FakeIntersectionObserver.instances).toHaveLength(CAREER_HIGHLIGHT_CARD_TYPES.length);
    });

    FakeIntersectionObserver.instances[7]?.trigger();
    FakeIntersectionObserver.instances[9]?.trigger();

    const mostTeamsPlayedCard = await screen.findByRole('heading', {
      name: 'career.highlights.cards.mostTeamsPlayed.title',
    }).then((heading) => heading.closest('mat-card')) as HTMLElement | null;
    const mostTeamsOwnedCard = screen.getByRole('heading', {
      name: 'career.highlights.cards.mostTeamsOwned.title',
    }).closest('mat-card') as HTMLElement | null;
    const sameTeamOwnedCard = screen.getByRole('heading', {
      name: 'career.highlights.cards.sameTeamSeasonsOwned.title',
    }).closest('mat-card') as HTMLElement | null;

    expect(mostTeamsPlayedCard).not.toBeNull();
    expect(mostTeamsOwnedCard).not.toBeNull();
    expect(sameTeamOwnedCard).not.toBeNull();
    expect(await within(mostTeamsPlayedCard!).findByText('F Jamie Benn')).toBeInTheDocument();
    expect(within(mostTeamsOwnedCard!).getByText('tableCard.loadWhenVisible')).toBeInTheDocument();
    expect(within(sameTeamOwnedCard!).getByText('tableCard.apiUnavailable')).toBeInTheDocument();
  });
});
