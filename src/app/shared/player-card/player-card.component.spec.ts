import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen, within } from '@testing-library/angular';

import { AppComponent } from '../../app.component';
import {
    getBehaviorTestConfig,
    polyfillJsdom,
    polyfillMatchMedia,
    seedLocalStorage,
    slicedPlayers,
    waitForBehaviorAssertion,
} from '../../testing/behavior-test-utils';
import { toSlug } from '@shared/utils/slug.utils';
import { PlayerCardNavigationService } from './player-card-navigation.service';

describe('PlayerCardComponent — desktop user flow', { timeout: 90_000 }, () => {
    const writeTextMock = vi.fn<(_: string) => Promise<void>>();

    beforeEach(() => {
        polyfillJsdom();
        polyfillMatchMedia();
        seedLocalStorage();

        writeTextMock.mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: writeTextMock },
            configurable: true,
        });
    });

    afterEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('opens player card, shows tabs, copies share link, and closes it', async () => {
        const { fixture } = await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

        const firstPlayerName = slicedPlayers[0].name;
        await waitForBehaviorAssertion(fixture, () => {
            expect(screen.getByText(firstPlayerName)).toBeInTheDocument();
        });
        const firstPlayerCell = screen.getByText(firstPlayerName);

        // Open card by clicking a player row in stats table.
        fireEvent.click(firstPlayerCell);

        const dialog = await screen.findByRole('dialog', {}, { timeout: 15000 });
        const closePlayerCardButton = within(dialog).getByRole('button', {
            name: 'a11y.closePlayerCard',
        });
        expect(closePlayerCardButton).toBeInTheDocument();

        // Card tabs exist for combined player data.
        expect(within(dialog).getByRole('tab', { name: 'playerCard.all' })).toBeInTheDocument();
        expect(within(dialog).getByRole('tab', { name: 'playerCard.bySeason' })).toBeInTheDocument();
        expect(within(dialog).getByRole('tab', { name: 'playerCard.graphs' })).toBeInTheDocument();

        // Wait until selected team is resolved so copy-link can build a full URL.
        await within(dialog).findByText('Colorado Avalanche', { selector: '.team-name' });

        const copyLinkButton = within(dialog).getByRole('button', { name: 'playerCard.copyLink' });
        fireEvent.click(copyLinkButton);

        const playerSlug = toSlug(firstPlayerName);
        await vi.waitFor(() => {
            expect(writeTextMock).toHaveBeenCalledWith(
                `${window.location.origin}/player/colorado/${playerSlug}`
            );
        });

        // Copy feedback switches tooltip text to the copied-state key.
        const copiedTooltipNodes = await screen.findAllByText('playerCard.linkCopied');
        expect(copiedTooltipNodes.length).toBeGreaterThan(0);

        // Close card via dialog close button.
        fireEvent.click(closePlayerCardButton);

        await vi.waitFor(() => {
            expect(screen.queryByRole('button', { name: 'a11y.closePlayerCard' })).not.toBeInTheDocument();
        });
    });

    it('updates skater stats when position filter is toggled and keeps table row state in sync during keyboard navigation', async () => {
        const { fixture } = await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

        const targetPlayerName = slicedPlayers[1].name;
        await waitForBehaviorAssertion(fixture, () => {
            expect(screen.getByText(targetPlayerName)).toBeInTheDocument();
        });
        const targetPlayerCell = screen.getByText(targetPlayerName);
        fireEvent.click(targetPlayerCell);

        const closePlayerCardButton = await screen.findByRole('button', { name: 'a11y.closePlayerCard' });
        const playerName = screen.getByText(targetPlayerName, { selector: '.player-card-player-name' });
        const dialog = screen.getByRole('dialog');
        expect(playerName).toBeInTheDocument();

        expect(within(dialog).getByText('75.5')).toBeInTheDocument();

        const positionFilterToggle = screen.getByRole('switch', {
            name: 'playerCardPositionFilter.forwards',
        });
        fireEvent.click(positionFilterToggle);

        await vi.waitFor(() => {
            expect(within(dialog).getByText('74.12')).toBeInTheDocument();
        });

        fireEvent.keyDown(closePlayerCardButton, { key: 'ArrowLeft' });

        await vi.waitFor(() => {
            expect(
                screen.getByText(slicedPlayers[0].name, { selector: '.player-card-player-name' })
            ).toBeInTheDocument();
        });

        const firstActiveRow = document.querySelector('tr[data-row-index="0"]');
        expect(firstActiveRow).toHaveClass('a11y-active');

        fireEvent.keyDown(closePlayerCardButton, { key: 'ArrowRight' });

        await vi.waitFor(() => {
            expect(
                screen.getByText(targetPlayerName, { selector: '.player-card-player-name' })
            ).toBeInTheDocument();
        });

        const secondActiveRow = document.querySelector('tr[data-row-index="1"]');
        expect(secondActiveRow).toHaveClass('a11y-active');
    });

    it('supports graphs tab interactions for combined player data', async () => {
        const { fixture } = await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

        await waitForBehaviorAssertion(fixture, () => {
            expect(screen.getByText(slicedPlayers[0].name)).toBeInTheDocument();
        });
        const firstPlayerCell = screen.getByText(slicedPlayers[0].name);
        fireEvent.click(firstPlayerCell);

        const dialog = await screen.findByRole('dialog');
        const closePlayerCardButton = within(dialog).getByRole('button', { name: 'a11y.closePlayerCard' });

        fireEvent.click(within(dialog).getByRole('tab', { name: 'playerCard.graphs' }));

        const switchToRadarButton = await within(dialog).findByRole('button', {
            name: 'graphs.switchToRadar',
        }, { timeout: 10000 });
        expect(switchToRadarButton).toBeInTheDocument();

        const graphControlsToggleText = within(dialog).getByText('controlPanel.graphControls');
        const graphControlsToggle = graphControlsToggleText.closest('button');
        expect(graphControlsToggle).not.toBeNull();
        fireEvent.click(graphControlsToggle!);

        const goalsCheckbox = await within(dialog).findByRole('checkbox', {
            name: 'tableColumn.goals',
        });
        fireEvent.click(goalsCheckbox);

        await vi.waitFor(() => {
            expect(goalsCheckbox).toBeChecked();
        });

        goalsCheckbox.focus();
        fireEvent.keyDown(goalsCheckbox, { key: 'ArrowDown' });
        expect(closePlayerCardButton).toHaveFocus();

        goalsCheckbox.focus();
        fireEvent.keyDown(goalsCheckbox, { key: 'ArrowUp' });
        expect(within(dialog).getByRole('tab', { name: 'playerCard.graphs', selected: true })).toHaveFocus();

        fireEvent.click(switchToRadarButton);
        expect(await within(dialog).findByText('graphs.radarInfo')).toBeInTheDocument();

        const positionFilterToggle = within(dialog).getByRole('switch', {
            name: 'playerCardPositionFilter.forwards',
        });
        fireEvent.click(positionFilterToggle);

        await vi.waitFor(() => {
            expect(positionFilterToggle).toHaveAttribute('aria-checked', 'true');
            expect(within(dialog).getByText('graphs.radarInfo')).toBeInTheDocument();
        });

        fireEvent.click(within(dialog).getByRole('button', { name: 'graphs.switchToLine' }));

        await vi.waitFor(() => {
            expect(
                within(dialog).getByRole('button', { name: 'graphs.switchToRadar' })
            ).toBeInTheDocument();
        });
    });

    it('should not call getBoundingClientRect during card navigation (no forced reflow)', async () => {
        vi.useFakeTimers();
        try {
            polyfillMatchMedia();

            const wrapper = document.createElement('div');
            wrapper.className = 'card-content-wrapper';
            document.body.appendChild(wrapper);

            const spy = vi.spyOn(wrapper, 'getBoundingClientRect');

            const service = TestBed.runInInjectionContext(() => new PlayerCardNavigationService());
            const cdrStub = { detectChanges: vi.fn() } as unknown as ChangeDetectorRef;

            const mockPlayers = [
                { name: 'Player A' },
                { name: 'Player B' },
            ] as never[];

            service.init(
                { allPlayers: mockPlayers, currentIndex: 0 },
                cdrStub,
                vi.fn(),
            );

            service.navigateToNext();
            vi.runAllTimers();

            expect(spy).not.toHaveBeenCalled();

            service.ngOnDestroy();
            document.body.removeChild(wrapper);
        } finally {
            vi.useRealTimers();
        }
    });

    it('supports touch and wheel navigation while announcing the active player', async () => {
        const { fixture } = await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

        await waitForBehaviorAssertion(fixture, () => {
            expect(screen.getByText(slicedPlayers[0].name)).toBeInTheDocument();
        });
        const firstPlayerCell = screen.getByText(slicedPlayers[0].name);
        fireEvent.click(firstPlayerCell);

        const dialog = await screen.findByRole('dialog');
        const cardHost = document.querySelector('app-player-card');
        expect(cardHost).not.toBeNull();

        fireEvent.touchStart(cardHost!, {
            touches: [{ identifier: 1, clientX: 240, clientY: 80 }],
        });
        fireEvent.touchEnd(cardHost!, {
            changedTouches: [{ identifier: 1, clientX: 120, clientY: 82 }],
        });

        await vi.waitFor(() => {
            expect(
                within(dialog).getByText(slicedPlayers[1].name, { selector: '.player-card-player-name' })
            ).toBeInTheDocument();
        });
        expect(
            within(dialog).getByText(`Pelaaja 2 / ${slicedPlayers.length}: ${slicedPlayers[1].name}`)
        ).toBeInTheDocument();

        fireEvent.wheel(document, { deltaX: -120, deltaY: 0 });

        await vi.waitFor(() => {
            expect(
                within(dialog).getByText(slicedPlayers[0].name, { selector: '.player-card-player-name' })
            ).toBeInTheDocument();
        });
    });
});
