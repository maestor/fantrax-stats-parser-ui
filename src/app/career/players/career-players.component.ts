import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, tap } from 'rxjs';

import { ApiService, CareerPlayerListItem } from '@services/api.service';
import { TableRow } from '@shared/stats-table/stats-table.component';
import { VirtualTableComponent } from '@shared/stats-table/virtual-table.component';
import { CAREER_PLAYER_COLUMNS } from '@shared/table-columns';
import { Column } from '@shared/column.types';
import { formatSeasonDisplay } from '@shared/utils/season.utils';
import { FooterVisibilityService } from '@services/footer-visibility.service';

@Component({
  selector: 'app-career-players',
  imports: [VirtualTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './career-players.component.html',
})
export class CareerPlayersComponent {
  private readonly apiService = inject(ApiService);
  private readonly footerVisibilityService = inject(FooterVisibilityService);

  readonly columns: Column[] = CAREER_PLAYER_COLUMNS;
  readonly searchLabelKey = 'table.careerPlayerSearch';
  readonly formatCell = (
    row: TableRow,
    column: string,
    value: number | string | undefined,
  ): string => this.formatCellValue(row as CareerPlayerListItem, column, value);

  private readonly footerVisibilityCycle = this.footerVisibilityService.currentCycle();
  readonly requestState = toSignal(
    this.apiService.getCareerPlayers().pipe(
      map((data) => ({ data, loading: false, apiError: false })),
      catchError(() => of({ data: [] as CareerPlayerListItem[], loading: false, apiError: true })),
      tap(() => this.footerVisibilityService.markReady(this.footerVisibilityCycle)),
    ),
    { initialValue: { data: [] as CareerPlayerListItem[], loading: true, apiError: false } },
  );

  private formatCellValue(
    row: CareerPlayerListItem,
    column: string,
    value: number | string | undefined,
  ): string {
    if (column === 'name') {
      return `${row.position} ${String(value ?? '-')}`;
    }

    if ((column === 'firstSeason' || column === 'lastSeason') && typeof value === 'number') {
      return formatSeasonDisplay(value);
    }

    return value === undefined ? '-' : String(value);
  }
}
