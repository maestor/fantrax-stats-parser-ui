import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, tap } from 'rxjs';

import { ApiService, CareerGoalieListItem } from '@services/api.service';
import { TableRow } from '@shared/stats-table/stats-table.component';
import { VirtualTableComponent } from '@shared/stats-table/virtual-table.component';
import { CAREER_GOALIE_COLUMNS } from '@shared/table-columns';
import { Column } from '@shared/column.types';
import { formatSeasonDisplay } from '@shared/utils/season.utils';
import { FooterVisibilityService } from '@services/footer-visibility.service';

@Component({
  selector: 'app-career-goalies',
  imports: [VirtualTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './career-goalies.component.html',
})
export class CareerGoaliesComponent {
  private readonly apiService = inject(ApiService);
  private readonly footerVisibilityService = inject(FooterVisibilityService);

  readonly columns: Column[] = CAREER_GOALIE_COLUMNS;
  readonly searchLabelKey = 'table.playerSearch';
  readonly formatCell = (
    _row: TableRow,
    column: string,
    value: number | string | undefined,
  ): string => this.formatCellValue(column, value);

  private readonly footerVisibilityCycle = this.footerVisibilityService.currentCycle();
  readonly requestState = toSignal(
    this.apiService.getCareerGoalies().pipe(
      map((data) => ({ data, loading: false, apiError: false })),
      catchError(() => of({ data: [] as CareerGoalieListItem[], loading: false, apiError: true })),
      tap(() => this.footerVisibilityService.markReady(this.footerVisibilityCycle)),
    ),
    { initialValue: { data: [] as CareerGoalieListItem[], loading: true, apiError: false } },
  );

  private formatCellValue(column: string, value: number | string | undefined): string {
    if ((column === 'firstSeason' || column === 'lastSeason') && typeof value === 'number') {
      return formatSeasonDisplay(value);
    }

    return value === undefined ? '-' : String(value);
  }
}
