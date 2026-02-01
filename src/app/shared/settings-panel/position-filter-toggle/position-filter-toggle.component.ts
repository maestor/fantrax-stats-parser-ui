import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import {
  MatButtonToggleModule,
  MatButtonToggleChange,
} from '@angular/material/button-toggle';
import { TranslateModule } from '@ngx-translate/core';

import { Subject, takeUntil } from 'rxjs';
import { FilterService, FilterState, PositionFilter } from '@services/filter.service';

@Component({
  selector: 'app-position-filter-toggle',
  imports: [MatButtonToggleModule, TranslateModule],
  templateUrl: './position-filter-toggle.component.html',
  styleUrl: './position-filter-toggle.component.scss',
})
export class PositionFilterToggleComponent implements OnInit, OnDestroy {
  @Input() context: 'player' | 'goalie' = 'player';
  positionFilter: PositionFilter = 'all';

  filterService = inject(FilterService);
  destroy$ = new Subject<void>();

  ngOnInit() {
    // Only subscribe for player context - goalies don't use position filter
    if (this.context !== 'player') return;

    this.filterService.playerFilters$
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: FilterState) => {
        this.positionFilter = filters.positionFilter;
      });
  }

  onPositionChange(event: MatButtonToggleChange): void {
    const positionFilter = event.value as PositionFilter;
    this.filterService.updatePlayerFilters({ positionFilter });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
