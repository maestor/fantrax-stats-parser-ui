import { Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { StatsTableComponent, TableRow } from '@shared/stats-table/stats-table.component';
import { Column } from '@shared/column.types';
import { ExpandedRowViewModel } from '@shared/table-row-expansion.types';
import { derivePositions } from '@shared/utils/position.utils';
import { RegularLeaderboardEntry, PlayoffLeaderboardEntry } from '@services/api.service';

type LeaderboardEntry = RegularLeaderboardEntry | PlayoffLeaderboardEntry;
type LeaderboardRow = LeaderboardEntry & { displayPosition: string };

@Component({
  selector: 'app-leaderboard',
  imports: [StatsTableComponent],
  template: `
    <app-stats-table
      [data]="data"
      [columns]="columns()"
      [loading]="loading"
      [apiError]="apiError"
      [showSearch]="false"
      [showPositionColumn]="false"
      [clickable]="false"
      [selectRow]="false"
      [formatCell]="formatCell()"
      [expandable]="true"
      [rowKey]="rowKeyForTable"
      [isRowExpandable]="isRowExpandableForTable"
      [expandedRowsFor]="expandedRowsForTable"
      [expandToggleAriaLabel]="expandToggleAriaLabelForTable"
      [expandedHeaderLabels]="expandedHeaderLabels()"
      defaultSortColumn=""
      tableId="leaderboard-table"
    />
  `,
})
export class LeaderboardComponent implements OnInit {
  readonly fetchFn = input.required<() => Observable<LeaderboardEntry[]>>();
  readonly columns = input.required<Column[]>();
  readonly formatCell = input<
    ((column: string, value: number | string | undefined) => string) | undefined
  >();
  readonly rowKey = input.required<(row: LeaderboardRow, index: number) => string>();
  readonly isRowExpandable = input.required<(row: LeaderboardRow) => boolean>();
  readonly expandedRowsFor = input.required<(row: LeaderboardRow) => ExpandedRowViewModel[]>();
  readonly expandToggleAriaLabel = input.required<
    (row: LeaderboardRow, expanded: boolean) => string
  >();
  readonly expandedHeaderLabels = input.required<{
    season: string;
    primary: string;
    secondary?: string;
  }>();
  private destroyRef = inject(DestroyRef);

  readonly rowKeyForTable = (row: TableRow, index: number): string =>
    this.rowKey()(row as LeaderboardRow, index);
  readonly isRowExpandableForTable = (row: TableRow): boolean =>
    this.isRowExpandable()(row as LeaderboardRow);
  readonly expandedRowsForTable = (row: TableRow): ExpandedRowViewModel[] =>
    this.expandedRowsFor()(row as LeaderboardRow);
  readonly expandToggleAriaLabelForTable = (row: TableRow, expanded: boolean): string =>
    this.expandToggleAriaLabel()(row as LeaderboardRow, expanded);

  data: LeaderboardRow[] = [];
  loading = true;
  apiError = false;

  ngOnInit(): void {
    this.loading = true;
    this.fetchFn()()
      .pipe(takeUntilDestroyed(this.destroyRef))
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
}
