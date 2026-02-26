# Stats-Table Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Merge `leaderboard-table` into `stats-table` so a single generic table component covers all use cases — stats pages (clickable, search, comparison checkboxes) and leaderboard pages (read-only, no search, icon column headers, custom cell formatting).

**Architecture:** Introduce a `Column` interface replacing `string[]` everywhere. Extend `stats-table` with feature flags that default to the current interactive behavior. Migrate both leaderboard parents to `stats-table`. Delete `leaderboard-table`. Update docs.

**Tech Stack:** Angular 21, Angular Material 21, @ngx-translate, Jasmine/Karma, RxJS

---

## New `Column` type API (reference for all tasks)

```ts
// src/app/shared/column.types.ts
export interface ColumnIcon {
  name: string;              // '🏆' or Material icon name like 'star'
  type: 'emoji' | 'material';
}

export interface Column {
  field: string;
  icon?: ColumnIcon;
}
```

## New `stats-table` inputs (reference for all tasks)

Existing inputs that change type:
- `columns: Column[]` (was `string[]`) — does NOT include `'position'`; position column is separate

New inputs (all are opt-in, defaults preserve current behavior):
```ts
@Input() showSearch = true;
@Input() showPositionColumn = true;
@Input() positionValue?: (row: any, index: number) => string | number; // undefined = auto-increment
@Input() selectRow = false;
@Input() isRowSelected: (row: any) => boolean = () => false;
@Input() canSelectRow$: Observable<boolean> = of(true);
@Input() onRowSelect?: (row: any) => void;
@Input() clickable = true;
@Input() formatCell?: (column: string, value: any) => string;
```

ComparisonService is **removed** from stats-table. Player/goalie-stats inject it themselves and wire it up via `isRowSelected`, `canSelectRow$`, `onRowSelect`.

## Internal stats-table derived state (reference)

```ts
dynamicColumns: Column[] = [];      // columns input, no filter needed (position is separate)
displayedFields: string[] = [];     // ['position', ...dynamicColumns.map(c=>c.field)] or without 'position'
```

`displayedFields` is what goes into `*matHeaderRowDef` and `*matRowDef`.

---

## Task 1: Create `Column` type definitions

**Files:**
- Create: `src/app/shared/column.types.ts`

**Step 1: Create the file**

```ts
export interface ColumnIcon {
  name: string;
  type: 'emoji' | 'material';
}

export interface Column {
  field: string;
  icon?: ColumnIcon;
}
```

No test needed for a pure type file — TypeScript compilation is the test. Proceed to next task.

**Step 2: Commit**
```bash
git add src/app/shared/column.types.ts
git commit -m "feat: add Column and ColumnIcon type definitions"
```

---

## Task 2: Update `table-columns.ts` to use `Column[]`

**Files:**
- Modify: `src/app/shared/table-columns.ts`
- Check callers: `src/app/shared/comparison-dialog/comparison-stats/comparison-stats.component.ts`

**Step 1: Write the failing test**

In `src/app/shared/comparison-dialog/comparison-stats/comparison-stats.component.spec.ts`, find any test that uses `PLAYER_STAT_COLUMNS` as string[]. These tests will continue to pass if `PLAYER_STAT_COLUMNS` stays as `string[]`. Verify they currently pass:

```bash
npx karma start --single-run 2>&1 | grep -E "PLAYER_STAT|comparison-stats"
```

**Step 2: Update `table-columns.ts`**

