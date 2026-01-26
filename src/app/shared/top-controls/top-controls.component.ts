import { Component, Input, OnInit, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TeamSwitcherComponent } from './team-switcher/team-switcher.component';
import { ReportSwitcherComponent } from './report-switcher/report-switcher.component';
import { SeasonSwitcherComponent } from './season-switcher/season-switcher.component';
import { StartFromSeasonSwitcherComponent } from './start-from-season-switcher/start-from-season-switcher.component';
import { SettingsService } from '@services/settings.service';

@Component({
  selector: 'app-top-controls',
  imports: [
    TranslateModule,
    TeamSwitcherComponent,
    StartFromSeasonSwitcherComponent,
    SeasonSwitcherComponent,
    ReportSwitcherComponent,
  ],
  templateUrl: './top-controls.component.html',
  styleUrl: './top-controls.component.scss',
})
export class TopControlsComponent implements OnInit {
  @Input() context: 'player' | 'goalie' = 'player';
  @Input() contentOnly = false;

  isExpanded = true;

  private readonly settingsService = inject(SettingsService);

  ngOnInit(): void {
    this.isExpanded = this.contentOnly ? true : this.settingsService.topControlsExpanded;
  }

  toggleExpanded(): void {
    if (this.contentOnly) return;
    this.isExpanded = !this.isExpanded;
    this.settingsService.setTopControlsExpanded(this.isExpanded);
  }
}
