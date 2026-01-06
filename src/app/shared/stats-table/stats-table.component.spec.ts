import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatsTableComponent } from './stats-table.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { Player, Goalie } from '@services/api.service';
import { PlayerCardComponent } from '@shared/player-card/player-card.component';
import { of } from 'rxjs';

describe('StatsTableComponent', () => {
  let component: StatsTableComponent;
  let fixture: ComponentFixture<StatsTableComponent>;
  let dialog: MatDialog;

  const mockPlayerData: Player[] = [
    {
      name: 'Player 1',
      score: 84.5,
      scoreAdjustedByGames: 56.03,
      games: 82,
      goals: 50,
      assists: 60,
      points: 110,
      plusMinus: 25,
      penalties: 20,
      shots: 300,
      ppp: 40,
      shp: 2,
      hits: 100,
      blocks: 50,
    },
    {
      name: 'Player 2',
      score: 75.3,
      scoreAdjustedByGames: 80.3,
      games: 75,
      goals: 40,
      assists: 50,
      points: 90,
      plusMinus: 15,
      penalties: 15,
      shots: 250,
      ppp: 30,
      shp: 1,
      hits: 80,
      blocks: 40,
    },
  ];

  const mockGoalieData: Goalie[] = [
    {
      name: 'Goalie 1',
      score: 90.2,
      scoreAdjustedByGames: 70.15,
      games: 65,
      wins: 40,
      saves: 1800,
      shutouts: 5,
      goals: 0,
      assists: 2,
      points: 2,
      penalties: 0,
      ppp: 0,
      shp: 0,
      gaa: '2.50',
      savePercent: '0.915',
    },
  ];

  const playerColumns = [
    'position',
    'name',
    'score',
    'games',
    'goals',
    'assists',
    'points',
    'plusMinus',
    'penalties',
    'shots',
    'ppp',
    'shp',
    'hits',
    'blocks',
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        StatsTableComponent,
        TranslateModule.forRoot(),
        MatDialogModule,
        MatSortModule,
        MatTooltipModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsTableComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(component.data).toEqual([]);
      expect(component.columns).toEqual([]);
      expect(component.defaultSortColumn).toBe('score');
      expect(component.loading).toBe(false);
    });

    it('should initialize dataSource as empty MatTableDataSource', () => {
      expect(component.dataSource).toBeInstanceOf(MatTableDataSource);
      expect(component.dataSource.data).toEqual([]);
    });

    it('should initialize displayedColumns as empty array', () => {
      expect(component.displayedColumns).toEqual([]);
    });

    it('should initialize dynamicColumns as empty array', () => {
      expect(component.dynamicColumns).toEqual([]);
    });
  });

  describe('ngOnChanges', () => {
    it('should update dataSource when data changes', () => {
      const changes = {
        data: new SimpleChange(null, mockPlayerData, true),
      };

      component.data = mockPlayerData;
      component.columns = playerColumns;
      component.ngOnChanges(changes);

      expect(component.dataSource.data).toEqual(mockPlayerData as any);
    });

    it('should set displayedColumns when columns are provided', () => {
      const changes = {
        data: new SimpleChange(null, mockPlayerData, true),
      };

      component.data = mockPlayerData;
      component.columns = playerColumns;
      component.ngOnChanges(changes);

      expect(component.displayedColumns).toEqual(playerColumns);
    });

    it('should filter static columns to create dynamicColumns', () => {
      const changes = {
        data: new SimpleChange(null, mockPlayerData, true),
      };

      component.data = mockPlayerData;
      component.columns = playerColumns;
      component.ngOnChanges(changes);

      expect(component.dynamicColumns).not.toContain('position');
      expect(component.dynamicColumns).toContain('name');
      expect(component.dynamicColumns).toContain('games');
      expect(component.dynamicColumns.length).toBe(playerColumns.length - 1);
    });

    it('should not update displayedColumns if columns are empty', () => {
      const changes = {
        data: new SimpleChange(null, mockPlayerData, true),
      };

      component.data = mockPlayerData;
      component.columns = [];
      component.displayedColumns = ['existing'];
      component.ngOnChanges(changes);

      expect(component.displayedColumns).toEqual(['existing']);
    });

    it('should handle empty data array', () => {
      const changes = {
        data: new SimpleChange(null, [], true),
      };

      component.data = [];
      component.columns = playerColumns;
      component.ngOnChanges(changes);

      expect(component.dataSource.data).toEqual([]);
    });

    it('should keep dataSource.sort assigned when data changes after sort is available', () => {
      component.data = mockPlayerData;
      component.columns = playerColumns;

      fixture.detectChanges();

      const newData = [...mockPlayerData].reverse();
      const changes = {
        data: new SimpleChange(mockPlayerData, newData, false),
      };

      component.data = newData;
      component.ngOnChanges(changes);

      expect(component.dataSource.sort).toBe(component.sort);
    });
  });

  describe('ngAfterViewInit', () => {
    it('should set dataSource sort using the view MatSort instance', () => {
      component.data = mockPlayerData;
      component.columns = playerColumns;

      fixture.detectChanges();

      expect(component.dataSource.sort).toBe(component.sort);
    });

    it('should set default sort column', () => {
      component.defaultSortColumn = 'points';

      fixture.detectChanges();

      expect(component.sort.active).toBe('points');
    });

    it('should set default sort direction to descending', () => {
      fixture.detectChanges();

      expect(component.sort.direction).toBe('desc');
    });
  });

  describe('filterItems', () => {
    it('should filter dataSource based on input value', () => {
      component.data = mockPlayerData;
      component.dataSource.data = mockPlayerData as any;

      const event = {
        target: { value: 'Player 1' },
      } as unknown as Event;

      component.filterItems(event);

      expect(component.dataSource.filter).toBe('player 1');
    });

    it('should trim whitespace from filter value', () => {
      component.dataSource.data = mockPlayerData as any;

      const event = {
        target: { value: '  Player 1  ' },
      } as unknown as Event;

      component.filterItems(event);

      expect(component.dataSource.filter).toBe('player 1');
    });

    it('should convert filter value to lowercase', () => {
      component.dataSource.data = mockPlayerData as any;

      const event = {
        target: { value: 'PLAYER 1' },
      } as unknown as Event;

      component.filterItems(event);

      expect(component.dataSource.filter).toBe('player 1');
    });

    it('should handle empty filter value', () => {
      component.dataSource.data = mockPlayerData as any;

      const event = {
        target: { value: '' },
      } as unknown as Event;

      component.filterItems(event);

      expect(component.dataSource.filter).toBe('');
    });
  });

  describe('selectItem', () => {
    it('should open dialog with PlayerCardComponent', () => {
      spyOn(dialog, 'open').and.returnValue({
        afterClosed: () => of(undefined),
      } as any);

      component.selectItem(mockPlayerData[0]);

      expect(dialog.open).toHaveBeenCalledWith(PlayerCardComponent, {
        data: mockPlayerData[0],
        maxWidth: '95vw',
        width: 'auto',
        panelClass: 'player-card-dialog',
      });
    });

    it('should pass player data to dialog', () => {
      spyOn(dialog, 'open').and.returnValue({
        afterClosed: () => of(undefined),
      } as any);

      const player = mockPlayerData[0];
      component.selectItem(player);

      expect(dialog.open).toHaveBeenCalledWith(
        PlayerCardComponent,
        jasmine.objectContaining({
          data: player,
        })
      );
    });

    it('should pass goalie data to dialog', () => {
      spyOn(dialog, 'open').and.returnValue({
        afterClosed: () => of(undefined),
      } as any);

      const goalie = mockGoalieData[0];
      component.selectItem(goalie);

      expect(dialog.open).toHaveBeenCalledWith(
        PlayerCardComponent,
        jasmine.objectContaining({
          data: goalie,
        })
      );
    });

    it('should use correct dialog configuration', () => {
      spyOn(dialog, 'open').and.returnValue({
        afterClosed: () => of(undefined),
      } as any);

      component.selectItem(mockPlayerData[0]);

      expect(dialog.open).toHaveBeenCalledWith(
        PlayerCardComponent,
        jasmine.objectContaining({
          maxWidth: '95vw',
          width: 'auto',
          panelClass: 'player-card-dialog',
        })
      );
    });
  });

  describe('input properties', () => {
    it('should accept data input', () => {
      component.data = mockPlayerData;
      expect(component.data).toEqual(mockPlayerData);
    });

    it('should accept columns input', () => {
      component.columns = playerColumns;
      expect(component.columns).toEqual(playerColumns);
    });

    it('should accept defaultSortColumn input', () => {
      component.defaultSortColumn = 'points';
      expect(component.defaultSortColumn).toBe('points');
    });

    it('should accept loading input', () => {
      component.loading = true;
      expect(component.loading).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete data update cycle', () => {
      const changes = {
        data: new SimpleChange(null, mockPlayerData, true),
      };

      component.data = mockPlayerData;
      component.columns = playerColumns;
      component.ngOnChanges(changes);

      expect(component.dataSource.data).toEqual(mockPlayerData as any);
      expect(component.displayedColumns).toEqual(playerColumns);
      expect(component.dynamicColumns.length).toBeGreaterThan(0);
    });

    it('should handle data update after initialization with sorting enabled', () => {
      component.data = mockPlayerData;
      component.columns = playerColumns;

      fixture.detectChanges();

      const updatedData = [...mockPlayerData].reverse();
      const changes = {
        data: new SimpleChange(mockPlayerData, updatedData, false),
      };

      component.data = updatedData;
      component.ngOnChanges(changes);

      expect(component.dataSource.data).toEqual(updatedData as any);
      expect(component.dataSource.sort).toBe(component.sort);
    });

    it('should handle switching between player and goalie data', () => {
      let changes = {
        data: new SimpleChange(null, mockPlayerData, true),
      };
      component.data = mockPlayerData;
      component.columns = playerColumns;
      component.ngOnChanges(changes);

      expect(component.dataSource.data).toEqual(mockPlayerData as any);

      changes = {
        data: new SimpleChange(mockPlayerData, mockGoalieData as any, false),
      };
      component.data = mockGoalieData;
      component.ngOnChanges(changes);

      expect(component.dataSource.data).toEqual(mockGoalieData as any);
    });
  });
});
