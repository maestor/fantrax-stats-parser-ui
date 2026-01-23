# Component Guide

## Component Overview

This application uses Angular's standalone component architecture. Components are organized into base, feature, and shared directories.

## Base Components

### NavigationComponent

**Location**: `src/app/base/navigation/`

**Purpose**: Main navigation with tabs for Players and Goalies views

**Key Features**:

- Material tabs for navigation
- Active route highlighting
- Responsive layout

**Usage**:

```html
<app-navigation></app-navigation>
```

**Inputs/Outputs**: None (uses router for navigation)

---

### FooterComponent

**Location**: `src/app/base/footer/`

**Purpose**: Application footer with links and information

**Key Features**:

- Static footer content
- External links
- Copyright/license info

**Usage**:

```html
<app-footer></app-footer>
```

## Feature Components

### PlayerStatsComponent

**Location**: `src/app/player-stats/`

**Type**: Smart Component (Container)

**Purpose**: Main view for player statistics

**Responsibilities**:

- Fetch player data from API
- Manage player filter state
- Pass data to child components

**Key Dependencies**:

- `ApiService` - Data fetching (team-aware via `teamId`)
- `TeamService` - Selected team state (refetch trigger)
- `FilterService` - Filter state
- `StatsService` - Per-game calculations

**Child Components**:

- `SettingsPanelComponent` - Per-page settings (filters)
- `StatsTableComponent` - Data table display

**Data Flow**:

```
API → ApiService → PlayerStatsComponent → StatsTableComponent
          ↓
  SettingsPanelComponent

TeamService → PlayerStatsComponent (triggers refetch + adds teamId)
```

---

### GoalieStatsComponent

**Location**: `src/app/goalie-stats/`

**Type**: Smart Component (Container)

**Purpose**: Main view for goalie statistics

**Responsibilities**:

- Fetch goalie data from API
- Manage goalie filter state
- Pass data to child components

**Key Dependencies**:

- `ApiService` - Data fetching (team-aware via `teamId`)
- `TeamService` - Selected team state (refetch trigger)
- `FilterService` - Filter state
- `StatsService` - Per-game calculations

**Similar structure to PlayerStatsComponent but for goalies**

## Shared Components

### TeamSwitcherComponent

**Location**: `src/app/shared/top-controls/team-switcher/`

**Type**: Presentational Component (with lightweight side effects)

**Purpose**: Team selector UI shown under the app header

**Behavior**:
- Loads available teams from the backend (`ApiService.getTeams()`)
- Disables the selector while loading (and on error)
- On team change: updates `TeamService`, resets filters, and navigates back to the players route

### StatsTableComponent

**Location**: `src/app/shared/stats-table/`

**Type**: Presentational Component (Dumb)

**Purpose**: Reusable data table for displaying player/goalie statistics with search, sorting and Player Card integration.

**Inputs**:

```typescript
@Input() data: any[] = [];
@Input() columns: string[] = [];
@Input() defaultSortColumn = 'score';
@Input() loading = false;
```

**Outputs**: None — row clicks open `PlayerCardComponent` directly via `MatDialog`.

**Features**:

- Angular Material table (`MatTableDataSource`) with `MatSort`-backed sorting (defaulting to the `score` column)
- Search box that filters rows via `filterItems()`
- Column configuration driven by `columns` and shared definitions in `table-columns.ts`
- Static `position` column that auto-numbers rows
- Compact stat headers from `tableColumnShort.*` with tooltips using full labels from `tableColumn.*`
- Center-aligned numeric/stat headers and cells, with the name column left-aligned for readability
- Responsive layout with horizontal scrolling on narrow viewports

**Usage**:

```html
<app-stats-table [data]="tableData" [columns]="tableColumns"></app-stats-table>
```

---

### SettingsPanelComponent

**Location**: `src/app/shared/settings-panel/`

**Type**: Presentational Component

**Purpose**: Expandable settings container for the current context (players or goalies).

**Child Components**:

- StatsModeToggleComponent
- MinGamesSliderComponent

**Inputs**:

```typescript
@Input() context: 'player' | 'goalie' = 'player';
@Input() maxGames = 0;
```

**Outputs**: None — each child component talks directly to `FilterService`.

**Layout**: Horizontal, responsive layout defined in `settings-panel.component.scss`.

**Mobile Responsiveness**:

- **Desktop (>960px)**: All controls displayed horizontally in a single row
- **Tablet (768px-960px)**: Controls wrap to 2 columns with optimized spacing
- **Mobile (<768px)**: Collapsible panel with toggle button
  - Toggle button shows/hides filter controls
  - Controls stack vertically when expanded
  - Smooth expand/collapse animation
  - Panel is expanded by default on page load
- **Small Mobile (<480px)**: Full-width controls with reduced padding

**State Management**:

```typescript
isExpanded = true; // Controls panel visibility on mobile

toggleExpanded(): void {
  this.isExpanded = !this.isExpanded;
}
```

