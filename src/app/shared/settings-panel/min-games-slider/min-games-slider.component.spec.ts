import { fireEvent, render, screen, within } from '@testing-library/angular';

import { PlayerStatsComponent } from '../../../player-stats/player-stats.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  seedLocalStorage,
  slicedPlayers,
} from '../../../testing/behavior-test-utils';
import type { Player } from '@services/api.service';

describe('MinGamesSliderComponent — player stats user flow', { timeout: 60_000 }, () => {
  const highGamesPlayer = {
    ...slicedPlayers[0],
    id: 'high-games-player',
    name: 'High Games Player',
    games: 10,
  } as unknown as Player;
  const lowGamesPlayer = {
    ...slicedPlayers[1],
    id: 'low-games-player',
    name: 'Low Games Player',
    games: 6,
  } as unknown as Player;

  beforeEach(() => {
    polyfillJsdom();
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('filters the player table when the minimum games threshold increases', async () => {
    const { fixture } = await render(
      PlayerStatsComponent,
      getBehaviorTestConfig({
        isMobile: false,
        players: [highGamesPlayer, lowGamesPlayer],
      })
    );

    const playerTable = await screen.findByRole('table');
    await screen.findByText(highGamesPlayer.name, {}, { timeout: 5000 });
    expect(within(playerTable).getByText(lowGamesPlayer.name)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /settingsPanel\.settings/ }));

    const minGamesSlider = await screen.findByRole('slider', {
      name: 'minGamesSlider.ariaLabel',
    });

    fireEvent.input(minGamesSlider, { target: { value: '7' } });
    fireEvent.change(minGamesSlider, { target: { value: '7' } });

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(minGamesSlider).toHaveValue('7');
      expect(within(playerTable).getByText(highGamesPlayer.name)).toBeInTheDocument();
      expect(within(playerTable).queryByText(lowGamesPlayer.name)).not.toBeInTheDocument();
    });
  });
});
