import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { ApiService } from '@services/api.service';
import { ViewportService } from '@services/viewport.service';
import { PwaUpdateService } from '@services/pwa-update.service';

import teamsFixture from '../../e2e/fixtures/data/teams.json';
import lastModifiedFixture from '../../e2e/fixtures/data/last-modified.json';
import seasonsFixture from '../../e2e/fixtures/data/seasons--regular.json';
import playersFixture from '../../e2e/fixtures/data/players--combined--regular.json';

describe('AppComponent — desktop frontpage', () => {
  beforeEach(() => {
    // Pre-seed SettingsService via localStorage so startFromSeason is non-null.
    // StatsBaseComponent returns EMPTY when both season and startFrom are undefined,
    // so this ensures data loading starts immediately without waiting for
    // StartFromSeasonSwitcherComponent to resolve.
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        selectedTeamId: '1',
        startFromSeason: 2012,
        topControlsExpanded: true,
        season: null,
        reportType: 'regular',
      })
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  async function setup() {
    const mockApiService = {
      getTeams: () => of(teamsFixture),
      getLastModified: () => of(lastModifiedFixture),
      getSeasons: () => of(seasonsFixture),
      getPlayerData: () => of(playersFixture.slice(0, 20)),
      getGoalieData: () => of([]),
      getLeaderboardRegular: () => of([]),
      getLeaderboardPlayoffs: () => of([]),
    };

    const mockViewportService = {
      isMobile$: of(false),
    };

    const mockPwaUpdateService = {
      updateAvailable$: of(false),
      activateAndReload: vi.fn(),
    };

    await render(AppComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideNoopAnimations(),
        { provide: ApiService, useValue: mockApiService },
        { provide: ViewportService, useValue: mockViewportService },
        { provide: PwaUpdateService, useValue: mockPwaUpdateService },
      ],
    });

    // Wait for lazy-loaded route, async data pipeline (auditTime(0) in StatsBaseComponent),
    // and the StartFromSeasonSwitcherComponent to resolve startFromSeason before data loads.
    // We wait for an actual player name from the fixture to appear, confirming data has rendered.
    const firstPlayerName = playersFixture[0].name;
    await screen.findByText(firstPlayerName, {}, { timeout: 5000 });
  }

  it('renders the page title heading', async () => {
    await setup();

    expect(
      screen.getByRole('heading', { name: 'pageTitle' })
    ).toBeInTheDocument();
  });

  it('renders last modified text', async () => {
    await setup();

    expect(screen.getByText(/lastModified\.label/)).toBeInTheDocument();
  });

  it('renders the controls toggle button', async () => {
    await setup();

    const button = screen.getByRole('button', { name: /topControls\.controls/ });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders the nav menu button', async () => {
    await setup();

    expect(
      screen.getByRole('button', { name: 'a11y.openNavMenu' })
    ).toBeInTheDocument();
  });

  it('renders navigation tabs for player and goalie stats', async () => {
    await setup();

    // Angular Material renders mat-tab-link with role="tab"
    expect(screen.getByRole('tab', { name: 'link.playerStats' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'link.goalieStats' })).toBeInTheDocument();
  });

  it('renders the stats table with data rows', async () => {
    await setup();

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // The table should have rows (header + data rows)
    const rows = screen.getAllByRole('row');
    // At least header row + some data rows (we provided 20 players)
    expect(rows.length).toBeGreaterThan(1);
  });

  it('renders the settings panel toggle button', async () => {
    await setup();

    // The settings panel button text includes the toggle icon character
    const button = screen.getByRole('button', { name: /settingsPanel\.settings/ });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders footer content with navigation links', async () => {
    await setup();

    const footerNav = screen.getByRole('navigation', { name: 'footer.links.ariaLabel' });
    expect(footerNav).toBeInTheDocument();

    // Footer has 3 links (LinkedIn, UI GitHub, API GitHub)
    expect(screen.getByText('footer.links.linkedin.label')).toBeInTheDocument();
    expect(screen.getByText('footer.links.ui.label')).toBeInTheDocument();
    expect(screen.getByText('footer.links.api.label')).toBeInTheDocument();
  });

  it('renders the search input for filtering players', async () => {
    await setup();

    expect(
      screen.getByLabelText('table.playerSearch')
    ).toBeInTheDocument();
  });

  it('renders copyright text in footer', async () => {
    await setup();

    expect(screen.getByText('footer.copyright')).toBeInTheDocument();
  });
});
