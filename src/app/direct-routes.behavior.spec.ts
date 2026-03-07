import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen } from '@testing-library/angular';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AppComponent } from './app.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  polyfillMatchMedia,
  seedLocalStorage,
  slicedGoalies,
  slicedPlayers,
} from './testing/behavior-test-utils';
import { toSlug } from '@shared/utils/slug.utils';
import seasonPlayersFixture from '../../e2e/fixtures/data/players--season--regular--2025.json';
import type { ApiParams, Player } from '@services/api.service';

describe('Direct routes — desktop user behavior', { timeout: 60_000 }, () => {
  const writeTextMock = vi.fn<(_: string) => Promise<void>>();
  const seasonPlayers = seasonPlayersFixture as unknown as Player[];

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

  it('opens the player direct season route, syncs season state, and copies a season-aware link', async () => {
    await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        getPlayerData: (params: ApiParams) =>
          params.season === 2025
            ? of(seasonPlayers)
            : of(slicedPlayers as unknown as Player[]),
      })
    );

    const router = TestBed.inject(Router);
    const seasonPlayer = seasonPlayers[0];
    await router.navigateByUrl(`/player/colorado/${toSlug(seasonPlayer.name)}/2025`);

    expect(
      await screen.findByText(seasonPlayer.name, { selector: '.player-card-player-name' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'playerCard.bySeason' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'playerCard.copyLink' }));

    await vi.waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        `${window.location.origin}/player/colorado/${toSlug(seasonPlayer.name)}/2025`
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'a11y.closePlayerCard' }));

    await vi.waitFor(() => {
      expect(router.url).toBe('/player-stats');
    });
    expect(
      screen.getByRole('combobox', { name: /season\.selector/ })
    ).toHaveTextContent('2025-2026');
  });

  it('shows a recovery path for invalid player links', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/player/colorado/not-a-player');

    expect(await screen.findByText('Player "not-a-player" not found')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Go to Player Stats' }));

    await vi.waitFor(() => {
      expect(router.url).toBe('/player-stats');
    });
  });

  it('opens the goalie direct route, omits skater-only controls, and copies a goalie link', async () => {
    await render(
      AppComponent,
      getBehaviorTestConfig({ isMobile: false, goalies: slicedGoalies })
    );
    const router = TestBed.inject(Router);
    const goalie = slicedGoalies[0];

    await router.navigateByUrl(`/goalie/colorado/${toSlug(goalie.name)}`);

    expect(
      await screen.findByText(goalie.name, { selector: '.player-card-player-name' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('switch', { name: /playerCardPositionFilter\./ })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'playerCard.copyLink' }));

    await vi.waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        `${window.location.origin}/goalie/colorado/${toSlug(goalie.name)}`
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'a11y.closePlayerCard' }));

    await vi.waitFor(() => {
      expect(router.url).toBe('/goalie-stats');
    });
  });

  it('shows a recovery path for invalid goalie links', async () => {
    await render(
      AppComponent,
      getBehaviorTestConfig({ isMobile: false, goalies: slicedGoalies })
    );
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/goalie/colorado/not-a-goalie');

    expect(await screen.findByText('Goalie "not-a-goalie" not found')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Go to Goalie Stats' }));

    await vi.waitFor(() => {
      expect(router.url).toBe('/goalie-stats');
    });
  });
});
