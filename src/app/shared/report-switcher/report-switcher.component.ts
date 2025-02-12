import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  MatButtonToggleModule,
  MatButtonToggleChange,
} from '@angular/material/button-toggle';
import { ReportType } from '@services/api.service';

@Component({
  selector: 'app-report-switcher',
  imports: [MatButtonToggleModule, FormsModule, TranslateModule],
  templateUrl: './report-switcher.component.html',
  styleUrl: './report-switcher.component.scss',
})
export class ReportSwitcherComponent {
  @Output() changeReportTypeEvent = new EventEmitter<ReportType>();

  reportType: ReportType = 'regular';

  onChangeReportType(event: MatButtonToggleChange): void {
    this.changeReportTypeEvent.emit(event.value);
    this.reportType = event.value;
  }
}
