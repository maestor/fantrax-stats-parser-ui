import { Component, Input, inject, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, map, Observable, of, BehaviorSubject, distinctUntilChanged, switchMap, withLatestFrom, filter } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ReportType } from '@services/api.service';
import { FilterService, FilterState } from '@services/filter.service';

@Component({
  selector: 'app-report-switcher',
  imports: [MatFormFieldModule, MatSelectModule, TranslateModule, CommonModule, ReactiveFormsModule],
  templateUrl: './report-switcher.component.html',
  styleUrl: './report-switcher.component.scss',
})
export class ReportSwitcherComponent implements OnInit, OnDestroy, OnChanges {
  @Input() context: 'player' | 'goalie' = 'player';
  readonly reportTypeOptions: ReportType[] = ['regular', 'playoffs', 'both'];
  destroy$ = new Subject<void>();

  filterService = inject(FilterService);
  reportType$: Observable<ReportType> = of('regular');

  readonly reportTypeControl = new FormControl<ReportType>('regular', {
    nonNullable: true,
  });

  private readonly context$ = new BehaviorSubject<'player' | 'goalie'>(this.context);

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

    // Drive the control from the filter state (source of truth).
    this.reportType$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.reportTypeControl.setValue(value, { emitEvent: false }));

    // Push user changes back into the filter state.
    this.reportTypeControl.valueChanges
      .pipe(
        distinctUntilChanged(),
        withLatestFrom(this.context$),
        filter(([value]) => !!value),
        takeUntil(this.destroy$)
      )
      .subscribe(([value, context]) => {
        const reportType = value as ReportType;
        context === 'goalie'
          ? this.filterService.updateGoalieFilters({ reportType })
          : this.filterService.updatePlayerFilters({ reportType });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
