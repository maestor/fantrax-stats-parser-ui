import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReportType } from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { StatsContext } from '@shared/types/context.types';

@Component({
  selector: 'app-report-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule, TranslateModule],
  templateUrl: './report-switcher.component.html',
  styleUrl: './report-switcher.component.scss',
})
export class ReportSwitcherComponent {
  readonly context = input.required<StatsContext>();
  private readonly filterService = inject(FilterService);
  private readonly playerFilterState = toSignal(this.filterService.playerFilters$, {
    initialValue: this.filterService.playerFilters,
  });
  private readonly goalieFilterState = toSignal(this.filterService.goalieFilters$, {
    initialValue: this.filterService.goalieFilters,
  });
  private readonly filterState = computed(() =>
    this.context() === 'goalie' ? this.goalieFilterState() : this.playerFilterState()
  );

  readonly reportType = computed<ReportType>(() => this.filterState().reportType);

  changeReportType(value: ReportType): void {
    this.context() === 'goalie'
      ? this.filterService.updateGoalieFilters({ reportType: value })
      : this.filterService.updatePlayerFilters({ reportType: value });
  }
}
