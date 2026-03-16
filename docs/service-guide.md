# Service Guide

## Service Overview

Services in this application handle data fetching, business logic, state management, and caching. All services are provided at the root level as singletons.

## Core Services

### SettingsService
**Location**: `src/app/services/settings.service.ts`

**Purpose**: Persisted user preferences ("UI rememberings")

**Responsibilities**:
- Store user settings in a single `localStorage` key: `fantrax.settings`
- Provide the currently used reactive settings reads for team id, start-from season, and top-controls expand/collapse state
- Validate all fields on load; invalid or missing fields fall back to defaults

**Notes**:
- `startFromSeason` defaults to the oldest available season for the selected team
- When the selected team changes, `startFromSeason` resets to that team's oldest season
- Storage failures are ignored (privacy mode, quota, etc.)
- `season` defaults to `null` (all seasons); `reportType` defaults to `'regular'`
- Settings are validated field-by-field on load; invalid or missing fields fall back to defaults

**Key API**:
```typescript
class SettingsService {
  readonly selectedTeamId$: Observable<string>;
  readonly selectedTeamIdSignal: Signal<string>;
  readonly startFromSeason$: Observable<number | undefined>;
  readonly topControlsExpandedSignal: Signal<boolean>;

  get selectedTeamId(): string;
  get startFromSeason(): number | undefined;
  get season(): number | undefined;
  get reportType(): ReportType;

  setSelectedTeamId(teamId: string): void;
  setStartFromSeason(season: number | undefined): void;
  setTopControlsExpanded(expanded: boolean): void;
  setSeason(season: number | null): void;
  setReportType(reportType: ReportType): void;
}
```

**AppSettings type**:
```typescript
export type AppSettings = {
  selectedTeamId: string;
  startFromSeason: number | null;
  topControlsExpanded: boolean;
  season: number | null;
  reportType: ReportType;
};
```

### TeamService
**Location**: `src/app/services/team.service.ts`

**Purpose**: Global selected-team state with persistence

**Responsibilities**:
- Provide current team id as both a signal (`selectedTeamIdSignal`) and an observable (`selectedTeamId$`)
- Persist selection via `SettingsService` (`fantrax.settings` → `selectedTeamId`)
- Default to Colorado (team id `"1"`) — there is no "no team" state

**Key API**:
```typescript
class TeamService {
  readonly selectedTeamId$: Observable<string>;
  readonly selectedTeamIdSignal: Signal<string>;
  get selectedTeamId(): string;
  setTeamId(teamId: string): void;
}
```

### ApiService
**Location**: `src/app/services/api.service.ts`

**Purpose**: HTTP communication layer with the backend API

**Responsibilities**:
- Make HTTP requests to backend
- Handle request/response transformation
- Basic error handling
- Configure API endpoints
- Re-export API response types from generated OpenAPI types
- Fail fast during server prerendering so static share HTML does not hang waiting on the backend

### API Types

Types for all API responses are auto-generated from the OpenAPI spec via `openapi-typescript`.
The generated file lives at `src/app/services/api.types.generated.ts` — never edit it manually.

Types are re-exported from `api.service.ts` under stable names so consumers don't need to
import from the generated file directly:

```typescript
import type { Player, Goalie, Team, Season } from '@services/api.service';
```

To regenerate after backend API changes:

```bash
npm run generate:types
```

**Manually maintained types** (not in the OpenAPI spec):
- `ReportType` — `'regular' | 'playoffs' | 'both'`
- `ApiParams` — frontend query parameter wrapper
- `PlayerPosition` — `'F' | 'D'`
- `LastModifiedResponse` — backend last-modified timestamp response
- `PlayerScores` / `GoalieScoresCombined` / `GoalieScoresSeason` — explicit score field shapes
  (spec defines these as loose objects; explicit types preserved for autocomplete safety)

