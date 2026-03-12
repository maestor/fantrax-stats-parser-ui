import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { HttpParams } from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";
import { catchError, finalize, shareReplay, tap } from "rxjs/operators";
import { CacheService } from "./cache.service";
import { environment } from "../../environments/environment";
import type { components } from './api.types.generated';

// Generated from OpenAPI spec — run `npm run generate:types` to update
export type Season                  = components['schemas']['Season'];
export type PlayerSeasonStats       = components['schemas']['PlayerSeasonData'];
export type GoalieSeasonStats       = components['schemas']['GoalieSeasonData'];
export type Team                    = components['schemas']['Team'];
export type RegularLeaderboardEntry = components['schemas']['RegularLeaderboardEntry'];
export type PlayoffLeaderboardEntry = components['schemas']['PlayoffLeaderboardEntry'];
export type CareerPlayerListItem    = components['schemas']['CareerPlayerListItem'];
export type CareerGoalieListItem    = components['schemas']['CareerGoalieListItem'];
export type CareerPlayer            = components['schemas']['CareerPlayer'];
export type CareerGoalie            = components['schemas']['CareerGoalie'];
export type CareerHighlightType     = components['schemas']['CareerHighlightType'];
export type CareerHighlightTeam     = components['schemas']['CareerHighlightTeam'];
export type CareerTeamCountHighlightItem = components['schemas']['CareerTeamCountHighlightItem'];
export type CareerSameTeamHighlightItem = components['schemas']['CareerSameTeamHighlightItem'];
export type CareerStanleyCupHighlightItem = components['schemas']['CareerStanleyCupHighlightItem'];
export type CareerStashHighlightItem = components['schemas']['CareerStashHighlightItem'];
export type CareerRegularGrinderHighlightItem =
  components['schemas']['CareerRegularGrinderHighlightItem'];
export type CareerTeamCountHighlightPage = components['schemas']['CareerTeamCountHighlightPage'];
export type CareerSameTeamHighlightPage = components['schemas']['CareerSameTeamHighlightPage'];
export type CareerStanleyCupHighlightPage = components['schemas']['CareerStanleyCupHighlightPage'];
export type CareerStashHighlightPage = components['schemas']['CareerStashHighlightPage'];
export type CareerRegularGrinderHighlightPage =
  components['schemas']['CareerRegularGrinderHighlightPage'];
export type CareerHighlightPage =
  | CareerTeamCountHighlightPage
  | CareerSameTeamHighlightPage
  | CareerStanleyCupHighlightPage
  | CareerStashHighlightPage
  | CareerRegularGrinderHighlightPage;

// Player includes frontend-only augmentation fields not present in the API spec.
// seasons is made optional to match single-season endpoint usage (spec: CombinedPlayer has required seasons).
export type Player = Omit<components['schemas']['CombinedPlayer'], 'seasons'> & {
  seasons?: components['schemas']['PlayerSeasonData'][];
  // Preserved original scores when position filter transforms the data
  _originalScore?: number;
  _originalScoreAdjustedByGames?: number;
};

// seasons is made optional to match single-season endpoint usage (spec: CombinedGoalie has required seasons).
export type Goalie = Omit<components['schemas']['CombinedGoalie'], 'seasons'> & {
  seasons?: components['schemas']['GoalieSeasonData'][];
};

