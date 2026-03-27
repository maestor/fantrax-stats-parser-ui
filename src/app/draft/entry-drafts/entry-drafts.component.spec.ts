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
import { EntryDraftsComponent } from './entry-drafts.component';

const entryDraftGroupsFixture: EntryDraftTeamGroup[] = [
  {
    team: { id: '12', name: 'Anaheim Ducks' },
    summary: {
      highestPick: {
        pickNumber: 8,
        items: [
          {
            season: 2015,
            round: 1,
            draftedPlayer: 'Ivan Provorov',
          },
          {
            season: 2013,
            round: 1,
            draftedPlayer: 'Max Domi',
          },
        ],
      },
      averageDraftPosition: 82.89,
      amounts: {
        total: 64,
        ownPicks: 52,
        tradedPicks: 12,
        playersPerDraftAverage: 4.92,
      },
      rounds: {
        first: 13,
        second: 12,
        third: 15,
        fourth: 14,
        fifth: 10,
      },
    },
    seasons: [
      {
        season: 2013,
        picks: [
          {
            round: 4,
            pickNumber: 116,
            draftedPlayer: 'Brett Pesce',
            originalOwner: { id: '6', name: 'Detroit Red Wings' },
          },
          {
            round: 5,
            pickNumber: 129,
            draftedPlayer: null,
            originalOwner: { id: '4', name: 'Vancouver Canucks' },
          },
        ],
      },
      {
        season: 2025,
        picks: [
          {
            round: 1,
            pickNumber: 22,
            draftedPlayer: 'Cameron Reid',
            originalOwner: { id: '12', name: 'Anaheim Ducks' },
          },
          {
            round: 1,
            pickNumber: 29,
            draftedPlayer: 'Blake Fiddler',
            originalOwner: { id: '1', name: 'Colorado Avalanche' },
          },
        ],
      },
    ],
  },
  {
    team: { id: '18', name: 'Boston Bruins' },
    summary: {
      highestPick: null,
      averageDraftPosition: null,
      amounts: {
        total: 0,
        ownPicks: 0,
        tradedPicks: 0,
        playersPerDraftAverage: 0,
      },
      rounds: {
        first: 0,
        second: 0,
        third: 0,
        fourth: 0,
        fifth: 0,
      },
    },
    seasons: [],
  },
];

