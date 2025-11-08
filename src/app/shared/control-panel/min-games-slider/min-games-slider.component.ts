import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatSliderModule } from '@angular/material/slider';
import { Subject, takeUntil } from 'rxjs';
import { FilterService, FilterState } from '@services/filter.service';

@Component({
  selector: 'app-min-games-slider',
  imports: [TranslateModule, MatSliderModule],
  templateUrl: './min-games-slider.component.html',
  styleUrl: './min-games-slider.component.scss',
})
export class MinGamesSliderComponent implements OnInit, OnDestroy {
  @Input() context: 'player' | 'goalie' = 'player';
  @Input() maxGames = 0;

  minGames = 0;
  private filterService = inject(FilterService);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    const filters$ =
      this.context === 'goalie'
        ? this.filterService.goalieFilters$
        : this.filterService.playerFilters$;
    filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: FilterState) => {
        this.minGames = filters.minGames;
      });
  }

  onValueChange(minGames: number) {
    if (this.context === 'goalie') {
      this.filterService.updateGoalieFilters({ minGames });
    } else {
      this.filterService.updatePlayerFilters({ minGames });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