// Player scores object (0-100 normalized rankings per stat)
export type PlayerScores = {
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

// Player position type
export type PlayerPosition = "F" | "D";

// Goalie scores object for combined endpoint
export type GoalieScoresCombined = {
  wins: number;
  saves: number;
  shutouts: number;
};

// Goalie scores object for season endpoint (includes gaa/savePercent)
export type GoalieScoresSeason = GoalieScoresCombined & {
  gaa: number;
  savePercent: number;
};

export type ReportType = "regular" | "playoffs" | "both";

export type ApiParams = {
  reportType?: ReportType;
  season?: number;
  teamId?: string;
  startFrom?: number;
};

export type LastModifiedResponse = {
  lastModified: string;
};

@Injectable({
  providedIn: "root", // Provides service globally
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
    return this.handleRequest<Team[]>("teams", "teams");
  }

  // Fetch last modified information for the backend data
  getLastModified(): Observable<LastModifiedResponse> {
    return this.handleRequest<LastModifiedResponse>(
      "last-modified",
      "last-modified",
    );
  }

  // Fetching regular season leaderboard data
  getLeaderboardRegular(): Observable<RegularLeaderboardEntry[]> {
    return this.handleRequest<RegularLeaderboardEntry[]>(
      "leaderboard/regular",
      "leaderboard-regular",
    );
  }

  // Fetching playoffs leaderboard data
  getLeaderboardPlayoffs(): Observable<PlayoffLeaderboardEntry[]> {
    return this.handleRequest<PlayoffLeaderboardEntry[]>(
      "leaderboard/playoffs",
      "leaderboard-playoffs",
    );
  }

  // Fetching available seasons
  getSeasons(
    reportType: ReportType = "regular",
    teamId?: string,
    startFrom?: number,
  ): Observable<Season[]> {
    const normalizedTeamId = this.normalizeTeamId(teamId);
    const cacheKey = `seasons-${reportType}${this.teamCacheKeySuffix(normalizedTeamId)}${this.startFromCacheKeySuffix(startFrom)}`;
    return this.handleRequest<Season[]>(
      `seasons/${reportType}`,
      cacheKey,
      this.queryParams(normalizedTeamId, startFrom),
    );
  }

  // Fetching players data
  getPlayerData(params: ApiParams): Observable<Player[]> {
    const { reportType = "regular", season, teamId, startFrom } = params;
    const normalizedTeamId = this.normalizeTeamId(teamId);
    const startFromForRequest = season ? undefined : startFrom;
    const cacheKey = `playerStats-${reportType}-${season ?? "combined"}${this.startFromCacheKeySuffix(startFromForRequest)}${this.teamCacheKeySuffix(normalizedTeamId)}`;
    const path = season
      ? `players/season/${reportType}/${season}`
      : `players/combined/${reportType}`;

    return this.handleRequest<Player[]>(
      path,
      cacheKey,
      this.queryParams(normalizedTeamId, startFromForRequest),
    );
  }

  // Fetching goalies data
  getGoalieData(params: ApiParams): Observable<Goalie[]> {
    const { reportType = "regular", season, teamId, startFrom } = params;
    const normalizedTeamId = this.normalizeTeamId(teamId);
    const startFromForRequest = season ? undefined : startFrom;
    const cacheKey = `goalieStats-${reportType}-${season ?? "combined"}${this.startFromCacheKeySuffix(startFromForRequest)}${this.teamCacheKeySuffix(normalizedTeamId)}`;
    const path = season
      ? `goalies/season/${reportType}/${season}`
      : `goalies/combined/${reportType}`;

    return this.handleRequest<Goalie[]>(
      path,
      cacheKey,
      this.queryParams(normalizedTeamId, startFromForRequest),
    );
  }

  getCareerPlayers(): Observable<CareerPlayerListItem[]> {
    return this.handleRequest<CareerPlayerListItem[]>(
      'career/players',
      'career-players',
    );
  }

  getCareerGoalies(): Observable<CareerGoalieListItem[]> {
    return this.handleRequest<CareerGoalieListItem[]>(
      'career/goalies',
      'career-goalies',
    );
  }

  getCareerHighlights(
    type: CareerHighlightType,
    skip = 0,
    take = 10,
  ): Observable<CareerHighlightPage> {
    return this.handleRequest<CareerHighlightPage>(
      `career/highlights/${type}`,
      `career-highlights-${type}-${skip}-${take}`,
      {
        skip: String(skip),
        take: String(take),
      },
    );
  }

  // Helper to get data from cache or make API call
  private handleRequest<T>(
    path: string,
    cacheKey: string,
    queryParams?: Record<string, string>,
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

    const params = queryParams
      ? new HttpParams({ fromObject: queryParams })
      : undefined;

    const request$ = this.http
      .get<T>(`${this.API_URL}/${path}`, { params })
      .pipe(
        tap((data) => {
          for (const key of cacheKeys) {
            this.cacheService.set<T>(key, data);
          }
        }),
        catchError(this.handleError),
        finalize(() => this.inFlightRequests.delete(requestKey)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.inFlightRequests.set(requestKey, { observable: request$, cacheKeys });
    return request$;
  }

  private buildRequestKey(
    path: string,
    queryParams?: Record<string, string>,
  ): string {
    if (!queryParams) return path;

    const keys = Object.keys(queryParams).sort();

    const query = keys
      .map((key) => {
        const value = queryParams[key];
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join("&");

    return `${path}?${query}`;
  }

  private normalizeTeamId(teamId?: string): string | undefined {
    if (!teamId) return undefined;
    return teamId === "1" ? undefined : teamId;
  }

  private queryParams(
    teamId?: string,
    startFrom?: number,
  ): Record<string, string> | undefined {
    const params: Record<string, string> = {};
    if (teamId) params["teamId"] = teamId;
    if (startFrom !== undefined && Number.isFinite(startFrom)) {
      params["startFrom"] = String(startFrom);
    }

    return Object.keys(params).length > 0 ? params : undefined;
  }

  private teamCacheKeySuffix(teamId?: string): string {
    return teamId ? `-team-${teamId}` : "";
  }

  private startFromCacheKeySuffix(startFrom?: number): string {
    return startFrom !== undefined && Number.isFinite(startFrom)
      ? `-startFrom-${startFrom}`
      : "";
  }

  // Error handling function
  private handleError(error: HttpErrorResponse) {
    console.error("API Error:", error);
    return throwError(() => new Error("Something went wrong with the API!"));
  }
}
