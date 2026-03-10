import { fireEvent, render, screen } from '@testing-library/angular';

import { PlayerStatsComponent } from '../../player-stats/player-stats.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  seedLocalStorage,
  slicedPlayers,
} from '../../testing/behavior-test-utils';

describe(
  'SettingsPanelComponent — player stats user flow',
  { timeout: 60_000 },
  () => {
    beforeEach(() => {
      polyfillJsdom();
      seedLocalStorage();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('renders in player stats and expands to reveal the settings controls', async () => {
      await render(
        PlayerStatsComponent,
        getBehaviorTestConfig({ isMobile: false }),
      );

      await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

      const toggle = screen.getByRole('button', {
        name: /settingsPanel\.settings/,
      });

      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(
        screen.queryByRole('switch', { name: 'statsModeToggle' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('switch', { name: 'minGamesSlider.ariaLabel' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('radio', { name: 'positionFilter.all' }),
      ).not.toBeInTheDocument();

      fireEvent.click(toggle);

      await vi.waitFor(() => {
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(
          screen.getByRole('switch', { name: 'statsModeToggle' }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('slider', { name: 'minGamesSlider.ariaLabel' }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('radio', { name: 'positionFilter.all' }),
        ).toBeInTheDocument();
      });
    });
  },
);
