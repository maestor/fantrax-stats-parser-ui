import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import {
  MatSlideToggleModule,
  MatSlideToggleChange,
} from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { FilterService, FilterState } from '@services/filter.service';

@Component({
  selector: 'app-stats-mode-toggle',
  imports: [MatSlideToggleModule, TranslateModule, CommonModule],
  templateUrl: './stats-mode-toggle.component.html',
  styleUrl: './stats-mode-toggle.component.scss',
})
export class StatsModeToggleComponent implements OnInit, OnDestroy {
  @Input() context: 'player' | 'goalie' = 'player';
  statsPerGame = false;

  filterService = inject(FilterService);
  destroy$ = new Subject<void>();

  ngOnInit() {
    const filters$ =
      this.context === 'goalie'
        ? this.filterService.goalieFilters$
        : this.filterService.playerFilters$;

    filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: FilterState) => {
        this.statsPerGame = filters.statsPerGame;
      });
  }

  toggleMode(event: MatSlideToggleChange): void {
    const statsPerGame = event.checked;
    this.context === 'goalie'
      ? this.filterService.updateGoalieFilters({ statsPerGame })
      : this.filterService.updatePlayerFilters({ statsPerGame });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
