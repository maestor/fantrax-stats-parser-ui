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
import sameTeamSeasonsHighlightsPage0FixtureData from '../../../e2e/fixtures/data/career--highlights--same-team-seasons-played--skip=0--take=10.json';
import sameTeamSeasonsHighlightsPage1FixtureData from '../../../e2e/fixtures/data/career--highlights--same-team-seasons-played--skip=10--take=10.json';

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
export const sameTeamSeasonsHighlightsPage0Fixture =
  sameTeamSeasonsHighlightsPage0FixtureData as CareerHighlightPage;
export const sameTeamSeasonsHighlightsPage1Fixture =
  sameTeamSeasonsHighlightsPage1FixtureData as CareerHighlightPage;

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
  | 'leaderboardPlayoffs';

export type BehaviorApiMockOptions = {
  teams?: Team[];
  lastModified?: LastModifiedResponse | null;
  seasons?: Season[];
  players?: Player[];
  goalies?: Goalie[];
  careerPlayers?: CareerPlayerListItem[];
  careerGoalies?: CareerGoalieListItem[];
  careerHighlightsMostTeamsPlayed?: CareerHighlightPage;
  careerHighlightsSameTeamSeasonsPlayed?: CareerHighlightPage;
  leaderboardRegular?: RegularLeaderboardEntry[];
  leaderboardPlayoffs?: PlayoffLeaderboardEntry[];
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
          ?? of(
            type === 'most-teams-played'
              ? (skip >= 10
                ? (options.careerHighlightsMostTeamsPlayed ?? mostTeamsPlayedHighlightsPage1Fixture)
                : (options.careerHighlightsMostTeamsPlayed ?? mostTeamsPlayedHighlightsPage0Fixture))
              : (skip >= 10
                ? (options.careerHighlightsSameTeamSeasonsPlayed
                  ?? sameTeamSeasonsHighlightsPage1Fixture)
                : (options.careerHighlightsSameTeamSeasonsPlayed
                  ?? sameTeamSeasonsHighlightsPage0Fixture))
          )),
    getLeaderboardRegular: () =>
      errorKeys.has('leaderboardRegular')
        ? createApiError()
        : of(options.leaderboardRegular ?? []),
    getLeaderboardPlayoffs: () =>
      errorKeys.has('leaderboardPlayoffs')
        ? createApiError()
        : of(options.leaderboardPlayoffs ?? []),
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
