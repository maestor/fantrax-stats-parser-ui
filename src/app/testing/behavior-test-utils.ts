import { Provider } from '@angular/core';
import { DeferBlockBehavior } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';

import { routes } from '../app.routes';
import {
  ApiParams,
  ApiService,
  CareerHighlightPage,
  CareerHighlightType,
  Goalie,
  LastModifiedResponse,
  Player,
  CareerGoalieListItem,
  CareerPlayerListItem,
  PlayoffLeaderboardEntry,
  RegularLeaderboardEntry,
  TransactionLeaderboardEntry,
  ReportType,
  Season,
  Team,
} from '@services/api.service';
import { ViewportService } from '@services/viewport.service';
import { PwaUpdateService } from '@services/pwa-update.service';

import teamsFixture from '../../../e2e/fixtures/data/teams.json';
import lastModifiedFixture from '../../../e2e/fixtures/data/last-modified.json';
import seasonsFixture from '../../../e2e/fixtures/data/seasons--regular.json';
import playersFixture from '../../../e2e/fixtures/data/players--combined--regular.json';
import goaliesFixtureData from '../../../e2e/fixtures/data/goalies--combined--regular--startFrom=2012.json';
import careerPlayersFixtureData from '../../../e2e/fixtures/data/career--players.json';
import careerGoaliesFixtureData from '../../../e2e/fixtures/data/career--goalies.json';
import mostTeamsPlayedHighlightsPage0FixtureData from '../../../e2e/fixtures/data/career--highlights--most-teams-played--skip=0--take=10.json';
import mostTeamsPlayedHighlightsPage1FixtureData from '../../../e2e/fixtures/data/career--highlights--most-teams-played--skip=10--take=10.json';
import mostTeamsOwnedHighlightsPage0FixtureData from '../../../e2e/fixtures/data/career--highlights--most-teams-owned--skip=0--take=10.json';
import mostTeamsOwnedHighlightsPage1FixtureData from '../../../e2e/fixtures/data/career--highlights--most-teams-owned--skip=10--take=10.json';
import sameTeamSeasonsHighlightsPage0FixtureData from '../../../e2e/fixtures/data/career--highlights--same-team-seasons-played--skip=0--take=10.json';
import sameTeamSeasonsHighlightsPage1FixtureData from '../../../e2e/fixtures/data/career--highlights--same-team-seasons-played--skip=10--take=10.json';
import sameTeamSeasonsOwnedHighlightsPage0FixtureData from '../../../e2e/fixtures/data/career--highlights--same-team-seasons-owned--skip=0--take=10.json';
import sameTeamSeasonsOwnedHighlightsPage1FixtureData from '../../../e2e/fixtures/data/career--highlights--same-team-seasons-owned--skip=10--take=10.json';
import mostTradesHighlightsPage0FixtureData from '../../../e2e/fixtures/data/career--highlights--most-trades--skip=0--take=10.json';
import mostClaimsHighlightsPage0FixtureData from '../../../e2e/fixtures/data/career--highlights--most-claims--skip=0--take=10.json';
import mostDropsHighlightsPage0FixtureData from '../../../e2e/fixtures/data/career--highlights--most-drops--skip=0--take=10.json';
import leaderboardTransactionsFixtureData from '../../../e2e/fixtures/data/leaderboard--transactions.json';

export const PLAYER_SLICE_COUNT = 12;
export const GOALIE_SLICE_COUNT = 5;

export const slicedPlayers = playersFixture.slice(0, PLAYER_SLICE_COUNT);
export const goaliesFixture = goaliesFixtureData as unknown as Goalie[];
export const slicedGoalies = goaliesFixture.slice(0, GOALIE_SLICE_COUNT);
export const careerPlayersFixture = careerPlayersFixtureData as unknown as CareerPlayerListItem[];
export const careerGoaliesFixture = careerGoaliesFixtureData as unknown as CareerGoalieListItem[];
export const mostTeamsPlayedHighlightsPage0Fixture =
  mostTeamsPlayedHighlightsPage0FixtureData as CareerHighlightPage;
export const mostTeamsPlayedHighlightsPage1Fixture =
  mostTeamsPlayedHighlightsPage1FixtureData as CareerHighlightPage;
export const mostTeamsOwnedHighlightsPage0Fixture =
  mostTeamsOwnedHighlightsPage0FixtureData as CareerHighlightPage;
