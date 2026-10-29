import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/angular';
import { of, Subject, throwError } from 'rxjs';
import { AppComponent } from '../../../app.component';
import { ApiRequestError, ApiService } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import type { components } from '@services/api.types.generated';
import {
  careerPlayersFixture,
  createApiServiceMock,
  getBehaviorTestConfig,
  polyfillJsdom,
  polyfillMatchMedia,
  seedLocalStorage,
} from '../../../testing/behavior-test-utils';

const counts = { seasonCount: { owned: 2, played: 1 }, teamCount: { owned: 2, played: 1 } };
const stats = {
  games: 10,
  goals: 3,
  assists: 4,
  points: 7,
  plusMinus: 2,
  penalties: 6,
  shots: 20,
  ppp: 1,
  shp: 0,
  hits: 8,
  blocks: 9,
};
const zeroStats = {
  games: 0,
  goals: 0,
  assists: 0,
  points: 0,
  plusMinus: 0,
  penalties: 0,
  shots: 0,
  ppp: 0,
  shp: 0,
  hits: 0,
  blocks: 0,
};
const playedTeam = {
  ...stats,
  teamId: '2',
  teamName: 'Carolina Hurricanes',
  seasonCount: { owned: 1, played: 1 },
};
const ownedTeam = {
  ...zeroStats,
  teamId: '4',
  teamName: 'Vancouver Canucks',
  seasonCount: { owned: 1, played: 0 },
};
const totals = { ...counts, ...stats, teams: [playedTeam, ownedTeam] };
const combinedStats = {
  games: 12,
  goals: 6,
  assists: 8,
  points: 14,
  plusMinus: 4,
  penalties: 12,
  shots: 40,
  ppp: 2,
  shp: 0,
  hits: 16,
  blocks: 18,
};
const profileFixture: components['schemas']['CareerPlayer'] = {
  id: 'p1',
  name: 'Career Player',
  position: 'F',
  summary: {
    ...counts,
    firstSeason: 2023,
    lastSeason: 2024,
    teams: [
      {
        teamId: '4',
        teamName: 'Vancouver Canucks',
        seasonCount: { owned: 1, played: 0 },
        firstSeason: 2023,
        lastSeason: 2023,
      },
      {
        teamId: '2',
        teamName: 'Carolina Hurricanes',
        seasonCount: { owned: 1, played: 1 },
        firstSeason: 2024,
        lastSeason: 2024,
      },
    ],
  },
  totals: {
    regular: totals,
    playoffs: {
      ...stats,
      games: 2,
      seasonCount: { owned: 1, played: 1 },
      teamCount: { owned: 1, played: 1 },
      teams: [{ ...playedTeam, games: 2 }],
    },
    career: {
      ...totals,
      ...combinedStats,
      teams: [{ ...playedTeam, ...combinedStats }, ownedTeam],
    },
  },
  seasons: [
    {
      ...stats,
      season: 2024,
      reportType: 'regular',
      teamId: '2',
      teamName: 'Carolina Hurricanes',
      position: 'F',
    },
    {
      ...stats,
      games: 2,
      season: 2024,
      reportType: 'playoffs',
      teamId: '2',
      teamName: 'Carolina Hurricanes',
      position: 'F',
    },
    {
      ...zeroStats,
      season: 2023,
      reportType: 'regular',
      teamId: '4',
      teamName: 'Vancouver Canucks',
      position: 'F',
    },
  ],
};
const historyFixture: components['schemas']['CareerHistory'] = {
  id: 'p1',
  coverage: {
    entryDraftSeasons: [2023],
    expansionDraftSeasons: [],
    openingDraftPresent: false,
    claimSeasons: [],
    tradeSeasons: [2024],
    completeness: 'unknown',
  },
  events: [
    {
      id: 'trade-1',
      type: 'trade',
      season: 2024,
      date: '2025-01-10T12:00:00.000Z',
      tradeId: 'deal1',
      status: 'ambiguous',
      movements: [
        {
          fromTeam: { id: '2', name: 'Carolina Hurricanes' },
          toTeam: { id: '4', name: 'Vancouver Canucks' },
        },
      ],
    },
    {
      id: 'draft-1',
      type: 'draft',
      season: 2023,
      date: null,
      draftType: 'entry',
      round: 2,
      pickNumber: 40,
      team: { id: '2', name: 'Carolina Hurricanes' },
      originalOwner: { id: '4', name: 'Vancouver Canucks' },
    },
  ],
};

