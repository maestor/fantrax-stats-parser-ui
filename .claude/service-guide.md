# Service Guide

## Service Overview

Services in this application handle data fetching, business logic, state management, and caching. All services are provided at the root level as singletons.

## Core Services

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
  reportType?: 'regular' | 'playoffs';
  season?: number;
};
```

**Key Methods**:
```typescript
class ApiService {
  // Fetch player statistics
  getPlayerData(params: ApiParams): Observable<Player[]>

  // Fetch goalie statistics
  getGoalieData(params: ApiParams): Observable<Goalie[]>

  // Fetch available seasons
  getSeasons(): Observable<Season[]>
}
```

**Configuration**:
```typescript
private readonly API_BASE_URL = 'http://localhost:3000/api';
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
    this.apiService.getPlayerStats('2023-2024')
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

**Purpose**: Business logic layer for statistics data

**Responsibilities**:
- Transform raw API data
- Calculate derived statistics
- Combine and format data
- Manage stats-related state

**Key Methods**:
```typescript
class StatsService {
  // Get processed player statistics
  getProcessedPlayerStats(season: string): Observable<ProcessedPlayerStats[]>

  // Get processed goalie statistics
  getProcessedGoalieStats(season: string): Observable<ProcessedGoalieStats[]>

  // Calculate additional metrics
  calculateAdvancedStats(stats: PlayerStats): EnhancedStats

  // Combine regular season and playoff stats
  combineSeasonStats(regular: Stats[], playoffs: Stats[]): CombinedStats[]
}
```

**Data Transformations**:
- Points calculation (goals + assists)
- Plus/minus adjustments
- Percentage calculations (shooting %, save %)
- Per-game averages
- Totals across multiple seasons

**Caching Strategy**:
- Works with CacheService for data caching
- Implements shareReplay for observable sharing

**Usage Example**:
```typescript
export class PlayerStatsComponent {
  private statsService = inject(StatsService);

  stats$ = this.statsService.getProcessedPlayerStats('2023-2024')
    .pipe(
      map(stats => this.filterStats(stats)),
      catchError(err => this.handleError(err))
    );
}
```

---

### FilterService
**Location**: `src/app/services/filter.service.ts`

**Purpose**: Data filtering and table operations

**Responsibilities**:
- Filter stats by various criteria
- Sort table data
- Search/filter by player name
- Apply minimum games filter
- Manage filter state

**Key Methods**:
```typescript
class FilterService {
  // Filter by minimum games played
  filterByMinGames(stats: Stats[], minGames: number): Stats[]

  // Filter by player name (search)
  filterByName(stats: Stats[], searchTerm: string): Stats[]

  // Filter by position
  filterByPosition(stats: Stats[], position: string): Stats[]

  // Sort statistics
  sortStats(stats: Stats[], sortBy: string, direction: 'asc' | 'desc'): Stats[]

  // Apply multiple filters
  applyFilters(stats: Stats[], filters: FilterConfig): Stats[]
}
```

**Filter Configuration**:
```typescript
interface FilterConfig {
  minGames?: number;
  searchTerm?: string;
  position?: string;
  season?: string;
  reportType?: 'regular' | 'playoffs';
}
```

**State Management**:
- Maintains current filter settings
- Exposes filter state as observables
- Updates filters reactively

**Usage Example**:
```typescript
export class StatsTableComponent {
  private filterService = inject(FilterService);

  filteredStats$ = combineLatest([
    this.stats$,
    this.filterService.filterConfig$
  ]).pipe(
    map(([stats, config]) => this.filterService.applyFilters(stats, config))
  );
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
