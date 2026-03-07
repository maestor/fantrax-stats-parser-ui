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
import type { ApiParams, Goalie, Player } from '@services/api.service';

describe('Direct routes — desktop user behavior', { timeout: 60_000 }, () => {
  const writeTextMock = vi.fn<(_: string) => Promise<void>>();
  const seasonPlayers = seasonPlayersFixture as unknown as Player[];
  const seasonGoalie = {
    ...slicedGoalies[0],
    games: slicedGoalies[0].seasons?.[4]?.games ?? slicedGoalies[0].games,
    wins: slicedGoalies[0].seasons?.[4]?.wins ?? slicedGoalies[0].wins,
    saves: slicedGoalies[0].seasons?.[4]?.saves ?? slicedGoalies[0].saves,
    shutouts: slicedGoalies[0].seasons?.[4]?.shutouts ?? slicedGoalies[0].shutouts,
    gaa: slicedGoalies[0].seasons?.[4]?.gaa ?? '2.50',
    savePercent: slicedGoalies[0].seasons?.[4]?.savePercent ?? '0.915',
    score: slicedGoalies[0].seasons?.[4]?.score ?? slicedGoalies[0].score,
    scoreAdjustedByGames:
      slicedGoalies[0].seasons?.[4]?.scoreAdjustedByGames ?? slicedGoalies[0].scoreAdjustedByGames,
    scores: slicedGoalies[0].seasons?.[4]?.scores ?? slicedGoalies[0].scores,
    seasons: undefined,
  } as unknown as Goalie;

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
    }, { timeout: 5000 });
    expect(
      screen.getByRole('combobox', { name: /season\.selector/ })
    ).toHaveTextContent('2025-2026');
  });

  it('opens the player direct route on the requested tab and preserves the tab in copied links', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));
    const router = TestBed.inject(Router);
    const player = slicedPlayers[0];

    await router.navigateByUrl(`/player/colorado/${toSlug(player.name)}?tab=by-season`);

    expect(
      await screen.findByRole('tab', { name: 'playerCard.bySeason', selected: true })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'playerCard.copyLink' }));

    await vi.waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        `${window.location.origin}/player/colorado/${toSlug(player.name)}?tab=by-season`
      );
    });
  });

  it('opens the player season route on the graphs tab and copies a season-aware graphs link', async () => {
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

    await router.navigateByUrl(`/player/colorado/${toSlug(seasonPlayer.name)}/2025?tab=graphs`);

    expect(
      await screen.findByRole('tab', { name: 'playerCard.graphs', selected: true })
    ).toBeInTheDocument();
    expect(await screen.findByText('graphs.radarInfo')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'graphs.switchToLine' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'playerCard.copyLink' }));

    await vi.waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        `${window.location.origin}/player/colorado/${toSlug(seasonPlayer.name)}/2025?tab=graphs`
      );
    });
  });

  it('copies the active player link after keyboard navigation inside a direct-link session', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));
    const router = TestBed.inject(Router);
    const firstPlayer = slicedPlayers[0];
    const lastPlayer = slicedPlayers.at(-1);

    expect(lastPlayer).toBeDefined();

    await router.navigateByUrl(`/player/colorado/${toSlug(firstPlayer.name)}?tab=by-season`);

    const closeButton = await screen.findByRole('button', { name: 'a11y.closePlayerCard' });
    fireEvent.keyDown(closeButton, { key: 'ArrowLeft' });

    await vi.waitFor(() => {
      expect(
        screen.getByText(lastPlayer!.name, { selector: '.player-card-player-name' })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'playerCard.copyLink' }));

    await vi.waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        `${window.location.origin}/player/colorado/${toSlug(lastPlayer!.name)}?tab=by-season`
      );
    });
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
    }, { timeout: 5000 });
  });

  it('opens the goalie direct route on the graphs tab and preserves the tab in copied links', async () => {
    await render(
      AppComponent,
      getBehaviorTestConfig({ isMobile: false, goalies: slicedGoalies })
    );
    const router = TestBed.inject(Router);
    const goalie = slicedGoalies[0];

    await router.navigateByUrl(`/goalie/colorado/${toSlug(goalie.name)}?tab=graphs`);

    expect(
      await screen.findByRole('tab', { name: 'playerCard.graphs', selected: true })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'playerCard.copyLink' }));

    await vi.waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        `${window.location.origin}/goalie/colorado/${toSlug(goalie.name)}?tab=graphs`
      );
    });
  });

  it('opens the goalie direct season route on the graphs tab and shows season radar content', async () => {
    await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        goalies: slicedGoalies,
        getGoalieData: (params: ApiParams) =>
          params.season === 2024
            ? of([seasonGoalie])
            : of(slicedGoalies as unknown as Goalie[]),
      })
    );
    const router = TestBed.inject(Router);
    const goalie = slicedGoalies[0];

    await router.navigateByUrl(`/goalie/colorado/${toSlug(goalie.name)}/2024?tab=graphs`);

    expect(
      await screen.findByRole('tab', { name: 'playerCard.graphs', selected: true })
    ).toBeInTheDocument();
    expect(await screen.findByText('graphs.radarInfo')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'graphs.switchToLine' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'playerCard.copyLink' }));

    await vi.waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        `${window.location.origin}/goalie/colorado/${toSlug(goalie.name)}?tab=graphs`
      );
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
