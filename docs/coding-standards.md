# Coding Standards

## Angular Conventions

### Component Structure

Use standalone components (Angular 14+):

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-component-name',
  standalone: true,
  imports: [CommonModule, /* other imports */],
  templateUrl: './component-name.component.html',
  styleUrl: './component-name.component.scss'
})
export class ComponentNameComponent {
  // Component logic
}
```

### Dependency Injection

Use `inject()` function (Angular 14+):

```typescript
import { inject } from '@angular/core';
import { SomeService } from './some.service';

export class MyComponent {
  private someService = inject(SomeService);

  // Use the service
}
```

**Avoid** constructor-based injection unless necessary for inheritance.

### Lifecycle Hooks

Implement interfaces for lifecycle hooks:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

export class MyComponent implements OnInit, OnDestroy {
  ngOnInit(): void {
    // Initialization logic
  }

  ngOnDestroy(): void {
    // Cleanup logic
  }
}
```

## TypeScript Standards

### Type Safety

Always use explicit types:

```typescript
// Good
const count: number = 5;
const name: string = 'John';
const items: string[] = ['a', 'b'];

// Avoid
const count = 5;  // implicit any
```

### Interfaces and Types

Define interfaces for data structures:

```typescript
interface PlayerStats {
  name: string;
  goals: number;
  assists: number;
  points: number;
}

// Use readonly for immutable properties
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}
```

### Function Typing

Always type function parameters and return values:

```typescript
// Good
function calculatePoints(goals: number, assists: number): number {
  return goals + assists;
}

// Avoid
function calculatePoints(goals, assists) {
  return goals + assists;
}
```

## RxJS Best Practices

### Observable Subscriptions

Always unsubscribe to prevent memory leaks:

```typescript
import { Component, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.dataService.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        // Handle data
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Better**: Use async pipe in templates when possible:

```html
<!-- Template -->
<div *ngIf="data$ | async as data">
  {{ data.value }}
</div>
```

```typescript
// Component
export class MyComponent {
  data$ = this.dataService.getData();
}
```

### Observable Operators

Use appropriate operators:

```typescript
import { map, filter, catchError, shareReplay } from 'rxjs/operators';

this.data$ = this.apiService.getData().pipe(
  filter(data => data !== null),
  map(data => this.transform(data)),
  catchError(error => this.handleError(error)),
  shareReplay(1)  // Share result among multiple subscribers
);
```

## Component Best Practices

### Smart vs Dumb Components

**Smart Components** (Container):
- Fetch data from services
- Manage state
- Pass data to child components
- Located in feature directories

```typescript
// player-stats.component.ts
export class PlayerStatsComponent {
  private statsService = inject(StatsService);

  stats$ = this.statsService.getPlayerStats();
}
```

**Dumb Components** (Presentational):
- Receive data via @Input
- Emit events via @Output
- No service dependencies
- Located in shared directory

```typescript
// stats-table.component.ts
export class StatsTableComponent {
  @Input() data: PlayerStats[] = [];
  @Output() rowClick = new EventEmitter<PlayerStats>();
}
```

### Change Detection

Use OnPush when possible for better performance:

```typescript
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-stats-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class StatsTableComponent {
  // Component uses OnPush - only updates when inputs change
}
```

## Template Standards

### Naming Conventions

```html
<!-- Use camelCase for properties -->
<div [className]="activeClass"></div>

<!-- Use kebab-case for attributes -->
<app-custom-component custom-attribute="value"></app-custom-component>

<!-- Event handlers with 'on' prefix -->
<button (click)="onButtonClick()">Click</button>
```

### Structural Directives

```html
<!-- Prefer *ngIf with else -->
<div *ngIf="isLoading; else content">
  Loading...
</div>
<ng-template #content>
  <!-- Content -->
</ng-template>

<!-- Use trackBy for *ngFor -->
<div *ngFor="let item of items; trackBy: trackByFn">
  {{ item.name }}
</div>
```

### Async Pipe

Always use async pipe for observables in templates:

```html
<!-- Good -->
<div *ngIf="data$ | async as data">
  {{ data.value }}
</div>

<!-- Avoid manual subscription in component -->
```

## Service Standards

### Service Structure

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'  // Singleton service
})
export class DataService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getData(): Observable<Data[]> {
    return this.http.get<Data[]>(`${this.apiUrl}/data`);
  }
}
```

### Error Handling

Always handle errors in services:

```typescript
import { catchError, throwError } from 'rxjs';

getData(): Observable<Data[]> {
  return this.http.get<Data[]>(`${this.apiUrl}/data`).pipe(
    catchError(error => {
      console.error('Error fetching data:', error);
      return throwError(() => new Error('Failed to fetch data'));
    })
  );
}
```

## Testing Standards

### Component Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent]  // Standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Title');
  });
});
```

### Service Tests

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

## File Organization

### Imports Order

1. Angular core imports
2. Angular common imports
3. Third-party libraries
4. Application imports (services, components, etc.)

```typescript
// 1. Angular core
import { Component, OnInit, inject } from '@angular/core';

// 2. Angular common
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// 3. Third-party
import { TranslateModule } from '@ngx-translate/core';

// 4. Application
import { DataService } from '@app/services/data.service';
import { SharedComponent } from '@app/shared/shared.component';
```

## Naming Conventions

- **Components**: PascalCase, suffix with `Component`
- **Services**: PascalCase, suffix with `Service`
- **Interfaces**: PascalCase, no prefix
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case

```typescript
// Good
export class PlayerStatsComponent { }
export class ApiService { }
export interface PlayerStats { }
const playerName = 'John';
const MAX_RETRIES = 3;
```

## Comments and Documentation

### JSDoc for Public APIs

```typescript
/**
 * Fetches player statistics from the API
 * @param playerId - The unique identifier for the player
 * @param season - The season year (e.g., '2023-2024')
 * @returns Observable of player statistics
 */
getPlayerStats(playerId: string, season: string): Observable<PlayerStats> {
  // Implementation
}
```

### Inline Comments

Use sparingly, only for complex logic:

```typescript
// Calculate total points including bonus points for hat tricks
const totalPoints = goals + assists + (goals >= 3 ? 2 : 0);
```

## Code Formatting

- **Indentation**: 2 spaces (configured in .editorconfig)
- **Line length**: 100 characters max
- **Semicolons**: Always use
- **Quotes**: Single quotes for strings
- **Trailing commas**: Use in multiline arrays/objects
