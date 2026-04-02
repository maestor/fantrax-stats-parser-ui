import { fireEvent, render, screen } from '@testing-library/angular';
import { TestBed } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { ApiService, Goalie, Player, Season } from '@services/api.service';
import { AppComponent, buildRootRouteUiState } from './app.component';
import { buildDashboardRouteUiState } from './dashboard-shell/dashboard-shell.component';
import { buildSettingsDrawerRouteConfig } from './shared/utils/settings-drawer.utils';
import {
  closeDashboardSettingsDrawer,
  createApiServiceMock,
  getBehaviorTestConfig,
  openDashboardSettingsDrawer,
  polyfillJsdom,
  polyfillMatchMedia,
  seasonsFixture,
  seedLocalStorage,
  slicedGoalies,
  slicedPlayers,
  PLAYER_SLICE_COUNT,
  waitForBehaviorAssertion,
} from './testing/behavior-test-utils';

// Full-render behavior tests with lazy-loaded routes need more time under coverage load.
describe('AppComponent — desktop frontpage', { timeout: 60_000 }, () => {
  beforeEach(() => {
    polyfillJsdom();
    polyfillMatchMedia();
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('renders all user-visible elements and supports skip link focus flow', async () => {
    const { fixture } = await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

    // Wait for lazy-loaded route and async data pipeline to complete
    const firstPlayerName = slicedPlayers[0].name;
    await waitForBehaviorAssertion(fixture, () => {
      expect(screen.getByText(firstPlayerName)).toBeInTheDocument();
    });

    // -- Page title --
    expect(
      screen.getByRole('heading', { name: 'pageTitle' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /nav\.hockeyPlayerStats/ })
    ).toBeInTheDocument();
    await waitForBehaviorAssertion(fixture, () => {
      expect(
        screen.getByRole('heading', { name: 'nav.hockeyPlayerStats: Colorado Avalanche' })
      ).toBeInTheDocument();
    });

    // -- Shared dashboard settings drawer button --
    expect(
      screen.getByRole('button', { name: 'a11y.openSettingsDrawer' })
    ).toBeInTheDocument();

    await openDashboardSettingsDrawer();

    // -- Drawer sections and controls --
    expect(await screen.findByRole('heading', { name: 'settingsDrawer.settings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'topControls.controls' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'settingsPanel.settings' })).toBeInTheDocument();

    const teamCombobox = screen.getByRole('combobox', { name: /team\.selector/ });
    expect(teamCombobox).toBeInTheDocument();

    await waitForBehaviorAssertion(fixture, () => {
      expect(screen.getByRole('combobox', { name: /season\.selector/ })).toHaveTextContent(
        'season.allSeasons'
      );
      expect(screen.getByRole('combobox', { name: /reportType\.selector/ })).toHaveTextContent(
        'reportType.regular'
      );
      expect(screen.getByRole('combobox', { name: /startFromSeason\.selector/ })).toHaveTextContent(
        '2012-2013'
      );
    });

    expect(screen.getByText(/lastModified\.label/)).toBeInTheDocument();

    await closeDashboardSettingsDrawer(fixture);

    // -- Navigation tabs --
    expect(screen.getByRole('tab', { name: 'link.playerStats' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'link.goalieStats' })).toBeInTheDocument();

    // -- Nav menu button --
    expect(
      screen.getByRole('button', { name: 'a11y.openNavMenu' })
    ).toBeInTheDocument();

    // -- Stats table with expected row count --
    expect(screen.getByRole('table')).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    // Header row + one data row per player
    expect(rows).toHaveLength(PLAYER_SLICE_COUNT + 1);

    // -- Search input --
    expect(screen.getByLabelText('table.playerSearch')).toBeInTheDocument();

    // -- Accessibility flow (merged on purpose for speed):
    // Verify the skip link moves focus directly to the first data row after initial content has loaded.
    // Keeping this in the same render avoids a second expensive full-app render while preserving user-path behavior.
    const skipLink = screen.getByText('a11y.skipToTable');
    fireEvent.click(skipLink);

    expect(document.activeElement?.textContent).toContain(firstPlayerName);
  });

  it('supports keyboard shortcuts and ignores help shortcut while typing in the search field', async () => {
    const { fixture } = await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

    await waitForBehaviorAssertion(fixture, () => {
      expect(screen.getByText(slicedPlayers[0].name)).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('table.playerSearch');

    fireEvent.keyDown(document, { key: '/' });
    expect(searchInput).toHaveFocus();

    fireEvent.keyDown(searchInput, { key: '?' });
    expect(screen.queryByRole('button', { name: 'helpDialog.close' })).not.toBeInTheDocument();

    searchInput.blur();
    fireEvent.keyDown(document, { key: '?' });

    await waitForBehaviorAssertion(fixture, () => {
      expect(
        screen.getByRole('button', { name: 'helpDialog.close' })
      ).toBeInTheDocument();
    });
    const helpCloseButton = screen.getByRole('button', { name: 'helpDialog.close' });
    fireEvent.click(helpCloseButton);

    await vi.waitFor(() => {
      expect(screen.queryByRole('button', { name: 'helpDialog.close' })).not.toBeInTheDocument();
    });
  }, 90_000);

  it('shows the update snackbar, reopens it after Escape dismissal, and triggers reload from the snackbar action', async () => {
    const activateAndReload = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    const { fixture } = await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        pwaUpdateAvailable: true,
        pwaActivateAndReload: activateAndReload,
      })
    );

    await waitForBehaviorAssertion(fixture, () => {
      expect(screen.getByText(slicedPlayers[0].name)).toBeInTheDocument();
    });

    const initialActionText = await screen.findByText('pwa.updateAction');
    const initialActionButton = initialActionText.closest('button');
    expect(initialActionButton).not.toBeNull();
    const snackbar = TestBed.inject(MatSnackBar);
    snackbar.dismiss();

    await vi.waitFor(() => {
      const reopenedActionText = screen.getByText('pwa.updateAction');
      const reopenedActionButton = reopenedActionText.closest('button');
      expect(reopenedActionButton).not.toBeNull();
      expect(reopenedActionButton).not.toBe(initialActionButton);
    });

    fireEvent.click(screen.getByText('pwa.updateAction'));

    await vi.waitFor(() => {
      expect(activateAndReload).toHaveBeenCalledTimes(1);
    });
  });

  it('resolves the global nav overlay only when the nav button is pressed', async () => {
    const behaviorConfig = getBehaviorTestConfig({ isMobile: false });
    const bottomSheetFactory = vi.fn(() => ({ open: vi.fn() }));

    const { fixture } = await render(AppComponent, {
      ...behaviorConfig,
      providers: [
        ...behaviorConfig.providers,
        {
          provide: MatBottomSheet,
          useFactory: bottomSheetFactory,
        },
      ],
    });

    await waitForBehaviorAssertion(fixture, () => {
      expect(screen.getByText(slicedPlayers[0].name)).toBeInTheDocument();
    });

    expect(bottomSheetFactory).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'a11y.openNavMenu' }));

    await vi.waitFor(() => {
      expect(bottomSheetFactory).toHaveBeenCalledTimes(1);
    }, { timeout: 5000 });
  });

  it('starts with visible defaults when browser storage is empty', async () => {
    localStorage.clear();

    const { fixture } = await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

    await waitForBehaviorAssertion(fixture, () => {
      expect(screen.getByText(slicedPlayers[0].name)).toBeInTheDocument();
    });

    await openDashboardSettingsDrawer();
    await waitForBehaviorAssertion(fixture, () => {
      expect(screen.getByRole('combobox', { name: /startFromSeason\.selector/ })).toHaveTextContent(
        '2012-2013'
      );
      expect(screen.getByRole('combobox', { name: /season\.selector/ })).toHaveTextContent(
        'season.allSeasons'
      );
      expect(screen.getByRole('combobox', { name: /reportType\.selector/ })).toHaveTextContent(
        'reportType.regular'
      );
    });
    await closeDashboardSettingsDrawer(fixture);
  });

  it('falls back to regular report type when persisted storage contains an invalid report type', async () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        selectedTeamId: '1',
        startFromSeason: 2012,
        season: null,
        reportType: 'invalid-report-type',
      })
    );

    const { fixture } = await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

    await waitForBehaviorAssertion(fixture, () => {
      expect(screen.getByText(slicedPlayers[0].name)).toBeInTheDocument();
    });

    await openDashboardSettingsDrawer();
    await waitForBehaviorAssertion(fixture, () => {
      expect(screen.getByRole('combobox', { name: /reportType\.selector/ })).toHaveTextContent(
        'reportType.regular'
      );
    });
    await closeDashboardSettingsDrawer(fixture);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('boots stats with start-from data before the drawer opens and still defers drawer-only metadata work', async () => {
    const apiServiceMock = createApiServiceMock();
    const getTeams = vi.fn(apiServiceMock.getTeams);
    const getSeasons = vi.fn(apiServiceMock.getSeasons);
    const getLastModified = vi.fn(apiServiceMock.getLastModified);
    const behaviorConfig = getBehaviorTestConfig({ isMobile: false });

    await render(AppComponent, {
      ...behaviorConfig,
      providers: [
        ...behaviorConfig.providers,
        {
          provide: ApiService,
          useValue: {
            ...apiServiceMock,
            getTeams,
            getSeasons,
            getLastModified,
          },
        },
      ],
    });

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

    expect(getTeams).toHaveBeenCalledTimes(1);
    expect(getSeasons).toHaveBeenCalledTimes(1);
    expect(getLastModified).not.toHaveBeenCalled();

    await openDashboardSettingsDrawer();
    await screen.findByRole('heading', { name: 'settingsDrawer.settings' });

    await vi.waitFor(() => {
      expect(getTeams.mock.calls.length).toBeGreaterThan(1);
      expect(getSeasons).toHaveBeenCalled();
      expect(getLastModified).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps the dashboard usable when metadata calls fail', async () => {
    await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        errorKeys: ['teams', 'lastModified'],
      })
    );

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

    expect(
      screen.getByRole('heading', { name: 'nav.hockeyPlayerStats' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /nav\.hockeyPlayerStats:/ })).not.toBeInTheDocument();

    await openDashboardSettingsDrawer();
    expect(await screen.findByRole('heading', { name: 'settingsDrawer.settings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'topControls.controls' })).toBeInTheDocument();
    expect(screen.queryByText(/lastModified\.label/)).not.toBeInTheDocument();
  });

  it.each([
    {
      caseName: 'when the API omits the timestamp',
      lastModified: null,
    },
    {
      caseName: 'when the timestamp is invalid',
      lastModified: {
        lastModified: 'not-a-real-date',
      } as never,
    },
  ])('omits the drawer last-modified text $caseName', async ({ lastModified }) => {
    const { fixture } = await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        lastModified,
      })
    );

    await waitForBehaviorAssertion(fixture, () => {
      expect(screen.getByText(slicedPlayers[0].name)).toBeInTheDocument();
    });

    await openDashboardSettingsDrawer();
    expect(document.querySelector('.settings-drawer-last-modified')).toBeNull();
    expect(screen.queryByText(/lastModified\.label/)).not.toBeInTheDocument();
  });

  it('shows the root settings button and only base drawer sections on browse routes', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/career/players');

    expect(
      await screen.findByLabelText('table.careerPlayerSearch', {}, { timeout: 15_000 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'a11y.openSettingsDrawer' })
    ).toBeInTheDocument();

    await openDashboardSettingsDrawer();

    expect(await screen.findByRole('heading', { name: 'settingsDrawer.settings' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /team\.selector/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'topControls.controls' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'settingsPanel.settings' })).not.toBeInTheDocument();
    expect(screen.getByText(/lastModified\.label/)).toBeInTheDocument();
  });

  it('keeps the shell overflow visible so browse-route sticky navigation can follow page scroll', async () => {
    const { container, fixture } = await render(
      AppComponent,
      getBehaviorTestConfig({ isMobile: false }),
    );
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/career/highlights');
    await waitForBehaviorAssertion(fixture, () => {
      expect(
        screen.getByRole('navigation', { name: 'career.highlights.jumpNavAriaLabel' }),
      ).toBeInTheDocument();
    });

    const shell = container.querySelector('mat-sidenav-container');
    const shellContent = container.querySelector('mat-sidenav-content');

    expect(shell).not.toBeNull();
    expect(shellContent).not.toBeNull();
    expect(getComputedStyle(shell as Element).overflow).toBe('visible');
    expect(getComputedStyle(shellContent as Element).overflow).toBe('visible');
  });

  it.each([
    '/draft/statistics',
    '/leaderboards/regular',
  ])('shows the shared team highlight toggle in the drawer on %s', async (route) => {
    const { fixture } = await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));
    const router = TestBed.inject(Router);

    await router.navigateByUrl(route);
    await waitForBehaviorAssertion(fixture, () => {
      expect(router.url).toBe(route);
    });

    await openDashboardSettingsDrawer();

    const disableHighlightToggle = await screen.findByRole('switch', {
      name: 'draft.settings.disableSelectedTeamHighlight',
    });

    expect(screen.getByRole('combobox', { name: /team\.selector/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'topControls.controls' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'settingsPanel.settings' })).not.toBeInTheDocument();
    expect(screen.getByText(/lastModified\.label/)).toBeInTheDocument();

    fireEvent.click(disableHighlightToggle);

    await waitForBehaviorAssertion(fixture, () => {
      expect(disableHighlightToggle).toHaveAttribute('aria-checked', 'true');
      expect(JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}')).toMatchObject({
        disableSelectedTeamHighlight: true,
      });
    });
  });

  it('restores leaderboard row focus after closing the settings drawer', async () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        selectedTeamId: '2',
        startFromSeason: null,
        season: null,
        reportType: 'regular',
        disableSelectedTeamHighlight: false,
      })
    );

    const { fixture } = await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        leaderboardRegular: [
          {
            teamId: '1',
            teamName: 'Colorado Avalanche',
            regularTrophies: 2,
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
            seasons: [],
          },
          {
            teamId: '2',
            teamName: 'Dallas Stars',
            regularTrophies: 1,
            points: 950,
            wins: 480,
            losses: 210,
            ties: 45,
            pointsPercent: 0.68,
            winPercent: 0.62,
            divWins: 0,
            divLosses: 0,
            divTies: 0,
            divWinPercent: 0.5,
            tieRank: false,
            seasons: [],
          },
        ],
      }),
    );
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/leaderboards/regular');
    await waitForBehaviorAssertion(fixture, () => {
      expect(router.url).toBe('/leaderboards/regular');
    });

    const dallasRow = (await screen.findByText('Dallas Stars')).closest('tr');
    expect(dallasRow).not.toBeNull();

    await waitForBehaviorAssertion(fixture, () => {
      expect(dallasRow).toHaveAttribute('tabindex', '0');
      expect(dallasRow).toHaveClass('a11y-active');
    });

    await openDashboardSettingsDrawer();
    await closeDashboardSettingsDrawer(fixture);

    await waitForBehaviorAssertion(fixture, () => {
      expect(dallasRow).toHaveFocus();
    });
  });

  it('persists browse-route team changes without calling stats or seasons endpoints until stats mode becomes active again', async () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        selectedTeamId: '1',
        startFromSeason: 2012,
        season: 2024,
        reportType: 'playoffs',
      })
    );

    const dallasPlayers = [
      { ...slicedPlayers[0], id: 'dallas-demo-player', name: 'Dallas Demo Player' },
    ] as unknown as Player[];
    const getPlayerData = vi.fn((params: { teamId?: string }) =>
      params.teamId === '29'
        ? of(dallasPlayers)
        : of(slicedPlayers as unknown as Player[])
    );
    const getGoalieData = vi.fn((params: { teamId?: string }) =>
      params.teamId === '29'
        ? of(slicedGoalies as unknown as Goalie[])
        : of(slicedGoalies as unknown as Goalie[])
    );
    const getSeasons = vi.fn((_reportType?: string, teamId?: string) =>
      teamId === '29'
        ? of([{ season: 2015, text: '2015-2016' } as Season])
        : of(seasonsFixture)
    );

    const { fixture } = await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        getPlayerData,
        getGoalieData,
        getSeasons,
      })
    );

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/career/players');

    expect(
      await screen.findByLabelText('table.careerPlayerSearch', {}, { timeout: 15_000 })
    ).toBeInTheDocument();

    getPlayerData.mockClear();
    getGoalieData.mockClear();
    getSeasons.mockClear();

    await openDashboardSettingsDrawer();

    const teamCombobox = screen.getByRole('combobox', { name: /team\.selector/ });
    fireEvent.click(teamCombobox);
    fireEvent.click(await screen.findByRole('option', { name: 'Dallas Stars' }));

    await vi.waitFor(() => {
      expect(router.url).toBe('/career/players');
      expect(teamCombobox).toHaveTextContent('Dallas Stars');
      expect(getPlayerData).not.toHaveBeenCalled();
      expect(getGoalieData).not.toHaveBeenCalled();
      expect(getSeasons).not.toHaveBeenCalled();
      expect(JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}')).toMatchObject({
        selectedTeamId: '29',
        startFromSeason: null,
        season: null,
        reportType: 'regular',
      });
    });

    await router.navigateByUrl('/player-stats');

    await waitForBehaviorAssertion(fixture, () => {
      expect(router.url).toBe('/player-stats');
      expect(
        getSeasons.mock.calls.some(
          ([reportType, teamId]) => reportType === 'regular' && teamId === '29'
        )
      ).toBe(true);
      expect(getPlayerData).toHaveBeenCalledWith(
        expect.objectContaining({ teamId: '29', startFrom: 2015 })
      );
    });
    await waitForBehaviorAssertion(fixture, () => {
      expect(JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}')).toMatchObject({
        selectedTeamId: '29',
        startFromSeason: 2015,
        season: null,
        reportType: 'regular',
      });
    });
    await waitForBehaviorAssertion(fixture, () => {
      expect(screen.getByText('Dallas Demo Player')).toBeInTheDocument();
    });
  });
});

