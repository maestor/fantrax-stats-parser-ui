import { TestBed } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { fireEvent, render, screen } from '@testing-library/angular';

import { AppComponent } from '../../app.component';
import { GlobalNavComponent } from './global-nav.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  seedLocalStorage,
  slicedPlayers,
} from '../../testing/behavior-test-utils';

// Full-render navigation flow re-renders overlays and lazy routes, so coverage runs need more headroom.
describe('GlobalNavComponent — navigation flow', { timeout: 90_000 }, () => {
  beforeEach(() => {
    polyfillJsdom();
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('opens navigation with default view active, navigates to career and leaderboards, opens info dialog, and closes', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

    // Wait for the app to fully load
    const firstPlayerName = slicedPlayers[0].name;
    await screen.findByText(firstPlayerName, {}, { timeout: 5000 });

    // Open the sheet through Material directly so the test covers navigation behavior
    // without depending on the shell button's lazy import timing.
    TestBed.inject(MatBottomSheet).open(GlobalNavComponent, { autoFocus: false });

    // Navigation appears with all route/action items
    const hockeyBtn = await screen.findByRole(
      'button',
      { name: /nav\.hockeyPlayerStats/ },
      { timeout: 5000 }
    );
    expect(screen.getByRole('button', { name: /nav\.playerCareers/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nav\.leaderboards/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nav\.info/ })).toBeInTheDocument();

    // Hockey stats is the active (default) item — verified via active CSS class
    // (aria-current binding does not propagate in jsdom bottom sheet context)
    expect(hockeyBtn).toHaveClass('global-nav-item--active');
    expect(screen.getByRole('button', { name: /nav\.playerCareers/ })).not.toHaveClass('global-nav-item--active');
    expect(screen.getByRole('button', { name: /nav\.leaderboards/ })).not.toHaveClass('global-nav-item--active');

    // -- Navigate to careers --
    fireEvent.click(screen.getByRole('button', { name: /nav\.playerCareers/ }));

    await screen.findByText('career.tabs.players', {}, { timeout: 5000 });
    expect(screen.getByLabelText('table.careerPlayerSearch')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /team\.selector/ })).not.toBeInTheDocument();
    await vi.waitFor(() => {
      expect(screen.queryByRole('button', { name: /nav\.playerCareers/ })).not.toBeInTheDocument();
    });

    // Re-open navigation and verify careers is now active
    fireEvent.click(screen.getByRole('button', { name: 'a11y.openNavMenu' }));

    const careersBtn = await screen.findByRole(
      'button',
      { name: /nav\.playerCareers/ },
      { timeout: 5000 }
    );
    expect(careersBtn).toHaveClass('global-nav-item--active');
    expect(screen.getByRole('button', { name: /nav\.hockeyPlayerStats/ })).not.toHaveClass('global-nav-item--active');

    // -- Navigate to leaderboards --
    fireEvent.click(screen.getByRole('button', { name: /nav\.leaderboards/ }));

    // Bottom sheet dismisses after route navigation; wait for leaderboard page tab links
    await screen.findByText('leaderboards.tabs.regular', {}, { timeout: 5000 });
    await vi.waitFor(() => {
      expect(screen.queryByRole('button', { name: /nav\.leaderboards/ })).not.toBeInTheDocument();
    });

    // Re-open navigation and verify leaderboards is now active
    fireEvent.click(screen.getByRole('button', { name: 'a11y.openNavMenu' }));

    const leaderboardsBtn2 = await screen.findByRole(
      'button',
      { name: /nav\.leaderboards/ },
      { timeout: 5000 }
    );
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
