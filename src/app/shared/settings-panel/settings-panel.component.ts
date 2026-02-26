import { Component, Input } from '@angular/core';
import { StatsContext } from '@shared/types/context.types';
import { TranslateModule } from '@ngx-translate/core';
import { PositionFilterToggleComponent } from './position-filter-toggle/position-filter-toggle.component';
import { StatsModeToggleComponent } from './stats-mode-toggle/stats-mode-toggle.component';
import { MinGamesSliderComponent } from './min-games-slider/min-games-slider.component';

@Component({
  selector: 'app-settings-panel',
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
  @Input() context: StatsContext = 'player';
  @Input() maxGames = 0;
  @Input() contentOnly = false;
  isExpanded = false;

  toggleExpanded(): void {
    if (this.contentOnly) return;
    this.isExpanded = !this.isExpanded;
  }
}
