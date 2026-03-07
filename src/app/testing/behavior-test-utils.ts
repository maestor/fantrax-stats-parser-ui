import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';

import { routes } from '../app.routes';
import {
  ApiParams,
  ApiService,
  Goalie,
  LastModifiedResponse,
  Player,
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

export const PLAYER_SLICE_COUNT = 12;
export const GOALIE_SLICE_COUNT = 5;

export const slicedPlayers = playersFixture.slice(0, PLAYER_SLICE_COUNT);
export const goaliesFixture = goaliesFixtureData as unknown as Goalie[];
export const slicedGoalies = goaliesFixture.slice(0, GOALIE_SLICE_COUNT);

export { teamsFixture, lastModifiedFixture, seasonsFixture, playersFixture };

type BehaviorApiErrorKey =
  | 'teams'
  | 'lastModified'
  | 'seasons'
  | 'players'
  | 'goalies'
  | 'leaderboardRegular'
  | 'leaderboardPlayoffs';

export type BehaviorApiMockOptions = {
  teams?: Team[];
  lastModified?: LastModifiedResponse | null;
  seasons?: Season[];
  players?: Player[];
  goalies?: Goalie[];
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
};

export type BehaviorTestConfigOptions = BehaviorApiMockOptions & {
  isMobile: boolean;
  pwaUpdateAvailable?: boolean;
  pwaActivateAndReload?: ReturnType<typeof vi.fn>;
};

function createApiError() {
  return throwError(() => new Error('Behavior test API error'));
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
    imports: [TranslateModule.forRoot()],
    providers: [
      provideRouter(routes),
      provideNoopAnimations(),
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