describe('EntryDraftsComponent', () => {
  function createFooterVisibilityMock() {
    return {
      currentCycle: vi.fn(() => 7),
      markReady: vi.fn(),
    };
  }

  async function renderComponent(options?: {
    apiService?: Partial<ApiService>;
    footerVisibilityService?: ReturnType<typeof createFooterVisibilityMock>;
    platformId?: object | string;
  }) {
    return render(EntryDraftsComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        {
          provide: ApiService,
          useValue: {
            getEntryDrafts: () => of(entryDraftGroupsFixture),
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

  it('renders entry draft summaries in API order and sorts seasons newest-first', async () => {
    const footerVisibilityService = createFooterVisibilityMock();
    const { container, fixture } = await renderComponent({ footerVisibilityService });

    const panelButtons = await screen.findAllByRole('button', { expanded: false });
    expect(panelButtons.map((button) => button.textContent?.trim())).toEqual([
      'Anaheim Ducks',
      'Boston Bruins',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Anaheim Ducks' }));

    const firstPanel = container.querySelector('mat-expansion-panel');
    expect(firstPanel).not.toBeNull();

    const firstPanelElement = firstPanel as HTMLElement;
    const firstPanelQueries = within(firstPanelElement);

    expect(firstPanelQueries.getByText('draft.entryDrafts.summaryHeading')).toBeInTheDocument();
    expect(firstPanelQueries.getByText('draft.entryDrafts.highestPickHeading')).toBeInTheDocument();
    expect(firstPanelQueries.getByText('draft.entryDrafts.roundsHeading')).toBeInTheDocument();
    expect(firstPanelQueries.getByText('draft.entryDrafts.turnLabel 8')).toBeInTheDocument();
    expect(firstPanelQueries.getByText('Blake Fiddler')).toBeInTheDocument();
    expect(firstPanelQueries.getByText('draft.entryDrafts.unknownPlayerLabel')).toBeInTheDocument();
    expect(firstPanelQueries.getAllByText(/draft\.entryDrafts\.originalOwnerLabel/)).toHaveLength(3);
    expect(firstPanelQueries.getByText('Colorado Avalanche')).toBeInTheDocument();
    expect(firstPanelQueries.getByText('Detroit Red Wings')).toBeInTheDocument();
    expect(firstPanelQueries.getByText('Vancouver Canucks')).toBeInTheDocument();

    const highestPickSummary = firstPanelElement.querySelector('.entry-highlight-summary')?.textContent?.trim();
    expect(highestPickSummary).toContain('2015 Ivan Provorov');
    expect(highestPickSummary).toContain('2013 Max Domi');
    expect(highestPickSummary).not.toContain('draft.entryDrafts.roundLabel');

    const summaryValues = Array.from(firstPanelElement.querySelectorAll('.entry-summary-value'))
      .map((element) => element.textContent?.trim())
      .filter((value): value is string => Boolean(value));
    expect(summaryValues).toEqual(expect.arrayContaining(['82.89', '64', '52', '12', '4.92']));

    const roundValues = Array.from(firstPanelElement.querySelectorAll('.entry-round-value'))
      .map((element) => element.textContent?.trim())
      .filter((value): value is string => Boolean(value));
    expect(roundValues).toEqual(['13', '12', '15', '14', '10']);

    const seasonTitles = Array.from(firstPanelElement.querySelectorAll('.entry-season-title'))
      .map((element) => element.textContent?.trim())
      .filter((value): value is string => Boolean(value));
    expect(seasonTitles).toEqual(['2025', '2013']);

    expect(fixture.componentInstance.loading).toBe(false);
    expect(fixture.componentInstance.apiError).toBe(false);
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });

  it('shows a loading state until the entry draft response resolves', async () => {
    const response$ = new Subject<EntryDraftTeamGroup[]>();
    const footerVisibilityService = createFooterVisibilityMock();

    const { fixture } = await renderComponent({
      apiService: {
        getEntryDrafts: () => response$.asObservable(),
      },
      footerVisibilityService,
    });

    expect(screen.getByText('draft.loading')).toBeInTheDocument();
    expect(footerVisibilityService.markReady).not.toHaveBeenCalled();

    response$.next(entryDraftGroupsFixture);
    response$.complete();

    await waitForBehaviorAssertion(fixture, () => {
      expect(fixture.componentInstance.loading).toBe(false);
      expect(fixture.componentInstance.groups).toEqual([
        {
          ...entryDraftGroupsFixture[0],
          seasons: [entryDraftGroupsFixture[0].seasons[1], entryDraftGroupsFixture[0].seasons[0]],
        },
        entryDraftGroupsFixture[1],
      ]);
      expect(screen.getByText('Anaheim Ducks')).toBeInTheDocument();
    });
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });

  it('keeps only one entry-draft panel expanded at a time', async () => {
    await renderComponent();

    const firstPanelButton = await screen.findByRole('button', { name: 'Anaheim Ducks' });
    const secondPanelButton = await screen.findByRole('button', { name: 'Boston Bruins' });

    fireEvent.click(firstPanelButton);
    expect(firstPanelButton).toHaveAttribute('aria-expanded', 'true');
    expect(secondPanelButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(secondPanelButton);
    expect(firstPanelButton).toHaveAttribute('aria-expanded', 'false');
    expect(secondPanelButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows an empty state when there are no entry draft groups', async () => {
    const footerVisibilityService = createFooterVisibilityMock();

    await renderComponent({
      apiService: {
        getEntryDrafts: () => of([]),
      },
      footerVisibilityService,
    });

    expect(await screen.findByText('draft.noResults')).toBeInTheDocument();
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });

  it('shows an API error state when entry draft loading fails', async () => {
    const footerVisibilityService = createFooterVisibilityMock();

    await renderComponent({
      apiService: {
        getEntryDrafts: () => throwError(() => new Error('entry draft failed')),
      },
      footerVisibilityService,
    });

    expect(await screen.findByText('draft.apiUnavailable')).toBeInTheDocument();
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });

  it('keeps the prerendered route in loading state instead of flashing an API error on the server', async () => {
    const footerVisibilityService = createFooterVisibilityMock();
    const getEntryDrafts = vi.fn(() => throwError(() => new Error('should not run on the server')));

    const { fixture } = await renderComponent({
      apiService: {
        getEntryDrafts,
      },
      footerVisibilityService,
      platformId: 'server',
    });

    expect(screen.getByText('draft.loading')).toBeInTheDocument();
    expect(screen.queryByText('draft.apiUnavailable')).not.toBeInTheDocument();
    expect(fixture.componentInstance.loading).toBe(true);
    expect(fixture.componentInstance.apiError).toBe(false);
    expect(getEntryDrafts).not.toHaveBeenCalled();
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });
});
