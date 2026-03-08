import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { Column } from '@shared/column.types';
import { TableRow } from './stats-table.component';

const ROW_NUMBER_COLUMN = '__rowNumber';
const DEFAULT_ROW_HEIGHT = 52;

@Component({
  selector: 'app-virtual-table',
  standalone: true,
  imports: [
    NgClass,
    ScrollingModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSortModule,
    MatTooltipModule,
  ],
  templateUrl: './virtual-table.component.html',
  styleUrl: './virtual-table.component.scss',
})
export class VirtualTableComponent implements OnChanges, AfterViewInit {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() data: TableRow[] = [];
  @Input() columns: Column[] = [];
  @Input() defaultSortColumn!: string;
  @Input() loading = false;
  @Input() apiError = false;
  @Input() searchLabelKey = 'table.playerSearch';
  @Input() formatCell!: (
    row: TableRow,
    column: string,
    value: number | string | undefined,
  ) => string;

  @ViewChild(MatSort) sort?: MatSort;
  @ViewChild(CdkVirtualScrollViewport) viewport?: CdkVirtualScrollViewport;
  @ViewChild(CdkVirtualScrollViewport, { read: ElementRef })
  viewportElementRef?: ElementRef<HTMLElement>;
  @ViewChild('searchInput', { read: ElementRef }) searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('tableRoot', { read: ElementRef }) tableRootRef?: ElementRef<HTMLElement>;

  readonly rowHeight = DEFAULT_ROW_HEIGHT;

  activeRowIndex = 0;
  dynamicColumns: Column[] = [];
  displayedFields: string[] = [];
  gridTemplateColumns = '';
  filteredRows: TableRow[] = [];
  headerScrollbarOffset = 0;
  tableMinWidth = 0;