describe('Career profile', () => {
  beforeEach(() => {
    polyfillJsdom();
    polyfillMatchMedia();
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  async function setup(overrides: Record<string, unknown> = {}, isMobile = false) {
    const config = getBehaviorTestConfig({ isMobile });
    return render(AppComponent, {
      ...config,
      providers: [
        ...config.providers,
        {
          provide: ApiService,
          useValue: {
            ...createApiServiceMock(),
            getCareerPlayer: () => of(profileFixture),
            getCareerHistory: () => of({ ...historyFixture, events: [] }),
            ...overrides,
          },
        },
      ],
    });
  }

  it('places the team from the previous season after the new team in a two-team season', async () => {
    const row = profileFixture.seasons[0];
    const profile = {
      ...profileFixture,
      seasons: [
        { ...row, season: 2023, teamId: '1', teamName: 'Colorado Avalanche', games: 1 },
        { ...row, season: 2023, teamId: '2', teamName: 'Anaheim Ducks', games: 0 },
        { ...row, season: 2022, teamId: '1', teamName: 'Colorado Avalanche' },
      ],
    } satisfies components['schemas']['CareerPlayer'];
    await setup({ getCareerPlayer: () => of(profile) });
    await TestBed.inject(Router).navigateByUrl('/career/players/p1');
    const table = await screen.findByRole('table', { name: 'career.profile.seasons' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((item) => item.textContent)).toEqual([
      expect.stringContaining('Anaheim Ducks'),
      expect.stringContaining('Colorado Avalanche'),
      expect.stringContaining('Colorado Avalanche'),
    ]);
  });

  it('preserves the API order when adjacent seasons give conflicting clues', async () => {
    const row = profileFixture.seasons[0];
    const profile = {
      ...profileFixture,
      seasons: [
        { ...row, season: 2024, teamId: '1', teamName: 'Colorado Avalanche' },
        { ...row, season: 2023, teamId: '1', teamName: 'Colorado Avalanche' },
        { ...row, season: 2023, teamId: '2', teamName: 'Anaheim Ducks' },
        { ...row, season: 2022, teamId: '1', teamName: 'Colorado Avalanche' },
      ],
    } satisfies components['schemas']['CareerPlayer'];
    await setup({ getCareerPlayer: () => of(profile) });
    await TestBed.inject(Router).navigateByUrl('/career/players/p1');
    const table = await screen.findByRole('table', { name: 'career.profile.seasons' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows[1]).toHaveTextContent('Colorado Avalanche');
    expect(rows[2]).toHaveTextContent('Anaheim Ducks');
  });

  it.each([
    { list: 'players', position: 'F', name: 'Artturi Lehkonen' },
    { list: 'players', position: 'D', name: 'Miro Heiskanen' },
    { list: 'goalies', position: 'G', name: 'Mitchell Gibson' },
  ])('keeps document and social metadata specific to the loaded $position career', async ({ list, position, name }) => {
    const pending = new Subject<components['schemas']['CareerPlayerProfile']>();
    await setup({
      [list === 'goalies' ? 'getCareerGoalie' : 'getCareerPlayer']: (id: string) =>
        id === 'next' ? pending : of({ id: 'p1', name, position }),
    });
    TestBed.inject(TranslateService).setTranslation('fi', {
      seo: {
        careerTitle: 'FFHL-ura - {{name}} ({{position}})',
        careerDescription: 'Uratilastot ja siirtohistoria FFHL:ssä pelaajasta {{name}} ({{position}})',
      },
    }, true);
    const router = TestBed.inject(Router);
    await router.navigateByUrl(`/career/${list}/p1?from=career-highlights`);
    const title = `FFHL-ura - ${name} (${position})`;
    const description = `Uratilastot ja siirtohistoria FFHL:ssä pelaajasta ${name} (${position})`;
    await waitFor(() => expect(document.title).toBe(title));
    for (const tag of ['og:title', 'twitter:title']) {
      expect(document.head.querySelector(`meta[property="${tag}"], meta[name="${tag}"]`)).toHaveAttribute('content', title);
    }
    for (const tag of ['description', 'og:description', 'twitter:description']) {
      expect(document.head.querySelector(`meta[property="${tag}"], meta[name="${tag}"]`)).toHaveAttribute('content', description);
    }
    await router.navigateByUrl(`${router.url.split('?')[0]}?from=entry-drafts`);
    await waitFor(() => expect(document.title).toBe(title));
    await router.navigateByUrl(`/career/${list}/next`);
    await screen.findByText('career.profile.loading');
    expect(document.title).not.toContain(name);
    pending.error(new ApiRequestError(404));
    await screen.findByText('career.profile.notFound');
    expect(document.title).not.toContain(name);
    await router.navigateByUrl('/career/highlights');
    await waitFor(() => expect(document.title).toBe('pageTitle | nav.playerCareers | career.tabs.highlights'));
  });

  it.each([
    { kind: 'player', list: 'players', id: '02npi', name: 'Alex Mallet', position: 'F' },
    { kind: 'goalie', list: 'goalies', id: 'prospect-g', name: 'Prospect Goalie', position: 'G' },
  ])('shows only the hero and history for a history-only $kind', async ({ kind, list, id, name, position }) => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
    await setup({
      [kind === 'player' ? 'getCareerPlayer' : 'getCareerGoalie']: () => of({ id, name, position }),
      getCareerHistory: () => of({
        ...historyFixture, id,
        events: [{ id: 'drop-1', type: 'drop', season: 2012, date: '2013-01-06T23:34:00.000Z', team: { id: '1', name: 'Colorado Avalanche' } }],
      }),
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl(`/career/${list}/${id}`);
    expect(await screen.findByRole('heading', { name })).toHaveFocus();
    expect(await screen.findByRole('heading', { name: 'career.profile.history' })).toBeVisible();
    expect(screen.getByText(position, { exact: true })).toBeVisible();
    expect(screen.getByText('Colorado Avalanche')).toBeVisible();
    expect(screen.queryByRole('navigation', { name: 'career.profile.jumpLabel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'career.profile.scope' })).not.toBeInTheDocument();
    expect(screen.queryByText('career.profile.seasonsOwned')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'career.profile.copyLink' }));
    await waitFor(() => expect(clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining(`/career/${list}/`)));
  });

  it.each([false, true])('opens a whole-league profile and puts its player first as plain text in the received packages (mobile: %s)', async (isMobile) => {
    const getTradeDetail = vi.fn(() =>
      of({
        id: 'deal1',
        season: 2024,
        date: '2025-01-10T12:00:00.000Z',
        status: 'ambiguous',
        blocks: [
          {
            sourceBlockIndex: 0,
            sourcePeriod: 10,
            assets: [
              {
                type: 'player',
                name: 'Package Player',
                rawName: 'Package Player',
                entityId: 'p2',
                careerType: 'player',
                position: 'F',
                fromTeam: { id: '2', name: 'Carolina Hurricanes' },
                toTeam: { id: '4', name: 'Vancouver Canucks' },
                draftSeason: null,
                draftRound: null,
                draftOriginalOwner: null,
              },
              {
                type: 'player',
                name: 'Career Player',
                rawName: 'Career Player',
                entityId: 'p1',
                careerType: 'player',
                position: 'F',
                fromTeam: { id: '2', name: 'Carolina Hurricanes' },
                toTeam: { id: '4', name: 'Vancouver Canucks' },
                draftSeason: null,
                draftRound: null,
                draftOriginalOwner: null,
              },
            ],
          },
          {
            sourceBlockIndex: 1,
            sourcePeriod: 11,
            assets: [
              {
                type: 'player',
                name: 'Other Goalie',
                rawName: 'Other Goalie',
                entityId: 'g1',
                careerType: 'goalie',
                position: 'G',
                fromTeam: { id: '4', name: 'Vancouver Canucks' },
                toTeam: { id: '2', name: 'Carolina Hurricanes' },
                draftSeason: null,
                draftRound: null,
                draftOriginalOwner: null,
              },
            ],
          },
        ],
      } satisfies components['schemas']['TradeDetail']),
    );
    const config = getBehaviorTestConfig({ isMobile });
    await render(AppComponent, {
      ...config,
      providers: [
        ...config.providers,
        {
          provide: ApiService,
          useValue: {
            ...createApiServiceMock(),
            getCareerPlayer: () => of(profileFixture),
            getCareerHistory: () => of(historyFixture),
            getTradeDetail,
          },
        },
      ],
    });
    await TestBed.inject(Router).navigateByUrl('/career/players/p1');
    expect(await screen.findByRole('heading', { name: 'Career Player' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'career.tabs.players' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const seasonTable = screen.getByRole('table', { name: 'career.profile.seasons' });
    expect(within(seasonTable).getByText('2023-24')).toBeInTheDocument();
    expect(
      within(screen.getByRole('table', { name: 'career.profile.seasons' })).getByRole('row', {
        name: /2023-24 Vancouver Canucks.*0/,
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('combobox', { name: 'career.profile.scope' }));
    fireEvent.click(await screen.findByRole('option', { name: 'career.profile.scopes.career' }));
    const seasonHeaders = within(seasonTable).getAllByRole('rowheader', { name: '2024-25' });
    expect(seasonHeaders).toHaveLength(2);
    expect(seasonHeaders[0]).toHaveTextContent('2024-25');
    expect(seasonHeaders[1]).toBeEmptyDOMElement();
    expect(within(seasonTable).getByRole('rowheader', { name: '2023-24' })).toHaveTextContent('2023-24');
    fireEvent.click(screen.getByRole('combobox', { name: 'career.profile.scope' }));
    fireEvent.click(await screen.findByRole('option', { name: 'career.profile.scopes.playoffs' }));
    expect(
      within(screen.getByRole('table', { name: 'career.profile.seasons' })).queryByText('2023-24'),
    ).not.toBeInTheDocument();
    expect(within(seasonTable).getByRole('rowheader', { name: '2024-25' })).toHaveTextContent('2024-25');
    expect(
      screen.getByRole('heading', { name: 'career.profile.events.draft 2023' }),
    ).toBeInTheDocument();
    if (isMobile) {
      fireEvent.click(screen.getByRole('button', { name: /career.profile.inspectTrade/ }));
    } else {
      expect(screen.queryByRole('button', { name: /career.profile.inspectTrade/ })).not.toBeInTheDocument();
    }
    expect(await screen.findByRole('link', { name: 'Other Goalie' })).toHaveAttribute(
      'href',
      '/career/goalies/other-goalie-g1',
    );
    const received = screen.getByRole('region', { name: 'Carolina Hurricanes career.profile.received' });
    expect(within(received).getByRole('link', { name: 'Other Goalie' })).toBeInTheDocument();
    expect(within(received).queryByRole('link', { name: 'Career Player' })).not.toBeInTheDocument();
    expect(getTradeDetail).toHaveBeenCalledOnce();
    const otherPackage = screen.getByRole('region', {
      name: 'Vancouver Canucks career.profile.received',
    });
    expect(within(otherPackage).getAllByRole('listitem').map((item) => item.textContent?.trim()))
      .toEqual(['Career Player', 'Package Player']);
    expect(within(otherPackage).queryByRole('link', { name: 'Career Player' })).not.toBeInTheDocument();
    expect(within(otherPackage).getByRole('link', { name: 'Package Player' })).toHaveAttribute(
      'href', '/career/players/package-player-p2',
    );
    const tradeDetails = screen.getByRole('region', { name: 'career.profile.tradeDetails' });
    expect(within(tradeDetails).getAllByRole('region')[0]).toBe(otherPackage);
  });

  it('normalizes old and stale-name links by ID and copies unique readable URLs', async () => {
    const name = 'J.T. Stützle';
    const getCareerPlayer = vi.fn((id: string) => of({ ...profileFixture, id, name }));
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      clipboard: { writeText },
    });
    await setup({ getCareerPlayer });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/career/players/p1');
    await waitFor(() => expect(router.url).toBe('/career/players/j-t-stutzle-p1'));
    expect(await screen.findByRole('heading', { name })).toBeInTheDocument();
    await router.navigateByUrl('/career/players/old-name-p1');
    await waitFor(() => expect(router.url).toBe('/career/players/j-t-stutzle-p1'));
    expect(getCareerPlayer).toHaveBeenCalledExactlyOnceWith('p1');
    expect(TestBed.inject(FooterVisibilityService).footerVisible()).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'career.profile.copyLink' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(
      window.location.origin + '/career/players/j-t-stutzle-p1',
    ));
    await router.navigateByUrl('/career/players/j-t-stutzle-p2');
    await waitFor(() => expect(router.url).toBe('/career/players/j-t-stutzle-p2'));
    expect(getCareerPlayer).toHaveBeenLastCalledWith('p2');
    expect(await screen.findByRole('heading', { name })).toBeInTheDocument();
  });

  it('restores list search, sorting, and the originating keyboard row after returning from a profile', async () => {
    await setup({
      getCareerPlayers: () => of([{ ...careerPlayersFixture[0], id: 'p1', name: 'Career Player' }]),
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/career/players');
    const search = await screen.findByRole('searchbox', { name: 'table.careerPlayerSearch' });
    fireEvent.input(search, { target: { value: 'Career' } });
    fireEvent.click(screen.getByRole('columnheader', { name: 'tableColumnShort.regularGames' }));
    const link = screen.getByRole('link', { name: /Career Player/ });
    expect(link).toHaveAttribute('href', '/career/players/career-player-p1');
    const row = link.closest('[role="row"]') as HTMLElement;
    row.focus();
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(await screen.findByRole('heading', { name: 'Career Player' })).toHaveFocus();
    fireEvent.click(screen.getByRole('link', { name: /career.profile.back/ }));
    expect(await screen.findByRole('searchbox', { name: 'table.careerPlayerSearch' })).toHaveValue(
      'Career',
    );
    expect(
      screen.getByRole('columnheader', { name: 'tableColumnShort.regularGames' }),
    ).toHaveAttribute('aria-sort', 'descending');
    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: /Career Player/ }).closest('[role="row"]'),
      ).toHaveFocus(),
    );
    fireEvent.keyDown(
      screen.getByRole('link', { name: /Career Player/ }).closest('[role="row"]') as HTMLElement,
      { key: ' ' },
    );
    expect(await screen.findByRole('heading', { name: 'Career Player' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: /career.profile.back/ }));
    const returnRow = (await screen.findByRole('link', { name: /Career Player/ })).closest(
      '[role="row"]',
    ) as HTMLElement;
    fireEvent.click(within(returnRow).getAllByRole('cell')[0]);
    expect(await screen.findByRole('heading', { name: 'Career Player' })).toBeInTheDocument();
  });

  it('preserves browse origins through readable URL normalization and labels the matching back link', async () => {
    await setup();
    const router = TestBed.inject(Router);
    for (const [source, path, label] of [
      ['career-highlights', '/career/highlights', 'backHighlights'],
      ['category-stats', '/category-stats', 'backCategoryStats'],
      ['entry-drafts', '/draft/entry-drafts', 'backEntryDrafts'],
      ['opening-draft', '/draft/opening-draft', 'backOpeningDraft'],
      ['expansion-drafts', '/draft/expansion-drafts', 'backExpansionDrafts'],
    ]) {
      await router.navigateByUrl(`/career/players/p1?from=${source}`);
      await waitFor(() => expect(router.url).toBe(`/career/players/career-player-p1?from=${source}`));
      expect(await screen.findByRole('link', { name: new RegExp(`career.profile.${label}`) })).toHaveAttribute('href', path);
    }
  });

  it('opens a statistics popup career shortcut and returns to the originating statistics page', async () => {
    seedLocalStorage();
    await setup({ getCareerPlayer: (id: string) => of({ ...profileFixture, id, name: 'Jamie Benn' }) });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/player/colorado/jamie-benn');
    const dialog = await screen.findByRole('dialog');
    const shortcut = within(dialog).getByRole('link', { name: 'playerCard.careerLink' });
    expect(shortcut).toHaveAttribute('href', '/career/players/jamie-benn-00qs7?from=player-stats');
    fireEvent.click(shortcut);
    await waitFor(() => expect(router.url).toBe('/career/players/jamie-benn-00qs7?from=player-stats'));
    expect(await screen.findByRole('heading', { name: 'Jamie Benn' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const back = screen.getByRole('link', { name: /career.profile.backPlayerStats/ });
    expect(back).toHaveAttribute('href', '/player-stats');
    fireEvent.click(back);
    await waitFor(() => expect(router.url).toBe('/player-stats'));
    await router.navigateByUrl('/career/players/jamie-benn-00qs7?from=goalie-stats');
    expect(await screen.findByRole('link', { name: /career.profile.backGoalieStats/ })).toHaveAttribute('href', '/goalie-stats');
  });

  it('keeps statistics usable while history fails, then retries into a genuine empty history', async () => {
    const getCareerHistory = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new ApiRequestError(500)))
      .mockReturnValue(of({ ...historyFixture, events: [] }));
    await setup({ getCareerHistory });
    await TestBed.inject(Router).navigateByUrl('/career/players/p1');
    expect(await screen.findByText('career.profile.historyFailed')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'career.profile.seasons' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'career.profile.retry' }));
    expect(await screen.findByText('career.profile.noHistory')).toBeInTheDocument();
    expect(getCareerHistory).toHaveBeenCalledTimes(2);
    const teamsHeading = screen.getByRole('heading', { name: 'career.profile.teams' });
    const scrollIntoView = vi.fn();
    Object.defineProperty(teamsHeading, 'scrollIntoView', { value: scrollIntoView });
    fireEvent.click(screen.getByRole('button', { name: 'career.profile.teams' }));
    expect(teamsHeading).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', inline: 'nearest', behavior: 'smooth' });

  });

  it('distinguishes a missing career from request failures and ignores an old identity response', async () => {
    const old = new Subject<components['schemas']['CareerPlayer']>();
    const current = new Subject<components['schemas']['CareerPlayer']>();
    await setup({
      getCareerPlayer: (id: string) =>
        id === 'missing'
          ? throwError(() => new ApiRequestError(404))
          : id === 'old'
            ? old
            : current,
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/career/players/missing');
    expect(await screen.findByText('career.profile.notFound')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'career.profile.retry' })).not.toBeInTheDocument();
    await router.navigateByUrl('/career/players/old');
    expect(await screen.findByText('career.profile.loading')).toBeInTheDocument();
    await router.navigateByUrl('/career/players/current');
    old.next({ ...profileFixture, id: 'old', name: 'Outdated Player' });
    current.next({ ...profileFixture, id: 'current' });
    expect(await screen.findByRole('heading', { name: 'Career Player' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Outdated Player' })).not.toBeInTheDocument();
  });

  it('retries failed statistics and announces both successful and failed link copying', async () => {
    const getCareerPlayer = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new ApiRequestError(500)))
      .mockReturnValue(of(profileFixture));
    const writeText = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('denied'));
    vi.stubGlobal('navigator', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      clipboard: { writeText },
    });
    await setup({ getCareerPlayer });
    await TestBed.inject(Router).navigateByUrl('/career/players/p1');
    expect(await screen.findByText('career.profile.failed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'career.profile.retry' }));
    expect(await screen.findByRole('heading', { name: 'Career Player' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'career.profile.copyLink' }));
    const copyButton = screen.getByRole('button', { name: 'career.profile.copyLink' });
    await waitFor(() => expect(copyButton).toHaveAccessibleDescription('career.profile.copied'));
    await waitFor(() => expect(copyButton).toHaveAccessibleDescription(''), { timeout: 3000 });
    fireEvent.click(screen.getByRole('button', { name: 'career.profile.copyLink' }));
    await waitFor(() => expect(copyButton).toHaveAccessibleDescription('career.profile.copyFailed'));
  });

  it('discards pending copy feedback after changing profiles or leaving the page', async () => {
    let finishCopy!: () => void;
    const pendingCopy = () => new Promise<void>((resolve) => { finishCopy = resolve; });
    let copying = pendingCopy();
    const writeText = vi.fn(() => copying);
    vi.stubGlobal('navigator', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      clipboard: { writeText },
    });
    await setup({ getCareerPlayer: (id: string) => of({ ...profileFixture, id }) });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/career/players/p1');
    const firstButton = await screen.findByRole('button', { name: 'career.profile.copyLink' });
    fireEvent.click(firstButton);
    await router.navigateByUrl('/career/players/career-player-p2');
    finishCopy();
    await copying;
    const nextButton = screen.getByRole('button', { name: 'career.profile.copyLink' });
    await waitFor(() => expect(nextButton).toHaveAccessibleDescription(''));
    copying = pendingCopy();
    fireEvent.click(nextButton);
    await router.navigateByUrl('/career/players');
    finishCopy();
    await copying;
    expect(screen.queryByRole('button', { name: 'career.profile.copyLink' })).not.toBeInTheDocument();
    expect(screen.queryByText('career.profile.copied')).not.toBeInTheDocument();
  });

  it('shows goalie rates only on source season rows and keeps empty playoff statistics distinct', async () => {
    const line = {
      games: 10,
      wins: 5,
      saves: 240,
      shutouts: 1,
      goals: 0,
      assists: 1,
      points: 1,
      penalties: 0,
      ppp: 0,
      shp: 0,
    };
    const goalieTotals = {
      ...line,
      ...counts,
      teams: [
        { ...line, teamId: '2', teamName: 'Carolina Hurricanes', seasonCount: counts.seasonCount },
      ],
    };
    const emptyTotals = { ...goalieTotals, games: 0, teams: [] };
    const goalie: components['schemas']['CareerGoalie'] = {
      id: 'g1',
      name: 'Career Goalie',
      summary: profileFixture.summary,
      totals: { regular: goalieTotals, playoffs: emptyTotals, career: goalieTotals },
      seasons: [
        {
          ...line,
          season: 2024,
          reportType: 'regular',
          teamId: '2',
          teamName: 'Carolina Hurricanes',
          gaa: '0.00',
          savePercent: '0.000',
        },
      ],
    };
    await setup({
      getCareerGoalie: () => of(goalie),
      getCareerHistory: () => of({ ...historyFixture, events: [] }),
    });
    await TestBed.inject(Router).navigateByUrl('/career/goalies/g1');
    expect(await screen.findByRole('heading', { name: 'Career Goalie' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'career.tabs.goalies' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      within(screen.getByRole('table', { name: 'career.profile.seasons' })).getByRole(
        'columnheader',
        { name: 'tableColumn.gaa' },
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('table', { name: 'career.profile.teams' })).queryByRole(
        'columnheader',
        { name: 'tableColumn.gaa' },
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText('0.000')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('combobox', { name: 'career.profile.scope' }));
    fireEvent.click(await screen.findByRole('option', { name: 'career.profile.scopes.playoffs' }));
    expect(screen.getAllByText('career.profile.noStats')).toHaveLength(2);
  });

  it.each([false, true])('sorts received draft picks by round, year, and original team (mobile: %s)', async (isMobile) => {
    type Asset = components['schemas']['TradeDetail']['blocks'][number]['assets'][number];
    const fromTeam = { id: '2', name: 'Carolina Hurricanes' };
    const toTeam = { id: '4', name: 'Vancouver Canucks' };
    const ownerIds = { 'Dallas Stars': '29', 'San Jose Sharks': '8', 'Colorado Avalanche': '1' };
    const pick = (draftSeason: number, draftRound: number, owner: keyof typeof ownerIds): Asset => ({
      type: 'draft_pick',
      name: `${draftSeason} Draft Pick, Round ${draftRound} (${owner})`,
      rawName: `${draftSeason} Draft Pick, Round ${draftRound} (${owner})`,
      entityId: null,
      careerType: null,
      position: null,
      fromTeam,
      toTeam,
      draftSeason,
      draftRound,
      draftOriginalOwner: { id: ownerIds[owner], name: owner },
    });
    const player: Asset = {
      ...pick(2022, 3, 'Dallas Stars'),
      type: 'player',
      name: 'Other Goalie',
      rawName: 'Other Goalie',
      entityId: 'g1',
      careerType: 'goalie',
      position: 'G',
      draftSeason: null,
      draftRound: null,
      draftOriginalOwner: null,
    };
    const other: Asset = {
      ...player,
      type: 'other',
      name: 'Future consideration',
      entityId: null,
      careerType: null,
    };
    const assets = [
      pick(2022, 3, 'Dallas Stars'),
      player,
      pick(2022, 3, 'San Jose Sharks'),
      other,
      pick(2022, 2, 'Dallas Stars'),
      pick(2021, 3, 'Dallas Stars'),
      pick(2023, 1, 'San Jose Sharks'),
      pick(2022, 3, 'Colorado Avalanche'),
      pick(2022, 10, 'Dallas Stars'),
      pick(2026, 4, 'Dallas Stars'),
      pick(2026, 5, 'Dallas Stars'),
      pick(2026, 11, 'Dallas Stars'),
      {
        ...pick(2022, 3, 'Dallas Stars'),
        name: '2022 Draft Pick, Round 3 (Quebec Nordiques)',
        rawName: '2022 Draft Pick, Round 3 (Quebec Nordiques)',
        draftOriginalOwner: null,
      },
    ];
    const detail: components['schemas']['TradeDetail'] = {
      id: 'deal1',
      season: 2024,
      date: '2025-01-10T12:00:00.000Z',
      status: 'ambiguous',
      blocks: [
        { sourceBlockIndex: 0, sourcePeriod: 10, assets: assets.slice(0, 4) },
        { sourceBlockIndex: 1, sourcePeriod: 11, assets: assets.slice(4) },
      ],
    };
    await setup(
      { getTradeDetail: () => of(detail), getCareerHistory: () => of(historyFixture) },
      isMobile,
    );
    await TestBed.inject(Router).navigateByUrl('/career/players/p1');
    if (isMobile) {
      fireEvent.click(await screen.findByRole('button', { name: /career.profile.inspectTrade/ }));
    }
    const received = await screen.findByRole('region', {
      name: 'Vancouver Canucks career.profile.received',
    });
    const labels = within(received).getAllByRole('listitem').map((item) => item.textContent?.trim());
    expect(labels).toEqual([
      '2023 career.profile.events.draft 1st (SJS)',
      'Other Goalie',
      '2022 career.profile.events.draft 2nd (DAL)',
      'Future consideration',
      '2021 career.profile.events.draft 3rd (DAL)',
      '2022 career.profile.events.draft 3rd (COL)',
      '2022 career.profile.events.draft 3rd (DAL)',
      '2022 Draft Pick, Round 3 (Quebec Nordiques)',
      '2022 career.profile.events.draft 3rd (SJS)',
      '2026 career.profile.events.draft 4th (DAL)',
      '2026 career.profile.events.draft 5th (DAL)',
      '2022 career.profile.events.draft 10th (DAL)',
      '2026 career.profile.events.draft 11th (DAL)',
    ]);
    const abbreviation = within(received).getAllByText('SJS')[0];
    expect(abbreviation).toHaveAttribute('title', 'San Jose Sharks');
    expect(abbreviation).toHaveAttribute('aria-label', 'San Jose Sharks');
    expect(within(received).getByRole('link', { name: 'Other Goalie' })).toHaveAttribute(
      'href', '/career/goalies/other-goalie-g1',
    );
    expect(detail.blocks.flatMap((block) => block.assets)).toEqual(assets);
  });

  it('retries an individual trade failure without hiding statistics and removes collapsed content', async () => {
    const asset = {
      name: 'Unresolved Prospect',
      rawName: 'Unresolved Prospect',
      entityId: null,
      careerType: null,
      position: null,
      fromTeam: { id: '2', name: 'Carolina Hurricanes' },
      toTeam: { id: '4', name: 'Vancouver Canucks' },
      draftSeason: null,
      draftRound: null,
      draftOriginalOwner: null,
    };
    const detail: components['schemas']['TradeDetail'] = {
      id: 'deal1',
      season: 2024,
      date: '2025-01-10T12:00:00.000Z',
      status: 'incomplete',
      blocks: [
        {
          sourceBlockIndex: 0,
          sourcePeriod: 10,
          assets: [
            { ...asset, type: 'player' },
            {
              ...asset,
              type: 'draft_pick',
              name: 'Draft Pick, Round 2 (Carolina Hurricanes)',
              draftRound: 2,
              draftOriginalOwner: { id: '2', name: 'Carolina Hurricanes' },
            },
            {
              ...asset,
              type: 'draft_pick',
              name: '2026 Draft Pick (Carolina Hurricanes)',
              draftSeason: 2026,
              draftOriginalOwner: { id: '2', name: 'Carolina Hurricanes' },
            },
            {
              ...asset,
              type: 'draft_pick',
              name: '2026 Round 2',
              rawName: '2026 Round 2',
              draftSeason: 2026,
              draftRound: 2,
              draftOriginalOwner: { id: '2', name: 'Carolina Hurricanes' },
            },
          ],
        },
      ],
    };
    const getTradeDetail = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new ApiRequestError(500)))
      .mockReturnValue(of(detail));
    await setup({
      getTradeDetail,
      getCareerHistory: () => of(historyFixture),
      getTeams: () => throwError(() => new ApiRequestError(500)),
    }, true);
    await TestBed.inject(Router).navigateByUrl('/career/players/p1');
    const button = await screen.findByRole('button', { name: /career.profile.inspectTrade/ });
    expect(getTradeDetail).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(await screen.findByText('career.profile.tradeFailed')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'career.profile.seasons' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'career.profile.retry' }));
    expect(await screen.findByText('Unresolved Prospect')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Unresolved Prospect' })).not.toBeInTheDocument();
    const received = screen.getByRole('region', { name: 'Vancouver Canucks career.profile.received' });
    expect(within(received).getAllByRole('listitem')).toHaveLength(4);
    expect(within(received).getByText('Draft Pick, Round 2 (Carolina Hurricanes)')).toBeInTheDocument();
    expect(within(received).getByText('2026 Draft Pick (Carolina Hurricanes)')).toBeInTheDocument();
    expect(within(received).getByText(/2026 career.profile.events.draft 2nd/).closest('li')).toHaveTextContent(
      /^2026 career.profile.events.draft 2nd \(Carolina Hurricanes\)$/,
    );
    const missingPackage = screen.getByRole('region', {
      name: 'Carolina Hurricanes career.profile.received',
    });
    expect(within(missingPackage).getByText('career.profile.noReceivedAssets')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByText('Unresolved Prospect')).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows an owned zero-game career without inventing a first appearance', async () => {
    const zeroLine = {
      games: 0,
      goals: 0,
      assists: 0,
      points: 0,
      plusMinus: 0,
      penalties: 0,
      shots: 0,
      ppp: 0,
      shp: 0,
      hits: 0,
      blocks: 0,
    };
    const zeroTotals = {
      ...zeroLine,
      seasonCount: { owned: 1, played: 0 },
      teamCount: { owned: 1, played: 0 },
      teams: [],
    };
    const profile = {
      ...profileFixture,
      totals: { career: zeroTotals, regular: zeroTotals, playoffs: zeroTotals },
      seasons: [
        {
          ...zeroLine,
          season: 2024,
          reportType: 'regular' as const,
          teamId: '2',
          teamName: 'Carolina Hurricanes',
          position: 'F',
        },
      ],
    };
    await setup({ getCareerPlayer: () => of(profile) });
    await TestBed.inject(Router).navigateByUrl('/career/players/p1');
    expect(await screen.findByText('career.profile.noAppearance')).toBeInTheDocument();
    expect(
      within(screen.getByRole('table', { name: 'career.profile.seasons' })).getByRole('row', {
        name: /2024-25 Carolina Hurricanes.*0/,
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('combobox', { name: 'career.profile.scope' }));
    fireEvent.click(await screen.findByRole('option', { name: 'career.profile.scopes.career' }));
    expect(screen.getByRole('combobox', { name: 'career.profile.scope' })).toHaveTextContent(
      'career.profile.scopes.career',
    );
  });
});
