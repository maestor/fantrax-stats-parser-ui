import { fireEvent, render, screen } from '@testing-library/angular';
import { TestBed } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AppComponent, buildRootRouteUiState } from './app.component';
import {
  buildDashboardRouteUiState,
  buildInitialDashboardMobileState,
} from './dashboard-shell/dashboard-shell.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  polyfillMatchMedia,
  seedLocalStorage,
  slicedPlayers,
  PLAYER_SLICE_COUNT,
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
  });

  it('renders all user-visible elements and supports skip link focus flow', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

    // Wait for lazy-loaded route and async data pipeline to complete
    const firstPlayerName = slicedPlayers[0].name;
    await screen.findByText(firstPlayerName, {}, { timeout: 5000 });

    // -- Page title --
    expect(
      screen.getByRole('heading', { name: 'pageTitle' })
    ).toBeInTheDocument();

    // -- Last modified --
    expect(screen.getByText(/lastModified\.label/)).toBeInTheDocument();

    // -- Top controls: toggle button (expanded by default) --
    const controlsToggle = screen.getByRole('button', { name: /topControls\.controls/ });
    expect(controlsToggle).toHaveAttribute('aria-expanded', 'true');

    // -- Top controls: four dropdowns with default values --
    const teamCombobox = screen.getByRole('combobox', { name: /team\.selector/ });
    expect(teamCombobox).toBeInTheDocument();
    expect(screen.getByText('Colorado Avalanche')).toBeInTheDocument();

    const seasonCombobox = screen.getByRole('combobox', { name: /season\.selector/ });
    expect(seasonCombobox).toBeInTheDocument();
    expect(screen.getByText('season.allSeasons')).toBeInTheDocument();

    const reportCombobox = screen.getByRole('combobox', { name: /reportType\.selector/ });
    expect(reportCombobox).toBeInTheDocument();
    expect(screen.getByText('reportType.regular')).toBeInTheDocument();

    const startFromCombobox = screen.getByRole('combobox', { name: /startFromSeason\.selector/ });
    expect(startFromCombobox).toBeInTheDocument();

    // -- Navigation tabs --
    expect(screen.getByRole('tab', { name: 'link.playerStats' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'link.goalieStats' })).toBeInTheDocument();

    // -- Nav menu button --
    expect(
      screen.getByRole('button', { name: 'a11y.openNavMenu' })
    ).toBeInTheDocument();

    // -- Settings panel toggle (collapsed by default) --
    const settingsToggle = screen.getByRole('button', { name: /settingsPanel\.settings/ });
    expect(settingsToggle).toHaveAttribute('aria-expanded', 'false');

    // -- Stats table with expected row count --
    expect(screen.getByRole('table')).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    // Header row + one data row per player
    expect(rows).toHaveLength(PLAYER_SLICE_COUNT + 1);

    // -- Search input --
    expect(screen.getByLabelText('table.playerSearch')).toBeInTheDocument();

    // -- Footer --
    expect(await screen.findByRole(
      'navigation',
      { name: 'footer.links.ariaLabel' },
      { timeout: 5000 }
    )).toBeInTheDocument();
    expect(screen.getByText('footer.links.linkedin.label')).toBeInTheDocument();
    expect(screen.getByText('footer.links.ui.label')).toBeInTheDocument();
    expect(screen.getByText('footer.links.api.label')).toBeInTheDocument();
    expect(screen.getByText('footer.copyright')).toBeInTheDocument();

    // -- Accessibility flow (merged on purpose for speed):
    // Verify the skip link moves focus directly to the first data row after initial content has loaded.
    // Keeping this in the same render avoids a second expensive full-app render while preserving user-path behavior.
    const skipLink = screen.getByText('a11y.skipToTable');
    fireEvent.click(skipLink);

    expect(document.activeElement?.textContent).toContain(firstPlayerName);
  });

  it('supports keyboard shortcuts and ignores help shortcut while typing in the search field', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

    const searchInput = screen.getByLabelText('table.playerSearch');

    fireEvent.keyDown(document, { key: '/' });
    expect(searchInput).toHaveFocus();

    fireEvent.keyDown(searchInput, { key: '?' });
    expect(screen.queryByRole('button', { name: 'helpDialog.close' })).not.toBeInTheDocument();

    searchInput.blur();
    fireEvent.keyDown(document, { key: '?' });

    const helpCloseButton = await screen.findByRole(
      'button',
      { name: 'helpDialog.close' },
      { timeout: 5000 }
    );
    fireEvent.click(helpCloseButton);

    await vi.waitFor(() => {
      expect(screen.queryByRole('button', { name: 'helpDialog.close' })).not.toBeInTheDocument();
    });
  });

  it('shows the update snackbar, reopens it after Escape dismissal, and triggers reload from the snackbar action', async () => {
    const activateAndReload = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        pwaUpdateAvailable: true,
        pwaActivateAndReload: activateAndReload,
      })
    );

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

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

    await render(AppComponent, {
      ...behaviorConfig,
      providers: [
        ...behaviorConfig.providers,
        {
          provide: MatBottomSheet,
          useFactory: bottomSheetFactory,
        },
      ],
    });

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

    expect(bottomSheetFactory).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'a11y.openNavMenu' }));

    await vi.waitFor(() => {
      expect(bottomSheetFactory).toHaveBeenCalledTimes(1);
    });
  });

  it('starts with visible defaults when browser storage is empty', async () => {
    localStorage.clear();

    await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

    expect(screen.getByRole('button', { name: /topControls\.controls/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
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

  it('falls back to regular report type when persisted storage contains an invalid report type', async () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        selectedTeamId: '1',
        startFromSeason: 2012,
        topControlsExpanded: true,
        season: null,
        reportType: 'invalid-report-type',
      })
    );

    await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

    expect(screen.getByRole('combobox', { name: /reportType\.selector/ })).toHaveTextContent(
      'reportType.regular'
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders the empty last-modified placeholder when the API omits the timestamp', async () => {
    await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        lastModified: null,
      })
    );

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

    expect(document.querySelector('.last-modified--empty')).not.toBeNull();
    expect(screen.queryByText(/lastModified\.label/)).not.toBeInTheDocument();
  });

  it('renders the empty last-modified placeholder when the timestamp is invalid', async () => {
    await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        lastModified: {
          lastModified: 'not-a-real-date',
        } as never,
      })
    );

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

    expect(document.querySelector('.last-modified--empty')).not.toBeNull();
    expect(screen.queryByText(/lastModified\.label/)).not.toBeInTheDocument();
  });
});

