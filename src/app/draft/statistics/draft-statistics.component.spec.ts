import { PLATFORM_ID } from '@angular/core';
import { fireEvent, render, screen, within } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, of, throwError } from 'rxjs';

import { ApiService, EntryDraftTeamGroup } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import {
  provideDisabledMaterialAnimations,
  waitForBehaviorAssertion,
} from '../../testing/behavior-test-utils';
import { DraftStatisticsComponent } from './draft-statistics.component';

function createEntryDraftGroup(index: number): EntryDraftTeamGroup {
  return {
    team: {
      id: `${index + 1}`,
      name: `Team ${index + 1}`,
    },
    summary: {
      highestPick: null,
      averageDraftPosition: index + 1,
      amounts: {
        total: 20 - index,
        ownPicks: 15 - index,
        tradedPicks: 5,
        playersPerDraftAverage: 6 - index * 0.1,
        playedInLeague: 12 - index,
        playedForDraftingTeam: 6 - Math.floor(index / 2),
      },
      rounds: {
        first: 12 - index,
        second: 11 - index,
        third: 10 - index,
        fourth: 9 - index,
        fifth: 8 - index,
      },
    },
    seasons: [],
  };
}

const statisticsGroupsFixture = Array.from({ length: 12 }, (_, index) => createEntryDraftGroup(index));

describe('DraftStatisticsComponent', () => {
  function createFooterVisibilityMock() {
    return {
      currentCycle: vi.fn(() => 9),
      markReady: vi.fn(),
    };
  }

  async function renderComponent(options?: {
    apiService?: Partial<ApiService>;
    footerVisibilityService?: ReturnType<typeof createFooterVisibilityMock>;
    platformId?: object | string;
  }) {
    return render(DraftStatisticsComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        {
          provide: ApiService,
          useValue: {
            getEntryDrafts: () => of(statisticsGroupsFixture),
            ...options?.apiService,
          },
        },
        {
          provide: FooterVisibilityService,
          useValue: options?.footerVisibilityService ?? createFooterVisibilityMock(),
        },
        {
          provide: PLATFORM_ID,
          useValue: options?.platformId ?? 'browser',
        },
      ],
    });
  }

  it('renders all draft statistics cards and paginates the ranked teams', async () => {
    const footerVisibilityService = createFooterVisibilityMock();

    const { fixture } = await renderComponent({ footerVisibilityService });

    expect(
      await screen.findByRole('heading', { name: 'draft.statistics.cards.totalPicks.title' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'draft.statistics.cards.playedInLeague.title' })).toBeInTheDocument();
    expect(fixture.componentInstance.cards.map((card) => card.id)).toEqual([
      'total-picks',
      'own-picks',
      'traded-picks',
      'players-per-draft',
      'average-position',
      'played-in-league',
      'round-1',
      'round-2',
      'round-3',
      'round-4',
      'round-5',
    ]);
    expect(screen.getAllByRole('table')).toHaveLength(11);
    expect(
      screen.queryByRole('button', { name: /tableCard\.showDetails/ }),
    ).not.toBeInTheDocument();

    const totalPicksCard = screen.getByRole('heading', { name: 'draft.statistics.cards.totalPicks.title' })
      .closest('app-table-card');
    expect(totalPicksCard).not.toBeNull();

    const totalPicksState = fixture.componentInstance.cards.find((card) => card.id === 'total-picks');
    expect(totalPicksState).toBeDefined();

    const totalPicksQueries = within(totalPicksCard as HTMLElement);
    expect(totalPicksQueries.getByText(totalPicksState!.rows[0].primaryText)).toBeInTheDocument();
    expect(totalPicksQueries.queryByText(totalPicksState!.allRows[10].primaryText)).not.toBeInTheDocument();

    fireEvent.click(totalPicksQueries.getByRole('button', { name: 'tableCard.nextPage' }));

    await waitForBehaviorAssertion(fixture, () => {
      const pagedCard = fixture.componentInstance.cards.find((card) => card.id === 'total-picks');
      expect(pagedCard?.skip).toBe(10);
      expect(totalPicksQueries.getByText(totalPicksState!.allRows[10].primaryText)).toBeInTheDocument();
    });

    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(9);
  });

  it('shows a loading state until the statistics response resolves', async () => {
    const response$ = new Subject<EntryDraftTeamGroup[]>();
    const footerVisibilityService = createFooterVisibilityMock();

    const { fixture } = await renderComponent({
      apiService: {
        getEntryDrafts: () => response$.asObservable(),
      },
      footerVisibilityService,
    });

    expect(screen.getAllByRole('progressbar')).toHaveLength(11);
    expect(footerVisibilityService.markReady).not.toHaveBeenCalled();

    response$.next(statisticsGroupsFixture);
    response$.complete();

    await waitForBehaviorAssertion(fixture, () => {
      expect(fixture.componentInstance.loading).toBe(false);
      expect(screen.getAllByRole('table')).toHaveLength(11);
    });
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(9);
  });

  it('shows an API error state on every card when statistics loading fails', async () => {
    const footerVisibilityService = createFooterVisibilityMock();

    await renderComponent({
      apiService: {
        getEntryDrafts: () => throwError(() => new Error('entry draft statistics failed')),
      },
      footerVisibilityService,
    });

    expect(await screen.findAllByText('tableCard.apiUnavailable')).toHaveLength(11);
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(9);
  });

  it('keeps the prerendered statistics route in loading state on the server', async () => {
    const footerVisibilityService = createFooterVisibilityMock();
    const getEntryDrafts = vi.fn(() => throwError(() => new Error('should not run on the server')));

    const { fixture } = await renderComponent({
      apiService: {
        getEntryDrafts,
      },
      footerVisibilityService,
      platformId: 'server',
    });

    expect(screen.getAllByRole('progressbar')).toHaveLength(11);
    expect(fixture.componentInstance.loading).toBe(true);
    expect(fixture.componentInstance.apiError).toBe(false);
    expect(getEntryDrafts).not.toHaveBeenCalled();
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(9);
  });
});
