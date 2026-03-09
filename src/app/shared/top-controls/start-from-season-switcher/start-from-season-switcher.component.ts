import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { StartFromSeasonSyncService } from './start-from-season-sync.service';

@Component({
  selector: 'app-start-from-season-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule, TranslateModule],
  templateUrl: './start-from-season-switcher.component.html',
  styleUrl: './start-from-season-switcher.component.scss',
})
export class StartFromSeasonSwitcherComponent {
  private readonly startFromSeasonSync = inject(StartFromSeasonSyncService);
  readonly seasons = this.startFromSeasonSync.seasons;
  readonly selectedStartFrom = this.startFromSeasonSync.selectedStartFrom;
  readonly selectedStartFromText = this.startFromSeasonSync.selectedStartFromText;

  changeStartFrom(event: MatSelectChange): void {
    this.startFromSeasonSync.setSelectedStartFrom(event.value);
  }
}
