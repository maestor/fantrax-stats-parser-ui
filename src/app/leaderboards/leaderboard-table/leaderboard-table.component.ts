import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

const STATIC_COLUMNS = ['displayPosition', 'teamName'];

@Component({
  selector: 'app-leaderboard-table',
  standalone: true,
  imports: [MatTableModule, MatSortModule, MatProgressBarModule, MatTooltipModule, TranslateModule],
  templateUrl: './leaderboard-table.component.html',
  styleUrl: './leaderboard-table.component.scss',
})
export class LeaderboardTableComponent implements OnChanges, AfterViewInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  private loadingIntervalId?: ReturnType<typeof setInterval>;
  private loadingStartMs?: number;
  private viewInitialized = false;

  loadingProgress = 0;
  loadingBuffer = 0;
  activeRowIndex = 0;

  private _displayedColumns: string[] = [];
  private _data: any[] = [];

  @Input()
  set displayedColumns(value: string[]) {
    this._displayedColumns = value ?? [];
    this.dynamicColumns = this._displayedColumns.filter(c => !STATIC_COLUMNS.includes(c));
    if (this.viewInitialized) {
      this.effectiveColumns = this._displayedColumns;
    }
  }
  get displayedColumns(): string[] {
    return this._displayedColumns;
  }

  @Input()
  set data(value: any[]) {
    this._data = value ?? [];
    if (this.viewInitialized) {
      this.dataSource.data = this._data;
      this.activeRowIndex = 0;
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
    }
  }
  get data(): any[] {
    return this._data;
  }

  @Input() tableId = 'leaderboard-table';
  @Input() loading = false;
  @Input() apiError = false;
  /** Column key that renders an emoji (🏆) header with the full translation as tooltip. */
  @Input() trophyColumn?: string;
  /** Optional custom cell formatter. Return the display value for a column+raw-value pair. */
  @Input() formatCell: (column: string, value: any) => string = (_, v) => v ?? '';

  dataSource = new MatTableDataSource<any>([]);
  dynamicColumns: string[] = [];
  /** Columns actually passed to *matHeaderRowDef and *matRowDef — only populated after view init
   * so that all @for-generated column definitions are registered before the table renders. */
  effectiveColumns: string[] = [];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChildren('dataRow', { read: ElementRef }) dataRows?: QueryList<ElementRef<HTMLElement>>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loading']) {
      this.onLoadingChanged(this.loading);
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    // Now that @for has rendered all dynamic column defs, it is safe to
    // set the displayed columns and populate the data source.
    this.effectiveColumns = this._displayedColumns;
    this.dataSource.data = this._data;
    this.activeRowIndex = 0;
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.clearLoadingProgressTimer();
  }

  getRowTabIndex(index: number): number {
    return index === this.activeRowIndex ? 0 : -1;
  }

  onRowFocus(index: number): void {
    this.activeRowIndex = index;
  }

  onHeaderKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown') return;
    if ((this.dataRows?.length ?? 0) === 0) return;
    event.preventDefault();
    this.focusRow(0);
  }

  onRowKeydown(event: KeyboardEvent, index: number): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusRow(index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusRow(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        this.focusRow(0);
        break;
      case 'End':
        event.preventDefault();
        this.focusRow((this.dataRows?.length ?? 0) - 1);
        break;
      case 'PageDown':
        event.preventDefault();
        this.focusRow(index + 10);
        break;
      case 'PageUp':
        event.preventDefault();
        this.focusRow(index - 10);
        break;
    }
  }

  private focusRow(index: number): void {
    const rows = this.dataRows?.toArray() ?? [];
    if (rows.length === 0) return;
    const clamped = Math.max(0, Math.min(index, rows.length - 1));
    this.activeRowIndex = clamped;
    rows[clamped]?.nativeElement.focus();
    rows[clamped]?.nativeElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  private onLoadingChanged(isLoading: boolean): void {
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

  private updateLoadingProgress(): void {
    const elapsed = Math.max(0, Date.now() - (this.loadingStartMs ?? Date.now()));
    const progress = Math.min(100, Math.round((elapsed / 60_000) * 100));
    this.loadingProgress = progress;
    this.loadingBuffer = Math.min(100, progress + 15);
  }

  private clearLoadingProgressTimer(): void {
    if (this.loadingIntervalId) {
      clearInterval(this.loadingIntervalId);
      this.loadingIntervalId = undefined;
    }
    this.loadingStartMs = undefined;
  }
}
