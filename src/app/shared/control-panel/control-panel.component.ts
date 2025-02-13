import { Component } from '@angular/core';
import { ReportSwitcherComponent } from './report-switcher/report-switcher.component';
import { SeasonSwitcherComponent } from './season-switcher/season-switcher.component';

@Component({
  selector: 'app-control-panel',
  imports: [ReportSwitcherComponent, SeasonSwitcherComponent],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.scss',
})
export class ControlPanelComponent {}