---

### SeasonSwitcherComponent

**Location**: `src/app/shared/top-controls/season-switcher/`

**Type**: Presentational Component

**Purpose**: Dropdown/select for choosing the season, wired to `FilterService`.

**Inputs**:

```typescript
@Input() context: 'player' | 'goalie' = 'player';
```

**Behavior**:

- Loads seasons from `ApiService`
- Displays seasons in reverse order (newest first)
- Updates the appropriate filter stream in `FilterService` when the selection changes

---

### ReportSwitcherComponent

**Location**: `src/app/shared/top-controls/report-switcher/`

**Purpose**: Toggle between regular season and playoffs for the current context.

**Inputs**:

```typescript
@Input() context: 'player' | 'goalie' = 'player';
```

**Behavior**:

- Uses `MatButtonToggle` to let the user pick `regular` vs `playoffs`
- Subscribes to `FilterService` (`playerFilters$`/`goalieFilters$`) to expose `reportType$`
- Calls `updatePlayerFilters` / `updateGoalieFilters` when the toggle changes

---

### StatsModeToggleComponent

**Location**: `src/app/shared/settings-panel/stats-mode-toggle/`

**Purpose**: Toggle between combined stats and per-game stats.

**Inputs**:

```typescript
@Input() context: 'player' | 'goalie' = 'player';
```

**Behavior**:

- Uses a `MatSlideToggle` to manipulate the `statsPerGame` flag in `FilterService`
- Keeps its visual state in sync with the current filter state for the given context

---

### MinGamesSliderComponent

**Location**: `src/app/shared/settings-panel/min-games-slider/`

**Purpose**: Slider to filter by minimum games played.

**Inputs**:

```typescript
@Input() context: 'player' | 'goalie' = 'player';
@Input() maxGames = 0;
```

**Behavior**:

- Uses `MatSlider` to choose `minGames`
- Constrains the slider range based on `maxGames`
- Pushes changes into `FilterService` for the active context

---

### PlayerCardComponent

**Location**: `src/app/shared/player-card/`

**Type**: Dialog Component

**Purpose**: Display individual player/goalie information with comprehensive statistics

**Data Input**: Injected via `MAT_DIALOG_DATA`

```typescript
data: Player | Goalie;
```

**Key Features**:

- **Tab Navigation**: Switches between "All" (combined stats), "By Season" (season breakdown) and "Graphs" (trend lines)
- **Dynamic Width**: Auto-adjusts dialog width based on active tab (wider for season table and graphs)
- **Season Sorting**: Displays seasons from newest to oldest (e.g., 2025-26, 2024-25)
- **Season Formatting**: All season displays use "YYYY-YY" format (e.g., "2025-26")
- **Sticky Headers**: Table headers remain visible while scrolling through seasons
- **Responsive Design**: Adapts to mobile and desktop viewports with optimized layouts
- **Intelligent Column Ordering**: Automatically reorders columns for optimal readability
- **Mobile-Optimized Controls**: Collapsible graph controls on mobile devices

**Tabs**:

1. **All (Kaikki)**: Shows combined career statistics in vertical format (360px-800px wide)
2. **By Season (Kausittain)**: Shows season-by-season breakdown in horizontal table (auto-width, max 95vw)
3. **Graphs (Graafit)**: Shows a multi-series line chart of per-season stats with toggles

**Column Ordering Logic**:

For **Player Stats**, columns appear in natural order:

- score, season, games, goals, assists, points, plusMinus, penalties, shots, ppp, shp, hits, blocks

For **Goalie Stats**, columns are intelligently reordered:

- season, games, wins, saves, **savePercent**, **gaa**, shutouts, goals, assists, points, penalties, ppp, shp
- Note: `savePercent` and `gaa` are positioned after `saves` for better context

**Season Display**:

- When viewing individual season data (single season selected), the season field:
  - Appears at the top of the stats list
  - Is formatted as "YYYY-YY" (e.g., "2025-26" instead of "2025")
- When viewing combined data with season breakdown tab:
  - Seasons are sorted newest to oldest
  - Each season displays in "YYYY-YY" format

**Implementation Details**:

- Uses Material Dialog service with custom panel class
- Tracks active tab index to toggle `season-mode` class for dynamic width
- `formatSeasonDisplay()` method converts year to "YYYY-YY" format
- `reorderStatsForDisplay()` method handles:
  - Moving season to top of list (when present)
  - Ensuring `score` is treated as a regular stat key alongside the other per-player metrics
  - Reordering goalie-specific columns (`savePercent`, `gaa`) so they appear immediately after `saves`
- `setupSeasonData()` method handles season breakdown table column ordering
- `setupChartData()` + `updateChartData()` build the graphs tab line chart using `ng2-charts` + `chart.js`
  - X-axis labels use compact `YY-YY` season format (e.g. `12-13`)
  - X-axis includes empty years between first and last season (gaps rendered as breaks in the lines)
  - Y-axis always starts at 0 and rounds the upper bound to a clean step (5 ticks)