export const mostTeamsOwnedHighlightsPage1Fixture =
  mostTeamsOwnedHighlightsPage1FixtureData as CareerHighlightPage;
export const sameTeamSeasonsHighlightsPage0Fixture =
  sameTeamSeasonsHighlightsPage0FixtureData as CareerHighlightPage;
export const sameTeamSeasonsHighlightsPage1Fixture =
  sameTeamSeasonsHighlightsPage1FixtureData as CareerHighlightPage;
export const sameTeamSeasonsOwnedHighlightsPage0Fixture =
  sameTeamSeasonsOwnedHighlightsPage0FixtureData as CareerHighlightPage;
export const sameTeamSeasonsOwnedHighlightsPage1Fixture =
  sameTeamSeasonsOwnedHighlightsPage1FixtureData as CareerHighlightPage;
export const mostTradesHighlightsPage0Fixture =
  mostTradesHighlightsPage0FixtureData as CareerHighlightPage;
export const mostClaimsHighlightsPage0Fixture =
  mostClaimsHighlightsPage0FixtureData as CareerHighlightPage;
export const mostDropsHighlightsPage0Fixture =
  mostDropsHighlightsPage0FixtureData as CareerHighlightPage;
export const leaderboardTransactionsFixture =
  leaderboardTransactionsFixtureData as TransactionLeaderboardEntry[];
export const mostStanleyCupsHighlightsPage0Fixture = {
  type: 'most-stanley-cups',
  skip: 0,
  take: 10,
  total: 2,
  items: [
    {
      id: 'cup-1',
      name: 'Patrick Maroon',
      position: 'F',
      cupCount: 3,
      cups: [
        {
          season: 2018,
          team: { id: '1', name: 'Colorado Avalanche' },
        },
        {
          season: 2020,
          team: { id: '2', name: 'Dallas Stars' },
        },
        {
          season: 2021,
          team: { id: '3', name: 'Tampa Bay Lightning' },
        },
      ],
    },
    {
      id: 'cup-2',
      name: 'Pat Maroon',
      position: 'F',
      cupCount: 2,
      cups: [
        {
          season: 2018,
          team: { id: '1', name: 'Colorado Avalanche' },
        },
        {
          season: 2020,
          team: { id: '2', name: 'Dallas Stars' },
        },
      ],
    },
  ],
} as CareerHighlightPage;
export const regularGrinderWithoutPlayoffsHighlightsPage0Fixture = {
  type: 'regular-grinder-without-playoffs',
  skip: 0,
  take: 10,
  total: 2,
  items: [
    {
      id: 'grinder-1',
      name: 'Radek Faksa',
      position: 'F',
      regularGames: 512,
      teams: [
        { id: '2', name: 'Dallas Stars' },
        { id: '4', name: 'Carolina Hurricanes' },
      ],
    },
    {
      id: 'grinder-2',
      name: 'Jack Johnson',
      position: 'D',
      regularGames: 484,
      teams: [{ id: '1', name: 'Colorado Avalanche' }],
    },
  ],
} as CareerHighlightPage;
export const stashKingHighlightsPage0Fixture = {
  type: 'stash-king',
  skip: 0,
  take: 10,
  total: 2,
  items: [
    {
      id: 'stash-1',
      name: 'Anton Khudobin',
      position: 'G',
      seasonCount: 11,
      team: { id: '2', name: 'Dallas Stars' },
    },
    {
      id: 'stash-2',
      name: 'Mark Pysyk',
      position: 'D',
      seasonCount: 10,
      team: { id: '4', name: 'Carolina Hurricanes' },
    },
  ],
} as CareerHighlightPage;

export { teamsFixture, lastModifiedFixture, seasonsFixture, playersFixture };

type BehaviorApiErrorKey =
  | 'teams'
  | 'lastModified'
  | 'seasons'
  | 'players'
  | 'goalies'
  | 'careerPlayers'
  | 'careerGoalies'
  | 'careerHighlights'
  | 'leaderboardRegular'
  | 'leaderboardPlayoffs'
  | 'leaderboardTransactions';

