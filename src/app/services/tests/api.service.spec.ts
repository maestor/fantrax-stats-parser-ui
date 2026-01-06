import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService, Season, Player, Goalie, ApiParams } from '../api.service';
import { CacheService } from '../cache.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let cacheService: CacheService;
  const API_URL = 'http://localhost:3000';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        CacheService,
      ],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    cacheService = TestBed.inject(CacheService);
    cacheService.clearAll();
  });

  afterEach(() => {
    httpMock.verify();
    cacheService.clearAll();
  });

  describe('getSeasons', () => {
    it('should fetch seasons from API', (done) => {
      const mockSeasons: Season[] = [
        { season: 2024, text: '2024-25' },
        { season: 2023, text: '2023-24' },
      ];

      service.getSeasons().subscribe((seasons) => {
        expect(seasons).toEqual(mockSeasons);
        expect(seasons.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/seasons`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSeasons);
    });

    it('should cache seasons data on first request', (done) => {
      const mockSeasons: Season[] = [{ season: 2024, text: '2024-25' }];

      service.getSeasons().subscribe(() => {
        const cachedData = cacheService.get<Season[]>('seasons');
        expect(cachedData).toEqual(mockSeasons);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/seasons`);
      req.flush(mockSeasons);
    });

    it('should return cached data on subsequent requests', (done) => {
      const mockSeasons: Season[] = [{ season: 2024, text: '2024-25' }];
      cacheService.set('seasons', mockSeasons);

      service.getSeasons().subscribe((seasons) => {
        expect(seasons).toEqual(mockSeasons);
        done();
      });

      httpMock.expectNone(`${API_URL}/seasons`);
    });

    it('should handle API errors gracefully', (done) => {
      const consoleErrorSpy = spyOn(console, 'error');

      service.getSeasons().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Something went wrong with the API!');
          expect(consoleErrorSpy).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne(`${API_URL}/seasons`);
      req.error(new ProgressEvent('Network error'), {
        status: 500,
        statusText: 'Server Error',
      });
    });
  });

  describe('getPlayerData', () => {
    it('should fetch regular season combined player data', (done) => {
      const params: ApiParams = { reportType: 'regular' };
      const mockPlayers: Player[] = [
        {
          name: 'Player 1',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 82,
          goals: 50,
          assists: 60,
          points: 110,
          plusMinus: 25,
          penalties: 20,
          shots: 300,
          ppp: 40,
          shp: 2,
          hits: 100,
          blocks: 50,
        },
      ];

      service.getPlayerData(params).subscribe((players) => {
        expect(players).toEqual(mockPlayers);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/players/combined/regular`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPlayers);
    });

    it('should fetch playoffs combined player data', (done) => {
      const params: ApiParams = { reportType: 'playoffs' };
      const mockPlayers: Player[] = [];

      service.getPlayerData(params).subscribe((players) => {
        expect(players).toEqual(mockPlayers);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/players/combined/playoffs`);
      req.flush(mockPlayers);
    });

    it('should fetch regular season data for specific season', (done) => {
      const params: ApiParams = { reportType: 'regular', season: 2024 };
      const mockPlayers: Player[] = [
        {
          name: 'Player 1',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 82,
          goals: 50,
          assists: 60,
          points: 110,
          plusMinus: 25,
          penalties: 20,
          shots: 300,
          ppp: 40,
          shp: 2,
          hits: 100,
          blocks: 50,
        },
      ];

      service.getPlayerData(params).subscribe((players) => {
        expect(players).toEqual(mockPlayers);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/players/season/regular/2024`);
      req.flush(mockPlayers);
    });

    it('should fetch playoffs data for specific season', (done) => {
      const params: ApiParams = { reportType: 'playoffs', season: 2023 };
      const mockPlayers: Player[] = [];

      service.getPlayerData(params).subscribe((players) => {
        expect(players).toEqual(mockPlayers);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/players/season/playoffs/2023`);
      req.flush(mockPlayers);
    });

    it('should use default reportType "regular" if not provided', (done) => {
      const params: ApiParams = {};
      const mockPlayers: Player[] = [];

      service.getPlayerData(params).subscribe((players) => {
        expect(players).toEqual(mockPlayers);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/players/combined/regular`);
      req.flush(mockPlayers);
    });

    it('should cache player data with correct key for combined data', (done) => {
      const params: ApiParams = { reportType: 'regular' };
      const mockPlayers: Player[] = [];

      service.getPlayerData(params).subscribe(() => {
        const cachedData = cacheService.get<Player[]>(
          'playerStats-regular-combined'
        );
        expect(cachedData).toEqual(mockPlayers);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/players/combined/regular`);
      req.flush(mockPlayers);
    });

    it('should cache player data with correct key for season data', (done) => {
      const params: ApiParams = { reportType: 'playoffs', season: 2024 };
      const mockPlayers: Player[] = [];

      service.getPlayerData(params).subscribe(() => {
        const cachedData = cacheService.get<Player[]>(
          'playerStats-playoffs-2024'
        );
        expect(cachedData).toEqual(mockPlayers);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/players/season/playoffs/2024`);
      req.flush(mockPlayers);
    });

    it('should return cached player data on subsequent requests', (done) => {
      const mockPlayers: Player[] = [
        {
          name: 'Cached Player',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 10,
          goals: 5,
          assists: 5,
          points: 10,
          plusMinus: 0,
          penalties: 2,
          shots: 20,
          ppp: 3,
          shp: 0,
          hits: 15,
          blocks: 10,
        },
      ];
      cacheService.set('playerStats-regular-combined', mockPlayers);

      service.getPlayerData({ reportType: 'regular' }).subscribe((players) => {
        expect(players).toEqual(mockPlayers);
        done();
      });

      httpMock.expectNone(`${API_URL}/players/combined/regular`);
    });

    it('should handle API errors for player data', (done) => {
      const params: ApiParams = { reportType: 'regular' };
      const consoleErrorSpy = spyOn(console, 'error');

      service.getPlayerData(params).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Something went wrong with the API!');
          expect(consoleErrorSpy).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne(`${API_URL}/players/combined/regular`);
      req.error(new ProgressEvent('Network error'), {
        status: 404,
        statusText: 'Not Found',
      });
    });
  });

  describe('getGoalieData', () => {
    it('should fetch regular season combined goalie data', (done) => {
      const params: ApiParams = { reportType: 'regular' };
      const mockGoalies: Goalie[] = [
        {
          name: 'Goalie 1',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 65,
          wins: 40,
          saves: 1800,
          shutouts: 5,
          goals: 0,
          assists: 2,
          points: 2,
          penalties: 0,
          ppp: 0,
          shp: 0,
          gaa: '2.50',
          savePercent: '0.915',
        },
      ];

      service.getGoalieData(params).subscribe((goalies) => {
        expect(goalies).toEqual(mockGoalies);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/goalies/combined/regular`);
      expect(req.request.method).toBe('GET');
      req.flush(mockGoalies);
    });

    it('should fetch playoffs combined goalie data', (done) => {
      const params: ApiParams = { reportType: 'playoffs' };
      const mockGoalies: Goalie[] = [];

      service.getGoalieData(params).subscribe((goalies) => {
        expect(goalies).toEqual(mockGoalies);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/goalies/combined/playoffs`);
      req.flush(mockGoalies);
    });

    it('should fetch regular season goalie data for specific season', (done) => {
      const params: ApiParams = { reportType: 'regular', season: 2024 };
      const mockGoalies: Goalie[] = [];

      service.getGoalieData(params).subscribe((goalies) => {
        expect(goalies).toEqual(mockGoalies);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/goalies/season/regular/2024`);
      req.flush(mockGoalies);
    });

    it('should fetch playoffs goalie data for specific season', (done) => {
      const params: ApiParams = { reportType: 'playoffs', season: 2023 };
      const mockGoalies: Goalie[] = [];

      service.getGoalieData(params).subscribe((goalies) => {
        expect(goalies).toEqual(mockGoalies);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/goalies/season/playoffs/2023`);
      req.flush(mockGoalies);
    });

    it('should use default reportType "regular" if not provided', (done) => {
      const params: ApiParams = {};
      const mockGoalies: Goalie[] = [];

      service.getGoalieData(params).subscribe((goalies) => {
        expect(goalies).toEqual(mockGoalies);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/goalies/combined/regular`);
      req.flush(mockGoalies);
    });

    it('should cache goalie data with correct key for combined data', (done) => {
      const params: ApiParams = { reportType: 'regular' };
      const mockGoalies: Goalie[] = [];

      service.getGoalieData(params).subscribe(() => {
        const cachedData = cacheService.get<Goalie[]>(
          'goalieStats-regular-combined'
        );
        expect(cachedData).toEqual(mockGoalies);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/goalies/combined/regular`);
      req.flush(mockGoalies);
    });

    it('should cache goalie data with correct key for season data', (done) => {
      const params: ApiParams = { reportType: 'playoffs', season: 2024 };
      const mockGoalies: Goalie[] = [];

      service.getGoalieData(params).subscribe(() => {
        const cachedData = cacheService.get<Goalie[]>(
          'goalieStats-playoffs-2024'
        );
        expect(cachedData).toEqual(mockGoalies);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/goalies/season/playoffs/2024`);
      req.flush(mockGoalies);
    });

    it('should return cached goalie data on subsequent requests', (done) => {
      const mockGoalies: Goalie[] = [
        {
          name: 'Cached Goalie',
          score: 0,
          scoreAdjustedByGames: 0,
          games: 10,
          wins: 8,
          saves: 300,
          shutouts: 2,
          goals: 0,
          assists: 0,
          points: 0,
          penalties: 0,
          ppp: 0,
          shp: 0,
          gaa: '2.00',
          savePercent: '0.920',
        },
      ];
      cacheService.set('goalieStats-regular-combined', mockGoalies);

      service.getGoalieData({ reportType: 'regular' }).subscribe((goalies) => {
        expect(goalies).toEqual(mockGoalies);
        done();
      });

      httpMock.expectNone(`${API_URL}/goalies/combined/regular`);
    });

    it('should handle API errors for goalie data', (done) => {
      const params: ApiParams = { reportType: 'regular' };
      const consoleErrorSpy = spyOn(console, 'error');

      service.getGoalieData(params).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Something went wrong with the API!');
          expect(consoleErrorSpy).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne(`${API_URL}/goalies/combined/regular`);
      req.error(new ProgressEvent('Network error'), {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });
});
