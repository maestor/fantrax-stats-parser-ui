import { fireEvent, render, screen } from '@testing-library/angular';

import { AppComponent } from '../../app.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  seedLocalStorage,
  slicedPlayers,
} from '../../testing/behavior-test-utils';

describe('GlobalNavComponent — navigation flow', { timeout: 45_000 }, () => {
  beforeEach(() => {
    polyfillJsdom();
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('opens navigation with default view active, navigates to leaderboards, opens info dialog, and closes', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

    // Wait for the app to fully load
    const firstPlayerName = slicedPlayers[0].name;
    await screen.findByText(firstPlayerName, {}, { timeout: 5000 });

    // -- Open navigation bottom sheet --
    fireEvent.click(screen.getByRole('button', { name: 'a11y.openNavMenu' }));

    // Navigation appears with all three items
    const hockeyBtn = await screen.findByRole('button', { name: /nav\.hockeyPlayerStats/ });
    expect(screen.getByRole('button', { name: /nav\.leaderboards/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nav\.info/ })).toBeInTheDocument();

    // Hockey stats is the active (default) item — verified via active CSS class
    // (aria-current binding does not propagate in jsdom bottom sheet context)
    expect(hockeyBtn).toHaveClass('global-nav-item--active');
    expect(screen.getByRole('button', { name: /nav\.leaderboards/ })).not.toHaveClass('global-nav-item--active');

    // -- Navigate to leaderboards --
    fireEvent.click(screen.getByRole('button', { name: /nav\.leaderboards/ }));

    // Bottom sheet dismisses after route navigation; wait for leaderboard page tab links
    await screen.findByText('leaderboards.tabs.regular', {}, { timeout: 5000 });
    await vi.waitFor(() => {
      expect(screen.queryByRole('button', { name: /nav\.leaderboards/ })).not.toBeInTheDocument();
    });

    // Re-open navigation and verify leaderboards is now active
    fireEvent.click(screen.getByRole('button', { name: 'a11y.openNavMenu' }));

    const leaderboardsBtn2 = await screen.findByRole('button', { name: /nav\.leaderboards/ });
    expect(leaderboardsBtn2).toHaveClass('global-nav-item--active');

    const hockeyBtn2 = screen.getByRole('button', { name: /nav\.hockeyPlayerStats/ });
    expect(hockeyBtn2).not.toHaveClass('global-nav-item--active');

    // -- Open info/help dialog from nav --
    fireEvent.click(screen.getByRole('button', { name: /nav\.info/ }));

    // Help dialog appears (opens as a separate overlay)
    const closeBtn = await screen.findByRole('button', { name: 'helpDialog.close' });

    // Close the help dialog via its close button
    fireEvent.click(closeBtn);

    // Navigation should still be open after closing the help dialog
    await vi.waitFor(() => {
      expect(screen.queryByRole('button', { name: 'helpDialog.close' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /nav\.hockeyPlayerStats/ })).toBeInTheDocument();

    // -- Close navigation by clicking the backdrop overlay --
    const backdrop = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
    fireEvent.click(backdrop);

    // Wait for navigation items to disappear
    await vi.waitFor(() => {
      expect(screen.queryByRole('button', { name: /nav\.hockeyPlayerStats/ })).not.toBeInTheDocument();
    });
  });
});