  private filterValue = '';
  private initialized = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.dynamicColumns = this.columns ?? [];
      this.displayedFields = [ROW_NUMBER_COLUMN, ...this.dynamicColumns.map((column) => column.field)];
      this.gridTemplateColumns = this.buildGridTemplateColumns();
    }

    if (changes['data'] || changes['defaultSortColumn']) {
      this.recomputeRows(true);
    }
  }

  ngAfterViewInit(): void {
    this.initialized = true;

    if (this.sort) {
      this.sort.active = this.defaultSortColumn;
      this.sort.direction = 'desc';
      this.sort.sortChange.subscribe(() => this.recomputeRows(false));
    }

    this.recomputeRows(false);
    queueMicrotask(() => this.syncViewportMetrics());
    this.cdr.detectChanges();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncViewportMetrics();
  }

  getInitialSortDirection(column: Column): SortDirection {
    return column.initialSortDirection ?? 'asc';
  }

  getCellClass(column: Column): { 'col-left': boolean; 'col-center': boolean } {
    return {
      'col-left': column.align === 'left',
      'col-center': column.align !== 'left',
    };
  }

  getCellValue(row: TableRow, field: string): number | string | undefined {
    return (row as Record<string, unknown>)[field] as number | string | undefined;
  }

  formatValue(row: TableRow, field: string): string {
    const value = this.getCellValue(row, field);
    return this.formatCell(row, field, value);
  }

  filterItems(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.recomputeRows(true);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' || this.filteredRows.length === 0) {
      return;
    }

    event.preventDefault();
    this.focusRow(this.activeRowIndex);
  }

  onHeaderKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        if (this.filteredRows.length === 0) return;
        event.preventDefault();
        this.focusRow(0);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.searchInput!.nativeElement.focus();
        return;
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

  onRowKeydown(event: KeyboardEvent, index: number): void {
    switch (event.key) {
      case 'PageDown':
        event.preventDefault();
        this.focusRow(index + 10);
        return;
      case 'PageUp':
        event.preventDefault();
        this.focusRow(index - 10);
        return;
      case 'ArrowDown':
        event.preventDefault();
        this.focusRow(index + 1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.focusRow(index - 1);
        return;
      case 'Home':
        event.preventDefault();
        this.focusRow(0);
        return;
      case 'End':
        event.preventDefault();
        this.focusRow(this.filteredRows.length - 1);
        return;
      default:
        return;
    }
  }

  trackRow = (index: number, row: TableRow): string => {
    const keyValue = (row as Record<string, unknown>)['id'];
    return typeof keyValue === 'string' && keyValue.length > 0 ? keyValue : `${index}`;
  };

  private recomputeRows(resetScroll: boolean): void {
    const filtered = this.data.filter((row) => this.matchesFilter(row));
    this.filteredRows = this.sortRows(filtered);
    this.activeRowIndex = Math.min(this.activeRowIndex, Math.max(0, this.filteredRows.length - 1));

    if (resetScroll) {
      this.activeRowIndex = 0;
      queueMicrotask(() => this.viewport?.scrollToIndex(0));
    }

    queueMicrotask(() => this.syncViewportMetrics());

    if (this.initialized) {
      this.cdr.detectChanges();
    }
  }

  private matchesFilter(row: TableRow): boolean {
    if (!this.filterValue) return true;

    return Object.entries(row as Record<string, unknown>)
      .filter(([key]) => key !== 'id')
      .some(([, value]) => String(value ?? '').toLowerCase().includes(this.filterValue));
  }

  private sortRows(rows: TableRow[]): TableRow[] {
    const active = this.sort?.active || this.defaultSortColumn;
    const direction = (this.sort?.direction || 'desc') as SortDirection;

    const sorted = [...rows].sort((left, right) =>
      this.compareValues(this.getCellValue(left, active), this.getCellValue(right, active))
    );

    return direction === 'asc' ? sorted : sorted.reverse();
  }

  private compareValues(
    left: number | string | undefined,
    right: number | string | undefined,
  ): number {
    if (left == null && right == null) return 0;
    if (left == null) return 1;
    if (right == null) return -1;

    if (typeof left === 'number' && typeof right === 'number') {
      return left - right;
    }

    const leftNumber = Number(left);
    const rightNumber = Number(right);

    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }

    return String(left).localeCompare(String(right), 'fi', { sensitivity: 'base' });
  }

  private buildGridTemplateColumns(): string {
    const columnTracks = this.displayedFields.map((field) => this.resolveColumnTrack(field));
    this.tableMinWidth = columnTracks.reduce((sum, column) => sum + column.minWidth, 0);
    return columnTracks.map((column) => column.track).join(' ');
  }

  private resolveColumnTrack(field: string): { minWidth: number; track: string } {
    switch (field) {
      case ROW_NUMBER_COLUMN:
        return { minWidth: 56, track: '56px' };
      case 'name':
        return { minWidth: 180, track: 'minmax(180px, 2.4fr)' };
      case 'firstSeason':
      case 'lastSeason':
        return { minWidth: 72, track: 'minmax(72px, 0.9fr)' };
      case 'seasonsOwned':
      case 'seasonsPlayedRegular':
      case 'seasonsPlayedPlayoffs':
      case 'teamsOwned':
      case 'teamsPlayedRegular':
      case 'teamsPlayedPlayoffs':
        return { minWidth: 82, track: 'minmax(82px, 1fr)' };
      case 'regularGames':
      case 'playoffGames':
        return { minWidth: 88, track: 'minmax(88px, 1.05fr)' };
      default:
        return { minWidth: 80, track: 'minmax(80px, 1fr)' };
    }
  }

  private syncViewportMetrics(): void {
    const viewportElement = this.viewportElementRef?.nativeElement;

    if (!viewportElement) {
      this.headerScrollbarOffset = 0;
      return;
    }

    const scrollbarWidth = viewportElement.offsetWidth - viewportElement.clientWidth;
    const nextOffset = Math.max(scrollbarWidth, 0);

    if (this.headerScrollbarOffset !== nextOffset) {
      this.headerScrollbarOffset = nextOffset;

      if (this.initialized) {
        this.cdr.detectChanges();
      }
    }
  }

  private focusRow(index: number): void {
    if (this.filteredRows.length === 0) return;

    const clampedIndex = Math.max(0, Math.min(index, this.filteredRows.length - 1));
    this.activeRowIndex = clampedIndex;
    this.viewport?.scrollToIndex(clampedIndex, 'auto');
    this.cdr.detectChanges();

    requestAnimationFrame(() => {
      const row = this.tableRootRef?.nativeElement.querySelector<HTMLElement>(
        `[data-row-index="${clampedIndex}"]`,
      );
      row?.focus();
    });
  }
}
