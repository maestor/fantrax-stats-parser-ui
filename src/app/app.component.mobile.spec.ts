import { fireEvent, render, screen, within } from '@testing-library/angular';

import { AppComponent } from './app.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  seedLocalStorage,
  slicedPlayers,
  PLAYER_SLICE_COUNT,
} from './testing/behavior-test-utils';

// Full-render behavior tests with lazy-loaded routes need more time under load
describe('AppComponent — mobile frontpage', () => {
  beforeEach(() => {
    polyfillJsdom();
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders all user-visible elements', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: true }));

    // Wait for lazy-loaded route and async data pipeline to complete
    const firstPlayerName = slicedPlayers[0].name;
    await screen.findByText(firstPlayerName, {}, { timeout: 5000 });

    // -- Page title --
    expect(
      screen.getByRole('heading', { name: 'pageTitle' })
    ).toBeInTheDocument();

    // -- Settings drawer toggle button --
    expect(
      screen.getByRole('button', { name: 'a11y.openSettingsDrawer' })
    ).toBeInTheDocument();

    // -- Nav menu button --
    expect(
      screen.getByRole('button', { name: 'a11y.openNavMenu' })
    ).toBeInTheDocument();

    // -- Team name summary --
    expect(screen.getByText(/team\.selector:/)).toBeInTheDocument();

    // -- Navigation tabs --
    expect(screen.getByRole('tab', { name: 'link.playerStats' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'link.goalieStats' })).toBeInTheDocument();

    // -- Stats table with expected row count --
    expect(screen.getByRole('table')).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(PLAYER_SLICE_COUNT + 1);

    // -- Footer --
    expect(screen.getByRole('navigation', { name: 'footer.links.ariaLabel' })).toBeInTheDocument();
    expect(screen.getByText('footer.links.linkedin.label')).toBeInTheDocument();
    expect(screen.getByText('footer.links.ui.label')).toBeInTheDocument();
    expect(screen.getByText('footer.links.api.label')).toBeInTheDocument();
    expect(screen.getByText('footer.copyright')).toBeInTheDocument();
  });

  it('opens settings drawer with expected default content and closes it', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: true }));

    const firstPlayerName = slicedPlayers[0].name;
    await screen.findByText(firstPlayerName, {}, { timeout: 5000 });

    // Drawer starts closed.
    const drawerToggle = screen.getByRole('button', { name: 'a11y.openSettingsDrawer' });

    // Open drawer from the page header.
    fireEvent.click(drawerToggle);

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'a11y.closeSettingsDrawer' })).toBeInTheDocument();
    });

    // Validate drawer sections and expected defaults are visible.
    expect(screen.getByRole('heading', { name: 'topControls.controls' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'settingsPanel.settings' })).toBeInTheDocument();

    expect(screen.getByRole('combobox', { name: /team\.selector/ })).toHaveTextContent('Colorado Avalanche');
    expect(screen.getByRole('combobox', { name: /startFromSeason\.selector/ })).toHaveTextContent('2012-2013');
    expect(screen.getByRole('combobox', { name: /season\.selector/ })).toHaveTextContent('season.allSeasons');
    expect(screen.getByRole('combobox', { name: /reportType\.selector/ })).toHaveTextContent('reportType.regular');

    expect(screen.getByText('positionFilter.label')).toBeInTheDocument();
    expect(screen.getByText('statsModeToggle')).toBeInTheDocument();
    expect(screen.getByText('minGamesSlider.label')).toBeInTheDocument();
    expect(screen.getByText(/lastModified\.label/)).toBeInTheDocument();

    // Close from drawer header close button.
    const drawerHeader = document.querySelector('.settings-drawer-header') as HTMLElement;
    fireEvent.click(within(drawerHeader).getByRole('button', { name: 'a11y.closeSettingsDrawer' }));

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'a11y.openSettingsDrawer' })).toBeInTheDocument();
    });
  });
});
