import { Component, Input } from '@angular/core';
import { ReportSwitcherComponent } from './report-switcher/report-switcher.component';
import { SeasonSwitcherComponent } from './season-switcher/season-switcher.component';
import { StatsModeToggleComponent } from './stats-mode-toggle/stats-mode-toggle.component';

@Component({
  selector: 'app-control-panel',
  imports: [
    ReportSwitcherComponent,
    SeasonSwitcherComponent,
    StatsModeToggleComponent,
  ],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.scss',
})
export class ControlPanelComponent {
  @Input() context: 'player' | 'goalie' = 'player';
}
