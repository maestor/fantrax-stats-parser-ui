import { HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ApiService } from './api.service';
import { CacheService } from './cache.service';

describe('ApiService', () => {
  let service: ApiService;
  let cache: CacheService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        ApiService,
        CacheService,
      ],
    });

    service = TestBed.inject(ApiService);
    cache = TestBed.inject(CacheService);
    httpMock = TestBed.inject(HttpTestingController);
    cache.clearAll();
  });

  afterEach(() => {
    httpMock.verify();
    cache.clearAll();
    vi.restoreAllMocks();
  });

  it('requests teams from the teams endpoint', async () => {
    const responsePromise = firstValueFrom(service.getTeams());

    const request = httpMock.expectOne('http://localhost:3000/teams');
    expect(request.request.method).toBe('GET');
    request.flush([{ id: '1', name: 'colorado', presentName: 'Colorado Avalanche' }]);

    await expect(responsePromise).resolves.toEqual([
      { id: '1', name: 'colorado', presentName: 'Colorado Avalanche' },
    ]);
  });

  it('requests seasons without team params when no team id is provided', async () => {
    const responsePromise = firstValueFrom(service.getSeasons());

    const request = httpMock.expectOne((req) =>
      req.url === 'http://localhost:3000/seasons/regular' &&
      req.params.keys().length === 0
    );
    request.flush([{ season: 2012, text: '2012-2013' }]);

    await expect(responsePromise).resolves.toEqual([{ season: 2012, text: '2012-2013' }]);
  });

  it('requests seasons with normalized team and startFrom query params', async () => {
    const responsePromise = firstValueFrom(service.getSeasons('regular', '29', 2015));

    const request = httpMock.expectOne((req) =>
      req.url === 'http://localhost:3000/seasons/regular' &&
      req.params.get('teamId') === '29' &&
      req.params.get('startFrom') === '2015'
    );
    expect(request.request.method).toBe('GET');
    request.flush([{ season: 2015, text: '2015-2016' }]);

    await expect(responsePromise).resolves.toEqual([{ season: 2015, text: '2015-2016' }]);
  });

  it('uses the season player endpoint and omits startFrom when season is provided', async () => {
    const responsePromise = firstValueFrom(
      service.getPlayerData({
        reportType: 'playoffs',
        season: 2024,
        teamId: '29',
        startFrom: 2015,
      })
    );

    const request = httpMock.expectOne((req) =>
      req.url === 'http://localhost:3000/players/season/playoffs/2024' &&
      req.params.get('teamId') === '29' &&
      !req.params.has('startFrom')
    );
    request.flush([]);

    await expect(responsePromise).resolves.toEqual([]);
  });

  it('omits the default team id from combined player requests', async () => {
    const responsePromise = firstValueFrom(service.getPlayerData({ teamId: '1' }));

    const request = httpMock.expectOne((req) =>
      req.url === 'http://localhost:3000/players/combined/regular' &&
      req.params.keys().length === 0
    );
    request.flush([]);

    await expect(responsePromise).resolves.toEqual([]);
  });

  it('uses the season goalie endpoint and omits startFrom when season is provided', async () => {
    const responsePromise = firstValueFrom(
      service.getGoalieData({
        reportType: 'playoffs',
        season: 2024,
        teamId: '29',
        startFrom: 2015,
      })
    );

    const request = httpMock.expectOne((req) =>
      req.url === 'http://localhost:3000/goalies/season/playoffs/2024' &&
      req.params.get('teamId') === '29' &&
      !req.params.has('startFrom')
    );
    request.flush([]);

    await expect(responsePromise).resolves.toEqual([]);
  });

  it('returns cached results on repeated requests without issuing another http call', async () => {
    const firstResponse = firstValueFrom(service.getGoalieData({ reportType: 'both', teamId: '29' }));

    const request = httpMock.expectOne((req) =>
      req.url === 'http://localhost:3000/goalies/combined/both' &&
      req.params.get('teamId') === '29'
    );
    request.flush([{ id: 'goalie-1', name: 'Goalie Demo' }]);

    await expect(firstResponse).resolves.toEqual([{ id: 'goalie-1', name: 'Goalie Demo' }]);

    await expect(
      firstValueFrom(service.getGoalieData({ reportType: 'both', teamId: '29' }))
    ).resolves.toEqual([{ id: 'goalie-1', name: 'Goalie Demo' }]);
    httpMock.expectNone('http://localhost:3000/goalies/combined/both');
  });

  it('returns cached results from the endpoint cache key without issuing an http call', async () => {
    cache.set('leaderboard-playoffs', [{ teamId: '1', teamName: 'Colorado Avalanche' }]);

    await expect(firstValueFrom(service.getLeaderboardPlayoffs())).resolves.toEqual([
      { teamId: '1', teamName: 'Colorado Avalanche' },
    ]);
    httpMock.expectNone('http://localhost:3000/leaderboard/playoffs');
  });

  it('shares one in-flight request between simultaneous subscribers', async () => {
    const firstResponse = firstValueFrom(service.getLeaderboardRegular());
    const secondResponse = firstValueFrom(service.getLeaderboardRegular());

    const requests = httpMock.match('http://localhost:3000/leaderboard/regular');
    expect(requests).toHaveLength(1);
    requests[0].flush([{ teamId: '1', teamName: 'Colorado Avalanche' }]);

    await expect(Promise.all([firstResponse, secondResponse])).resolves.toEqual([
      [{ teamId: '1', teamName: 'Colorado Avalanche' }],
      [{ teamId: '1', teamName: 'Colorado Avalanche' }],
    ]);
  });

  it('requests playoffs leaderboard data from the playoffs endpoint', async () => {
    const responsePromise = firstValueFrom(service.getLeaderboardPlayoffs());

    const request = httpMock.expectOne('http://localhost:3000/leaderboard/playoffs');
    expect(request.request.method).toBe('GET');
    request.flush([{ teamId: '1', teamName: 'Colorado Avalanche' }]);

    await expect(responsePromise).resolves.toEqual([
      { teamId: '1', teamName: 'Colorado Avalanche' },
    ]);
  });

  it('requests career highlights with explicit paging params', async () => {
    const responsePromise = firstValueFrom(
      service.getCareerHighlights('most-teams-played', 10, 10)
    );

    const request = httpMock.expectOne((req) =>
      req.url === 'http://localhost:3000/career/highlights/most-teams-played' &&
      req.params.get('skip') === '10' &&
      req.params.get('take') === '10'
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      type: 'most-teams-played',
      skip: 10,
      take: 10,
      total: 12,
      items: [],
    });

    await expect(responsePromise).resolves.toEqual({
      type: 'most-teams-played',
      skip: 10,
      take: 10,
      total: 12,
      items: [],
    });
  });

  it('caches career highlights by type and paging window', async () => {
    const firstResponse = firstValueFrom(
      service.getCareerHighlights('same-team-seasons-played', 0, 10)
    );

    const request = httpMock.expectOne((req) =>
      req.url === 'http://localhost:3000/career/highlights/same-team-seasons-played' &&
      req.params.get('skip') === '0' &&
      req.params.get('take') === '10'
    );
    request.flush({
      type: 'same-team-seasons-played',
      skip: 0,
      take: 10,
      total: 11,
      items: [],
    });

    await expect(firstResponse).resolves.toEqual({
      type: 'same-team-seasons-played',
      skip: 0,
      take: 10,
      total: 11,
      items: [],
    });

    await expect(
      firstValueFrom(service.getCareerHighlights('same-team-seasons-played', 0, 10))
    ).resolves.toEqual({
      type: 'same-team-seasons-played',
      skip: 0,
      take: 10,
      total: 11,
      items: [],
    });
    httpMock.expectNone('http://localhost:3000/career/highlights/same-team-seasons-played');
  });

  it('transforms http errors into a user-friendly error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const responsePromise = firstValueFrom(service.getLastModified());

    const request = httpMock.expectOne('http://localhost:3000/last-modified');
    request.flush('failure', { status: 500, statusText: 'Server Error' });

    await expect(responsePromise).rejects.toEqual(
      new Error('Something went wrong with the API!')
    );
    expect(console.error).toHaveBeenCalledWith(
      'API Error:',
      expect.any(HttpErrorResponse)
    );
  });
});
