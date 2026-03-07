import { fireEvent, render, screen, within } from '@testing-library/angular';

import { AppComponent } from '../../app.component';
import {
    getBehaviorTestConfig,
    polyfillJsdom,
    polyfillMatchMedia,
    seedLocalStorage,
    slicedPlayers,
} from '../../testing/behavior-test-utils';
import { toSlug } from '@shared/utils/slug.utils';

describe('PlayerCardComponent — desktop user flow', { timeout: 60_000 }, () => {
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
        await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

        const firstPlayerName = slicedPlayers[0].name;
        const firstPlayerCell = await screen.findByText(firstPlayerName, {}, { timeout: 5000 });

        // Open card by clicking a player row in stats table.
        fireEvent.click(firstPlayerCell);

        const closePlayerCardButton = await screen.findByRole('button', { name: 'a11y.closePlayerCard' });
        expect(closePlayerCardButton).toBeInTheDocument();

        // Card tabs exist for combined player data.
        expect(screen.getByRole('tab', { name: 'playerCard.all' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'playerCard.bySeason' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'playerCard.graphs' })).toBeInTheDocument();

        // Wait until selected team is resolved so copy-link can build a full URL.
        await screen.findByText('Colorado Avalanche', { selector: '.team-name' });

        const copyLinkButton = screen.getByRole('button', { name: 'playerCard.copyLink' });
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
        await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

        const targetPlayerName = slicedPlayers[1].name;
        const targetPlayerCell = await screen.findByText(targetPlayerName, {}, { timeout: 5000 });
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
});
