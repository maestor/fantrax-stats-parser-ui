import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { StatsModeToggleComponent } from './stats-mode-toggle.component';
import { FilterService } from '@services/filter.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('StatsModeToggleComponent', () => {
  let component: StatsModeToggleComponent;
  let fixture: ComponentFixture<StatsModeToggleComponent>;
  let filterService: FilterService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        StatsModeToggleComponent,
        TranslateModule.forRoot(),
        MatSlideToggleModule,
        NoopAnimationsModule,
      ],
      providers: [FilterService],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsModeToggleComponent);
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

  describe('ngOnInit - player context', () => {
    it('should subscribe to player filters', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      expect(component.statsPerGame).toBe(false);
    }));

    it('should update statsPerGame when player filters change', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      filterService.updatePlayerFilters({ statsPerGame: true });
      tick();

      expect(component.statsPerGame).toBe(true);
    }));
  });

  describe('ngOnInit - goalie context', () => {
    it('should subscribe to goalie filters', fakeAsync(() => {
      component.context = 'goalie';
      component.ngOnInit();
      tick();

      expect(component.statsPerGame).toBe(false);
    }));

    it('should update statsPerGame when goalie filters change', fakeAsync(() => {
      component.context = 'goalie';
      component.ngOnInit();
      tick();

      filterService.updateGoalieFilters({ statsPerGame: true });
      tick();

      expect(component.statsPerGame).toBe(true);
    }));
  });

  describe('toggleMode - player context', () => {
    it('should update player filters when toggled on', fakeAsync(() => {
      component.context = 'player';
      const event = { checked: true } as MatSlideToggleChange;

      component.toggleMode(event);
      tick();

      filterService.playerFilters$.subscribe((filters) => {
        expect(filters.statsPerGame).toBe(true);
      });
    }));

    it('should update player filters when toggled off', fakeAsync(() => {
      component.context = 'player';
      filterService.updatePlayerFilters({ statsPerGame: true });
      tick();

      const event = { checked: false } as MatSlideToggleChange;
      component.toggleMode(event);
      tick();

      filterService.playerFilters$.subscribe((filters) => {
        expect(filters.statsPerGame).toBe(false);
      });
    }));
  });

  describe('toggleMode - goalie context', () => {
    it('should update goalie filters when toggled', fakeAsync(() => {
      component.context = 'goalie';
      const event = { checked: true } as MatSlideToggleChange;

      component.toggleMode(event);
      tick();

      filterService.goalieFilters$.subscribe((filters) => {
        expect(filters.statsPerGame).toBe(true);
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
  });
});
