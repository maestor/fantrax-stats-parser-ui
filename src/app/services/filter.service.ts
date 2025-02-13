import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ReportType } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private reportTypeSource = new BehaviorSubject<ReportType>('regular');
  private seasonSource = new BehaviorSubject<number | undefined>(undefined);

  reportType$ = this.reportTypeSource.asObservable();
  season$ = this.seasonSource.asObservable();

  updateReportType(reportType: ReportType) {
    this.reportTypeSource.next(reportType);
  }

  updateSeason(season?: number) {
    this.seasonSource.next(season);
  }
}
