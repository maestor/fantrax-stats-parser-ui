import { fireEvent, render, screen } from '@testing-library/angular';

import { AppComponent } from '../../../app.component';
import {
    getBehaviorTestConfig,
    polyfillJsdom,
    seedLocalStorage,
    slicedPlayers,
} from '../../../testing/behavior-test-utils';

describe('TeamSwitcherComponent — desktop user flow', { timeout: 20_000 }, () => {
    beforeEach(() => {
        polyfillJsdom();
        seedLocalStorage();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('switches team and resets report type to regular', async () => {
        await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

        const firstPlayerName = slicedPlayers[0].name;
        await screen.findByText(firstPlayerName, {}, { timeout: 5000 });

        const reportCombobox = screen.getByRole('combobox', { name: /reportType\.selector/ });
        fireEvent.click(reportCombobox);

        const playoffsOption = await screen.findByRole('option', { name: 'reportType.playoffs' });
        fireEvent.click(playoffsOption);

        await vi.waitFor(() => {
            expect(reportCombobox).toHaveTextContent('reportType.playoffs');
        });

        const teamCombobox = screen.getByRole('combobox', { name: /team\.selector/ });
        fireEvent.click(teamCombobox);

        const dallasOption = await screen.findByRole('option', { name: 'Dallas Stars' });
        fireEvent.click(dallasOption);

        await vi.waitFor(() => {
            expect(teamCombobox).toHaveTextContent('Dallas Stars');
            expect(reportCombobox).toHaveTextContent('reportType.regular');
        });
    });
});
