import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { ApiService, Season } from '@services/api.service';
import { FilterService, FilterState } from '@services/filter.service';

@Component({
  selector: 'app-season-switcher',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    TranslateModule,
    CommonModule,
  ],
  templateUrl: './season-switcher.component.html',
  styleUrl: './season-switcher.component.scss',
})
export class SeasonSwitcherComponent implements OnInit, OnDestroy {
  @Input() context: 'player' | 'goalie' = 'player';
  seasons: Season[] = [];
  selectedSeason?: number;

  apiService = inject(ApiService);
  filterService = inject(FilterService);
  destroy$ = new Subject<void>();

  ngOnInit() {
    this.apiService.getSeasons().subscribe((data) => {
      this.seasons = [...data].reverse();
    });

    const filters$ =
      this.context === 'goalie'
        ? this.filterService.goalieFilters$
        : this.filterService.playerFilters$;

    filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: FilterState) => {
        this.selectedSeason = filters.season;
      });
  }

  changeSeason(event: MatSelectChange): void {
    const season = event.value;
    this.context === 'goalie'
      ? this.filterService.updateGoalieFilters({ season })
      : this.filterService.updatePlayerFilters({ season });
  }

  trackBySeason(_: number, season: Season) {
    return season.season;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
