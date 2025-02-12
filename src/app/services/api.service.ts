import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CacheService } from './cache.service';

export type Season = {
  season: number;
  text: string;
};

export type Player = {
  name: string;
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

export type Goalie = {
  name: string;
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

export type ReportType = 'regular' | 'playoffs';

export type ApiParams = {
  reportType?: ReportType;
  season?: number;
};

@Injectable({
  providedIn: 'root', // Provides service globally
})
export class ApiService {
  private http = inject(HttpClient);
  private cacheService = inject(CacheService);
  private readonly API_URL = 'http://localhost:3000';

  // Fetching available seasons
  getSeasons(): Observable<Season[]> {
    return this.handleRequest<Season[]>('seasons', 'seasons');
  }

  // Fetching players data
  getPlayerData(params: ApiParams): Observable<Player[]> {
    const { reportType = 'regular', season } = params;
    const cacheKey = `playerStats-${reportType}-${season ?? 'combined'}`;
    const path = season
      ? `players/season/${reportType}/${season}}`
      : `players/combined/${reportType}`;

    return this.handleRequest<Player[]>(path, cacheKey);
  }

  // Fetching goalies data
  getGoalieData(params: ApiParams): Observable<Goalie[]> {
    const { reportType = 'regular', season } = params;
    const cacheKey = `goalieStats-${reportType}-${season ?? 'combined'}`;
    const path = season
      ? `goalies/season/${reportType}/${season}`
      : `goalies/combined/${reportType}`;

    return this.handleRequest<Goalie[]>(path, cacheKey);
  }

  // Helper to get data from cache or make API call
  private handleRequest<T>(path: string, cacheKey: string) {
    const cachedData = this.cacheService.get<T>(cacheKey);
    if (cachedData) return of(cachedData);

    return this.http.get<T>(`${this.API_URL}/${path}`).pipe(
      tap((data) => this.cacheService.set<T>(cacheKey, data)),
      catchError(this.handleError)
    );
  }

  // Error handling function
  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    return throwError(() => new Error('Something went wrong with the API!'));
  }
}
