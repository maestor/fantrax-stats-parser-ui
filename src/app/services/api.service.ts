import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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

  // Fetching available teams
  getTeams(): Observable<Team[]> {
    return this.handleRequest<Team[]>('teams', 'teams');
  }

  // Fetching available seasons
  getSeasons(reportType: ReportType = 'regular', teamId?: string): Observable<Season[]> {
    const normalizedTeamId = this.normalizeTeamId(teamId);
    const cacheKey = `seasons-${reportType}${this.teamCacheKeySuffix(normalizedTeamId)}`;
    return this.handleRequest<Season[]>(
      `seasons/${reportType}`,
      cacheKey,
      this.teamQueryParams(normalizedTeamId)
    );
  }

  // Fetching players data
  getPlayerData(params: ApiParams): Observable<Player[]> {
    const { reportType = 'regular', season, teamId } = params;
    const normalizedTeamId = this.normalizeTeamId(teamId);
    const cacheKey = `playerStats-${reportType}-${season ?? 'combined'}${this.teamCacheKeySuffix(normalizedTeamId)}`;
    const path = season
      ? `players/season/${reportType}/${season}`
      : `players/combined/${reportType}`;

    return this.handleRequest<Player[]>(
      path,
      cacheKey,
      this.teamQueryParams(normalizedTeamId)
    );
  }

  // Fetching goalies data
  getGoalieData(params: ApiParams): Observable<Goalie[]> {
    const { reportType = 'regular', season, teamId } = params;
    const normalizedTeamId = this.normalizeTeamId(teamId);
    const cacheKey = `goalieStats-${reportType}-${season ?? 'combined'}${this.teamCacheKeySuffix(normalizedTeamId)}`;
    const path = season
      ? `goalies/season/${reportType}/${season}`
      : `goalies/combined/${reportType}`;

    return this.handleRequest<Goalie[]>(
      path,
      cacheKey,
      this.teamQueryParams(normalizedTeamId)
    );
  }

  // Helper to get data from cache or make API call
  private handleRequest<T>(
    path: string,
    cacheKey: string,
    queryParams?: Record<string, string>
  ) {
    const cachedData = this.cacheService.get<T>(cacheKey);
    if (cachedData) return of(cachedData);

    const params = queryParams ? new HttpParams({ fromObject: queryParams }) : undefined;

    return this.http.get<T>(`${this.API_URL}/${path}`, { params }).pipe(
      tap((data) => this.cacheService.set<T>(cacheKey, data)),
      catchError(this.handleError)
    );
  }

  private normalizeTeamId(teamId?: string): string | undefined {
    if (!teamId) return undefined;
    return teamId === '1' ? undefined : teamId;
  }

  private teamQueryParams(teamId?: string): Record<string, string> | undefined {
    return teamId ? { teamId } : undefined;
  }

  private teamCacheKeySuffix(teamId?: string): string {
    return teamId ? `-team-${teamId}` : '';
  }

  // Error handling function
  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    return throwError(() => new Error('Something went wrong with the API!'));
  }
}
