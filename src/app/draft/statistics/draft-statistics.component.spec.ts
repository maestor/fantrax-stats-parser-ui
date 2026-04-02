import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen, within } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, of, throwError } from 'rxjs';

import { ApiService, EntryDraftTeamGroup } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { SettingsService } from '@services/settings.service';
import {
  provideDisabledMaterialAnimations,
  waitForBehaviorAssertion,
} from '../../testing/behavior-test-utils';
import { DRAFT_STATISTICS_CARD_IDS } from './draft-statistics.constants';
import { DraftStatisticsComponent } from './draft-statistics.component';

function createEntryDraftGroup(index: number): EntryDraftTeamGroup {
  const totalPicksByIndex = [20, 19, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];

  return {
    team: {
      id: `${index + 1}`,
      name: `Team ${index + 1}`,
    },
    summary: {
      highestPick: null,
      averageDraftPosition: index + 1,
      amounts: {
        total: totalPicksByIndex[index],
        ownPicks: 15 - index,
        tradedPicks: 5,
        playersPerDraftAverage: 6 - index * 0.1,
        playedInLeague: 12 - index,
        playedInLeaguePercent: Number(((12 - index) / totalPicksByIndex[index]).toFixed(3)),
        playedForDraftingTeam: 6 - Math.floor(index / 2),
        playedForDraftingTeamPercent: Number(
          ((6 - Math.floor(index / 2)) / totalPicksByIndex[index]).toFixed(3),
        ),
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
  beforeEach(() => {
    localStorage.clear();
  });

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

  it('renders grouped draft statistics cards and paginates the ranked teams', async () => {
    const footerVisibilityService = createFooterVisibilityMock();

    const { fixture } = await renderComponent({ footerVisibilityService });

    expect(
      await screen.findByRole('heading', { name: 'draft.statistics.sections.pickVolume.title' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'draft.statistics.sections.outcomes.title' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'draft.statistics.sections.rounds.title' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'draft.statistics.cards.totalPicks.title' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'draft.statistics.cards.playedInLeague.title' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'draft.statistics.cards.playedInLeaguePercent.title' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'draft.statistics.cards.playedForDraftingTeamPercent.title' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'draft.statistics.sections.pickVolume.title' })).toBeInTheDocument();
    expect(fixture.componentInstance.cards.map((card) => card.id)).toEqual([
      ...DRAFT_STATISTICS_CARD_IDS,
    ]);
    expect(screen.getAllByRole('table')).toHaveLength(DRAFT_STATISTICS_CARD_IDS.length);
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
    expect(totalPicksQueries.getByText('1.')).toBeInTheDocument();
    expect(totalPicksQueries.getAllByText('T2.')).toHaveLength(2);
    expect(totalPicksQueries.queryByText('Team 11')).not.toBeInTheDocument();

    const playedInLeaguePercentCard = screen
      .getByRole('heading', { name: 'draft.statistics.cards.playedInLeaguePercent.title' })
      .closest('app-table-card');
    expect(playedInLeaguePercentCard).not.toBeNull();
    expect(within(playedInLeaguePercentCard as HTMLElement).getByText('60 %')).toBeInTheDocument();

    const playedForDraftingTeamPercentCard = screen
      .getByRole('heading', { name: 'draft.statistics.cards.playedForDraftingTeamPercent.title' })
      .closest('app-table-card');
    expect(playedForDraftingTeamPercentCard).not.toBeNull();
    expect(within(playedForDraftingTeamPercentCard as HTMLElement).getByText('30 %')).toBeInTheDocument();

    fireEvent.click(totalPicksQueries.getByRole('button', {
      name: /draft\.statistics\.cards\.totalPicks\.title.*tableCard\.next/,
    }));

    await waitForBehaviorAssertion(fixture, () => {
      const pagedCard = fixture.componentInstance.cards.find((card) => card.id === 'total-picks');
      expect(pagedCard?.skip).toBe(10);
      expect(totalPicksQueries.getByText('11.')).toBeInTheDocument();
      expect(totalPicksQueries.getByText('Team 11')).toBeInTheDocument();
    });

    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(9);
  });

  it('uses the persisted shared selected team for highlight and paging on initial render', async () => {
    localStorage.setItem('fantrax.settings', JSON.stringify({
      selectedTeamId: '12',
      startFromSeason: null,
      season: null,
      reportType: 'regular',
      disableSelectedTeamHighlight: false,
    }));

    const { fixture } = await renderComponent();
    const totalPicksCard = screen.getByRole('heading', { name: 'draft.statistics.cards.totalPicks.title' })
      .closest('app-table-card');
    expect(totalPicksCard).not.toBeNull();

    await waitForBehaviorAssertion(fixture, () => {
      const cardState = fixture.componentInstance.cards.find((card) => card.id === 'total-picks');
      const highlightedRow = within(totalPicksCard as HTMLElement).getByText('Team 12').closest('tr');
      expect(fixture.componentInstance.highlightedTeamId).toBe('12');
      expect(cardState?.skip).toBe(10);
      expect(cardState?.rows.some((row) => row.primaryText === 'Team 12' && row.rank?.text === '12.' && row.emphasized)).toBe(true);
      expect(highlightedRow).toHaveClass('table-card-row--emphasized');
      expect(within(highlightedRow as HTMLElement).getByText('12.')).toBeInTheDocument();
    });
  });

  it('reacts to shared team-setting changes and disables highlighting when the draft toggle is enabled', async () => {
    localStorage.setItem('fantrax.settings', JSON.stringify({
      selectedTeamId: '1',
      startFromSeason: null,
      season: null,
      reportType: 'regular',
      disableSelectedTeamHighlight: false,
    }));

    const { fixture } = await renderComponent();
    const settingsService = TestBed.inject(SettingsService);
    const totalPicksCard = await screen
      .findByRole('heading', { name: 'draft.statistics.cards.totalPicks.title' })
      .then((heading) => heading.closest('app-table-card'));

    expect(totalPicksCard).not.toBeNull();

    settingsService.setSelectedTeamId('12');

    await waitForBehaviorAssertion(fixture, () => {
      const cardState = fixture.componentInstance.cards.find((card) => card.id === 'total-picks');
      const highlightedRow = within(totalPicksCard as HTMLElement).getByText('Team 12').closest('tr');
      expect(JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}')).toMatchObject({
        selectedTeamId: '12',
      });
      expect(fixture.componentInstance.highlightedTeamId).toBe('12');
      expect(cardState?.skip).toBe(10);
      expect(highlightedRow).toHaveClass('table-card-row--emphasized');
      expect(within(highlightedRow as HTMLElement).getByText('12.')).toBeInTheDocument();
    });

    settingsService.setDisableSelectedTeamHighlight(true);

    await waitForBehaviorAssertion(fixture, () => {
      const cardState = fixture.componentInstance.cards.find((card) => card.id === 'total-picks');
      expect(fixture.componentInstance.highlightedTeamId).toBeNull();
      expect(cardState?.skip).toBe(0);
      expect(cardState?.rows.every((row) => !row.emphasized)).toBe(true);
      expect(within(totalPicksCard as HTMLElement).queryByText('Team 12')).not.toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}')).toMatchObject({
        disableSelectedTeamHighlight: true,
      });
    });
  });

  it('keeps section jumps on the current route and scrolls to the target section', async () => {
    const { fixture } = await renderComponent();
    const outcomesSection = fixture.nativeElement.querySelector('#draft-statistics-section-outcomes') as HTMLElement | null;

    expect(outcomesSection).not.toBeNull();

    const scrollIntoView = vi.fn();
    Object.defineProperty(outcomesSection, 'scrollIntoView', {
      value: scrollIntoView,
      configurable: true,
    });

    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    fireEvent.click(screen.getByRole('button', { name: 'draft.statistics.sections.outcomes.title' }));

    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      '',
      `${window.location.pathname}${window.location.search}#draft-statistics-section-outcomes`,
    );
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'start',
      inline: 'nearest',
      behavior: 'smooth',
    });
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

    expect(screen.getAllByRole('progressbar')).toHaveLength(DRAFT_STATISTICS_CARD_IDS.length);
    expect(footerVisibilityService.markReady).not.toHaveBeenCalled();

    response$.next(statisticsGroupsFixture);
    response$.complete();

    await waitForBehaviorAssertion(fixture, () => {
      expect(fixture.componentInstance.loading).toBe(false);
      expect(screen.getAllByRole('table')).toHaveLength(DRAFT_STATISTICS_CARD_IDS.length);
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

    expect(await screen.findAllByText('tableCard.apiUnavailable')).toHaveLength(DRAFT_STATISTICS_CARD_IDS.length);
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

    expect(screen.getAllByRole('progressbar')).toHaveLength(DRAFT_STATISTICS_CARD_IDS.length);
    expect(fixture.componentInstance.loading).toBe(true);
    expect(fixture.componentInstance.apiError).toBe(false);
    expect(getEntryDrafts).not.toHaveBeenCalled();
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(9);
  });
});