export type BehaviorApiMockOptions = {
  teams?: Team[];
  lastModified?: LastModifiedResponse | null;
  seasons?: Season[];
  players?: Player[];
  goalies?: Goalie[];
  careerPlayers?: CareerPlayerListItem[];
  careerGoalies?: CareerGoalieListItem[];
  careerHighlightsMostTeamsPlayed?: CareerHighlightPage;
  careerHighlightsMostTeamsOwned?: CareerHighlightPage;
  careerHighlightsSameTeamSeasonsPlayed?: CareerHighlightPage;
  careerHighlightsSameTeamSeasonsOwned?: CareerHighlightPage;
  careerHighlightsMostStanleyCups?: CareerHighlightPage;
  careerHighlightsRegularGrinderWithoutPlayoffs?: CareerHighlightPage;
  careerHighlightsStashKing?: CareerHighlightPage;
  careerHighlightsMostTrades?: CareerHighlightPage;
  careerHighlightsMostClaims?: CareerHighlightPage;
  careerHighlightsMostDrops?: CareerHighlightPage;
  leaderboardRegular?: RegularLeaderboardEntry[];
  leaderboardPlayoffs?: PlayoffLeaderboardEntry[];
  leaderboardTransactions?: TransactionLeaderboardEntry[];
  errorKeys?: BehaviorApiErrorKey[];
  getSeasons?: (
    reportType?: ReportType,
    teamId?: string,
    startFrom?: number,
  ) => Observable<Season[]>;
  getPlayerData?: (params: ApiParams) => Observable<Player[]>;
  getGoalieData?: (params: ApiParams) => Observable<Goalie[]>;
  getCareerPlayers?: () => Observable<CareerPlayerListItem[]>;
  getCareerGoalies?: () => Observable<CareerGoalieListItem[]>;
  getCareerHighlights?: (
    type: CareerHighlightType,
    skip?: number,
    take?: number,
  ) => Observable<CareerHighlightPage>;
};

export type BehaviorTestConfigOptions = BehaviorApiMockOptions & {
  isMobile: boolean;
  pwaUpdateAvailable?: boolean;
  pwaActivateAndReload?: ReturnType<typeof vi.fn>;
};

function createApiError() {
  return throwError(() => new Error('Behavior test API error'));
}

function getDefaultCareerHighlightsFixture(
  options: BehaviorApiMockOptions,
  type: CareerHighlightType,
  skip: number,
): CareerHighlightPage {
  switch (type) {
    case 'most-teams-played':
      return skip >= 10
        ? (options.careerHighlightsMostTeamsPlayed ?? mostTeamsPlayedHighlightsPage1Fixture)
        : (options.careerHighlightsMostTeamsPlayed ?? mostTeamsPlayedHighlightsPage0Fixture);
    case 'most-teams-owned':
      return skip >= 10
        ? (options.careerHighlightsMostTeamsOwned ?? mostTeamsOwnedHighlightsPage1Fixture)
        : (options.careerHighlightsMostTeamsOwned ?? mostTeamsOwnedHighlightsPage0Fixture);
    case 'same-team-seasons-played':
      return skip >= 10
        ? (options.careerHighlightsSameTeamSeasonsPlayed ?? sameTeamSeasonsHighlightsPage1Fixture)
        : (options.careerHighlightsSameTeamSeasonsPlayed ?? sameTeamSeasonsHighlightsPage0Fixture);
    case 'same-team-seasons-owned':
      return skip >= 10
        ? (options.careerHighlightsSameTeamSeasonsOwned ?? sameTeamSeasonsOwnedHighlightsPage1Fixture)
        : (options.careerHighlightsSameTeamSeasonsOwned ?? sameTeamSeasonsOwnedHighlightsPage0Fixture);
    case 'most-stanley-cups':
      return options.careerHighlightsMostStanleyCups ?? mostStanleyCupsHighlightsPage0Fixture;
    case 'regular-grinder-without-playoffs':
      return options.careerHighlightsRegularGrinderWithoutPlayoffs
        ?? regularGrinderWithoutPlayoffsHighlightsPage0Fixture;
    case 'stash-king':
      return options.careerHighlightsStashKing ?? stashKingHighlightsPage0Fixture;
    case 'most-trades':
      return options.careerHighlightsMostTrades ?? mostTradesHighlightsPage0Fixture;
    case 'most-claims':
      return options.careerHighlightsMostClaims ?? mostClaimsHighlightsPage0Fixture;
    case 'most-drops':
      return options.careerHighlightsMostDrops ?? mostDropsHighlightsPage0Fixture;
    case 'reunion-king':
      throw new Error('Behavior test mock for reunion-king is not configured.');
  }
}