```ts
import { Column } from './column.types';

const BASE_COLUMNS: Column[] = [
  { field: 'name' },
  { field: 'score' },
  { field: 'scoreAdjustedByGames' },
  { field: 'games' },
];
// NOTE: 'position' is intentionally NOT in the columns array anymore.
// It is controlled by stats-table's showPositionColumn input.

const COMMON_COLUMNS: Column[] = [
  { field: 'goals' },
  { field: 'assists' },
  { field: 'points' },
  { field: 'penalties' },
  { field: 'ppp' },
  { field: 'shp' },
];
const PLAYER_ONLY_COLUMNS: Column[] = [
  { field: 'plusMinus' },
  { field: 'shots' },
  { field: 'hits' },
  { field: 'blocks' },
];
const GOALIE_ONLY_COLUMNS: Column[] = [{ field: 'wins' }, { field: 'saves' }];
const GOALIE_ONLY_COMBINED_COLUMNS: Column[] = [...GOALIE_ONLY_COLUMNS, { field: 'shutouts' }];
const GOALIE_ONLY_SEASON_COLUMNS: Column[] = [
  ...GOALIE_ONLY_COLUMNS,
  { field: 'gaa' },
  { field: 'savePercent' },
  { field: 'shutouts' },
];

export const PLAYER_COLUMNS: Column[] = [...BASE_COLUMNS, ...COMMON_COLUMNS, ...PLAYER_ONLY_COLUMNS];
export const GOALIE_COLUMNS: Column[] = [...BASE_COLUMNS, ...GOALIE_ONLY_COMBINED_COLUMNS, ...COMMON_COLUMNS];
export const GOALIE_SEASON_COLUMNS: Column[] = [...BASE_COLUMNS, ...GOALIE_ONLY_SEASON_COLUMNS, ...COMMON_COLUMNS];

// These remain string[] because comparison-stats iterates field names only
export const PLAYER_STAT_COLUMNS: string[] = PLAYER_COLUMNS
  .filter(c => c.field !== 'name')
  .map(c => c.field);
export const GOALIE_STAT_COLUMNS: string[] = GOALIE_COLUMNS
  .filter(c => c.field !== 'name')
  .map(c => c.field);
export const GOALIE_SEASON_STAT_COLUMNS: string[] = GOALIE_SEASON_COLUMNS
  .filter(c => c.field !== 'name')
  .map(c => c.field);
```

**Step 3: Run tests to verify nothing broke**

```bash
npm run verify
```
Expected: all existing tests pass (comparison-stats gets `string[]` from derived exports, no change there).

**Step 4: Commit**
```bash
git add src/app/shared/table-columns.ts
git commit -m "refactor: convert table-columns exports from string[] to Column[]"
```

---

## Task 3: Update stats-table component TypeScript

**Files:**
- Modify: `src/app/shared/stats-table/stats-table.component.ts`

**Step 1: Update imports and inputs**

Replace the existing import/class with the new version. Key changes:
- Remove `ComparisonService`, `MatCheckboxModule`, `MatDialog`, `PlayerCardComponent` from default requirements (keep them but guard usage)
- Add `Observable`, `of` from rxjs
- Change `columns: string[]` to `columns: Column[]`
- Add new inputs
- Change `dynamicColumns: string[]` to `Column[]`
- Add `displayedFields: string[]`
- Update all places that read `displayedColumns` → `displayedFields`

```ts
import { Observable, of } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { Column } from '@shared/column.types';

// New inputs
@Input() columns: Column[] = [];
@Input() showSearch = true;
@Input() showPositionColumn = true;
@Input() positionValue?: (row: any, index: number) => string | number;
@Input() selectRow = false;
@Input() isRowSelected: (row: any) => boolean = () => false;
@Input() canSelectRow$: Observable<boolean> = of(true);
@Input() onRowSelect?: (row: any) => void;
@Input() clickable = true;
@Input() formatCell?: (column: string, value: any) => string;

// Internal derived state
dynamicColumns: Column[] = [];
displayedFields: string[] = [];      // replaces displayedColumns
```

**Step 2: Update `ngOnChanges`**

Replace the columns/data block:

```ts
if (changes['data'] && this.data) {
  this.dataSource.data = this.data;

  if (this.columns?.length > 0) {
    this.dynamicColumns = this.columns;
    this.displayedFields = this.buildDisplayedFields();
  }
  // ... rest unchanged (sort, activeRowIndex)
}

if (changes['columns'] && !changes['data']) {
  this.dynamicColumns = this.columns;
  this.displayedFields = this.buildDisplayedFields();
}

if (changes['showPositionColumn']) {
  this.displayedFields = this.buildDisplayedFields();
}
```

