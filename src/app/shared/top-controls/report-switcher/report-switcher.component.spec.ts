import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReportSwitcherComponent } from './report-switcher.component';
import { FilterService } from '@services/filter.service';
import { MatButtonToggleModule, MatButtonToggleChange } from '@angular/material/button-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ReportSwitcherComponent', () => {
  let component: ReportSwitcherComponent;
  let fixture: ComponentFixture<ReportSwitcherComponent>;
  let filterService: FilterService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReportSwitcherComponent,
        MatButtonToggleModule,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [FilterService],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportSwitcherComponent);
    component = fixture.componentInstance;
    filterService = TestBed.inject(FilterService);
  });

  afterEach(() => {
    if (component) {
      component.ngOnDestroy();
    }
    filterService.resetPlayerFilters();
    filterService.resetGoalieFilters();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should have default context as player', () => {
      expect(component.context).toBe('player');
    });

    it('should initialize reportType to regular', () => {
      expect(component.reportType).toBe('regular');
    });

    it('should initialize reportType$ observable', () => {
      expect(component.reportType$).toBeDefined();
    });
  });

  describe('ngOnInit - player context', () => {
    it('should reflect initial player filter reportType', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      component.reportType$.subscribe((value) => {
        expect(value).toBe('regular');
      });
    }));

    it('should update reportType$ when player filters change', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      filterService.updatePlayerFilters({ reportType: 'playoffs' });
      tick();

      component.reportType$.subscribe((value) => {
        expect(value).toBe('playoffs');
      });
    }));

    it('should emit multiple values as filters change', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      const emissions: string[] = [];
      component.reportType$.subscribe((value) => emissions.push(value));
      tick();

      filterService.updatePlayerFilters({ reportType: 'playoffs' });
      tick();

      filterService.updatePlayerFilters({ reportType: 'regular' });
      tick();

      expect(emissions).toContain('regular');
      expect(emissions).toContain('playoffs');
    }));
  });

  describe('ngOnInit - goalie context', () => {
    it('should reflect initial goalie filter reportType', fakeAsync(() => {
      component.context = 'goalie';
      component.ngOnInit();
      tick();

      component.reportType$.subscribe((value) => {
        expect(value).toBe('regular');
      });
    }));

    it('should update reportType$ when goalie filters change', fakeAsync(() => {
      component.context = 'goalie';
      component.ngOnInit();
      tick();

      filterService.updateGoalieFilters({ reportType: 'playoffs' });
      tick();

      component.reportType$.subscribe((value) => {
        expect(value).toBe('playoffs');
      });
    }));

    it('should be updated when player filter reportType changes (global sync)', fakeAsync(() => {
      component.context = 'goalie';
      component.ngOnInit();
      tick();

      filterService.updatePlayerFilters({ reportType: 'playoffs' });
      tick();

      component.reportType$.subscribe((value) => {
        expect(value).toBe('playoffs');
      });
    }));
  });

  describe('changeReportType - player context', () => {
    it('should update player filters on change', fakeAsync(() => {
      component.context = 'player';
      const event = { value: 'playoffs' } as MatButtonToggleChange;

      let result: string | undefined;
      filterService.playerFilters$.subscribe((filters) => {
        result = filters.reportType;
      });

      component.changeReportType(event);
      tick();

      expect(result).toBe('playoffs');
    }));

    it('should update component reportType property', () => {
      component.context = 'player';
      const event = { value: 'playoffs' } as MatButtonToggleChange;

      component.changeReportType(event);

      expect(component.reportType).toBe('playoffs');
    });

    it('should sync reportType to goalie filters', fakeAsync(() => {
      component.context = 'player';
      const event = { value: 'playoffs' } as MatButtonToggleChange;

      component.changeReportType(event);
      tick();

      filterService.goalieFilters$.subscribe((filters) => {
        expect(filters.reportType).toBe('playoffs');
      });
    }));

    it('should handle switching back to regular', fakeAsync(() => {
      component.context = 'player';

      let event = { value: 'playoffs' } as MatButtonToggleChange;
      component.changeReportType(event);
      tick();

      event = { value: 'regular' } as MatButtonToggleChange;
      component.changeReportType(event);
      tick();

      filterService.playerFilters$.subscribe((filters) => {
        expect(filters.reportType).toBe('regular');
      });
    }));
  });

  describe('changeReportType - goalie context', () => {
    it('should update goalie filters on change', fakeAsync(() => {
      component.context = 'goalie';
      const event = { value: 'playoffs' } as MatButtonToggleChange;

      let result: string | undefined;
      filterService.goalieFilters$.subscribe((filters) => {
        result = filters.reportType;
      });

      component.changeReportType(event);
      tick();

      expect(result).toBe('playoffs');
    }));

    it('should sync reportType to player filters', fakeAsync(() => {
      component.context = 'goalie';
      const event = { value: 'playoffs' } as MatButtonToggleChange;

      component.changeReportType(event);
      tick();

      filterService.playerFilters$.subscribe((filters) => {
        expect(filters.reportType).toBe('playoffs');
      });
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      spyOn(component.destroy$, 'next');
      spyOn(component.destroy$, 'complete');

      component.ngOnDestroy();

      expect(component.destroy$.next).toHaveBeenCalled();
      expect(component.destroy$.complete).toHaveBeenCalled();
    });

    it('should unsubscribe from filter changes', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      const emissions: string[] = [];
      component.reportType$.subscribe((value) => emissions.push(value));
      tick();

      component.ngOnDestroy();

      filterService.updatePlayerFilters({ reportType: 'playoffs' });
      tick();

      expect(emissions.filter((e) => e === 'playoffs').length).toBe(0);
    }));
  });

  describe('integration scenarios', () => {
    it('should synchronize observable with filter service', fakeAsync(() => {
      component.context = 'player';
      filterService.updatePlayerFilters({ reportType: 'playoffs' });
      tick();

      component.ngOnInit();
      tick();

      component.reportType$.subscribe((value) => {
        expect(value).toBe('playoffs');
      });
    }));

    it('should handle rapid filter changes', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      const emissions: string[] = [];
      component.reportType$.subscribe((value) => emissions.push(value));
      tick();

      filterService.updatePlayerFilters({ reportType: 'playoffs' });
      tick();
      filterService.updatePlayerFilters({ reportType: 'regular' });
      tick();
      filterService.updatePlayerFilters({ reportType: 'playoffs' });
      tick();

      expect(emissions[emissions.length - 1]).toBe('playoffs');
    }));

    it('should work correctly after context change', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      const event = { value: 'playoffs' } as MatButtonToggleChange;
      component.changeReportType(event);
      tick();

      component.ngOnDestroy();

      component.context = 'goalie';
      component.ngOnInit();
      tick();

      component.reportType$.subscribe((value) => {
        expect(value).toBe('playoffs');
      });
    }));
  });
});
