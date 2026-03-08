import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { StatsContext } from '@shared/types/context.types';
import { TranslateModule } from '@ngx-translate/core';
import { PositionFilterToggleComponent } from './position-filter-toggle/position-filter-toggle.component';
import { StatsModeToggleComponent } from './stats-mode-toggle/stats-mode-toggle.component';
import { MinGamesSliderComponent } from './min-games-slider/min-games-slider.component';

@Component({
  selector: 'app-settings-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    PositionFilterToggleComponent,
    StatsModeToggleComponent,
    MinGamesSliderComponent,
  ],
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.scss',
})
export class SettingsPanelComponent {
  readonly context = input.required<StatsContext>();
  readonly maxGames = input.required<number>();
  readonly contentOnly = input(false);
  private readonly expandedState = signal(false);

  readonly isExpanded = computed(() =>
    this.contentOnly() ? true : this.expandedState()
  );

  toggleExpanded(): void {
    if (this.contentOnly()) return;
    this.expandedState.update((expanded) => !expanded);
  }
}
