import { Component, Input, inject, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, map, Observable, of, BehaviorSubject, distinctUntilChanged, switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReportType } from '@services/api.service';
import { FilterService, FilterState } from '@services/filter.service';
import { StatsContext } from '@shared/types/context.types';

@Component({
  selector: 'app-report-switcher',
  imports: [MatFormFieldModule, MatSelectModule, TranslateModule, AsyncPipe],
  templateUrl: './report-switcher.component.html',
  styleUrl: './report-switcher.component.scss',
})
export class ReportSwitcherComponent implements OnInit, OnDestroy, OnChanges {
  @Input() context: StatsContext = 'player';
  readonly reportTypeOptions: ReportType[] = ['regular', 'playoffs', 'both'];
  destroy$ = new Subject<void>();

  filterService = inject(FilterService);
  reportType$: Observable<ReportType> = of('regular');

  private readonly context$ = new BehaviorSubject<StatsContext>(this.context);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['context']) {
      this.context$.next(this.context);
    }
  }

  ngOnInit() {
    const filters$ = this.context$.pipe(
      distinctUntilChanged(),
      switchMap((context) =>
        context === 'goalie'
          ? this.filterService.goalieFilters$
          : this.filterService.playerFilters$
      )
    );

    this.reportType$ = filters$.pipe(
      map((filters: FilterState) => filters.reportType),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    );
  }

  changeReportType(value: ReportType): void {
    const context = this.context$.value;
    context === 'goalie'
      ? this.filterService.updateGoalieFilters({ reportType: value })
      : this.filterService.updatePlayerFilters({ reportType: value });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