Add private helper:
```ts
private buildDisplayedFields(): string[] {
  const dynamic = this.dynamicColumns.map(c => c.field);
  return this.showPositionColumn ? ['position', ...dynamic] : dynamic;
}
```

**Step 3: Update `applyDefaultSort`**

```ts
private applyDefaultSort(): void {
  const desired = this.defaultSortColumn;
  const hasColumns = this.dynamicColumns.length > 0;
  const canUseDesired = Boolean(desired) &&
    (!hasColumns || this.dynamicColumns.some(c => c.field === desired));

  const fallback = hasColumns
    ? (this.dynamicColumns.find(c => c.field !== 'position')?.field ?? this.dynamicColumns[0]?.field)
    : desired;

  this.sort.active = canUseDesired ? desired : (fallback ?? desired);
  this.sort.direction = 'desc';
}
```

**Step 4: Update `onRowKeydown`**

Guard Enter key with `clickable`:
```ts
case 'Enter': {
  if (!this.clickable) return;
  event.preventDefault();
  this.selectItem(row);
  return;
}
```

**Step 5: Update `onHeaderKeydown`**

Guard ArrowUp (search focus) with `showSearch`:
```ts
case 'ArrowUp': {
  if (!this.showSearch) return;
  const input = this.searchInput?.nativeElement;
  if (!input) return;
  event.preventDefault();
  input.focus();
  return;
}
```

**Step 6: Remove ComparisonService methods, add selectRow methods**

Remove: `onCompareToggle`, `isCompareSelected`, `canSelectMore$`
Add:
```ts
onRowSelectToggle(row: any): void {
  this.onRowSelect?.(row);
}
```

**Step 7: Update `displayedColumns` references**

Every place in the component that reads `this.displayedColumns` → `this.displayedFields`. Also rename the public property in the template context. `displayedColumns` was public — rename to `displayedFields` for consistency, or keep as `displayedColumns` with internal rename. Easiest: rename the property to `displayedFields` everywhere.

**Step 8: Run tests**

```bash
npm run verify
```
Expected: stats-table tests will fail (they still use old string[] API and reference old properties). That's expected — fix in Task 5.

---

## Task 4: Update stats-table template

**Files:**
- Modify: `src/app/shared/stats-table/stats-table.component.html`

Replace the entire template with:

```html
<div class="stats-table-wrapper mat-elevation-z4" [attr.id]="tableId" tabindex="-1" #tableRoot>
  <p class="sr-only" [attr.id]="instructionsId">
    {{ 'a11y.tableNavigationHint' | translate }}
  </p>

  @if (showSearch) {
    <div class="search-container">
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>{{ "table.playerSearch" | translate }}</mat-label>
        <input matInput type="search" autocomplete="off"
          (input)="filterItems($event)"
          (keydown)="onSearchKeydown($event)"
          #searchInput />
      </mat-form-field>
    </div>
  }

  <div class="table-container">
    <table mat-table [dataSource]="dataSource" matSort matSortStart="desc"
      [attr.aria-describedby]="instructionsId">

      <!-- Position column (rank + optional checkbox) -->
      @if (showPositionColumn) {
        <ng-container matColumnDef="position">
          <th mat-header-cell *matHeaderCellDef>
            @if (selectRow) {
              <span matTooltip="{{ 'tooltip.comparePositionColumn' | translate }}">
                {{ "tableColumnShort.position" | translate }}
              </span>
            } @else {
              {{ "tableColumnShort.position" | translate }}
            }
          </th>
          <td mat-cell *matCellDef="let row; let i = index"
            (click)="$event.stopPropagation()">
            @if (selectRow) {
              <mat-checkbox
                [checked]="isRowSelected(row)"
                [disabled]="!isRowSelected(row) && !(canSelectRow$ | async)"
                (change)="onRowSelectToggle(row)"
                [attr.aria-label]="getRowAriaLabel(row, 'a11y.selectToCompare')">
                {{ positionValue ? positionValue(row, i) : (i + 1) }}
              </mat-checkbox>
            } @else {
              {{ positionValue ? positionValue(row, i) : (i + 1) }}
            }
          </td>
        </ng-container>
      }

      <!-- Dynamic column renderer -->
      @for (column of dynamicColumns; track column.field) {
        <ng-container [matColumnDef]="column.field">
          <th mat-header-cell *matHeaderCellDef mat-sort-header
            matTooltip="{{ 'tableColumn.' + column.field | translate }}">
            @if (column.icon?.type === 'emoji') {
              {{ column.icon!.name }}
            } @else if (column.icon?.type === 'material') {
              <mat-icon>{{ column.icon!.name }}</mat-icon>
            }
            <span [class.sr-only]="column.icon">
              {{ "tableColumnShort." + column.field | translate }}
            </span>
          </th>
          <td mat-cell *matCellDef="let element">
            {{ formatCell
                ? formatCell(column.field, element[column.field])
                : (element[column.field] !== "" ? element[column.field] : "-") }}
          </td>
        </ng-container>
      }

      <tr mat-header-row (keydown)="onHeaderKeydown($event)"
        *matHeaderRowDef="displayedFields; sticky: true"></tr>
      <tr mat-row #dataRow
        [class.clickable-row]="clickable"
        (click)="clickable && selectItem(row)"
        (focus)="onRowFocus(i)"
        (keydown)="onRowKeydown($event, row, i)"
        [attr.tabindex]="getRowTabIndex(i)"
        [attr.data-row-index]="i"
        [class.a11y-active]="i === activeRowIndex"
        [attr.aria-label]="clickable ? getRowAriaLabel(row, 'a11y.openPlayerCard') : null"
        [attr.aria-haspopup]="clickable ? 'dialog' : null"
        *matRowDef="let row; columns: displayedFields; let i = index">
      </tr>
      <tr class="mat-row" *matNoDataRow>
        <td class="mat-cell no-results" [colSpan]="displayedFields.length">
          <span>
            @if (apiError) {
              {{ "table.apiUnavailable" | translate }}
            } @else if (loading) {
              {{ "table.loading" | translate }}
            } @else {
              {{ "table.noSearchResults" | translate }}
            }
          </span>
          @if (loading && !apiError) {
            <mat-progress-bar class="loading-bar" mode="buffer"
              [value]="loadingProgress" [bufferValue]="loadingBuffer">
            </mat-progress-bar>
          }
        </td>
      </tr>
    </table>
  </div>
</div>
```

Also add `MatIconModule` to the component's `imports` array in the `.ts` file for Material icon support.

Add CSS for `.clickable-row`:
```scss
// stats-table.component.scss — add alongside existing row styles
tr.mat-mdc-row.clickable-row {
  cursor: pointer;
}
```

**Step 2: Run build to catch template errors**

```bash
npm run verify
```
Expected: template compiles, existing tests may still fail (addressed in Task 5).

---

## Task 5: Update stats-table tests

**Files:**
- Modify: `src/app/shared/stats-table/stats-table.component.spec.ts`

This is the most extensive test update. Key changes:

**Step 1: Update column format throughout**

Replace all `string[]` column arrays:
```ts
// Old
const playerColumns = ['position', 'name', 'score', ...];

// New — position is NOT in the array, it is shown via showPositionColumn (default true)
const playerColumns: Column[] = [
  { field: 'name' }, { field: 'score' }, { field: 'games' },
  { field: 'goals' }, { field: 'assists' }, { field: 'points' },
  { field: 'plusMinus' }, { field: 'penalties' }, { field: 'shots' },
  { field: 'ppp' }, { field: 'shp' }, { field: 'hits' }, { field: 'blocks' },
];
```

**Step 2: Update `displayedColumns` → `displayedFields` references**

In any test that asserts `component.displayedColumns`, change to `component.displayedFields`.

**Step 3: Update dynamicColumns assertions**

`dynamicColumns` is now `Column[]`. Update:
```ts
// Old
expect(component.dynamicColumns).not.toContain('position');
expect(component.dynamicColumns).toContain('name');

// New
expect(component.dynamicColumns.map(c => c.field)).not.toContain('position');
expect(component.dynamicColumns.map(c => c.field)).toContain('name');
```