**Leaderboard response shape note**:
- `RegularLeaderboardEntry` and `PlayoffLeaderboardEntry` include `seasons` arrays from the API schema.
- The leaderboard UI uses these for expandable per-season detail rows while aggregate columns/ranking remain unchanged.

**Key Methods**:
```typescript
class ApiService {
  // Fetch available teams
  getTeams(): Observable<Team[]>;

  // Fetch last modified timestamp for backend data
  getLastModified(): Observable<LastModifiedResponse>;

  // Fetch player statistics
  getPlayerData(params: ApiParams): Observable<Player[]>

  // Fetch goalie statistics
  getGoalieData(params: ApiParams): Observable<Goalie[]>

  // Fetch paged career highlight leaderboard slices
  getCareerHighlights(
    type: CareerHighlightType,
    skip?: number,
    take?: number
  ): Observable<CareerHighlightPage>

  // Fetch available seasons for a given report type (regular/playoffs)
  // Optional `startFrom` filters out earlier seasons.
  getSeasons(reportType?: ReportType, teamId?: string, startFrom?: number): Observable<Season[]>

  // Fetch all-time regular season leaderboard; cache key: leaderboard-regular
  getLeaderboardRegular(): Observable<RegularLeaderboardEntry[]>

  // Fetch all-time playoffs leaderboard; cache key: leaderboard-playoffs
  getLeaderboardPlayoffs(): Observable<PlayoffLeaderboardEntry[]>
}
```

**Configuration**:
```typescript
import { environment } from '../../environments/environment';

private readonly API_URL = environment.apiUrl;
```

**Error Handling**:
- Catches HTTP errors
- Logs to console
- Returns observables with error states
- During server prerendering, skips live backend requests immediately and lets route-level callers fall back to their existing loading/error UI

**Usage Example**:
```typescript
export class MyComponent {
  private apiService = inject(ApiService);

  loadData(): void {
    this.apiService.getPlayerData({ reportType: 'regular', season: undefined })
      .subscribe({
        next: (data) => console.log(data),
        error: (err) => console.error('API Error:', err)
      });
  }
}
```

---

### SeoService
**Location**: `src/app/services/seo.service.ts`

**Purpose**: Keep browser metadata aligned with the active route for basic SEO and share previews

**Responsibilities**:
- Build page titles from the existing translated section/tab labels defined in route metadata
- Keep `<title>`, canonical URL, and Open Graph/Twitter tags in sync after navigation
- Reapply metadata when the active UI language changes
- Reuse a shared default social image from `public/icons/`

**Notes**:
- The root route uses only the site title (`FFHL tilastopalvelu`)
- Other public routes use the format `FFHL tilastopalvelu | SectionName | TabName`
- The service updates browser metadata after Angular boots; `src/index.html` still provides the default non-JavaScript fallback metadata for crawlers

### ServerTranslateLoader
**Location**: `src/app/services/server-translate.loader.ts`

**Purpose**: Provide bundled translations during server prerendering without making HTTP requests for `public/i18n/*.json`

**Responsibilities**:
- Return the existing Finnish translation object for prerendered routes
- Keep route titles and meta tags available in prerendered HTML even when the server build has no asset HTTP layer
- Fall back to Finnish for unknown languages until more server-side language bundles are added

**Key Inputs**:
```typescript
type RouteSeoData = {
  sectionKey?: string;
  tabKey?: string;
};
```

---

### StatsService
**Location**: `src/app/services/stats.service.ts`

**Purpose**: Compute per-game statistics from already-fetched data

**Responsibilities**:
- Convert totals to per-game averages (while preserving fixed fields)
- Keep formatting consistent (2 decimals)
- In per-game mode, uses `scoreAdjustedByGames` as the per-game `score`

**Key Methods**:
```typescript
class StatsService {
  getPlayerStatsPerGame(data: Player[]): Player[];
  getGoalieStatsPerGame(data: Goalie[]): Goalie[];
}
```

---

