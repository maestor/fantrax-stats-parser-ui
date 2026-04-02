import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';

import { SettingsService } from '@services/settings.service';

@Component({
  selector: 'app-selected-team-highlight-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSlideToggleModule, TranslateModule],
  templateUrl: './selected-team-highlight-toggle.component.html',
  styleUrl: './selected-team-highlight-toggle.component.scss',
})
export class SelectedTeamHighlightToggleComponent {
  private readonly settingsService = inject(SettingsService);

  readonly disabled = this.settingsService.disableSelectedTeamHighlightSignal;

  onToggleChange(event: MatSlideToggleChange): void {
    this.settingsService.setDisableSelectedTeamHighlight(event.checked);
  }
}
