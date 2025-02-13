import { Component, inject } from '@angular/core';
import {
  MatSlideToggleModule,
  MatSlideToggleChange,
} from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { FilterService } from '@services/filter.service';

@Component({
  selector: 'app-stats-mode-toggle',
  imports: [MatSlideToggleModule, TranslateModule],
  templateUrl: './stats-mode-toggle.component.html',
  styleUrl: './stats-mode-toggle.component.scss',
})
export class StatsModeToggleComponent {
  private filterService = inject(FilterService);

  toggleMode(event: MatSlideToggleChange): void {
    this.filterService.toggleStatsMode(event.checked);
  }
}
