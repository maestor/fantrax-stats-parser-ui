import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatSliderModule } from '@angular/material/slider';
import { FilterService } from '@services/filter.service';
import { StatsContext } from '@shared/types/context.types';

@Component({
  selector: 'app-min-games-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MatSliderModule],
  templateUrl: './min-games-slider.component.html',
  styleUrl: './min-games-slider.component.scss',
})
export class MinGamesSliderComponent {
  readonly context = input.required<StatsContext>();
  readonly maxGames = input.required<number>();

  private readonly filterService = inject(FilterService);
  private readonly filterState = computed(() =>
    this.context() === 'goalie'
      ? this.filterService.goalieFiltersSignal()
      : this.filterService.playerFiltersSignal()
  );

  readonly minGames = computed(() => this.filterState().minGames);

  constructor() {
    effect(() => {
      const maxGames = this.maxGames();
      const minGames = this.minGames();

      if (maxGames < minGames) {
        queueMicrotask(() => this.onValueChange(maxGames));
      }
    });
  }

  onValueChange(minGames: number): void {
    const clampedMinGames = Math.max(0, Math.min(minGames, this.maxGames()));

    if (this.context() === 'goalie') {
      this.filterService.updateGoalieFilters({ minGames: clampedMinGames });
    } else {
      this.filterService.updatePlayerFilters({ minGames: clampedMinGames });
    }
  }
}
