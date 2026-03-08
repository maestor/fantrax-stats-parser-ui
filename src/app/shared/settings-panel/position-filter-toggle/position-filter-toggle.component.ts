import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
  private readonly playerFilterState = toSignal(this.filterService.playerFilters$, {
    initialValue: this.filterService.playerFilters,
  });

  readonly positionFilter = computed<PositionFilter>(() =>
    this.playerFilterState().positionFilter
  );

  onPositionChange(event: MatButtonToggleChange): void {
    const positionFilter = event.value as PositionFilter;
    this.filterService.updatePlayerFilters({ positionFilter });
  }
}
