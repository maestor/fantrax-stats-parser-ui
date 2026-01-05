import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MinGamesSliderComponent } from './min-games-slider.component';
import { FilterService } from '@services/filter.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatSliderModule } from '@angular/material/slider';
import { SimpleChange } from '@angular/core';

describe('MinGamesSliderComponent', () => {
  let component: MinGamesSliderComponent;
  let fixture: ComponentFixture<MinGamesSliderComponent>;
  let filterService: FilterService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinGamesSliderComponent, TranslateModule.forRoot(), MatSliderModule],
      providers: [FilterService],
    }).compileComponents();

    fixture = TestBed.createComponent(MinGamesSliderComponent);
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

    it('should initialize maxGames to 0', () => {
      expect(component.maxGames).toBe(0);
    });

    it('should initialize minGames to 0', () => {
      expect(component.minGames).toBe(0);
    });
  });

  describe('ngOnInit - player context', () => {
    it('should subscribe to player filters when context is player', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      expect(component.minGames).toBe(0);
    }));

    it('should update minGames when player filters change', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      filterService.updatePlayerFilters({ minGames: 10 });
      tick();

      expect(component.minGames).toBe(10);
    }));

    it('should track multiple player filter updates', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      filterService.updatePlayerFilters({ minGames: 5 });
      tick();
      expect(component.minGames).toBe(5);

      filterService.updatePlayerFilters({ minGames: 15 });
      tick();
      expect(component.minGames).toBe(15);

      filterService.updatePlayerFilters({ minGames: 20 });
      tick();
      expect(component.minGames).toBe(20);
    }));
  });

  describe('ngOnInit - goalie context', () => {
    it('should subscribe to goalie filters when context is goalie', fakeAsync(() => {
      component.context = 'goalie';
      component.ngOnInit();
      tick();

      expect(component.minGames).toBe(0);
    }));

    it('should update minGames when goalie filters change', fakeAsync(() => {
      component.context = 'goalie';
      component.ngOnInit();
      tick();

      filterService.updateGoalieFilters({ minGames: 5 });
      tick();

      expect(component.minGames).toBe(5);
    }));

    it('should not be affected by player filter changes', fakeAsync(() => {
      component.context = 'goalie';
      component.ngOnInit();
      tick();

      filterService.updatePlayerFilters({ minGames: 10 });
      tick();

      expect(component.minGames).toBe(0);
    }));
  });

  describe('ngOnChanges', () => {
    it('should not change minGames if maxGames is greater', () => {
      component.minGames = 10;
      component.maxGames = 20;

      const changes = {
        maxGames: new SimpleChange(0, 20, false),
      };

      component.ngOnChanges(changes);
      expect(component.minGames).toBe(10);
    });

    it('should update minGames when maxGames decreases below it', fakeAsync(() => {
      component.context = 'player';
      component.minGames = 20;
      component.maxGames = 10;

      const changes = {
        maxGames: new SimpleChange(30, 10, false),
      };

      component.ngOnChanges(changes);
      tick();

      expect(component.minGames).toBe(10);
    }));

    it('should call onValueChange when minGames is adjusted', fakeAsync(() => {
      spyOn(component, 'onValueChange');
      component.minGames = 25;
      component.maxGames = 15;

      const changes = {
        maxGames: new SimpleChange(30, 15, false),
      };

      component.ngOnChanges(changes);
      tick();

      expect(component.onValueChange).toHaveBeenCalledWith(15);
    }));

    it('should handle maxGames equal to minGames', fakeAsync(() => {
      component.minGames = 10;
      component.maxGames = 10;

      const changes = {
        maxGames: new SimpleChange(15, 10, false),
      };

      component.ngOnChanges(changes);
      tick();

      expect(component.minGames).toBe(10);
    }));

    it('should not trigger update if maxGames has not changed', () => {
      spyOn(component, 'onValueChange');
      component.minGames = 10;

      const changes = {};
      component.ngOnChanges(changes);

      expect(component.onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('onValueChange - player context', () => {
    it('should update player filters when context is player', fakeAsync(() => {
      component.context = 'player';

      let result: number | undefined;
      filterService.playerFilters$.subscribe((filters) => {
        result = filters.minGames;
      });

      component.onValueChange(15);
      tick();

      expect(result).toBe(15);
    }));

    it('should not affect goalie filters when context is player', fakeAsync(() => {
      component.context = 'player';

      let result: number | undefined;
      filterService.goalieFilters$.subscribe((filters) => {
        result = filters.minGames;
      });

      component.onValueChange(10);
      tick();

      expect(result).toBe(0);
    }));

    it('should handle multiple value changes', fakeAsync(() => {
      component.context = 'player';

      let result: number | undefined;
      filterService.playerFilters$.subscribe((filters) => {
        result = filters.minGames;
      });

      component.onValueChange(5);
      tick();
      component.onValueChange(10);
      tick();
      component.onValueChange(15);
      tick();

      expect(result).toBe(15);
    }));
  });

  describe('onValueChange - goalie context', () => {
    it('should update goalie filters when context is goalie', fakeAsync(() => {
      component.context = 'goalie';

      let result: number | undefined;
      filterService.goalieFilters$.subscribe((filters) => {
        result = filters.minGames;
      });

      component.onValueChange(8);
      tick();

      expect(result).toBe(8);
    }));

    it('should not affect player filters when context is goalie', fakeAsync(() => {
      component.context = 'goalie';

      let result: number | undefined;
      filterService.playerFilters$.subscribe((filters) => {
        result = filters.minGames;
      });

      component.onValueChange(12);
      tick();

      expect(result).toBe(0);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should unsubscribe from filter changes', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      component.ngOnDestroy();

      filterService.updatePlayerFilters({ minGames: 20 });
      tick();

      expect(component.minGames).toBe(0);
    }));
  });

  describe('edge cases', () => {
    it('should handle minGames of 0', fakeAsync(() => {
      component.context = 'player';

      let result: number | undefined;
      filterService.playerFilters$.subscribe((filters) => {
        result = filters.minGames;
      });

      component.onValueChange(0);
      tick();

      expect(result).toBe(0);
    }));

    it('should handle large minGames values', fakeAsync(() => {
      component.context = 'player';

      let result: number | undefined;
      filterService.playerFilters$.subscribe((filters) => {
        result = filters.minGames;
      });

      component.onValueChange(100);
      tick();

      expect(result).toBe(100);
    }));

    it('should handle rapid maxGames changes', fakeAsync(() => {
      component.minGames = 50;

      let changes = { maxGames: new SimpleChange(100, 40, false) };
      component.maxGames = 40;
      component.ngOnChanges(changes);
      tick();

      changes = { maxGames: new SimpleChange(40, 30, false) };
      component.maxGames = 30;
      component.ngOnChanges(changes);
      tick();

      expect(component.minGames).toBe(30);
    }));
  });

  describe('integration scenarios', () => {
    it('should synchronize with filter service on init and update', fakeAsync(() => {
      filterService.updatePlayerFilters({ minGames: 10 });
      tick();

      component.context = 'player';
      component.ngOnInit();
      tick();

      expect(component.minGames).toBe(10);

      let result: number | undefined;
      filterService.playerFilters$.subscribe((filters) => {
        result = filters.minGames;
      });

      component.onValueChange(15);
      tick();

      expect(result).toBe(15);
      expect(component.minGames).toBe(15);
    }));

    it('should handle context switching', fakeAsync(() => {
      component.context = 'player';
      component.ngOnInit();
      tick();

      component.onValueChange(10);
      tick();

      component.ngOnDestroy();
      component.context = 'goalie';
      component.ngOnInit();
      tick();

      expect(component.minGames).toBe(0);

      let result: number | undefined;
      filterService.goalieFilters$.subscribe((filters) => {
        result = filters.minGames;
      });

      component.onValueChange(5);
      tick();

      expect(result).toBe(5);
    }));
  });
});
