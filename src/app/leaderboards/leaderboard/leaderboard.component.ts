import {
  Component,
  DestroyRef,
  Injector,
  OnInit,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { StatsTableComponent, TableRow } from '@shared/stats-table/stats-table.component';
import { Column } from '@shared/column.types';
import { ExpandedRowViewModel } from '@shared/table-row-expansion.types';
import { derivePositions } from '@shared/utils/position.utils';
import {
  RegularLeaderboardEntry,
  PlayoffLeaderboardEntry,
  TransactionLeaderboardEntry,
} from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { SettingsService } from '@services/settings.service';

type LeaderboardEntry =
  | RegularLeaderboardEntry
  | PlayoffLeaderboardEntry
  | TransactionLeaderboardEntry;
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
  private readonly statsTable = viewChild(StatsTableComponent);
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
  readonly blankTieRanks = input(true);
  readonly expandedHeaderLabels = input.required<{
    season: string;
    primary: string;
    secondary?: string;
  }>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly footerVisibilityService = inject(FooterVisibilityService);
  private readonly injector = inject(Injector);
  private readonly settingsService = inject(SettingsService);
  private readonly leaderboardRowsState = signal<LeaderboardRow[]>([]);
  private readonly selectedTeamId = this.settingsService.selectedTeamIdSignal;
  private readonly disableSelectedTeamHighlight = this.settingsService.disableSelectedTeamHighlightSignal;

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
  private footerVisibilityCycle = 0;

  constructor() {
    effect(() => {
      const statsTable = this.statsTable();
      const rows = this.leaderboardRowsState();
      const selectedTeamId = this.selectedTeamId();
      const disableSelectedTeamHighlight = this.disableSelectedTeamHighlight();

      if (!statsTable) {
        return;
      }

      const nextFocusedRowKey = !disableSelectedTeamHighlight
        && rows.some((row) => row.teamId === selectedTeamId)
        ? selectedTeamId
        : null;

      afterNextRender(() => {
        this.focusSelectedTeamRow(statsTable, nextFocusedRowKey);
      }, { injector: this.injector });
    });
  }

  ngOnInit(): void {
    this.footerVisibilityCycle = this.footerVisibilityService.currentCycle();
    this.loading = true;
    this.fetchFn()()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.data = derivePositions(data, {
            blankTieRanks: this.blankTieRanks(),
          });
          this.leaderboardRowsState.set(this.data);
          this.loading = false;
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
        error: () => {
          this.data = [];
          this.leaderboardRowsState.set([]);
          this.apiError = true;
          this.loading = false;
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
      });
  }

  private focusSelectedTeamRow(
    statsTable: StatsTableComponent,
    nextFocusedRowKey: string | null,
  ): void {
    if (nextFocusedRowKey === null) {
      return;
    }

    statsTable.focusRowByKey(nextFocusedRowKey);
  }
}