**Step 4: Update comparison checkbox tests**

Replace old ComparisonService-based tests with selectRow tests:

```ts
describe('selectRow feature', () => {
  it('should not show checkboxes when selectRow is false (default)', () => {
    component.columns = playerColumns;
    component.data = mockPlayerData;
    component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
    expect(checkbox).toBeFalsy();
  });

  it('should show checkboxes when selectRow is true', () => {
    component.columns = playerColumns;
    component.data = mockPlayerData;
    component.selectRow = true;
    component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
    expect(checkbox).toBeTruthy();
  });

  it('should call onRowSelect handler when checkbox changes', () => {
    const handler = jasmine.createSpy('onRowSelect');
    component.onRowSelect = handler;
    component.onRowSelectToggle(mockPlayerData[0]);
    expect(handler).toHaveBeenCalledWith(mockPlayerData[0]);
  });

  it('should use isRowSelected to determine checkbox state', () => {
    component.isRowSelected = (row) => row === mockPlayerData[0];
    expect(component.isRowSelected(mockPlayerData[0])).toBeTrue();
    expect(component.isRowSelected(mockPlayerData[1])).toBeFalse();
  });
});
```

**Step 5: Add showSearch tests**

```ts
describe('showSearch', () => {
  it('should show search input by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[type="search"]')).toBeTruthy();
  });

  it('should hide search input when showSearch is false', () => {
    component.showSearch = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[type="search"]')).toBeFalsy();
  });

  it('onHeaderKeydown ArrowUp should do nothing when showSearch is false', () => {
    component.showSearch = false;
    const input = document.createElement('input');
    component.searchInput = new ElementRef(input);
    const focusSpy = spyOn(input, 'focus');

    const event = { key: 'ArrowUp', preventDefault: jasmine.createSpy() } as any;
    component.onHeaderKeydown(event);

    expect(focusSpy).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
```

**Step 6: Add showPositionColumn tests**

```ts
describe('showPositionColumn', () => {
  it('should include position in displayedFields by default', () => {
    component.columns = playerColumns;
    component.data = mockPlayerData;
    component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
    expect(component.displayedFields[0]).toBe('position');
  });

  it('should exclude position from displayedFields when showPositionColumn is false', () => {
    component.columns = playerColumns;
    component.showPositionColumn = false;
    component.data = mockPlayerData;
    component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
    expect(component.displayedFields).not.toContain('position');
  });
});
```

**Step 7: Add formatCell tests**

```ts
describe('formatCell', () => {
  it('should use default rendering when formatCell is not provided', () => {
    component.columns = [{ field: 'goals' }];
    component.data = [{ goals: 10 }];
    component.ngOnChanges({ data: new SimpleChange(null, [{ goals: 10 }], true) });
    fixture.detectChanges();

    const cell = fixture.nativeElement.querySelector('td.mat-column-goals');
    expect(cell?.textContent?.trim()).toBe('10');
  });

  it('should apply formatCell when provided', () => {
    component.columns = [{ field: 'goals' }];
    component.formatCell = (col, val) => col === 'goals' ? `${val}G` : val;
    component.data = [{ goals: 10 }];
    component.ngOnChanges({ data: new SimpleChange(null, [{ goals: 10 }], true) });
    fixture.detectChanges();

    const cell = fixture.nativeElement.querySelector('td.mat-column-goals');
    expect(cell?.textContent?.trim()).toBe('10G');
  });
});
```

**Step 8: Add icon column tests**

```ts
describe('icon columns', () => {
  it('should render emoji icon in column header', () => {
    component.columns = [{ field: 'goals', icon: { name: '🏆', type: 'emoji' } }];
    component.data = mockPlayerData;
    component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('th.mat-column-goals');
    expect(header?.textContent).toContain('🏆');
  });

  it('should hide column label text visually when icon is present', () => {
    component.columns = [{ field: 'goals', icon: { name: '🏆', type: 'emoji' } }];
    component.data = mockPlayerData;
    component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
    fixture.detectChanges();

    const srSpan = fixture.nativeElement.querySelector('th.mat-column-goals .sr-only');
    expect(srSpan).toBeTruthy();
  });
});
```

