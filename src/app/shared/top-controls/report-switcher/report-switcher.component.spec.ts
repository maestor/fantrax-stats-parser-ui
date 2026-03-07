import { fireEvent, render, screen } from '@testing-library/angular';
import { AppComponent } from '../../../app.component';
import {
    getBehaviorTestConfig,
    polyfillJsdom,
    seedLocalStorage,
    slicedPlayers,
} from '../../../testing/behavior-test-utils';

describe('ReportSwitcherComponent — desktop user flow', () => {
    beforeEach(() => {
        polyfillJsdom();
        seedLocalStorage();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('lets user change report type from regular to playoffs and both', async () => {
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

        fireEvent.click(reportCombobox);
        const bothOption = await screen.findByRole('option', { name: 'reportType.both' });
        fireEvent.click(bothOption);

        await vi.waitFor(() => {
            expect(reportCombobox).toHaveTextContent('reportType.both');
        });
    });
});