### FilterService
**Location**: `src/app/services/filter.service.ts`

**Purpose**: Reactive UI filter state for player/goalie pages

**Responsibilities**:
- Maintain independent filter state for players and goalies
- Expose filter state as both signals and observables for components
- Keep `season` and `reportType` in sync globally between players and goalies
- Provide reset helpers (including a global reset)

**Persistence**:
- Injects `SettingsService` to seed initial `season` and `reportType` from persisted settings on startup
- Persists `season` and `reportType` back to `SettingsService` on every global filter change (these two fields are global — shared between player and goalie contexts)
- Non-global fields (`statsPerGame`, `minGames`, `positionFilter`) are never persisted

**Type Definitions**:
```typescript
export type PositionFilter = 'all' | 'F' | 'D';

export interface FilterState {
  reportType: ReportType;
  season?: number;
  statsPerGame: boolean;
  minGames: number;
  positionFilter: PositionFilter;  // Filter by player position (players only)
}
```

**Key Methods**:
```typescript
class FilterService {
  playerFilters$: Observable<FilterState>;
  goalieFilters$: Observable<FilterState>;
  playerFiltersSignal: Signal<FilterState>;
  goalieFiltersSignal: Signal<FilterState>;

  updatePlayerFilters(change: Partial<FilterState>): void;
  updateGoalieFilters(change: Partial<FilterState>): void;

  resetPlayerFilters(): void;
  resetGoalieFilters(): void;
  resetAll(): void;
}
```

**Position Filter Behavior**:
- `positionFilter` defaults to `'all'` (show all players)
- When set to `'F'` (forwards) or `'D'` (defensemen):
  - Stats table filters to show only players of that position
  - Score columns display position-relative values (`scoreByPosition`, `scoreByPositionAdjustedByGames`)
  - Player card radar charts use `scoresByPosition` for position-relative comparisons
- Position filter is reset to `'all'` when `resetPlayerFilters()` is called

---

### CacheService
**Location**: `src/app/services/cache.service.ts`

**Purpose**: In-memory caching for API responses

**Responsibilities**:
- Cache API responses
- Manage cache expiration
- Clear cache when needed
- Reduce redundant API calls

**Key Methods**:
```typescript
class CacheService {
  // Get cached data
  get<T>(key: string): T | null

  // Set cache data with optional TTL
  set<T>(key: string, data: T, ttlMs?: number): void

  // Check if cache has data
  has(key: string): boolean

  // Clear specific cache entry
  clear(key: string): void

  // Clear all cache
  clearAll(): void
}
```

**Cache Strategy**:
- Time-based expiration (TTL only)
- No LRU or size-based eviction (current implementation is a simple `Map`)
- Cache keys are chosen by the caller (primarily `ApiService`)

**Cache Keys (current conventions)**:

```text
teams
seasons-regular
seasons-playoffs
seasons-regular-team-<teamId>
playerStats-regular-combined
playerStats-regular-<season>
goalieStats-playoffs-combined
goalieStats-playoffs-<season>

# Many keys have an optional suffix when a non-default team is selected:
# ...-team-<teamId>
```

**Default TTL**: 5 minutes (300,000 ms)

**Usage Example**:
```typescript
export class ApiService {
  private cache = inject(CacheService);

  getPlayerStats(season: string): Observable<PlayerStats[]> {
    const cacheKey = `stats:player:${season}`;

    // Check cache first
    const cached = this.cache.get<PlayerStats[]>(cacheKey);
    if (cached) {
      return of(cached);
    }

    // Fetch from API and cache
    return this.http.get<PlayerStats[]>(`/api/players/${season}`).pipe(
      tap(data => this.cache.set(cacheKey, data, 300))
    );
  }
}
```

### ComparisonService
**Location**: `src/app/services/comparison.service.ts`

**Purpose**: Manage player/goalie selection state for the comparison feature