**Step 9: Add clickable tests**

```ts
describe('clickable', () => {
  it('should not open dialog on Enter when clickable is false', () => {
    const selectSpy = spyOn(component, 'selectItem');
    component.clickable = false;
    const event = { key: 'Enter', preventDefault: jasmine.createSpy() } as any;

    component.onRowKeydown(event, mockPlayerData[0], 0);

    expect(selectSpy).not.toHaveBeenCalled();
  });

  it('should open dialog on Enter when clickable is true (default)', () => {
    const selectSpy = spyOn(component, 'selectItem');
    const event = { key: 'Enter', preventDefault: jasmine.createSpy() } as any;

    component.onRowKeydown(event, mockPlayerData[0], 0);

    expect(selectSpy).toHaveBeenCalledWith(mockPlayerData[0]);
  });
});
```

**Step 10: Remove ComparisonService import and test setup**

Remove `ComparisonService` from TestBed imports, `canSelectMore$` tests, `onCompareToggle` tests, `isCompareSelected` tests.

**Step 11: Run tests**

```bash
npm run verify
```
Expected: all stats-table tests pass.

**Step 12: Commit**
```bash
git add src/app/shared/stats-table/
git commit -m "feat: expand stats-table API with Column type and feature flags"
```

---

## Task 6: Update player-stats and goalie-stats

**Files:**
- Modify: `src/app/player-stats/player-stats.component.ts`
- Modify: `src/app/goalie-stats/goalie-stats.component.ts`
- Modify: `src/app/player-stats/player-stats.component.html`
- Modify: `src/app/goalie-stats/goalie-stats.component.html`

**Step 1: Update player-stats.component.ts**

```ts
import { ComparisonService } from '@services/comparison.service';
import { Column } from '@shared/column.types';
import { PLAYER_COLUMNS } from '@shared/table-columns';

// In the class:
readonly comparisonService = inject(ComparisonService);
readonly canSelectRow$ = this.comparisonService.canSelectMore$;
tableColumns: Column[] = PLAYER_COLUMNS;

// Update getTableColumns:
private getTableColumns(statsPerGame: boolean): Column[] {
  if (!statsPerGame) return PLAYER_COLUMNS;
  return PLAYER_COLUMNS.filter(c => c.field !== 'score');
}

// Add handlers for selectRow:
isRowSelected = (row: any) => this.comparisonService.isSelected(row);
onRowSelect = (row: any) => this.comparisonService.toggle(row);
```

**Step 2: Update player-stats.component.html**

```html
<app-stats-table
  [data]="tableData"
  [columns]="tableColumns"
  [defaultSortColumn]="defaultSortColumn"
  [loading]="loading"
  [apiError]="apiError"
  [selectRow]="true"
  [isRowSelected]="isRowSelected"
  [canSelectRow$]="canSelectRow$"
  [onRowSelect]="onRowSelect"
></app-stats-table>
```

**Step 3: Update goalie-stats.component.ts** (same pattern)

```ts
import { ComparisonService } from '@services/comparison.service';
import { Column } from '@shared/column.types';
import { GOALIE_COLUMNS, GOALIE_SEASON_COLUMNS } from '@shared/table-columns';

readonly comparisonService = inject(ComparisonService);
readonly canSelectRow$ = this.comparisonService.canSelectMore$;
tableColumns: Column[] = GOALIE_COLUMNS;

// Update getTableColumns to return Column[]
private getTableColumns(...): Column[] { ... }

isRowSelected = (row: any) => this.comparisonService.isSelected(row);
onRowSelect = (row: any) => this.comparisonService.toggle(row);
```

**Step 4: Update goalie-stats.component.html** (same as player-stats template)

**Step 5: Run tests**
```bash
npm run verify
```
Expected: all tests pass.

