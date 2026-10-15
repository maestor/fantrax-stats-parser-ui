import { provideRouter } from '@angular/router';
import { render, screen, fireEvent, within } from '@testing-library/angular';
import { Subject, of, throwError } from 'rxjs';
import { TranslateTestingModule } from '@testing/translate-testing';
import { PLATFORM_ID } from '@angular/core';

import { OpeningDraftComponent } from './opening-draft.component';
import { ApiService } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import {
  openingDraftsFixture,
  provideDisabledMaterialAnimations,
  waitForBehaviorAssertion,
} from '../../testing/behavior-test-utils';

describe('OpeningDraftComponent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function seedCollapsedDrawerState() {
    localStorage.setItem('fantrax.settings', JSON.stringify({
      selectedTeamId: '99',
      startFromSeason: null,
      season: null,
      reportType: 'regular',
      disableSelectedTeamHighlight: true,
    }));
  }

  function createFooterVisibilityMock() {
    return {
      currentCycle: vi.fn(() => 7),
      markReady: vi.fn(),
    };
  }

  function stubScrollTo() {
    const original = HTMLElement.prototype.scrollTo;
    const scrollTo = vi.fn();

    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });

    return {
      scrollTo,
      restore: () => {
        if (original) {
          Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
            configurable: true,
            value: original,
          });
          return;
        }

        delete (HTMLElement.prototype as Partial<typeof HTMLElement.prototype>).scrollTo;
      },
    };
  }

  async function renderComponent(options?: {
    apiService?: Partial<ApiService>;
    footerVisibilityService?: ReturnType<typeof createFooterVisibilityMock>;
    platformId?: object | string;
  }) {
    return render(OpeningDraftComponent, {
      imports: [TranslateTestingModule],
      providers: [
        provideRouter([]),
        provideDisabledMaterialAnimations(),
        {
          provide: ApiService,
          useValue: {
            getOpeningDrafts: () => of(openingDraftsFixture),
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

  it('links matched skater and goalie picks and keeps unknown careers as text', async () => {
    seedCollapsedDrawerState();
    const group = openingDraftsFixture[0];
    await renderComponent({ apiService: { getOpeningDrafts: () => of([{ ...group, picks: [
      { ...group.picks[0], pickNumber: 1, draftedPlayer: 'Test Skater', careerProfile: { id: 'skater', type: 'player' } },
      { ...group.picks[0], pickNumber: 2, draftedPlayer: 'Test Goalie', careerProfile: { id: 'goalie', type: 'goalie' } },
      { ...group.picks[0], pickNumber: 3, draftedPlayer: 'Prospect', careerProfile: null },
    ] }]) } });
    fireEvent.click(await screen.findByRole('button', { name: group.team.name }));
    const skater = await screen.findByRole('link', { name: 'Test Skater' });
    expect(skater).toHaveAttribute('href', '/career/players/test-skater-skater?from=opening-draft');
    expect(screen.getByRole('link', { name: 'Test Goalie' })).toHaveAttribute('href', '/career/goalies/test-goalie-goalie?from=opening-draft');
    expect(screen.getByText('Prospect')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Prospect' })).not.toBeInTheDocument();
    skater.focus();
    fireEvent.keyDown(skater, { key: 'ArrowDown' });
    expect(screen.getByRole('link', { name: 'Test Goalie' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.getByRole('button', { name: group.team.name })).toHaveFocus();
    expect(screen.queryByRole('link', { name: 'Test Skater' })).not.toBeInTheDocument();
  });

  it('opens the shared selected team by default when draft highlighting is enabled', async () => {
    localStorage.setItem('fantrax.settings', JSON.stringify({
      selectedTeamId: '1',
      startFromSeason: null,
      season: null,
      reportType: 'regular',
      disableSelectedTeamHighlight: false,
    }));

    await renderComponent();

    expect(await screen.findByRole('button', { name: 'Colorado Avalanche' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Dallas Stars' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('scrolls the auto-opened shared selected team header to the top of the draft list on initial render', async () => {
    localStorage.setItem('fantrax.settings', JSON.stringify({
      selectedTeamId: '1',
      startFromSeason: null,
      season: null,
      reportType: 'regular',
      disableSelectedTeamHighlight: false,
    }));

    const { scrollTo, restore } = stubScrollTo();

    try {
      const { fixture } = await renderComponent();
      const header = await screen.findByRole('button', { name: 'Colorado Avalanche' });

      await waitForBehaviorAssertion(fixture, () => {
        expect(scrollTo).toHaveBeenCalledWith({
          behavior: 'auto',
          top: expect.any(Number),
        });
        expect(header).toHaveAttribute('aria-expanded', 'true');
        expect(header).not.toHaveFocus();
      });
    } finally {
      restore();
    }
  });

  it('skips the default selected-team expansion when draft highlighting is disabled', async () => {
    localStorage.setItem('fantrax.settings', JSON.stringify({
      selectedTeamId: '1',
      startFromSeason: null,
      season: null,
      reportType: 'regular',
      disableSelectedTeamHighlight: true,
    }));

    await renderComponent();

    expect(await screen.findByRole('button', { name: 'Colorado Avalanche' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Dallas Stars' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders opening draft teams in API order and shows traded-pick details inside expanded panels', async () => {
    seedCollapsedDrawerState();

    const footerVisibilityService = createFooterVisibilityMock();
    const { fixture } = await renderComponent({ footerVisibilityService });

    const panelButtons = await screen.findAllByRole('button', { expanded: false });
    expect(panelButtons.map((button) => button.textContent?.trim())).toEqual(openingDraftsFixture.map((group) => group.team.name));

    fireEvent.click(screen.getByRole('button', { name: 'Colorado Avalanche' }));

    const coloradoPanel = screen.getByRole('button', { name: 'Colorado Avalanche' }).closest('mat-expansion-panel')!;
    const group = openingDraftsFixture[0];
    expect(within(coloradoPanel as HTMLElement).getAllByRole('listitem')).toHaveLength(group.picks.length);
    expect(within(coloradoPanel as HTMLElement).getByRole('link', { name: group.picks[0].draftedPlayer })).toHaveAttribute(
      'href', expect.stringMatching(/^\/career\/(players|goalies)\//),
    );
    const tradedPick = group.picks.find((pick) => pick.originalOwner.id !== group.team.id)!;
    expect(within(coloradoPanel as HTMLElement).getAllByText(tradedPick.originalOwner.name).length).toBeGreaterThan(0);

    expect(fixture.componentInstance.loading).toBe(false);
    expect(fixture.componentInstance.apiError).toBe(false);
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });

  it('moves focus from an expanded header into opening draft picks with keyboard navigation', async () => {
    seedCollapsedDrawerState();

    const { container } = await renderComponent();

    const header = await screen.findByRole('button', { name: 'Colorado Avalanche' });
    fireEvent.click(header);

    const firstPanel = container.querySelector('mat-expansion-panel');
    expect(firstPanel).not.toBeNull();

    const pickRows = Array.from((firstPanel as HTMLElement).querySelectorAll<HTMLElement>('.draft-focus-target'));
    expect(pickRows.length).toBeGreaterThan(1);

    const [firstPick, secondPick] = pickRows;
    const lastPick = pickRows.at(-1);

    fireEvent.keyDown(header, { key: 'ArrowDown' });
    expect(firstPick).toHaveFocus();

    fireEvent.keyDown(firstPick, { key: 'ArrowDown' });
    expect(secondPick).toHaveFocus();

    fireEvent.keyDown(secondPick, { key: 'Home' });
    expect(firstPick).toHaveFocus();

    if (lastPick) {
      fireEvent.keyDown(firstPick, { key: 'End' });
      expect(lastPick).toHaveFocus();

      fireEvent.keyDown(lastPick, { key: 'Escape' });
      expect(header).toHaveFocus();
      expect(header).toHaveAttribute('aria-expanded', 'false');
    }
  });

  it('supports paging within opening draft picks and collapsing from the expanded header', async () => {
    seedCollapsedDrawerState();

    const { container, fixture } = await renderComponent();

    const header = await screen.findByRole('button', { name: 'Colorado Avalanche' });
    fireEvent.click(header);

    const firstPanel = container.querySelector('mat-expansion-panel');
    expect(firstPanel).not.toBeNull();

    const pickRows = Array.from((firstPanel as HTMLElement).querySelectorAll<HTMLElement>('.draft-focus-target'));
    expect(pickRows.length).toBeGreaterThan(1);

    const [firstPick] = pickRows;
    const lastPick = pickRows.at(-1);
    expect(firstPick).toBeDefined();
    expect(lastPick).toBeDefined();

    fireEvent.keyDown(header, { key: 'ArrowDown' });
    expect(firstPick).toHaveFocus();

    fireEvent.keyDown(firstPick as HTMLElement, { key: 'PageDown' });
    expect(pickRows[5]).toHaveFocus();

    fireEvent.keyDown(pickRows[5], { key: 'PageUp' });
    expect(firstPick).toHaveFocus();

    fireEvent.keyDown(firstPick as HTMLElement, { key: 'ArrowUp' });
    expect(header).toHaveFocus();

    fireEvent.keyDown(header, { key: 'Escape' });

    await waitForBehaviorAssertion(fixture, () => {
      expect(header).toHaveAttribute('aria-expanded', 'false');
      expect(header).toHaveFocus();
    });
  });

  it('scrolls an expanded opening-draft header to the top without moving focus into picks', async () => {
    seedCollapsedDrawerState();

    const { scrollTo, restore } = stubScrollTo();

    try {
      const { fixture } = await renderComponent();

      const header = await screen.findByRole('button', { name: 'Colorado Avalanche' });
      fireEvent.click(header);

      await waitForBehaviorAssertion(fixture, () => {
        expect(scrollTo).toHaveBeenCalledWith({
          behavior: 'smooth',
          top: expect.any(Number),
        });
        expect(header).toHaveAttribute('aria-expanded', 'true');
      });
    } finally {
      restore();
    }
  });

  it('lets Escape on a header collapse whichever opening-draft panel is currently expanded', async () => {
    seedCollapsedDrawerState();

    const { fixture } = await renderComponent();

    const coloradoHeader = await screen.findByRole('button', { name: 'Colorado Avalanche' });
    const dallasHeader = await screen.findByRole('button', { name: 'Dallas Stars' });

    fireEvent.click(coloradoHeader);
    expect(coloradoHeader).toHaveAttribute('aria-expanded', 'true');

    dallasHeader.focus();
    fireEvent.keyDown(dallasHeader, { key: 'Escape' });

    await waitForBehaviorAssertion(fixture, () => {
      expect(coloradoHeader).toHaveAttribute('aria-expanded', 'false');
      expect(dallasHeader).toHaveFocus();
    });
  });

  it('shows a loading state until the opening draft response resolves', async () => {
    const response$ = new Subject<typeof openingDraftsFixture>();
    const footerVisibilityService = createFooterVisibilityMock();

    const { fixture } = await renderComponent({
      apiService: {
        getOpeningDrafts: () => response$.asObservable(),
      },
      footerVisibilityService,
    });

    expect(screen.getByText('draft.loading')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(footerVisibilityService.markReady).not.toHaveBeenCalled();

    response$.next(openingDraftsFixture);
    response$.complete();

    await waitForBehaviorAssertion(fixture, () => {
      expect(fixture.componentInstance.loading).toBe(false);
      expect(fixture.componentInstance.groups).toEqual(openingDraftsFixture);
      expect(screen.getByRole('button', { name: 'Colorado Avalanche' })).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });

  it('keeps only one opening-draft panel expanded at a time', async () => {
    seedCollapsedDrawerState();

    await renderComponent();

    const firstPanelButton = await screen.findByRole('button', { name: 'Colorado Avalanche' });
    const secondPanelButton = await screen.findByRole('button', { name: 'Dallas Stars' });

    fireEvent.click(firstPanelButton);
    expect(firstPanelButton).toHaveAttribute('aria-expanded', 'true');
    expect(secondPanelButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(secondPanelButton);
    expect(firstPanelButton).toHaveAttribute('aria-expanded', 'false');
    expect(secondPanelButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows an empty state when there are no opening draft picks', async () => {
    const footerVisibilityService = createFooterVisibilityMock();

    await renderComponent({
      apiService: {
        getOpeningDrafts: () => of([]),
      },
      footerVisibilityService,
    });

    expect(await screen.findByText('draft.noResults')).toBeInTheDocument();
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });

  it('shows an API error state when opening draft loading fails', async () => {
    const footerVisibilityService = createFooterVisibilityMock();

    await renderComponent({
      apiService: {
        getOpeningDrafts: () => throwError(() => new Error('opening draft failed')),
      },
      footerVisibilityService,
    });

    expect(await screen.findByText('draft.apiUnavailable')).toBeInTheDocument();
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });

  it('keeps the prerendered route in loading state instead of flashing an API error on the server', async () => {
    const footerVisibilityService = createFooterVisibilityMock();
    const getOpeningDrafts = vi.fn(() => throwError(() => new Error('should not run on the server')));

    const { fixture } = await renderComponent({
      apiService: {
        getOpeningDrafts,
      },
      footerVisibilityService,
      platformId: 'server',
    });

    expect(screen.getByText('draft.loading')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('draft.apiUnavailable')).not.toBeInTheDocument();
    expect(fixture.componentInstance.loading).toBe(true);
    expect(fixture.componentInstance.apiError).toBe(false);
    expect(getOpeningDrafts).not.toHaveBeenCalled();
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });
});
