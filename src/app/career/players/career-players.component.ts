import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { ApiService, CareerPlayerListItem } from '@services/api.service';
import { TableRow } from '@shared/stats-table/stats-table.component';
import { VirtualTableComponent } from '@shared/stats-table/virtual-table.component';
import { CAREER_PLAYER_COLUMNS } from '@shared/table-columns';
import { Column } from '@shared/column.types';
import { formatSeasonDisplay } from '@shared/utils/season.utils';

type CareerPlayerTableRow = CareerPlayerListItem & { playerPosition: string };

@Component({
  selector: 'app-career-players',
  standalone: true,
  imports: [VirtualTableComponent],
  templateUrl: './career-players.component.html',
})
export class CareerPlayersComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  readonly columns: Column[] = CAREER_PLAYER_COLUMNS;
  readonly defaultSortColumn = 'regularGames';
  readonly searchLabelKey = 'table.careerPlayerSearch';
  readonly formatCell = (column: string, value: number | string | undefined): string =>
    this.formatCellValue(column, value);
  readonly rowKey = (row: TableRow, index: number): string =>
    ((row as CareerPlayerTableRow).id || `${index}`);

  data: CareerPlayerTableRow[] = [];
  loading = true;
  apiError = false;

  ngOnInit(): void {
    this.loading = true;
    this.apiService
      .getCareerPlayers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.data = data.map((row) => ({
            ...row,
            playerPosition: row.position,
          }));
          this.loading = false;
        },
        error: () => {
          this.data = [];
          this.apiError = true;
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private formatCellValue(column: string, value: number | string | undefined): string {
    if ((column === 'firstSeason' || column === 'lastSeason') && typeof value === 'number') {
      return formatSeasonDisplay(value);
    }

    return value === undefined ? '-' : String(value);
  }
}
