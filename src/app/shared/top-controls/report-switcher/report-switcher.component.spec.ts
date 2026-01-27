import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReportSwitcherComponent } from './report-switcher.component';
import { FilterService } from '@services/filter.service';
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
      expect(component.reportTypeControl.value).toBe('regular');
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

      expect(component.reportTypeControl.value).toBe('playoffs');

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

      expect(component.reportTypeControl.value).toBe('playoffs');

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

      expect(component.reportTypeControl.value).toBe('playoffs');

      component.reportType$.subscribe((value) => {
        expect(value).toBe('playoffs');
      });
    }));
  });

  describe('user interactions', () => {
    it('should update player filters when control value changes', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      let result: string | undefined;
      filterService.playerFilters$.subscribe((filters) => {
        result = filters.reportType;
      });

      component.reportTypeControl.setValue('playoffs');
      tick();

      expect(result).toBe('playoffs');
    }));

    it('should sync reportType to goalie filters (global sync)', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      component.reportTypeControl.setValue('playoffs');
      tick();

      filterService.goalieFilters$.subscribe((filters) => {
        expect(filters.reportType).toBe('playoffs');
      });
    }));

    it('should support selecting both', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      component.reportTypeControl.setValue('both');
      tick();

      filterService.playerFilters$.subscribe((filters) => {
        expect(filters.reportType).toBe('both');
      });
    }));

    it('should update goalie filters when control value changes in goalie context', fakeAsync(() => {
      component.context = 'goalie';
      component.ngOnChanges({
        context: {
          currentValue: 'goalie',
          previousValue: 'player',
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      component.ngOnInit();
      tick();

      component.reportTypeControl.setValue('both');
      tick();

      filterService.goalieFilters$.subscribe((filters) => {
        expect(filters.reportType).toBe('both');
      });
    }));

    it('should work correctly after context change', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      component.reportTypeControl.setValue('playoffs');
      tick();

      // simulate input change
      component.context = 'goalie';
      component.ngOnChanges({
        context: {
          currentValue: 'goalie',
          previousValue: 'player',
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      tick();

      expect(component.reportTypeControl.value).toBe('playoffs');
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

      filterService.updatePlayerFilters({ reportType: 'playoffs' });
      tick();

      component.context = 'goalie';
      component.ngOnChanges({
        context: {
          currentValue: 'goalie',
          previousValue: 'player',
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      tick();

      expect(component.reportTypeControl.value).toBe('playoffs');
    }));
  });
});
