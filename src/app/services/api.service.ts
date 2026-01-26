import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { environment } from '../../environments/environment';

export type Season = {
  season: number;
  text: string;
};

export type PlayerSeasonStats = {
  season: number;
  score: number;
  scoreAdjustedByGames: number;
  games: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  penalties: number;
  shots: number;
  ppp: number;
  shp: number;
  hits: number;
  blocks: number;
};

export type Player = {
  name: string;
  score: number;
  scoreAdjustedByGames: number;
  games: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  penalties: number;
  shots: number;
  ppp: number;
  shp: number;
  hits: number;
  blocks: number;
  seasons?: PlayerSeasonStats[];
};

export type GoalieSeasonStats = {
  season: number;
  score: number;
  scoreAdjustedByGames: number;
  games: number;
  wins: number;
  saves: number;
  shutouts: number;
  goals: number;
  assists: number;
  points: number;
  penalties: number;
  ppp: number;
  shp: number;
  gaa?: string;
  savePercent?: string;
};

export type Goalie = {
  name: string;
  score: number;
  scoreAdjustedByGames: number;
  games: number;
  wins: number;
  saves: number;
  shutouts: number;
  goals: number;
  assists: number;
  points: number;
  penalties: number;
  ppp: number;
  shp: number;
  gaa?: string;
  savePercent?: string;
  seasons?: GoalieSeasonStats[];
};

export type ReportType = 'regular' | 'playoffs';

export type ApiParams = {
  reportType?: ReportType;
  season?: number;
  teamId?: string;
  startFrom?: number;
};

export type Team = {
  id: string;
  name: string;
};

@Injectable({
  providedIn: 'root', // Provides service globally
})
export class ApiService {
  private http = inject(HttpClient);
  private cacheService = inject(CacheService);
  private readonly API_URL = environment.apiUrl;

  private readonly inFlightRequests = new Map<
    string,
    { observable: Observable<unknown>; cacheKeys: Set<string> }
  >();

  // Fetching available teams
  getTeams(): Observable<Team[]> {
    return this.handleRequest<Team[]>('teams', 'teams');
  }

  // Fetching available seasons
  getSeasons(
    reportType: ReportType = 'regular',
    teamId?: string,
    startFrom?: number
  ): Observable<Season[]> {
    const normalizedTeamId = this.normalizeTeamId(teamId);
    const cacheKey = `seasons-${reportType}${this.teamCacheKeySuffix(normalizedTeamId)}${this.startFromCacheKeySuffix(startFrom)}`;
    return this.handleRequest<Season[]>(
      `seasons/${reportType}`,
      cacheKey,
      this.queryParams(normalizedTeamId, startFrom)
    );
  }

  // Fetching players data
  getPlayerData(params: ApiParams): Observable<Player[]> {
    const { reportType = 'regular', season, teamId, startFrom } = params;
    const normalizedTeamId = this.normalizeTeamId(teamId);
    const startFromForRequest = season ? undefined : startFrom;
    const cacheKey = `playerStats-${reportType}-${season ?? 'combined'}${this.startFromCacheKeySuffix(startFromForRequest)}${this.teamCacheKeySuffix(normalizedTeamId)}`;
    const path = season
      ? `players/season/${reportType}/${season}`
      : `players/combined/${reportType}`;

    return this.handleRequest<Player[]>(
      path,
      cacheKey,
      this.queryParams(normalizedTeamId, startFromForRequest)
    );
  }

  // Fetching goalies data
  getGoalieData(params: ApiParams): Observable<Goalie[]> {
    const { reportType = 'regular', season, teamId, startFrom } = params;
    const normalizedTeamId = this.normalizeTeamId(teamId);
    const startFromForRequest = season ? undefined : startFrom;
    const cacheKey = `goalieStats-${reportType}-${season ?? 'combined'}${this.startFromCacheKeySuffix(startFromForRequest)}${this.teamCacheKeySuffix(normalizedTeamId)}`;
    const path = season
      ? `goalies/season/${reportType}/${season}`
      : `goalies/combined/${reportType}`;

    return this.handleRequest<Goalie[]>(
      path,
      cacheKey,
      this.queryParams(normalizedTeamId, startFromForRequest)
    );
  }

  // Helper to get data from cache or make API call
  private handleRequest<T>(
    path: string,
    cacheKey: string,
    queryParams?: Record<string, string>
  ): Observable<T> {
    const requestKey = this.buildRequestKey(path, queryParams);
    const requestCacheKey = `req:${requestKey}`;

    const cachedByRequest = this.cacheService.get<T>(requestCacheKey);
    if (cachedByRequest !== null) return of(cachedByRequest);

    const cachedData = this.cacheService.get<T>(cacheKey);
    if (cachedData !== null) return of(cachedData);

    const existingInFlight = this.inFlightRequests.get(requestKey);
    if (existingInFlight) {
      existingInFlight.cacheKeys.add(cacheKey);
      return existingInFlight.observable as Observable<T>;
    }

    const cacheKeys = new Set<string>([cacheKey, requestCacheKey]);

    const params = queryParams ? new HttpParams({ fromObject: queryParams }) : undefined;

    const request$ = this.http.get<T>(`${this.API_URL}/${path}`, { params }).pipe(
      tap((data) => {
        for (const key of cacheKeys) {
          this.cacheService.set<T>(key, data);
        }
      }),
      catchError(this.handleError),
      finalize(() => this.inFlightRequests.delete(requestKey)),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.inFlightRequests.set(requestKey, { observable: request$, cacheKeys });
    return request$;
  }

  private buildRequestKey(
    path: string,
    queryParams?: Record<string, string>
  ): string {
    if (!queryParams) return path;

    const keys = Object.keys(queryParams).sort();
    if (keys.length === 0) return path;

    const query = keys
      .map((key) => {
        const value = queryParams[key];
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join('&');

    return `${path}?${query}`;
  }

  private normalizeTeamId(teamId?: string): string | undefined {
    if (!teamId) return undefined;
    return teamId === '1' ? undefined : teamId;
  }

  private queryParams(
    teamId?: string,
    startFrom?: number
  ): Record<string, string> | undefined {
    const params: Record<string, string> = {};
    if (teamId) params['teamId'] = teamId;
    if (startFrom !== undefined && Number.isFinite(startFrom)) {
      params['startFrom'] = String(startFrom);
    }

    return Object.keys(params).length > 0 ? params : undefined;
  }

  private teamCacheKeySuffix(teamId?: string): string {
    return teamId ? `-team-${teamId}` : '';
  }

  private startFromCacheKeySuffix(startFrom?: number): string {
    return startFrom !== undefined && Number.isFinite(startFrom)
      ? `-startFrom-${startFrom}`
      : '';
  }

  // Error handling function
  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    return throwError(() => new Error('Something went wrong with the API!'));
  }
}
