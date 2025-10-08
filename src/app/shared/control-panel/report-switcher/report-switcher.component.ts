import { Component, Input, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, map } from 'rxjs';
import {
  MatButtonToggleModule,
  MatButtonToggleChange,
} from '@angular/material/button-toggle';
import { ReportType } from '@services/api.service';
import { FilterService, FilterState } from '@services/filter.service';

@Component({
  selector: 'app-report-switcher',
  imports: [MatButtonToggleModule, FormsModule, TranslateModule, CommonModule],
  templateUrl: './report-switcher.component.html',
  styleUrl: './report-switcher.component.scss',
})
export class ReportSwitcherComponent implements OnInit, OnDestroy {
  @Input() context: 'player' | 'goalie' = 'player';
  reportType: ReportType = 'regular';
  destroy$ = new Subject<void>();

  filterService = inject(FilterService);
  reportType$ = this.filterService.playerFilters$.pipe(
    map((f) => f.reportType)
  );

  ngOnInit() {
    this.reportType$ = (
      this.context === 'goalie'
        ? this.filterService.goalieFilters$
        : this.filterService.playerFilters$
    ).pipe(
      map((filters: FilterState) => filters.reportType),
      takeUntil(this.destroy$)
    );
  }

  changeReportType(event: MatButtonToggleChange): void {
    this.reportType = event.value;
    this.context === 'goalie'
      ? this.filterService.updateGoalieFilters({ reportType: this.reportType })
      : this.filterService.updatePlayerFilters({ reportType: this.reportType });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
