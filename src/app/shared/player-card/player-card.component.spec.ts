import { fireEvent, render, screen } from '@testing-library/angular';

import { AppComponent } from '../../app.component';
import {
    getBehaviorTestConfig,
    polyfillJsdom,
    seedLocalStorage,
    slicedPlayers,
} from '../../testing/behavior-test-utils';
import { toSlug } from '@shared/utils/slug.utils';

describe('PlayerCardComponent — desktop user flow', { timeout: 35_000 }, () => {
    const writeTextMock = vi.fn<(_: string) => Promise<void>>();

    beforeEach(() => {
        polyfillJsdom();
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
});
