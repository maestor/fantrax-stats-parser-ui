import { fireEvent, render, screen, within } from '@testing-library/angular';

import { PlayerStatsComponent } from '../../../player-stats/player-stats.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  seedLocalStorage,
  slicedPlayers,
} from '../../../testing/behavior-test-utils';

describe('StatsModeToggleComponent — player stats user flow', { timeout: 60_000 }, () => {
  beforeEach(() => {
    polyfillJsdom();
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('switches the player table from score totals to per-game score columns', async () => {
    const { fixture } = await render(PlayerStatsComponent, getBehaviorTestConfig({ isMobile: false }));

    const firstPlayerCell = await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });
    const firstPlayerRow = firstPlayerCell.closest('tr');

    expect(firstPlayerRow).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /settingsPanel\.settings/ }));

    const statsModeToggle = await screen.findByRole('switch', { name: 'statsModeToggle' });
    expect(within(firstPlayerRow as HTMLElement).getByText('100')).toBeInTheDocument();
    expect(within(firstPlayerRow as HTMLElement).getByText('85.56')).toBeInTheDocument();

    fireEvent.click(statsModeToggle);

    await vi.waitFor(() => {
      fixture.detectChanges();
      const updatedFirstPlayerRow = screen
        .getByText(slicedPlayers[0].name)
        .closest('tr');

      expect(updatedFirstPlayerRow).not.toBeNull();
      expect(statsModeToggle).toHaveAttribute('aria-checked', 'true');
      expect(within(updatedFirstPlayerRow as HTMLElement).queryByText('100')).not.toBeInTheDocument();
      expect(within(updatedFirstPlayerRow as HTMLElement).getByText('85.56')).toBeInTheDocument();
    });
  });
});