- Graph stat toggles:
  - Players: score, scoreAdjustedByGames (default on), plus games, goals, assists, points, shots, penalties, hits, blocks (toggled on as needed)
  - Goalies: score, scoreAdjustedByGames (default on), plus games, wins, saves, shutouts (toggled on as needed)
- Custom scrollbar styling for season table
- Vertical scrolling with sticky headers (position: sticky, z-index: 10)
- Mobile-responsive layouts with collapsible controls

**Mobile Responsiveness**:

- **Desktop (>960px)**: Full-width card (360px-800px), all controls visible
- **Tablet (768px-960px)**: Optimized spacing and table height (85vh - 200px)
- **Mobile (<768px)**:
  - Full-width card (100vw)
  - Collapsible graph controls with toggle button
  - Reduced font sizes (12px for tables)
  - Optimized table height (80vh - 200px)
  - Horizontal scrolling enabled for wide tables
- **Small Mobile (<480px)**:
  - Further reduced font sizes (11px for tables)
  - Minimal padding (6px 2px)
  - Compact chart height (280px)
  - Smaller icons and titles

**Graph Controls State Management**:

```typescript
graphControlsExpanded = true; // Controls visibility on mobile

toggleGraphControls(): void {
  this.graphControlsExpanded = !this.graphControlsExpanded;
}
```

**Scrolling Behavior**:

- **All Stats Tab**: Vertical scrolling with max-height constraints
- **By Season Tab**: Both vertical and horizontal scrolling enabled
- **Graphs Tab**: Chart scales to available space, controls collapse on mobile

**Usage**:

```typescript
// In stats-table.component.ts
this.dialog.open(PlayerCardComponent, {
  data: playerOrGoalieData,
  maxWidth: "95vw",
  width: "auto",
  panelClass: "player-card-dialog",
});
```

**Conditional Rendering**:

- If `data.seasons` exists: Shows tab navigation with "All", "By Season" and "Graphs" tabs
- If no seasons data: Shows simple vertical stats list (individual season view)

---

### HelpDialogComponent

**Location**: `src/app/shared/help-dialog/`

**Type**: Dialog Component

**Purpose**: Show short instructions for what the application does and how to use it (localized, Finnish-first).

**How it's opened**:

- From the app shell title row in `AppComponent` (info icon next to the title)
- Keyboard shortcut: `?` (also supports `Shift + /` on layouts where that is how `?` is produced)

**Content model (flexible order)**:

- Content is defined in i18n JSON as an ordered list of blocks under `helpDialog`.
- Blocks are rendered in sequence, so you can freely reorder subtitles, paragraphs and lists by editing `public/i18n/fi.json`.

Supported block types:

- `h2` (subtitle)
- `h3` (sub-subtitle)
- `p` (paragraph)
- `ul` (bullet list)

**Accessibility**:

- The info icon button is icon-only and must have `aria-label`.
- The dialog provides a close button and keeps interactions keyboard-first.

## Component Communication Patterns

### Parent to Child (Input)

```typescript
// Parent
<app-child [data]="parentData"></app-child>

// Child
@Input() data: any;
```

### Child to Parent (Output)

```typescript
// Child
@Output() valueChange = new EventEmitter<string>();

onValueChange(value: string) {
  this.valueChange.emit(value);
}

// Parent
<app-child (valueChange)="onChildValueChange($event)"></app-child>

onChildValueChange(value: string) {
  // Handle the change
}
```

### Service-based Communication

```typescript
// Component A
this.sharedService.updateValue(newValue);

// Component B
this.sharedService.value$.subscribe((value) => {
  // React to changes
});
```

## Component Lifecycle

Common hooks used in this project:

1. **ngOnInit**: Component initialization, data fetching
2. **ngOnDestroy**: Cleanup, unsubscribe observables
3. **ngOnChanges**: React to input changes (for presentational components)

```typescript
export class MyComponent implements OnInit, OnDestroy, OnChanges {
  ngOnChanges(changes: SimpleChanges): void {
    if (changes["data"]) {
      // React to data input changes
    }
  }

  ngOnInit(): void {
    // Initialize component, fetch data
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
  }
}
```

## Styling Approach

Each component has its own SCSS file:

- Component-scoped styles (Angular's view encapsulation)
- Use Material theme variables
- Responsive breakpoints using Angular CDK

```scss
// component.scss
:host {
  display: block;
  padding: 16px;

  @media (max-width: 768px) {
    padding: 8px;
  }
}

.stats-container {
  display: flex;
  gap: 16px;
}
```

## Testing Components

Basic component test structure:

```typescript
describe("ComponentName", () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentName /* dependencies */],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render title", () => {
    component.title = "Test Title";
    fixture.detectChanges();
    const element = fixture.nativeElement;
    expect(element.querySelector("h1").textContent).toContain("Test Title");
  });
});
```
