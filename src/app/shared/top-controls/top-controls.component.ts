import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TeamSwitcherComponent } from './team-switcher/team-switcher.component';
import { ReportSwitcherComponent } from './report-switcher/report-switcher.component';
import { SeasonSwitcherComponent } from './season-switcher/season-switcher.component';
import { StartFromSeasonSwitcherComponent } from './start-from-season-switcher/start-from-season-switcher.component';
import { SettingsService } from '@services/settings.service';
import { StatsContext } from '@shared/types/context.types';

@Component({
  selector: 'app-top-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class TopControlsComponent {
  readonly context = input.required<StatsContext>();
  readonly contentOnly = input(false);
  private readonly settingsService = inject(SettingsService);
  private readonly persistedExpanded = toSignal(this.settingsService.topControlsExpanded$, {
    initialValue: this.settingsService.topControlsExpanded,
  });

  readonly isExpanded = computed(() =>
    this.contentOnly() ? true : this.persistedExpanded()
  );

  toggleExpanded(): void {
    if (this.contentOnly()) return;
    this.settingsService.setTopControlsExpanded(!this.isExpanded());
  }
}
