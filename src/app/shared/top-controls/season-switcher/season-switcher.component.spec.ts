import { fireEvent, render, screen } from '@testing-library/angular';

import { AppComponent } from '../../../app.component';
import {
    getBehaviorTestConfig,
    polyfillJsdom,
    seedLocalStorage,
    slicedPlayers,
} from '../../../testing/behavior-test-utils';

describe('SeasonSwitcherComponent — desktop user flow', () => {
    beforeEach(() => {
        polyfillJsdom();
        seedLocalStorage();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('lets user select a specific season and switch back to all seasons', async () => {
        await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

        const firstPlayerName = slicedPlayers[0].name;
        await screen.findByText(firstPlayerName, {}, { timeout: 5000 });

        const seasonCombobox = screen.getByRole('combobox', { name: /season\.selector/ });

        fireEvent.click(seasonCombobox);
        const season2023 = await screen.findByRole('option', { name: '2023-2024' });
        fireEvent.click(season2023);

        await vi.waitFor(() => {
            expect(seasonCombobox).toHaveTextContent('2023-2024');
        });

        fireEvent.click(seasonCombobox);
        const allSeasonsOption = await screen.findByRole('option', { name: 'season.allSeasons' });
        fireEvent.click(allSeasonsOption);

        await vi.waitFor(() => {
            expect(seasonCombobox).toHaveTextContent('season.allSeasons');
        });
    });
});
