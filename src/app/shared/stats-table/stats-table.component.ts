import {
  ChangeDetectorRef,
  inject,
  Component,
  Input,
  ElementRef,
  QueryList,
  ViewChildren,
  ViewChild,
  SimpleChanges,
  OnChanges,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { STATIC_COLUMNS } from '@shared/table-columns';
import { Player, Goalie } from '@services/api.service';
import { PlayerCardComponent } from '@shared/player-card/player-card.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-stats-table',
  imports: [
    TranslateModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSortModule,
    MatTooltipModule,
  ],
  templateUrl: './stats-table.component.html',
  styleUrl: './stats-table.component.scss',
})
export class StatsTableComponent implements OnChanges, AfterViewInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  readonly dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  private warmupTimeoutId?: ReturnType<typeof setTimeout>;
  private loadingIntervalId?: ReturnType<typeof setInterval>;
  private loadingStartMs?: number;

  loadingProgress = 0;
  loadingBuffer = 0;
  showWarmupMessage = false;

  @Input() data: any = [];
  @Input() columns: string[] = [];
  @Input() defaultSortColumn = 'score';
  @Input() loading = false;
  @Input() apiError = false;
  @Input() tableId = 'stats-table';

  instructionsId = 'stats-table-instructions';
  activeRowIndex = 0;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [];
  dynamicColumns: string[] = [];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('searchInput', { read: ElementRef }) searchInput?: ElementRef<HTMLInputElement>;
  @ViewChildren('dataRow', { read: ElementRef }) dataRows?: QueryList<ElementRef<HTMLElement>>;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tableId']) {
      this.instructionsId = `${this.tableId}-instructions`;
    }

    if (changes['loading']) {
      this.onLoadingChanged(this.loading);
    }

    const sortRelevantChange =
      Boolean(changes['defaultSortColumn']) || Boolean(changes['columns']);

    if (changes['data'] && this.data) {
      this.dataSource.data = this.data;

      if (this.columns?.length > 0) {
        this.displayedColumns = this.columns;
        this.dynamicColumns = this.displayedColumns.filter(
          (column) => !STATIC_COLUMNS.includes(column)
        );
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }

      if (this.sort && sortRelevantChange) {
        this.applyDefaultSort();
      }

      // Reset focus to first row when the dataset changes.
      this.activeRowIndex = 0;
      setTimeout(() => this.ensureActiveRowInRange(), 0);
    }

    if (this.sort && sortRelevantChange && !(changes['data'] && this.data)) {
      // When only the sort inputs changed, apply immediately.
      this.applyDefaultSort();
    }
  }

  ngOnDestroy(): void {
    this.clearWarmupTimer();
    this.clearLoadingProgressTimer();
  }

  private onLoadingChanged(isLoading: boolean) {
    this.clearWarmupTimer();
    this.clearLoadingProgressTimer();
    this.showWarmupMessage = false;

    if (!isLoading) {
      this.loadingProgress = 0;
      this.loadingBuffer = 0;
      return;
    }

    this.loadingStartMs = Date.now();
    this.updateLoadingProgress();
    this.loadingIntervalId = setInterval(() => {
      this.updateLoadingProgress();
      this.cdr.markForCheck();
    }, 200);

    this.warmupTimeoutId = setTimeout(() => {
      this.showWarmupMessage = true;
      this.cdr.markForCheck();
    }, 2000);
  }

  private updateLoadingProgress() {
    const elapsedMs = Math.max(0, Date.now() - (this.loadingStartMs ?? Date.now()));
    const expectedMs = 60_000;
    const progress = Math.min(100, Math.round((elapsedMs / expectedMs) * 100));
    const buffer = Math.min(100, progress + 15);

    this.loadingProgress = progress;
    this.loadingBuffer = buffer;
  }

  private clearLoadingProgressTimer() {
    if (this.loadingIntervalId) {
      clearInterval(this.loadingIntervalId);
      this.loadingIntervalId = undefined;
    }

    this.loadingStartMs = undefined;
  }

  private clearWarmupTimer() {
    if (this.warmupTimeoutId) {
      clearTimeout(this.warmupTimeoutId);
      this.warmupTimeoutId = undefined;
    }
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
      this.applyDefaultSort();
    }

    this.cdr.detectChanges();
    this.ensureActiveRowInRange();
  }

  private applyDefaultSort(): void {
    const desired = this.defaultSortColumn;

    // Prefer the desired sort column. If columns are not known yet (common during init), still apply.
    // If the desired column is not currently displayed, fall back to the first non-static column.
    const hasColumns = Array.isArray(this.displayedColumns) && this.displayedColumns.length > 0;
    const canUseDesired =
      Boolean(desired) && (!hasColumns || this.displayedColumns.includes(desired));

    const fallback = hasColumns
      ? this.displayedColumns.find((c) => c !== 'position') ?? this.displayedColumns[0]
      : desired;

    this.sort.active = canUseDesired ? desired : (fallback ?? desired);
    this.sort.direction = 'desc';
  }

  filterItems(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    setTimeout(() => this.ensureActiveRowInRange(), 0);
  }

  selectItem(data: Player | Goalie) {
    this.dialog.open(PlayerCardComponent, {
      data,
      maxWidth: '95vw',
      width: 'auto',
      panelClass: 'player-card-dialog',
    });
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown') {
      return;
    }

    if (this.getRowCount() === 0) {
      return;
    }

    event.preventDefault();
    this.focusRow(this.activeRowIndex);
  }

  onHeaderKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown': {
        if (this.getRowCount() === 0) {
          return;
        }

        event.preventDefault();
        this.focusRow(0);
        return;
      }
      case 'ArrowUp': {
        const input = this.searchInput?.nativeElement;
        if (!input) {
          return;
        }

        event.preventDefault();
        input.focus();
        return;
      }
      default:
        return;
    }
  }

  onRowFocus(index: number): void {
    this.activeRowIndex = index;
  }

  getRowTabIndex(index: number): number {
    return index === this.activeRowIndex ? 0 : -1;
  }

  onRowKeydown(event: KeyboardEvent, row: Player | Goalie, index: number): void {
    switch (event.key) {
      case 'Enter':
      case ' ': {
        event.preventDefault();
        this.selectItem(row);
        return;
      }
      case 'PageDown': {
        event.preventDefault();
        this.focusRow(index + 10);
        return;
      }
      case 'PageUp': {
        event.preventDefault();
        this.focusRow(index - 10);
        return;
      }
      case 'ArrowDown': {
        event.preventDefault();
        this.focusRow(index + 1);
        return;
      }
      case 'ArrowUp': {
        event.preventDefault();
        this.focusRow(index - 1);
        return;
      }
      case 'Home': {
        event.preventDefault();
        this.focusRow(0);
        return;
      }
      case 'End': {
        event.preventDefault();
        this.focusRow(this.getRowCount() - 1);
        return;
      }
      default:
        return;
    }
  }

  getRowAriaLabel(row: Player | Goalie): string {
    const name = (row as any)?.name ?? '';
    return this.translate.instant('a11y.openPlayerCard', { name });
  }

  private getRowCount(): number {
    return this.dataRows?.length ?? 0;
  }

  private ensureActiveRowInRange(): void {
    const rowCount = this.getRowCount();
    if (rowCount === 0) {
      this.activeRowIndex = 0;
      return;
    }

    if (this.activeRowIndex < 0) {
      this.activeRowIndex = 0;
    }
    if (this.activeRowIndex > rowCount - 1) {
      this.activeRowIndex = rowCount - 1;
    }
    this.cdr.markForCheck();
  }

  private focusRow(index: number): void {
    const rows = this.dataRows?.toArray() ?? [];
    if (rows.length === 0) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(index, rows.length - 1));
    this.activeRowIndex = clampedIndex;

    const el = rows[clampedIndex]?.nativeElement;
    if (!el) {
      return;
    }

    el.focus();
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