**Step 6: Commit**
```bash
git add src/app/player-stats/ src/app/goalie-stats/
git commit -m "refactor: wire ComparisonService into stats-table via selectRow inputs"
```

---

## Task 7: Add missing translation keys for leaderboard columns

**Files:**
- Modify: `public/i18n/fi.json`

The leaderboard columns `displayPosition`, `teamName`, `regularTrophies`, `championships`, `ties`, `losses`, `pointsPercent`, `winPercent`, `finals`, `conferenceFinals`, `secondRound`, `firstRound` need entries in `tableColumn` and `tableColumnShort`.

Note: `points` and `wins` already exist in `tableColumn` (player/goalie stats use them). Finnish translations are the same, so no conflict.

**Step 1: Add to `tableColumn` and `tableColumnShort` in fi.json**

```json
"tableColumn": {
  // ... existing keys ...
  "displayPosition": "#",
  "teamName": "Joukkue",
  "regularTrophies": "Runkosarjavoitot",
  "championships": "Mestaruudet",
  "ties": "Tasapelit",
  "losses": "Häviöt",
  "pointsPercent": "Piste-%",
  "winPercent": "Voitto-%",
  "finals": "Finaalit",
  "conferenceFinals": "Konferenssifinalit",
  "secondRound": "Toinen kierros",
  "firstRound": "Ensimmäinen kierros"
},
"tableColumnShort": {
  // ... existing keys ...
  "displayPosition": "#",
  "teamName": "Joukkue",
  "regularTrophies": "RSV",
  "championships": "Mest.",
  "ties": "T",
  "losses": "H",
  "pointsPercent": "P-%",
  "winPercent": "V-%",
  "finals": "Fin.",
  "conferenceFinals": "KF",
  "secondRound": "2K",
  "firstRound": "1K"
}
```

> **Important:** Confirm Finnish abbreviations with the project owner before finalizing. Existing `leaderboards.columns.*` translations are the authoritative source for full names.

**Step 2: Verify translations look correct by running the app (visual check, not automated)**

**Step 3: Commit**
```bash
git add public/i18n/fi.json
git commit -m "feat: add leaderboard column translation keys to tableColumn namespace"
```

---

## Task 8: Migrate leaderboard-regular to stats-table

**Files:**
- Modify: `src/app/leaderboards/regular/leaderboard-regular.component.ts`
- Modify: `src/app/leaderboards/regular/leaderboard-regular.component.html`

**Step 1: Update leaderboard-regular.component.ts**

```ts
import { StatsTableComponent } from '@shared/stats-table/stats-table.component';
import { Column } from '@shared/column.types';
// Remove: import { LeaderboardTableComponent }

readonly columns: Column[] = [
  { field: 'displayPosition' },
  { field: 'teamName' },
  { field: 'regularTrophies', icon: { name: '🏆', type: 'emoji' } },
  { field: 'points' },
  { field: 'wins' },
  { field: 'ties' },
  { field: 'losses' },
  { field: 'pointsPercent' },
  { field: 'winPercent' },
];

// In @Component:
imports: [StatsTableComponent],
```

Remove `readonly trophyColumn` and `readonly displayedColumns` (replaced by `columns`).

**Step 2: Update leaderboard-regular.component.html**

```html
<app-stats-table
  [data]="data"
  [columns]="columns"
  [loading]="loading"
  [apiError]="apiError"
  [showSearch]="false"
  [showPositionColumn]="false"
  [clickable]="false"
  [selectRow]="false"
  [formatCell]="formatCell"
  tableId="leaderboard-regular-table"
/>
```

**Step 3: Run tests**

```bash
npm run verify
```
Expected: leaderboard-regular tests still pass (they test component logic, not `app-leaderboard-table` directly). The test at line ~72 (`cols.indexOf('losses')`) uses `component.columns` — update it to reference `component.columns.map(c => c.field)`.

```ts
// Update leaderboard-regular.component.spec.ts
it('should include pointsPercent column between losses and winPercent', () => {
  const cols = component.columns.map(c => c.field);
  // ... rest unchanged
});
```