describe('buildRootRouteUiState', () => {
  it('uses the lighter browse shell for career routes before navigation settles', () => {
    expect(buildRootRouteUiState('/career/players?tab=goalies')).toEqual({
      isDashboardRoute: false,
      currentRouteSubtitleKey: 'nav.playerCareers',
      skipLinkTargetId: 'career-table',
    });
  });

  it('uses the lighter browse shell for leaderboard routes before navigation settles', () => {
    expect(buildRootRouteUiState('/leaderboards/playoffs')).toEqual({
      isDashboardRoute: false,
      currentRouteSubtitleKey: 'nav.leaderboards',
      skipLinkTargetId: 'leaderboard-table',
    });
  });

  it('keeps dashboard routes on the heavier shell', () => {
    expect(buildRootRouteUiState('/goalie-stats')).toEqual({
      isDashboardRoute: true,
      currentRouteSubtitleKey: null,
      skipLinkTargetId: 'stats-table',
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

describe('buildInitialDashboardMobileState', () => {
  it('seeds desktop state synchronously from matchMedia', () => {
    expect(
      buildInitialDashboardMobileState({
        matchMedia: () => ({ matches: false }) as MediaQueryList,
      })
    ).toEqual({
      ready: true,
      isMobile: false,
    });
  });

  it('seeds mobile state synchronously from matchMedia', () => {
    expect(
      buildInitialDashboardMobileState({
        matchMedia: () => ({ matches: true }) as MediaQueryList,
      })
    ).toEqual({
      ready: true,
      isMobile: true,
    });
  });

  it('falls back to desktop when matchMedia is unavailable', () => {
    expect(buildInitialDashboardMobileState(undefined)).toEqual({
      ready: true,
      isMobile: false,
    });
  });
});
