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

describe('AppComponent — mobile frontpage', () => {
  beforeEach(() => {
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
      isMobile$: of(true),
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

    // Wait for lazy-loaded route, async data pipeline, and data rendering.
    const firstPlayerName = playersFixture[0].name;
    await screen.findByText(firstPlayerName, {}, { timeout: 5000 });
  }

  it('renders the page title heading', async () => {
    await setup();

    expect(
      screen.getByRole('heading', { name: 'pageTitle' })
    ).toBeInTheDocument();
  });

  it('renders the settings drawer toggle button', async () => {
    await setup();

    expect(
      screen.getByRole('button', { name: 'a11y.openSettingsDrawer' })
    ).toBeInTheDocument();
  });

  it('renders the nav menu button', async () => {
    await setup();

    expect(
      screen.getByRole('button', { name: 'a11y.openNavMenu' })
    ).toBeInTheDocument();
  });

  it('renders the team name summary', async () => {
    await setup();

    expect(screen.getByText(/team\.selector:/)).toBeInTheDocument();
  });

  it('renders navigation tabs for player and goalie stats', async () => {
    await setup();

    expect(screen.getByRole('tab', { name: 'link.playerStats' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'link.goalieStats' })).toBeInTheDocument();
  });

  it('renders the stats table with data rows', async () => {
    await setup();

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    // At least header row + some data rows (we provided 20 players)
    expect(rows.length).toBeGreaterThan(1);
  });

  it('renders footer content with navigation links', async () => {
    await setup();

    const footerNav = screen.getByRole('navigation', { name: 'footer.links.ariaLabel' });
    expect(footerNav).toBeInTheDocument();

    expect(screen.getByText('footer.links.linkedin.label')).toBeInTheDocument();
    expect(screen.getByText('footer.links.ui.label')).toBeInTheDocument();
    expect(screen.getByText('footer.links.api.label')).toBeInTheDocument();
  });

  it('renders copyright text in footer', async () => {
    await setup();

    expect(screen.getByText('footer.copyright')).toBeInTheDocument();
  });
});
