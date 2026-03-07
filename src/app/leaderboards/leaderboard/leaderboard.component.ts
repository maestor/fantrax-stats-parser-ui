import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject, Observable, takeUntil } from 'rxjs';
import { StatsTableComponent, TableRow } from '@shared/stats-table/stats-table.component';
import { Column } from '@shared/column.types';
import { ExpandedRowViewModel } from '@shared/table-row-expansion.types';
import { derivePositions } from '@shared/utils/position.utils';
import { RegularLeaderboardEntry, PlayoffLeaderboardEntry } from '@services/api.service';

type LeaderboardEntry = RegularLeaderboardEntry | PlayoffLeaderboardEntry;
type LeaderboardRow = LeaderboardEntry & { displayPosition: string };

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [StatsTableComponent],
  template: `
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
      [expandable]="true"
      [rowKey]="rowKeyForTable"
      [isRowExpandable]="isRowExpandableForTable"
      [expandedRowsFor]="expandedRowsForTable"
      [expandToggleAriaLabel]="expandToggleAriaLabelForTable"
      [expandedHeaderLabels]="expandedHeaderLabels"
      defaultSortColumn=""
      tableId="leaderboard-table"
    />
  `,
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  @Input() fetchFn!: () => Observable<LeaderboardEntry[]>;
  @Input() columns: Column[] = [];
  @Input() formatCell?: (column: string, value: number | string | undefined) => string;
  @Input() rowKey?: (row: LeaderboardRow, index: number) => string;
  @Input({ required: true }) isRowExpandable!: (row: LeaderboardRow) => boolean;
  @Input({ required: true }) expandedRowsFor!: (row: LeaderboardRow) => ExpandedRowViewModel[];
  @Input() expandToggleAriaLabel?: (row: LeaderboardRow, expanded: boolean) => string;
  @Input() expandedHeaderLabels?: { season: string; primary: string; secondary?: string };
  readonly rowKeyForTable = (row: TableRow, index: number): string =>
    this.rowKey?.(row as LeaderboardRow, index) ?? String(index);
  readonly isRowExpandableForTable = (row: TableRow): boolean =>
    this.isRowExpandable(row as LeaderboardRow);
  readonly expandedRowsForTable = (row: TableRow): ExpandedRowViewModel[] =>
    this.expandedRowsFor(row as LeaderboardRow);
  readonly expandToggleAriaLabelForTable = (row: TableRow, expanded: boolean): string =>
    this.expandToggleAriaLabel?.(row as LeaderboardRow, expanded) ?? '';

  private destroy$ = new Subject<void>();

  data: LeaderboardRow[] = [];
  loading = true;
  apiError = false;

  ngOnInit(): void {
    this.loading = true;
    this.fetchFn()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.data = derivePositions(data);
          this.loading = false;
        },
        error: () => {
          this.apiError = true;
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
