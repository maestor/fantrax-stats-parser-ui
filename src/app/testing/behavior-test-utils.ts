import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { routes } from '../app.routes';
import { ApiService } from '@services/api.service';
import { ViewportService } from '@services/viewport.service';
import { PwaUpdateService } from '@services/pwa-update.service';

import teamsFixture from '../../../e2e/fixtures/data/teams.json';
import lastModifiedFixture from '../../../e2e/fixtures/data/last-modified.json';
import seasonsFixture from '../../../e2e/fixtures/data/seasons--regular.json';
import playersFixture from '../../../e2e/fixtures/data/players--combined--regular.json';

export const PLAYER_SLICE_COUNT = 12;

export const slicedPlayers = playersFixture.slice(0, PLAYER_SLICE_COUNT);

export { teamsFixture, lastModifiedFixture, seasonsFixture, playersFixture };

function createApiServiceMock() {
  return {
    getTeams: () => of(teamsFixture),
    getLastModified: () => of(lastModifiedFixture),
    getSeasons: () => of(seasonsFixture),
    getPlayerData: () => of(slicedPlayers),
    getGoalieData: () => of([]),
    getLeaderboardRegular: () => of([]),
    getLeaderboardPlayoffs: () => of([]),
  };
}

export function getBehaviorTestConfig(options: { isMobile: boolean }) {
  return {
    imports: [TranslateModule.forRoot()],
    providers: [
      provideRouter(routes),
      provideNoopAnimations(),
      { provide: ApiService, useValue: createApiServiceMock() },
      { provide: ViewportService, useValue: { isMobile$: of(options.isMobile) } },
      { provide: PwaUpdateService, useValue: { updateAvailable$: of(false), activateAndReload: vi.fn() } },
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
