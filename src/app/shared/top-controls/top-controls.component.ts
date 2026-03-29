import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TeamSwitcherComponent } from './team-switcher/team-switcher.component';
import { ReportSwitcherComponent } from './report-switcher/report-switcher.component';
import { SeasonSwitcherComponent } from './season-switcher/season-switcher.component';
import { StartFromSeasonSwitcherComponent } from './start-from-season-switcher/start-from-season-switcher.component';
import { StatsContext } from '@shared/types/context.types';

@Component({
  selector: 'app-top-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TeamSwitcherComponent,
    StartFromSeasonSwitcherComponent,
    SeasonSwitcherComponent,
    ReportSwitcherComponent,
  ],
  templateUrl: './top-controls.component.html',
  styleUrl: './top-controls.component.scss',
})
export class TopControlsComponent {
  readonly context = input.required<StatsContext>();
}
