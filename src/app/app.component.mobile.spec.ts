import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen, within } from '@testing-library/angular';
import { Router } from '@angular/router';

import { AppComponent } from './app.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  slicedGoalies,
  seedLocalStorage,
  slicedPlayers,
  PLAYER_SLICE_COUNT,
} from './testing/behavior-test-utils';

// Full-render behavior tests with lazy-loaded routes need more time under coverage load.
describe('AppComponent — mobile frontpage', { timeout: 60_000 }, () => {
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

  it('closes the settings drawer on Escape and keeps desktop-only toggle buttons out of the mobile UI', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: true }));

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

    expect(
      screen.queryByRole('button', { name: /topControls\.controls/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /settingsPanel\.settings/ })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'a11y.openSettingsDrawer' }));

    const closeDrawerButton = await screen.findByRole('button', { name: 'a11y.closeSettingsDrawer' });
    closeDrawerButton.focus();

    fireEvent.keyDown(closeDrawerButton, { key: 'Escape' });

    await vi.waitFor(() => {
      expect(screen.queryByRole('button', { name: 'a11y.closeSettingsDrawer' })).not.toBeInTheDocument();
    });
  });

  it('persists drawer filter changes across reopen and updates player-only content when switching to goalie stats', async () => {
    await render(
      AppComponent,
      getBehaviorTestConfig({ isMobile: true, goalies: slicedGoalies })
    );

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: 'a11y.openSettingsDrawer' }));
    await screen.findByRole('button', { name: 'a11y.closeSettingsDrawer' });

    const statsModeToggle = screen.getByRole('switch', { name: 'statsModeToggle' });
    fireEvent.click(statsModeToggle);

    await vi.waitFor(() => {
      expect(statsModeToggle).toHaveAttribute('aria-checked', 'true');
    });

    const minGamesSlider = screen.getByRole('slider', {
      name: 'minGamesSlider.ariaLabel',
    });
    fireEvent.input(minGamesSlider, { target: { value: '7' } });
    fireEvent.change(minGamesSlider, { target: { value: '7' } });

    await vi.waitFor(() => {
      expect(minGamesSlider).toHaveValue('7');
    });

    fireEvent.click(screen.getByRole('button', { name: 'a11y.closeSettingsDrawer' }));
    await vi.waitFor(() => {
      expect(screen.queryByRole('button', { name: 'a11y.closeSettingsDrawer' })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'a11y.openSettingsDrawer' }));

    const reopenedToggle = await screen.findByRole('switch', { name: 'statsModeToggle' });
    expect(reopenedToggle).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('slider', { name: 'minGamesSlider.ariaLabel' })
    ).toHaveValue('7');

    fireEvent.click(screen.getByRole('button', { name: 'a11y.closeSettingsDrawer' }));
    fireEvent.click(screen.getByRole('tab', { name: 'link.goalieStats' }));

    await screen.findByText(slicedGoalies[0].name, {}, { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: 'a11y.openSettingsDrawer' }));

    await screen.findByRole('heading', { name: 'settingsPanel.settings' });
    expect(screen.queryByText('positionFilter.label')).not.toBeInTheDocument();
    expect(screen.getByText('statsModeToggle')).toBeInTheDocument();
    expect(screen.getByText('minGamesSlider.label')).toBeInTheDocument();
    expect(screen.getByText(/lastModified\.label/)).toBeInTheDocument();
  });

  it('hides the settings drawer controls on mobile career routes and shows career tabs instead', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: true }));

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/career/players');

    expect(await screen.findByRole('tab', { name: 'career.tabs.players' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'career.tabs.goalies' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByLabelText('table.careerPlayerSearch')).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'a11y.openSettingsDrawer' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/team\.selector:/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'career.tabs.goalies' }));

    expect(await screen.findByLabelText('table.careerGoalieSearch')).toBeInTheDocument();
  });
});