**Responsibilities**:
- Track up to 2 selected players or goalies for comparison
- Expose selection state as observables
- Auto-clear selection when team, season, report type, or stats-per-game filter changes
- Provide toggle/clear helpers

**Key API**:
```typescript
class ComparisonService {
  readonly selected$: Observable<(Player | Goalie)[]>;
  readonly count$: Observable<number>;

  toggle(item: Player | Goalie): void;  // Add or remove from selection (max 2)
  clear(): void;                         // Reset selection to empty
  isSelected(item: Player | Goalie): boolean;
}
```

**Auto-Clear Triggers**:
- `TeamService.selectedTeamId$` changes
- `FilterService.playerFilters$` or `goalieFilters$` changes (season, reportType, statsPerGame)

This ensures stale selections don't persist across different data views.

---

## Service Interaction Patterns

### Practical Data Flow (as implemented)

```
FilterService (UI filter state) ─┐
TeamService (team state)        ├─> Feature page (PlayerStats/GoalieStats)
ApiService (HTTP + cache) ──────┘           │
StatsService (per-game transform) ──────────┤
ComparisonService (2-player selection) ─────┤
                      └─> StatsTable (search/sort/keyboard + Player Card)
                                            └─> ComparisonBar → ComparisonDialog
```

### Example: Fetching and Displaying Stats

```typescript
// 1. Component requests data
export class PlayerStatsComponent {
  private statsService = inject(StatsService);
  private filterService = inject(FilterService);

  // 2. StatsService coordinates the request
  stats$ = this.statsService.getProcessedPlayerStats('2023-2024');

  // 3. Apply filters
  filteredStats$ = combineLatest([
    this.stats$,
    this.filterService.minGames$
  ]).pipe(
    map(([stats, minGames]) =>
      this.filterService.filterByMinGames(stats, minGames)
    )
  );
}

// StatsService implementation
export class StatsService {
  private apiService = inject(ApiService);

  getProcessedPlayerStats(season: string): Observable<ProcessedPlayerStats[]> {
    // ApiService handles HTTP and caching
    return this.apiService.getPlayerStats(season).pipe(
      map(stats => this.processStats(stats))
    );
  }
}

// ApiService implementation
export class ApiService {
  private http = inject(HttpClient);
  private cache = inject(CacheService);

  getPlayerStats(season: string): Observable<PlayerStats[]> {
    const cacheKey = `player:${season}`;
    const cached = this.cache.get<PlayerStats[]>(cacheKey);

    if (cached) return of(cached);

    return this.http.get<PlayerStats[]>(`/api/players/${season}`).pipe(
      tap(data => this.cache.set(cacheKey, data))
    );
  }
}
```

## Service Testing

Services are tested through component behavior tests using Testing Library. For UI tests, mock only approved external boundaries such as `ApiService`:

```typescript
import { render, screen } from '@testing-library/angular';

// Mock the service at the boundary
const mockApiService = {
  getPlayerData: () => of(mockPlayers),
  getSeasons: () => of(mockSeasons),
};

await render(MyComponent, {
  providers: [
    { provide: ApiService, useValue: mockApiService },
  ],
});

// Assert on user-visible behavior
expect(screen.getByText('Player 1')).toBeInTheDocument();
```

## Best Practices

1. **Separation of Concerns**
   - ApiService: HTTP only
   - StatsService: Business logic only
   - FilterService: Data manipulation only
   - CacheService: Caching only

2. **Observable Patterns**
   - Use shareReplay for shared data streams
   - Use BehaviorSubject for state management
   - Always unsubscribe or use async pipe

3. **Error Handling**
   - Handle errors at service level
   - Provide meaningful error messages
   - Log errors appropriately

4. **Type Safety**
   - Define interfaces for all data structures
   - Type all service methods
   - Use generics where appropriate

5. **Caching Strategy**
   - Cache GET requests only
   - Set appropriate TTLs
   - Clear cache on mutations
   - Handle cache invalidation