describe('buildRootRouteUiState', () => {
  it('uses the lighter browse shell for career routes before navigation settles', () => {
    expect(buildRootRouteUiState('/career/players?tab=goalies')).toEqual({
      isDashboardRoute: false,
      currentRouteSubtitleKey: 'nav.playerCareers',
      skipLinkTargetId: 'career-table',
      skipLinkLabelKey: 'a11y.skipToTable',
    });
  });

  it('uses the lighter browse shell for leaderboard routes before navigation settles', () => {
    expect(buildRootRouteUiState('/leaderboards/playoffs')).toEqual({
      isDashboardRoute: false,
      currentRouteSubtitleKey: 'nav.leaderboards',
      skipLinkTargetId: 'leaderboard-table',
      skipLinkLabelKey: 'a11y.skipToTable',
    });
  });

  it('uses the lighter browse shell for draft routes before navigation settles', () => {
    expect(buildRootRouteUiState('/draft/opening-draft')).toEqual({
      isDashboardRoute: false,
      currentRouteSubtitleKey: 'nav.drafts',
      skipLinkTargetId: 'draft-list',
      skipLinkLabelKey: 'a11y.skipToDraftList',
    });
  });

  it('keeps dashboard routes on the heavier shell', () => {
    expect(buildRootRouteUiState('/goalie-stats')).toEqual({
      isDashboardRoute: true,
      currentRouteSubtitleKey: 'nav.hockeyPlayerStats',
      skipLinkTargetId: 'stats-table',
      skipLinkLabelKey: 'a11y.skipToTable',
    });
  });
});