export function provideDisabledMaterialAnimations(): Provider {
  return {
    provide: MATERIAL_ANIMATIONS,
    useValue: {
      animationsDisabled: true,
    },
  };
}

export function createApiServiceMock(options: BehaviorApiMockOptions = {}) {
  const errorKeys = new Set(options.errorKeys ?? []);
  const lastModified = Object.prototype.hasOwnProperty.call(options, 'lastModified')
    ? options.lastModified
    : lastModifiedFixture;

  return {
    getTeams: () =>
      errorKeys.has('teams')
        ? createApiError()
        : of(options.teams ?? teamsFixture),
    getLastModified: () =>
      errorKeys.has('lastModified')
        ? createApiError()
        : of(lastModified as LastModifiedResponse),
    getSeasons: (
      reportType?: ReportType,
      teamId?: string,
      startFrom?: number,
    ) =>
      errorKeys.has('seasons')
        ? createApiError()
        : (options.getSeasons?.(reportType, teamId, startFrom)
          ?? of(options.seasons ?? seasonsFixture)),
    getPlayerData: (params: ApiParams) =>
      errorKeys.has('players')
        ? createApiError()
        : (options.getPlayerData?.(params) ?? of(options.players ?? slicedPlayers)),
    getGoalieData: (params: ApiParams) =>
      errorKeys.has('goalies')
        ? createApiError()
        : (options.getGoalieData?.(params) ?? of(options.goalies ?? slicedGoalies)),
    getCareerPlayers: () =>
      errorKeys.has('careerPlayers')
        ? createApiError()
        : (options.getCareerPlayers?.() ?? of(options.careerPlayers ?? careerPlayersFixture)),
    getCareerGoalies: () =>
      errorKeys.has('careerGoalies')
        ? createApiError()
        : (options.getCareerGoalies?.() ?? of(options.careerGoalies ?? careerGoaliesFixture)),
    getCareerHighlights: (
      type: CareerHighlightType,
      skip = 0,
      take = 10,
    ) =>
      errorKeys.has('careerHighlights')
        ? createApiError()
        : (options.getCareerHighlights?.(type, skip, take)
          ?? of(getDefaultCareerHighlightsFixture(options, type, skip))),
    getLeaderboardRegular: () =>
      errorKeys.has('leaderboardRegular')
        ? createApiError()
        : of(options.leaderboardRegular ?? []),
    getLeaderboardPlayoffs: () =>
      errorKeys.has('leaderboardPlayoffs')
        ? createApiError()
        : of(options.leaderboardPlayoffs ?? []),
    getLeaderboardTransactions: () =>
      errorKeys.has('leaderboardTransactions')
        ? createApiError()
        : of(options.leaderboardTransactions ?? leaderboardTransactionsFixture),
  };
}

export function getBehaviorTestConfig(options: BehaviorTestConfigOptions) {
  const activateAndReload =
    options.pwaActivateAndReload ?? vi.fn<() => Promise<void>>();

  return {
    deferBlockBehavior: DeferBlockBehavior.Playthrough,
    imports: [TranslateModule.forRoot()],
    providers: [
      provideRouter(routes),
      provideDisabledMaterialAnimations(),
      { provide: ApiService, useValue: createApiServiceMock(options) },
      { provide: ViewportService, useValue: { isMobile$: of(options.isMobile) } },
      {
        provide: PwaUpdateService,
        useValue: {
          updateAvailable$: of(options.pwaUpdateAvailable ?? false),
          activateAndReload,
        },
      },
    ],
  };
}

/**
 * jsdom does not implement scrollIntoView — stub it for behavior tests.
 */
export function polyfillJsdom(): void {
  if (typeof HTMLElement.prototype.scrollIntoView !== 'function') {
    HTMLElement.prototype.scrollIntoView = () => { };
  }

  if (typeof HTMLElement.prototype.scrollTo !== 'function') {
    HTMLElement.prototype.scrollTo = () => { };
  }
}

export function polyfillMatchMedia(): void {
  if (typeof window.matchMedia === 'function') {
    return;
  }

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

export function seedLocalStorage(): void {
  localStorage.setItem(
    'fantrax.settings',
    JSON.stringify({
      selectedTeamId: '1',
      startFromSeason: 2012,
      topControlsExpanded: true,
      season: null,
      reportType: 'regular',
    })
  );
}
