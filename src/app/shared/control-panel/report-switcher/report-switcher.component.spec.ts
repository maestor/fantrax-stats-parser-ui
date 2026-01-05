import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportSwitcherComponent } from './report-switcher.component';
import { FilterService } from '@services/filter.service';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CommonModule } from '@angular/common';

describe('ReportSwitcherComponent', () => {
  let component: ReportSwitcherComponent;
  let fixture: ComponentFixture<ReportSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportSwitcherComponent, MatButtonToggleModule, CommonModule],
      providers: [FilterService],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should reflect initial player filter reportType', (done) => {
    component.context = 'player';
    component.ngOnInit();
    component.reportType$.subscribe((value) => {
      expect(value).toBe('regular');
      done();
    });
  });

  it('should update player filters on change', () => {
    component.context = 'player';
    component.changeReportType({ value: 'playoffs' } as any);
    component.reportType$.subscribe((value) => {
      expect(value).toBe('playoffs');
    });
  });

  it('should update goalie filters on change when context is goalie', () => {
    component.context = 'goalie';
    component.changeReportType({ value: 'playoffs' } as any);
    component.reportType$.subscribe((value) => {
      expect(value).toBe('playoffs');
    });
  });
});
