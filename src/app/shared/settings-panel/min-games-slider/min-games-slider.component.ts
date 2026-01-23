import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
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
export class MinGamesSliderComponent implements OnInit, OnDestroy, OnChanges {
  @Input() context: 'player' | 'goalie' = 'player';
  @Input() maxGames = 0;

  minGames: number = 0;
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

  ngOnChanges(changes: SimpleChanges): void {
    // We need to update minGames if maxGames decreases below it
    if (changes['maxGames'] && this.maxGames < this.minGames) {
      this.minGames = this.maxGames;
      // Defer this so Angular can finish the change detection cycle
      Promise.resolve().then(() => this.onValueChange(this.minGames));
    }
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
