import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

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
  templateUrl: './career-goalies.component.html',
})
export class CareerGoaliesComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly destroy$ = new Subject<void>();
  private readonly footerVisibilityService = inject(FooterVisibilityService);

  readonly columns: Column[] = CAREER_GOALIE_COLUMNS;
  readonly searchLabelKey = 'table.playerSearch';
  readonly formatCell = (
    _row: TableRow,
    column: string,
    value: number | string | undefined,
  ): string => this.formatCellValue(column, value);

  data: CareerGoalieListItem[] = [];
  loading = true;
  apiError = false;
  private footerVisibilityCycle = 0;

  ngOnInit(): void {
    this.footerVisibilityCycle = this.footerVisibilityService.currentCycle();
    this.loading = true;
    this.apiService
      .getCareerGoalies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.data = data;
          this.loading = false;
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
        error: () => {
          this.data = [];
          this.apiError = true;
          this.loading = false;
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
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
