# Coding Standards

## Angular Conventions

### Component Structure

Use Angular 21 standalone components. Standalone is the default, so do not add redundant `standalone: true`:

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-component-name',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, /* other imports */],
  host: {
    'class': 'component-name',
  },
  templateUrl: './component-name.component.html',
  styleUrl: './component-name.component.scss',
})
export class ComponentNameComponent {
  readonly title = input.required<string>();
}
```

Prefer signal inputs and outputs for new component APIs:

```typescript
import { input, output } from '@angular/core';

export class ExampleComponent {
  readonly context = input<'player' | 'goalie'>('player');
  readonly selected = output<string>();
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
- Receive data via signal inputs
- Emit events via signal outputs
- No service dependencies
- Located in shared directory

```typescript
// stats-table.component.ts
export class StatsTableComponent {
  readonly data = input<PlayerStats[]>([]);
  readonly rowClick = output<PlayerStats>();
}
```

### Change Detection

Use `OnPush` when the component already updates safely from signal inputs, `async`-pipe bindings, or local event-driven state. Do not add it blindly to subscription-heavy components that still depend on manual change detection:

```typescript
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-stats-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class StatsTableComponent {
  // Safe because updates flow through inputs or async-pipe bindings.
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
<!-- Prefer Angular's built-in control flow -->
@if (isLoading) {
  <div>Loading...</div>
} @else {
  <div>Content</div>
}

@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}
```

### Async Pipe

Always use async pipe for observables in templates:

```html
<!-- Good -->
<div *ngIf="data$ | async as data">
  {{ data.value }}
</div>

## Accessibility Standards

Accessibility is a required part of every feature and refactor.

### Keyboard

- Every interactive element must be operable via keyboard.
- Prefer native semantics (`<button>`, `<a>`, proper form controls).
- If you implement custom keyboard behavior (tables, lists, roving focus), include tests for key handlers.

### Focus

- Focus must always be visible.
- Avoid focus entering hidden/collapsed UI.
  - Use `inert` + `aria-hidden` for collapsed containers.

### Labels

- Inputs must have visible labels (`mat-label` / `<label>`).
- Icon-only buttons must have `aria-label`.

### ARIA

- Use ARIA to complement semantics, not replace them.
- Avoid conflicting roles/attributes.

For project-specific patterns (skip link, table navigation), see `docs/accessibility.md`.

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

All tests use **Testing Library** (`@testing-library/angular`) with **Vitest**.

**Key conventions:**

- **Accessible queries only**: Use `getByRole`, `getByText`, `getByLabelText` — never CSS selectors, class names, or `data-testid`
- **Translation keys as rendered text**: Use the translation key directly (e.g., `'myTitle'`) with `TranslateModule.forRoot()` instead of loading locale files
- **File naming**: `*.spec.ts`
- **Minimize renders**: Group all assertions for a given scenario into one test with one `render()` call. Use comments to separate logical groups. Do not create separate `it()` blocks that each re-render the same component state
- **Prefer full behavior paths for UI tests**: Render the real feature/shell flow for controls the user can see and interact with
- **Mock only approved external boundaries in UI tests**: `ApiService`, `ViewportService`, and `PwaUpdateService` are normal mock points; do not mock stateful UI services like `FilterService`, `SettingsService`, or `TeamService` just to isolate a control
- **Delete impossible-state branches**: If a branch cannot happen in any real usage path, remove it instead of keeping defensive context checks or dead fallback code
- **Simplify before adding tests**: For behavior-neutral refactors, prefer deleting unreachable logic over adding narrow tests whose only purpose is to preserve coverage for code the UI can never hit

```typescript
import { render, screen } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';

import { MyComponent } from './my.component';

describe('MyComponent', { timeout: 15_000 }, () => {
  it('renders the heading', async () => {
    await render(MyComponent, {
      imports: [TranslateModule.forRoot()],
    });

    expect(screen.getByRole('heading', { name: 'myTitle' })).toBeInTheDocument();
  });
});
```

### Simplify Impossible States

When the parent/template structure already guarantees a component is used only in one mode, encode that directly in the component API.

- Remove unused inputs that only describe impossible states
- Remove branches that only exist to defend against contexts the component can never receive
- Update the caller/template and docs to match the smaller API
- Then test the remaining real user behavior through the normal feature flow

Do not keep dead conditional logic only because it was easy to write or because coverage tools can still "see" it.

## File Organization

### No `.gitkeep` files

Do not add `.gitkeep` files to directories. If a directory has no tracked files, it does not need to exist in the repository yet — create it when real content is added.

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
