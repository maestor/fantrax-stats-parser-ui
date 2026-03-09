import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  MatButtonToggleModule,
  MatButtonToggleChange,
} from '@angular/material/button-toggle';
import { TranslateModule } from '@ngx-translate/core';

import { FilterService, PositionFilter } from '@services/filter.service';

@Component({
  selector: 'app-position-filter-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonToggleModule, TranslateModule],
  templateUrl: './position-filter-toggle.component.html',
  styleUrl: './position-filter-toggle.component.scss',
})
export class PositionFilterToggleComponent {
  private readonly filterService = inject(FilterService);
  readonly positionFilter = computed<PositionFilter>(() =>
    this.filterService.playerFiltersSignal().positionFilter
  );

  onPositionChange(event: MatButtonToggleChange): void {
    const positionFilter = event.value as PositionFilter;
    this.filterService.updatePlayerFilters({ positionFilter });
  }
}
