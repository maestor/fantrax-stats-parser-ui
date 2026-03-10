import { fireEvent, render, screen } from '@testing-library/angular';
import { TestBed } from '@angular/core/testing';

import { AppComponent } from '../../app.component';
import {
    getBehaviorTestConfig,
    polyfillJsdom,
    seedLocalStorage,
    slicedPlayers,
} from '../../testing/behavior-test-utils';

describe('TopControlsComponent — desktop user flow', { timeout: 60_000 }, () => {
    beforeEach(() => {
        polyfillJsdom();
        seedLocalStorage();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('persists collapsed top-controls state across app reload', async () => {
        const firstRender = await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

        const firstPlayerName = slicedPlayers[0].name;
        await screen.findByText(firstPlayerName, {}, { timeout: 5000 });

        const controlsToggle = screen.getByRole('button', { name: /topControls\.controls/ });
        expect(controlsToggle).toHaveAttribute('aria-expanded', 'true');

        fireEvent.click(controlsToggle);

        await vi.waitFor(() => {
            expect(controlsToggle).toHaveAttribute('aria-expanded', 'false');
        });

        expect(
            screen.queryByRole('combobox', { name: /team\.selector/ })
        ).not.toBeInTheDocument();

        firstRender.fixture.destroy();
        TestBed.resetTestingModule();

        await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));
        await screen.findByText(firstPlayerName, {}, { timeout: 5000 });

        expect(
            screen.getByRole('button', { name: /topControls\.controls/ })
        ).toHaveAttribute('aria-expanded', 'false');
        expect(
            screen.queryByRole('combobox', { name: /team\.selector/ })
        ).not.toBeInTheDocument();
    });
});
