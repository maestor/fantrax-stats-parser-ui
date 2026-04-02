import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';

import { SettingsService } from '@services/settings.service';

@Component({
  selector: 'app-draft-team-highlight-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSlideToggleModule, TranslateModule],
  templateUrl: './draft-team-highlight-toggle.component.html',
  styleUrl: './draft-team-highlight-toggle.component.scss',
})
export class DraftTeamHighlightToggleComponent {
  private readonly settingsService = inject(SettingsService);

  readonly disabled = this.settingsService.disableDraftSelectedTeamHighlightSignal;

  onToggleChange(event: MatSlideToggleChange): void {
    this.settingsService.setDisableDraftSelectedTeamHighlight(event.checked);
  }
}
