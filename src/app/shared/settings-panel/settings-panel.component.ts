import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatsContext } from '@shared/types/context.types';
import { PositionFilterToggleComponent } from './position-filter-toggle/position-filter-toggle.component';
import { StatsModeToggleComponent } from './stats-mode-toggle/stats-mode-toggle.component';
import { MinGamesSliderComponent } from './min-games-slider/min-games-slider.component';

@Component({
  selector: 'app-settings-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PositionFilterToggleComponent,
    StatsModeToggleComponent,
    MinGamesSliderComponent,
  ],
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.scss',
})
export class SettingsPanelComponent {
  readonly context = input.required<StatsContext>();
  readonly layout = input<'default' | 'drawer'>('default');
  readonly maxGames = input.required<number>();
}
