import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReportSwitcherComponent } from './report-switcher/report-switcher.component';
import { SeasonSwitcherComponent } from './season-switcher/season-switcher.component';
import { StatsModeToggleComponent } from './stats-mode-toggle/stats-mode-toggle.component';
import { MinGamesSliderComponent } from './min-games-slider/min-games-slider.component';

@Component({
  selector: 'app-control-panel',
  imports: [
    TranslateModule,
    ReportSwitcherComponent,
    SeasonSwitcherComponent,
    StatsModeToggleComponent,
    MinGamesSliderComponent,
  ],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.scss',
})
export class ControlPanelComponent {
  @Input() context: 'player' | 'goalie' = 'player';
  @Input() maxGames = 0;
  isExpanded = false;

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }
}
