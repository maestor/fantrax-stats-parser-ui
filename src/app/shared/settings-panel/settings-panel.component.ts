import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { StatsModeToggleComponent } from './stats-mode-toggle/stats-mode-toggle.component';
import { MinGamesSliderComponent } from './min-games-slider/min-games-slider.component';

@Component({
  selector: 'app-settings-panel',
  imports: [
    TranslateModule,
    StatsModeToggleComponent,
    MinGamesSliderComponent,
  ],
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.scss',
})
export class SettingsPanelComponent {
  @Input() context: 'player' | 'goalie' = 'player';
  @Input() maxGames = 0;
  isExpanded = false;

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }
}
