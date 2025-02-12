import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportSwitcherComponent } from './report-switcher.component';

describe('ReportSwitcherComponent', () => {
  let component: ReportSwitcherComponent;
  let fixture: ComponentFixture<ReportSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportSwitcherComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
