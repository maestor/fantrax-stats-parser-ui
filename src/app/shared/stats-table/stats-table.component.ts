import {
  ChangeDetectorRef,
  inject,
  Component,
  Input,
  ElementRef,
  ViewChild,
  SimpleChanges,
  OnChanges,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { Observable, of } from 'rxjs';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Column, ColumnIcon } from '@shared/column.types';
import { Player, Goalie, RegularLeaderboardEntry, PlayoffLeaderboardEntry } from '@services/api.service';
import { ExpandedRowViewModel } from '@shared/table-row-expansion.types';

export type TableRow = Player | Goalie | RegularLeaderboardEntry | PlayoffLeaderboardEntry;
import { PlayerCardComponent, PlayerCardDialogData } from '@shared/player-card/player-card.component';

@Component({
  selector: 'app-stats-table',
  imports: [
    AsyncPipe,
    NgClass,
    TranslateModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSortModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './stats-table.component.html',
  styleUrl: './stats-table.component.scss',
})
export class StatsTableComponent implements OnChanges, AfterViewInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  readonly dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  private loadingIntervalId?: ReturnType<typeof setInterval>;
  private loadingStartMs?: number;

  loadingProgress = 0;
  loadingBuffer = 0;

  @Input() data: TableRow[] = [];
  @Input() columns: Column[] = [];
  @Input() defaultSortColumn = 'score';
  @Input() loading = false;
  @Input() apiError = false;
  @Input() tableId = 'stats-table';
  @Input() showSearch = true;
  @Input() showPositionColumn = true;
  @Input() positionValue?: (row: TableRow, index: number) => string | number;
  @Input() selectRow = false;
  @Input() isRowSelected: (row: TableRow) => boolean = () => false;
  @Input() canSelectRow$: Observable<boolean> = of(true);
  @Input() onRowSelect?: (row: TableRow) => void;
  @Input() clickable = true;
  @Input() formatCell?: (column: string, value: number | string | undefined) => string;
  @Input() expandable = false;
  @Input() rowKey?: (row: TableRow, index: number) => string;
  @Input() isRowExpandable: (row: TableRow) => boolean = () => false;
  @Input() expandedRowsFor: (row: TableRow) => ExpandedRowViewModel[] = () => [];
  @Input() expandToggleAriaLabel?: (row: TableRow, expanded: boolean) => string;
  @Input() expandedHeaderLabels?: { season: string; primary: string; secondary?: string };

  instructionsId = 'stats-table-instructions';
  activeRowIndex = 0;
  readonly expandedDetailColumns = ['expandedDetail'];

  dataSource = new MatTableDataSource<TableRow>([]);
  dynamicColumns: Column[] = [];
  displayedFields: string[] = [];
  private rowKeyMap = new WeakMap<object, string>();
  private expandedRowKeys = new Set<string>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('searchInput', { read: ElementRef }) searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('tableRoot', { read: ElementRef }) tableRootRef?: ElementRef<HTMLElement>;

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
      this.rebuildRowKeyMap();
      this.expandedRowKeys.clear();

      if (this.columns?.length > 0) {
        this.dynamicColumns = this.columns;
        this.displayedFields = this.buildDisplayedFields();
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

    if (changes['columns'] && !changes['data']) {
      this.dynamicColumns = this.columns;
      this.displayedFields = this.buildDisplayedFields();
    }

    if (changes['showPositionColumn']) {
      this.displayedFields = this.buildDisplayedFields();
    }

    if (this.sort && sortRelevantChange && !(changes['data'] && this.data)) {
      // When only the sort inputs changed, apply immediately.
      this.applyDefaultSort();
    }
  }

  ngOnDestroy(): void {
    this.clearLoadingProgressTimer();
  }

  private onLoadingChanged(isLoading: boolean) {
    this.clearLoadingProgressTimer();

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

  ngAfterViewInit(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
      this.applyDefaultSort();
    }

    this.cdr.detectChanges();
    this.ensureActiveRowInRange();
  }

  private buildDisplayedFields(): string[] {
    const dynamic = this.dynamicColumns.map(c => c.field);
    return this.showPositionColumn ? ['position', ...dynamic] : dynamic;
  }

  private applyDefaultSort(): void {
    if (!this.defaultSortColumn) {
      this.sort.active = '';
      this.sort.direction = '';
      return;
    }

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

  getHeaderIconType(column: Column): ColumnIcon['type'] | null {
    return column.icon?.type ?? null;
  }

  getCellClass(column: Column): { 'col-left': boolean; 'col-center': boolean } {
    return {
      'col-left': column.align === 'left',
      'col-center': column.align !== 'left',
    };
  }

  getPositionDisplay(row: TableRow, i: number): string | number {
    return this.positionValue ? this.positionValue(row, i) : i + 1;
  }

  getCellValue(row: TableRow, field: string): number | string | undefined {
    return (row as Record<string, unknown>)[field] as number | string | undefined;
  }

  isExpandControlColumn(column: Column): boolean {
    if (!this.expandable || this.dynamicColumns.length === 0) return false;
    return this.dynamicColumns[0]?.field === column.field;
  }

  shouldShowExpandToggle(row: TableRow): boolean {
    return this.expandable && this.isRowExpandable(row);
  }

  toggleRowExpansion(row: TableRow, event?: Event): void {
    event?.stopPropagation();
    if (!this.shouldShowExpandToggle(row)) return;

    const key = this.resolveRowKey(row);
    if (this.expandedRowKeys.has(key)) {
      this.expandedRowKeys.delete(key);
      this.refreshRenderedRows();
      return;
    }

    this.expandedRowKeys.add(key);
    this.refreshRenderedRows();
  }

  onExpandToggleKeydown(event: KeyboardEvent, row: TableRow): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.toggleRowExpansion(row, event);
  }

  onMainRowClick(row: TableRow, event: MouseEvent): void {
    if (this.clickable) {
      this.selectItem(row);
      return;
    }

    if (this.expandable && this.shouldShowExpandToggle(row)) {
      const wasExpanded = this.isExpanded(row);
      this.toggleRowExpansion(row);
      const isNowExpanded = this.isExpanded(row);
      if (wasExpanded && !isNowExpanded) {
        (event.currentTarget as HTMLElement | null)?.blur();
      }
    }
  }

  isRowInteractive(row: TableRow): boolean {
    return this.clickable || (this.expandable && this.shouldShowExpandToggle(row));
  }

  isExpanded(row: TableRow): boolean {
    if (!this.expandable) return false;
    return this.expandedRowKeys.has(this.resolveRowKey(row));
  }

  isExpandedDetailRow = (_index: number, row: TableRow): boolean =>
    this.expandable && this.isExpanded(row) && this.shouldShowExpandToggle(row);

  getExpandedRows(row: TableRow): ExpandedRowViewModel[] {
    if (!this.expandable || !this.shouldShowExpandToggle(row) || !this.isExpanded(row)) return [];
    return this.expandedRowsFor(row);
  }

  getExpandToggleAriaLabel(row: TableRow): string {
    const expanded = this.isExpanded(row);
    if (this.expandToggleAriaLabel) return this.expandToggleAriaLabel(row, expanded);

    const key = expanded ? 'a11y.collapseSeasonDetails' : 'a11y.expandSeasonDetails';
    return this.translate.instant(key, { name: this.getRowLabel(row) });
  }

  getDetailRowId(row: TableRow): string {
    return `expanded-detail-${this.resolveRowKey(row)}`;
  }

  filterItems(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    setTimeout(() => this.ensureActiveRowInRange(), 0);
  }

  selectItem(data: TableRow) {
    // Track navigated index in a closure so CDK focus restoration
    // (which triggers onRowFocus) cannot overwrite it before afterClosed fires.
    let navigatedIndex = this.dataSource.filteredData.indexOf(data);

    const dialogData: PlayerCardDialogData = {
      player: data as Player | Goalie,
      navigationContext: {
        allPlayers: this.dataSource.filteredData as (Player | Goalie)[],
        currentIndex: navigatedIndex,
        onNavigate: (newIndex: number) => {
          navigatedIndex = newIndex;
          this.activeRowIndex = newIndex;
          this.scrollRowIntoView(newIndex);
          this.cdr.detectChanges();
        },
      },
    };
    const dialogRef = this.dialog.open(PlayerCardComponent, {
      data: dialogData,
      maxWidth: '95vw',
      width: 'auto',
      panelClass: 'player-card-dialog',
    });

    // Focus the navigated-to row when dialog closes.
    dialogRef.afterClosed().subscribe(() => {
      this.focusRow(navigatedIndex);
    });
  }

  onRowSelectToggle(row: TableRow): void {
    this.onRowSelect?.(row);
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
        if (!this.showSearch) return;
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

  onRowKeydown(event: KeyboardEvent, row: TableRow, index: number): void {
    switch (event.key) {
      case ' ': {
        if (this.clickable) return;
        if (!this.expandable || !this.shouldShowExpandToggle(row)) return;
        event.preventDefault();
        this.toggleRowExpansion(row, event);
        return;
      }
      case 'Enter': {
        if (this.clickable) {
          event.preventDefault();
          this.selectItem(row);
          return;
        }

        if (!this.expandable || !this.shouldShowExpandToggle(row)) return;
        event.preventDefault();
        this.toggleRowExpansion(row, event);
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

  getRowAriaLabel(row: TableRow, translateKey: string): string {
    const name = this.getRowLabel(row);
    return this.translate.instant(translateKey, { name });
  }

  private getRowLabel(row: TableRow): string {
    const rowWithLabel = row as { name?: string; teamName?: string };
    return rowWithLabel.name ?? rowWithLabel.teamName ?? '';
  }

  private rebuildRowKeyMap(): void {
    this.rowKeyMap = new WeakMap<object, string>();
    this.dataSource.data.forEach((row, index) => {
      this.rowKeyMap.set(row, this.resolveRowKey(row, index));
    });
  }

  private resolveRowKey(row: TableRow, index?: number): string {
    if (this.rowKey) {
      const resolvedIndex = index ?? this.dataSource.data.indexOf(row);
      return this.rowKey(row, resolvedIndex >= 0 ? resolvedIndex : 0);
    }

    const mapped = this.rowKeyMap.get(row);
    if (mapped) return mapped;
    const fallbackIndex = index ?? this.dataSource.data.indexOf(row);
    return String(fallbackIndex >= 0 ? fallbackIndex : 0);
  }

  private refreshRenderedRows(): void {
    this.dataSource.data = [...this.dataSource.data];
    this.cdr.detectChanges();
  }

  private getRowCount(): number {
    return this.tableRootRef?.nativeElement.querySelectorAll('[data-row-index]').length ?? 0;
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
    const tableEl = this.tableRootRef?.nativeElement;
    if (!tableEl) return;

    const rows = Array.from(tableEl.querySelectorAll<HTMLElement>('[data-row-index]'));
    if (rows.length === 0) return;

    const clampedIndex = Math.max(0, Math.min(index, rows.length - 1));
    this.activeRowIndex = clampedIndex;

    const el = rows.find(r => Number(r.dataset['rowIndex']) === clampedIndex);
    if (!el) return;

    el.focus();
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  /** Scroll a row into view without stealing focus (used by dialog navigation callback). */
  private scrollRowIntoView(index: number): void {
    const tableEl = this.tableRootRef?.nativeElement;
    if (!tableEl) return;

    const rows = Array.from(tableEl.querySelectorAll<HTMLElement>('[data-row-index]'));
    if (rows.length === 0) return;

    const clampedIndex = Math.max(0, Math.min(index, rows.length - 1));
    const el = rows.find(r => Number(r.dataset['rowIndex']) === clampedIndex);
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
