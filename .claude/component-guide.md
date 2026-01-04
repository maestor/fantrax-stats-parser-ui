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
- `StatsService` - Data fetching
- `FilterService` - Data filtering
- `CacheService` - Response caching

**Child Components**:
- `ControlPanelComponent` - Filters and controls
- `StatsTableComponent` - Data table display

**Data Flow**:
```
API → StatsService → PlayerStatsComponent → StatsTableComponent
                            ↓
                      ControlPanelComponent
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
- `StatsService` - Data fetching
- `FilterService` - Data filtering
- `CacheService` - Response caching

**Similar structure to PlayerStatsComponent but for goalies**

## Shared Components

### StatsTableComponent
**Location**: `src/app/shared/stats-table/`

**Type**: Presentational Component (Dumb)

**Purpose**: Reusable data table for displaying statistics

**Inputs**:
```typescript
@Input() data: PlayerStats[] | GoalieStats[] = [];
@Input() columns: TableColumn[] = [];
@Input() displayedColumns: string[] = [];
```

**Outputs**:
```typescript
@Output() rowClick = new EventEmitter<any>();
@Output() sortChange = new EventEmitter<Sort>();
```

**Features**:
- Material table with sorting
- Pagination
- Column configuration
- Responsive design
- Custom cell templates

**Usage**:
```html
<app-stats-table
  [data]="stats"
  [columns]="tableColumns"
  [displayedColumns]="displayedCols"
  (rowClick)="onRowClick($event)"
  (sortChange)="onSortChange($event)">
</app-stats-table>
```

---

### ControlPanelComponent
**Location**: `src/app/shared/control-panel/`

**Type**: Presentational Component

**Purpose**: Container for all filter controls

**Child Components**:
- SeasonSwitcherComponent
- ReportSwitcherComponent
- StatsModeToggleComponent
- MinGamesSliderComponent

**Inputs**:
```typescript
@Input() seasons: string[] = [];
@Input() currentSeason: string = '';
@Input() reportType: 'regular' | 'playoffs' = 'regular';
@Input() statsMode: 'combined' | 'separate' = 'combined';
@Input() minGames: number = 0;
@Input() maxGames: number = 82;
```

**Outputs**:
```typescript
@Output() seasonChange = new EventEmitter<string>();
@Output() reportChange = new EventEmitter<'regular' | 'playoffs'>();
@Output() modeChange = new EventEmitter<'combined' | 'separate'>();
@Output() minGamesChange = new EventEmitter<number>();
```

**Layout**: Horizontal layout with responsive breakpoints

---

### SeasonSwitcherComponent
**Location**: `src/app/shared/control-panel/season-switcher/`

**Purpose**: Dropdown for selecting seasons

**Inputs**:
```typescript
@Input() seasons: string[] = [];
@Input() selected: string = '';
```

**Outputs**:
```typescript
@Output() selectionChange = new EventEmitter<string>();
```

**Uses**: Material Select component

---

### ReportSwitcherComponent
**Location**: `src/app/shared/control-panel/report-switcher/`

**Purpose**: Toggle between regular season and playoffs

**Inputs**:
```typescript
@Input() reportType: 'regular' | 'playoffs' = 'regular';
```

**Outputs**:
```typescript
@Output() typeChange = new EventEmitter<'regular' | 'playoffs'>();
```

**Uses**: Material Button Toggle

---

### StatsModeToggleComponent
**Location**: `src/app/shared/control-panel/stats-mode-toggle/`

**Purpose**: Toggle between combined and separate stats views

**Inputs**:
```typescript
@Input() mode: 'combined' | 'separate' = 'combined';
```

**Outputs**:
```typescript
@Output() modeChange = new EventEmitter<'combined' | 'separate'>();
```

**Uses**: Material Slide Toggle

---

### MinGamesSliderComponent
**Location**: `src/app/shared/control-panel/min-games-slider/`

**Purpose**: Slider to filter by minimum games played

**Inputs**:
```typescript
@Input() minGames: number = 0;
@Input() maxGames: number = 82;
@Input() value: number = 0;
```

**Outputs**:
```typescript
@Output() valueChange = new EventEmitter<number>();
```

**Features**:
- Material slider
- Dynamic range based on maxGames
- Real-time value display

---

### PlayerCardComponent
**Location**: `src/app/shared/player-card/`

**Type**: Presentational Component

**Purpose**: Display individual player information in a card format

**Inputs**:
```typescript
@Input() player: PlayerStats | GoalieStats;
@Input() cardType: 'player' | 'goalie' = 'player';
```

**Features**:
- Material card layout
- Player photo/avatar
- Key statistics display
- Responsive design

**Usage**:
```html
<app-player-card
  [player]="selectedPlayer"
  [cardType]="'player'">
</app-player-card>
```

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
this.sharedService.value$.subscribe(value => {
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
    if (changes['data']) {
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
describe('ComponentName', () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentName, /* dependencies */]
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    component.title = 'Test Title';
    fixture.detectChanges();
    const element = fixture.nativeElement;
    expect(element.querySelector('h1').textContent).toContain('Test Title');
  });
});
```
