import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  MatSlideToggleModule,
  MatSlideToggleChange,
} from '@angular/material/slide-toggle';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';

import { FilterService } from '@services/filter.service';
import { StatsContext } from '@shared/types/context.types';

@Component({
  selector: 'app-stats-mode-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSlideToggleModule, ...TRANSLATE_IMPORTS],
  templateUrl: './stats-mode-toggle.component.html',
})
export class StatsModeToggleComponent {
  readonly context = input.required<StatsContext>();
  private readonly filterService = inject(FilterService);
  private readonly filterState = computed(() =>
    this.context() === 'goalie'
      ? this.filterService.goalieFiltersSignal()
      : this.filterService.playerFiltersSignal()
  );

  readonly statsPerGame = computed(() => this.filterState().statsPerGame);

  toggleMode(event: MatSlideToggleChange): void {
    const statsPerGame = event.checked;
    this.context() === 'goalie'
      ? this.filterService.updateGoalieFilters({ statsPerGame })
      : this.filterService.updatePlayerFilters({ statsPerGame });
  }
}
