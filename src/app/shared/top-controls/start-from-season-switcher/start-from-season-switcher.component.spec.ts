import { fireEvent, render, screen } from '@testing-library/angular';
import { of } from 'rxjs';

import { AppComponent } from '../../../app.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  seedLocalStorage,
  slicedPlayers,
} from '../../../testing/behavior-test-utils';
import type { Player } from '@services/api.service';

describe('StartFromSeasonSwitcherComponent — desktop user flow', () => {
  beforeEach(() => {
    polyfillJsdom();
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('updates the visible player table when the start-from season changes', async () => {
    const recentPlayers = [
      { ...slicedPlayers[0], id: 'recent-demo', name: 'Recent Demo' },
    ] as unknown as Player[];
    const getPlayerData = vi.fn((params: { startFrom?: number }) =>
      params.startFrom === 2015
        ? of(recentPlayers)
        : of(slicedPlayers as unknown as Player[])
    );

    const { fixture } = await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        getPlayerData,
      })
    );

    const initialPlayerName = slicedPlayers[0].name;
    await screen.findByText(initialPlayerName, {}, { timeout: 5000 });

    const startFromCombobox = screen.getByRole('combobox', {
      name: /startFromSeason\.selector/,
    });
    fireEvent.click(startFromCombobox);
    fireEvent.click(await screen.findByRole('option', { name: '2015-2016' }));

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(startFromCombobox).toHaveTextContent('2015-2016');
      expect(screen.getByText('Recent Demo')).toBeInTheDocument();
      expect(screen.queryByText(initialPlayerName)).not.toBeInTheDocument();
      expect(getPlayerData).toHaveBeenCalledWith(
        expect.objectContaining({ startFrom: 2015 })
      );
    });
  });
});