**Step 4: Commit**
```bash
git add src/app/leaderboards/regular/
git commit -m "refactor: migrate leaderboard-regular to use stats-table"
```

---

## Task 9: Migrate leaderboard-playoffs to stats-table

**Files:**
- Modify: `src/app/leaderboards/playoffs/leaderboard-playoffs.component.ts`
- Modify: `src/app/leaderboards/playoffs/leaderboard-playoffs.component.html`

**Step 1: Update leaderboard-playoffs.component.ts**

```ts
import { StatsTableComponent } from '@shared/stats-table/stats-table.component';
import { Column } from '@shared/column.types';
// Remove: import { LeaderboardTableComponent }

readonly columns: Column[] = [
  { field: 'displayPosition' },
  { field: 'teamName' },
  { field: 'championships', icon: { name: '🏆', type: 'emoji' } },
  { field: 'finals' },
  { field: 'conferenceFinals' },
  { field: 'secondRound' },
  { field: 'firstRound' },
];

// In @Component:
imports: [StatsTableComponent],
```

Remove `readonly trophyColumn` and `readonly displayedColumns`.

**Step 2: Update leaderboard-playoffs.component.html**

```html
<app-stats-table
  [data]="data"
  [columns]="columns"
  [loading]="loading"
  [apiError]="apiError"
  [showSearch]="false"
  [showPositionColumn]="false"
  [clickable]="false"
  [selectRow]="false"
  tableId="leaderboard-playoffs-table"
/>
```

**Step 3: Update leaderboard-playoffs.component.spec.ts**

Same pattern as regular — update any `displayedColumns`/`trophyColumn` references to use `component.columns`.

**Step 4: Run tests**
```bash
npm run verify
```
Expected: all tests pass.

**Step 5: Commit**
```bash
git add src/app/leaderboards/playoffs/
git commit -m "refactor: migrate leaderboard-playoffs to use stats-table"
```

---

## Task 10: Delete leaderboard-table component

**Files:**
- Delete: `src/app/leaderboards/leaderboard-table/leaderboard-table.component.ts`
- Delete: `src/app/leaderboards/leaderboard-table/leaderboard-table.component.html`
- Delete: `src/app/leaderboards/leaderboard-table/leaderboard-table.component.scss`
- Delete: `src/app/leaderboards/leaderboard-table/leaderboard-table.component.spec.ts`

**Step 1: Verify no remaining references**

```bash
grep -r "leaderboard-table\|LeaderboardTable" src/ --include="*.ts" --include="*.html"
```
Expected: zero results.

**Step 2: Delete files**
```bash
rm -rf src/app/leaderboards/leaderboard-table/
```

**Step 3: Run final verification**
```bash
npm run verify
```
Expected: all tests pass, production build succeeds.

**Step 4: Commit**
```bash
git add -A
git commit -m "feat: remove leaderboard-table component — consolidated into stats-table"
```

---

## Task 11: Update documentation

**Files:**
- Modify: `docs/component-guide.md`
- Modify: `docs/codebase-structure.md`

**Step 1: Update `component-guide.md`**

Find the `StatsTableComponent` section (around line 195) and update:

1. Update `@Input()` list to include all new inputs
2. Add a "Feature flags" section explaining each flag
3. Add example for leaderboard usage (read-only, no search)
4. Remove any mention of `trophyColumn` or `formatCell` as leaderboard-only
5. Add `Column` type reference with interface definition

**Step 2: Update `codebase-structure.md`**

Remove references to `leaderboard-table/` directory from the tree and description. Update `stats-table/` description to mention it is now the unified table component for all data views.

**Step 3: Run verify one final time**
```bash
npm run verify
```

**Step 4: Commit**
```bash
git add docs/
git commit -m "docs: update component guide and codebase structure for stats-table consolidation"
```

---

## Done

After all tasks:
- `stats-table` is the single generic table component
- `leaderboard-table` is deleted
- All callers use `Column[]` type
- `ComparisonService` is no longer a dependency of `stats-table`
- Docs reflect the final state
