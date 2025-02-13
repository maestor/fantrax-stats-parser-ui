import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  MatButtonToggleModule,
  MatButtonToggleChange,
} from '@angular/material/button-toggle';
import { ReportType } from '@services/api.service';
import { FilterService } from '@services/filter.service';

@Component({
  selector: 'app-report-switcher',
  imports: [MatButtonToggleModule, FormsModule, TranslateModule],
  templateUrl: './report-switcher.component.html',
  styleUrl: './report-switcher.component.scss',
})
export class ReportSwitcherComponent {
  filterService = inject(FilterService);

  reportType: ReportType = 'regular';

  changeReportType(event: MatButtonToggleChange): void {
    this.reportType = event.value;
    this.filterService.updateReportType(this.reportType);
  }
}
