import { render, screen } from '@testing-library/angular';

import { AppComponent } from './app.component';
import {
  getBehaviorTestConfig,
  seedLocalStorage,
  slicedPlayers,
  PLAYER_SLICE_COUNT,
} from './testing/behavior-test-utils';

// Full-render behavior tests with lazy-loaded routes need more time under load
describe('AppComponent — desktop frontpage', { timeout: 15_000 }, () => {
  beforeEach(() => {
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders all user-visible elements', async () => {
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
    expect(screen.getByText('2012-2013')).toBeInTheDocument();

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
    expect(screen.getByRole('navigation', { name: 'footer.links.ariaLabel' })).toBeInTheDocument();
    expect(screen.getByText('footer.links.linkedin.label')).toBeInTheDocument();
    expect(screen.getByText('footer.links.ui.label')).toBeInTheDocument();
    expect(screen.getByText('footer.links.api.label')).toBeInTheDocument();
    expect(screen.getByText('footer.copyright')).toBeInTheDocument();
  });
});
