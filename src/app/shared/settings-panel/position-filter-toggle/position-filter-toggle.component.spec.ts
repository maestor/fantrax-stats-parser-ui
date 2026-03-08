import { fireEvent, render, screen, within } from '@testing-library/angular';

import { PlayerStatsComponent } from '../../../player-stats/player-stats.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  seedLocalStorage,
  slicedPlayers,
} from '../../../testing/behavior-test-utils';
import type { Player } from '@services/api.service';

describe('PositionFilterToggleComponent — player stats user flow', { timeout: 60_000 }, () => {
  const forwardPlayer = slicedPlayers.find((player) => player.position === 'F')!;
  const defensemanPlayer = slicedPlayers.find((player) => player.position === 'D')!;

  beforeEach(() => {
    polyfillJsdom();
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('filters the player table by selected position from the default all-players state', async () => {
    const { fixture } = await render(
      PlayerStatsComponent,
      getBehaviorTestConfig({
        isMobile: false,
        players: [forwardPlayer, defensemanPlayer] as unknown as Player[],
      })
    );

    const playerTable = await screen.findByRole('table');
    await screen.findByText(forwardPlayer.name, {}, { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: /settingsPanel\.settings/ }));

    const allToggle = screen.getByRole('radio', { name: 'positionFilter.all' });
    const defenseToggle = screen.getByRole('radio', { name: 'positionFilter.defensemen' });
    const forwardToggle = screen.getByRole('radio', { name: 'positionFilter.forwards' });

    expect(allToggle).toHaveAttribute('aria-checked', 'true');
    expect(within(playerTable).getByText(forwardPlayer.name)).toBeInTheDocument();
    expect(within(playerTable).getByText(defensemanPlayer.name)).toBeInTheDocument();

    fireEvent.click(defenseToggle);

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(defenseToggle).toHaveAttribute('aria-checked', 'true');
      expect(within(playerTable).getByText(defensemanPlayer.name)).toBeInTheDocument();
      expect(within(playerTable).queryByText(forwardPlayer.name)).not.toBeInTheDocument();
    });

    fireEvent.click(forwardToggle);

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(forwardToggle).toHaveAttribute('aria-checked', 'true');
      expect(within(playerTable).getByText(forwardPlayer.name)).toBeInTheDocument();
      expect(within(playerTable).queryByText(defensemanPlayer.name)).not.toBeInTheDocument();
    });
  });
});
