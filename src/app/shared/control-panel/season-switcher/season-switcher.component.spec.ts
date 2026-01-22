import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SeasonSwitcherComponent } from './season-switcher.component';
import { ApiService, Season } from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

describe('SeasonSwitcherComponent', () => {
  let component: SeasonSwitcherComponent;
  let fixture: ComponentFixture<SeasonSwitcherComponent>;
  let apiService: ApiService;
  let filterService: FilterService;

  const mockSeasons: Season[] = [
    { season: 2024, text: '2024-25' },
    { season: 2023, text: '2023-24' },
    { season: 2022, text: '2022-23' },
  ];

  beforeEach(async () => {
    const apiServiceMock = {
      getSeasons: jasmine
        .createSpy('getSeasons')
        .and.returnValue(of(mockSeasons)),
    };

    await TestBed.configureTestingModule({
      imports: [
        SeasonSwitcherComponent,
        TranslateModule.forRoot(),
        MatSelectModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        FilterService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonSwitcherComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
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

  describe('ngOnInit', () => {
    it('should load seasons on init', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(apiService.getSeasons).toHaveBeenCalledWith('regular');
      expect(component.seasons.length).toBe(3);
    }));

    it('should reverse seasons order (newest first)', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.seasons[0].season).toBe(2022);
      expect(component.seasons[2].season).toBe(2024);
    }));

    it('should subscribe to player filters when context is player', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      expect(component.selectedSeason).toBeUndefined();
    }));

    it('should update selectedSeason when player filters change', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      filterService.updatePlayerFilters({ season: 2024 });
      tick();

      expect(component.selectedSeason).toBe(2024);
    }));

    it('should subscribe to goalie filters when context is goalie', fakeAsync(() => {
      component.context = 'goalie';
      component.ngOnInit();
      tick();

      filterService.updateGoalieFilters({ season: 2023 });
      tick();

      expect(component.selectedSeason).toBe(2023);
    }));

    it('should refetch seasons when reportType changes', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      (apiService.getSeasons as jasmine.Spy).calls.reset();

      filterService.updatePlayerFilters({ reportType: 'playoffs' });
      tick();

      expect(apiService.getSeasons).toHaveBeenCalledWith('playoffs');
    }));
  });

  describe('changeSeason', () => {
    it('should update player filters when context is player', fakeAsync(() => {
      component.context = 'player';
      const event = { value: 2024 } as MatSelectChange;

      let result: number | undefined;
      filterService.playerFilters$.subscribe((filters) => {
        result = filters.season;
      });

      component.changeSeason(event);
      tick();

      expect(result).toBe(2024);
    }));

    it('should update goalie filters when context is goalie', fakeAsync(() => {
      component.context = 'goalie';
      const event = { value: 2023 } as MatSelectChange;

      let result: number | undefined;
      filterService.goalieFilters$.subscribe((filters) => {
        result = filters.season;
      });

      component.changeSeason(event);
      tick();

      expect(result).toBe(2023);
    }));

    it('should handle undefined season', fakeAsync(() => {
      component.context = 'player';
      const event = { value: undefined } as MatSelectChange;

      let result: number | undefined;
      filterService.playerFilters$.subscribe((filters) => {
        result = filters.season;
      });

      component.changeSeason(event);
      tick();

      expect(result).toBeUndefined();
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