describe('buildDashboardRouteUiState', () => {
  it('uses goalie context for goalie stats and direct goalie routes', () => {
    expect(buildDashboardRouteUiState('/goalie-stats')).toEqual({
      controlsContext: 'goalie',
    });
    expect(buildDashboardRouteUiState('/goalie/colorado/philipp-grubauer')).toEqual({
      controlsContext: 'goalie',
    });
  });

  it('uses player context for player stats and direct player routes', () => {
    expect(buildDashboardRouteUiState('/player-stats')).toEqual({
      controlsContext: 'player',
    });
    expect(buildDashboardRouteUiState('/player/colorado/jamie-benn')).toEqual({
      controlsContext: 'player',
    });
  });
});

describe('buildSettingsDrawerRouteConfig', () => {
  it('uses stats mode with the right stats context for stats routes', () => {
    expect(buildSettingsDrawerRouteConfig('/')).toEqual({
      mode: 'stats',
      statsContext: 'player',
    });
    expect(buildSettingsDrawerRouteConfig('/goalie-stats')).toEqual({
      mode: 'stats',
      statsContext: 'goalie',
    });
    expect(buildSettingsDrawerRouteConfig('/player/colorado/jamie-benn')).toEqual({
      mode: 'stats',
      statsContext: 'player',
    });
  });

  it('uses team mode for draft and leaderboard browse routes', () => {
    expect(buildSettingsDrawerRouteConfig('/draft/entry-drafts')).toEqual({
      mode: 'team',
    });
    expect(buildSettingsDrawerRouteConfig('/draft/statistics')).toEqual({
      mode: 'team',
    });
    expect(buildSettingsDrawerRouteConfig('/leaderboards/regular')).toEqual({
      mode: 'team',
    });
  });

  it('uses default mode for browse routes without stats controls', () => {
    expect(buildSettingsDrawerRouteConfig('/career/players')).toEqual({
      mode: 'default',
    });
  });

  it('falls back to the root stats drawer config for redirected unknown routes', () => {
    expect(buildSettingsDrawerRouteConfig('/future-route')).toEqual({
      mode: 'stats',
      statsContext: 'player',
    });
  });
});
