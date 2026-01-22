# Service Guide

## Service Overview

Services in this application handle data fetching, business logic, state management, and caching. All services are provided at the root level as singletons.

## Core Services

### TeamService
**Location**: `src/app/services/team.service.ts`

**Purpose**: Global selected-team state with persistence

**Responsibilities**:
- Provide current team id as an observable (`selectedTeamId$`)
- Persist selection to `localStorage` (`fantrax.selectedTeamId`)
- Default to Colorado (team id `"1"`) — there is no "no team" state

**Key API**:
```typescript
class TeamService {
  readonly selectedTeamId$: Observable<string>;
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
- Define data type interfaces

**Type Definitions**:
```typescript
export type ReportType = 'regular' | 'playoffs';

export type Team = {
  id: string;
  name: string;
};

// Season selector type
export type Season = {
  season: number;
  text: string;
};

// Player season-specific stats
export type PlayerSeasonStats = {
  season: number;
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

// Combined player stats with optional seasons array
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
  seasons?: PlayerSeasonStats[]; // Optional season breakdown
};

// Goalie season-specific stats
export type GoalieSeasonStats = {
  season: number;
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

// Combined goalie stats with optional seasons array
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
  seasons?: GoalieSeasonStats[]; // Optional season breakdown
};

// API request parameters
export type ApiParams = {
  reportType?: ReportType;
  season?: number;
  teamId?: string;
};
```

**Key Methods**:
```typescript
class ApiService {
  // Fetch available teams
  getTeams(): Observable<Team[]>;

  // Fetch player statistics
  getPlayerData(params: ApiParams): Observable<Player[]>

  // Fetch goalie statistics
  getGoalieData(params: ApiParams): Observable<Goalie[]>

  // Fetch available seasons for a given report type (regular/playoffs)
  getSeasons(reportType?: ReportType, teamId?: string): Observable<Season[]>
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

### StatsService
**Location**: `src/app/services/stats.service.ts`

**Purpose**: Compute per-game statistics from already-fetched data

**Responsibilities**:
- Convert totals to per-game averages (while preserving fixed fields)
- Keep formatting consistent (2 decimals)

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
- Expose filter state as observables for components
- Provide reset helpers (including a global reset)

**Key Methods**:
```typescript
class FilterService {
  playerFilters$: Observable<FilterState>;
  goalieFilters$: Observable<FilterState>;

  updatePlayerFilters(change: Partial<FilterState>): void;
  updateGoalieFilters(change: Partial<FilterState>): void;

  resetPlayerFilters(): void;
  resetGoalieFilters(): void;
  resetAll(): void;
}
```

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
  set<T>(key: string, data: T, ttlSeconds?: number): void

  // Check if cache has data
  has(key: string): boolean

  // Clear specific cache entry
  clear(key: string): void

  // Clear all cache
  clearAll(): void
}
```

**Cache Strategy**:
- Time-based expiration (TTL)
- LRU (Least Recently Used) eviction
- Cache size limits
- Cache keys based on request parameters

**Cache Keys**:
```typescript
// Format: 'service:method:params'
'stats:player:2023-2024:regular'
'stats:goalie:2023-2024:playoffs'
'api:seasons'
```

**Default TTL**: 5 minutes (300 seconds)

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

## Service Interaction Patterns

### Layered Architecture

```
Component Layer
      ↓
  StatsService (Business Logic)
      ↓
  ApiService (HTTP) → CacheService
      ↓
  FilterService (Data Processing)
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

### Testing ApiService

```typescript
describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch player stats', () => {
    const mockData = [{ name: 'Player 1', goals: 10 }];

    service.getPlayerStats('2023-2024').subscribe(data => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne('/api/players/2023-2024');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  afterEach(() => {
    httpMock.verify();
  });
});
```

### Testing StatsService

```typescript
describe('StatsService', () => {
  let service: StatsService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getPlayerStats']);

    TestBed.configureTestingModule({
      providers: [
        StatsService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(StatsService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should process player stats', () => {
    const mockRawStats = [{ name: 'Player', goals: 10, assists: 5 }];
    apiService.getPlayerStats.and.returnValue(of(mockRawStats));

    service.getProcessedPlayerStats('2023-2024').subscribe(stats => {
      expect(stats[0].points).toBe(15); // goals + assists
    });
  });
});
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
