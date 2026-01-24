import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { StatsTableComponent } from './stats-table.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ElementRef, SimpleChange } from '@angular/core';
import { Player, Goalie } from '@services/api.service';
import { PlayerCardComponent } from '@shared/player-card/player-card.component';
import { of } from 'rxjs';

describe('StatsTableComponent', () => {
  let component: StatsTableComponent;
  let fixture: ComponentFixture<StatsTableComponent>;
  let dialog: MatDialog;
  let translate: TranslateService;

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
    translate = TestBed.inject(TranslateService);

    translate.setTranslation(
      'fi',
      {
        a11y: {
          skipToTable: 'Siirry taulukkoon',
          openPlayerCard: 'Avaa pelaajakortti: {{name}}',
          tableNavigationHint:
            'Käytä ylös/alas näppäimiä selataksesi taulukkoa. PageUp/PageDown hyppää 10 riviä. Paina Enter tai välilyönti avataksesi pelaajakortin.',
        },
        table: {
          playerSearch: 'Pelaajahaku',
          noSearchResults: 'Ei hakutuloksia',
          loading: 'Ladataan dataa...',
          loadingWarmup:
            'Kärsivällisyyttä.. rajapinta saattaa käynnistyä jopa minuutin',
          apiUnavailable: 'Rajapinta ei ole saatavilla juuri nyt.',
        },
      },
      true
    );
    translate.use('fi');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('keyboard interaction', () => {
    it('should set activeRowIndex on row focus', () => {
      component.activeRowIndex = 0;
      component.onRowFocus(1);
      expect(component.activeRowIndex).toBe(1);
      expect(component.getRowTabIndex(1)).toBe(0);
      expect(component.getRowTabIndex(0)).toBe(-1);
    });

    it('should open player card on Enter key', () => {
      const selectSpy = spyOn(component, 'selectItem');
      const event = {
        key: 'Enter',
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any as KeyboardEvent;

      component.onRowKeydown(event, mockPlayerData[0], 0);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(selectSpy).toHaveBeenCalledWith(mockPlayerData[0]);
    });

    it('should open player card on Space key', () => {
      const selectSpy = spyOn(component, 'selectItem');
      const event = {
        key: ' ',
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any as KeyboardEvent;

      component.onRowKeydown(event, mockPlayerData[0], 0);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(selectSpy).toHaveBeenCalledWith(mockPlayerData[0]);
    });

    it('should move focus with Arrow keys, Home/End and PageUp/PageDown', () => {
      const focusSpy = spyOn<any>(component as any, 'focusRow');
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any as KeyboardEvent;

      component.onRowKeydown({ ...event, key: 'ArrowDown' } as any, mockPlayerData[0], 5);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalledWith(6);

      component.onRowKeydown({ ...event, key: 'ArrowUp' } as any, mockPlayerData[0], 5);
      expect(focusSpy).toHaveBeenCalledWith(4);

      component.onRowKeydown({ ...event, key: 'Home' } as any, mockPlayerData[0], 5);
      expect(focusSpy).toHaveBeenCalledWith(0);

      spyOn<any>(component as any, 'getRowCount').and.returnValue(20);
      component.onRowKeydown({ ...event, key: 'End' } as any, mockPlayerData[0], 5);
      expect(focusSpy).toHaveBeenCalledWith(19);

      component.onRowKeydown({ ...event, key: 'PageDown' } as any, mockPlayerData[0], 5);
      expect(focusSpy).toHaveBeenCalledWith(15);

      component.onRowKeydown({ ...event, key: 'PageUp' } as any, mockPlayerData[0], 5);
      expect(focusSpy).toHaveBeenCalledWith(-5);
    });

    it('should ignore unhandled keys on row', () => {
      const focusSpy = spyOn<any>(component as any, 'focusRow');
      const event = {
        key: 'Escape',
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any as KeyboardEvent;

      component.onRowKeydown(event, mockPlayerData[0], 0);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(focusSpy).not.toHaveBeenCalled();
    });
  });

  describe('search and header key handling', () => {
    it('onSearchKeydown should ignore other keys', () => {
      const focusSpy = spyOn<any>(component as any, 'focusRow');
      const event = {
        key: 'ArrowUp',
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any as KeyboardEvent;

      component.onSearchKeydown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(focusSpy).not.toHaveBeenCalled();
    });

    it('onSearchKeydown should not move focus when there are no rows', () => {
      const focusSpy = spyOn<any>(component as any, 'focusRow');
      spyOn<any>(component as any, 'getRowCount').and.returnValue(0);

      const event = {
        key: 'ArrowDown',
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any as KeyboardEvent;

      component.onSearchKeydown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(focusSpy).not.toHaveBeenCalled();
    });

    it('onSearchKeydown should focus the active row when ArrowDown is pressed', () => {
      const focusSpy = spyOn<any>(component as any, 'focusRow');
      spyOn<any>(component as any, 'getRowCount').and.returnValue(2);
      component.activeRowIndex = 1;

      const event = {
        key: 'ArrowDown',
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any as KeyboardEvent;

      component.onSearchKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalledWith(1);
    });

    it('onHeaderKeydown ArrowDown should focus first row when rows exist', () => {
      const focusSpy = spyOn<any>(component as any, 'focusRow');
      spyOn<any>(component as any, 'getRowCount').and.returnValue(3);

      const event = {
        key: 'ArrowDown',
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any as KeyboardEvent;

      component.onHeaderKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalledWith(0);
    });

    it('onHeaderKeydown ArrowDown should do nothing when there are no rows', () => {
      const focusSpy = spyOn<any>(component as any, 'focusRow');
      spyOn<any>(component as any, 'getRowCount').and.returnValue(0);

      const event = {
        key: 'ArrowDown',
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any as KeyboardEvent;

      component.onHeaderKeydown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(focusSpy).not.toHaveBeenCalled();
    });

    it('onHeaderKeydown ArrowUp should focus the search input when available', () => {
      const input = document.createElement('input');
      const focusSpy = spyOn(input, 'focus');
      component.searchInput = new ElementRef(input);

      const event = {
        key: 'ArrowUp',
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any as KeyboardEvent;

      component.onHeaderKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('onHeaderKeydown ArrowUp should do nothing when search input is missing', () => {
      component.searchInput = undefined;
      const event = {
        key: 'ArrowUp',
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any as KeyboardEvent;

      component.onHeaderKeydown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('focus management helpers', () => {
    it('ensureActiveRowInRange should reset to 0 when there are no rows', () => {
      spyOn<any>(component as any, 'getRowCount').and.returnValue(0);
      component.activeRowIndex = 5;

      (component as any).ensureActiveRowInRange();

      expect(component.activeRowIndex).toBe(0);
    });

    it('ensureActiveRowInRange should clamp negative and too-large indices', () => {
      spyOn<any>(component as any, 'getRowCount').and.returnValue(3);

      component.activeRowIndex = -10;
      (component as any).ensureActiveRowInRange();
      expect(component.activeRowIndex).toBe(0);

      component.activeRowIndex = 999;
      (component as any).ensureActiveRowInRange();
      expect(component.activeRowIndex).toBe(2);
    });

    it('focusRow should no-op when there are no rendered rows', () => {
      component.dataRows = {
        toArray: () => [],
        length: 0,
      } as any;

      component.activeRowIndex = 2;
      (component as any).focusRow(1);

      expect(component.activeRowIndex).toBe(2);
    });

    it('focusRow should clamp index and focus/scroll the row element', () => {
      const row0 = document.createElement('div');
      row0.tabIndex = 0;
      const row1 = document.createElement('div');
      row1.tabIndex = 0;

      const focus0 = spyOn(row0, 'focus');
      const focus1 = spyOn(row1, 'focus');

      // scrollIntoView isn't implemented in JSDOM; stub as needed.
      (row0 as any).scrollIntoView = jasmine.createSpy('scrollIntoView');
      (row1 as any).scrollIntoView = jasmine.createSpy('scrollIntoView');

      component.dataRows = {
        toArray: () => [new ElementRef(row0), new ElementRef(row1)],
        length: 2,
      } as any;

      (component as any).focusRow(999);
      expect(component.activeRowIndex).toBe(1);
      expect(focus1).toHaveBeenCalled();

      (component as any).focusRow(-10);
      expect(component.activeRowIndex).toBe(0);
      expect(focus0).toHaveBeenCalled();
    });

    it('focusRow should no-op when the row element is missing', () => {
      component.dataRows = {
        toArray: () => [{ nativeElement: null }],
        length: 1,
      } as any;

      component.activeRowIndex = 0;
      (component as any).focusRow(0);

      expect(component.activeRowIndex).toBe(0);
    });
  });

  describe('accessibility labeling', () => {
    it('getRowAriaLabel should include player name when present', () => {
      const instantSpy = spyOn(translate, 'instant').and.callThrough();
      const label = component.getRowAriaLabel({ name: 'Test Name' } as any);
      expect(instantSpy).toHaveBeenCalledWith('a11y.openPlayerCard', { name: 'Test Name' });
      expect(label).toContain('Test Name');
    });

    it('getRowAriaLabel should still call translate with empty name when missing', () => {
      const instantSpy = spyOn(translate, 'instant').and.callThrough();
      component.getRowAriaLabel({} as any);
      expect(instantSpy).toHaveBeenCalledWith('a11y.openPlayerCard', { name: '' });
    });
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

    it('should update sort.active when defaultSortColumn changes after view init', () => {
      component.data = mockPlayerData;
      component.columns = playerColumns;
      fixture.detectChanges();

      expect(component.sort.active).toBe('score');

      component.defaultSortColumn = 'points';
      component.ngOnChanges({
        defaultSortColumn: new SimpleChange('score', 'points', false),
      });

      expect(component.sort.active).toBe('points');
      expect(component.sort.direction).toBe('desc');
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

    it('should fall back to first non-position column when desired sort column is not displayed', () => {
      component.data = mockPlayerData;
      component.columns = playerColumns;
      fixture.detectChanges();

      component.displayedColumns = ['position', 'name', 'games'];
      component.defaultSortColumn = 'nonexistent';

      (component as any).applyDefaultSort();

      expect(component.sort.active).toBe('name');
      expect(component.sort.direction).toBe('desc');
    });

    it('should fall back to first column when only position column exists', () => {
      component.data = mockPlayerData;
      component.columns = playerColumns;
      fixture.detectChanges();

      component.displayedColumns = ['position'];
      component.defaultSortColumn = 'nonexistent';

      (component as any).applyDefaultSort();

      expect(component.sort.active).toBe('position');
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

  describe('loading messages', () => {
    it('should show short loading message during the first 2 seconds', fakeAsync(() => {
      component.data = [];
      component.columns = playerColumns;
      component.loading = true;

      component.ngOnChanges({
        loading: new SimpleChange(false, true, false),
        data: new SimpleChange(null, [], true),
      });
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Ladataan dataa...');
      expect(fixture.nativeElement.textContent).not.toContain(
        'Kärsivällisyyttä.. rajapinta saattaa käynnistyä jopa minuutin'
      );

      tick(1999);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Ladataan dataa...');
    }));

    it('should switch to warmup message after 2 seconds of loading', fakeAsync(() => {
      component.data = [];
      component.columns = playerColumns;
      component.loading = true;

      component.ngOnChanges({
        loading: new SimpleChange(false, true, false),
        data: new SimpleChange(null, [], true),
      });
      fixture.detectChanges();

      tick(2000);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(
        'Kärsivällisyyttä.. rajapinta saattaa käynnistyä jopa minuutin'
      );
    }));

    it('should not show warmup message if loading ends before 2 seconds', fakeAsync(() => {
      component.data = [];
      component.columns = playerColumns;
      component.loading = true;

      component.ngOnChanges({
        loading: new SimpleChange(false, true, false),
        data: new SimpleChange(null, [], true),
      });
      fixture.detectChanges();

      tick(1000);
      component.loading = false;
      component.ngOnChanges({
        loading: new SimpleChange(true, false, false),
      });
      fixture.detectChanges();

      tick(2000);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).not.toContain(
        'Kärsivällisyyttä.. rajapinta saattaa käynnistyä jopa minuutin'
      );
      expect(fixture.nativeElement.textContent).toContain('Ei hakutuloksia');
    }));

    it('should show API unavailable message when apiError is true', fakeAsync(() => {
      component.data = [];
      component.columns = playerColumns;
      component.loading = false;
      component.apiError = true;

      component.ngOnChanges({
        apiError: new SimpleChange(false, true, false),
        data: new SimpleChange(null, [], true),
      });
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(
        'Rajapinta ei ole saatavilla juuri nyt.'
      );
      expect(fixture.nativeElement.textContent).not.toContain('Ladataan dataa...');
    }));
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

  describe('Sticky Headers Feature', () => {
    it('should have table container with proper overflow styles for scrolling', () => {
      component.data = mockPlayerData;
      component.columns = playerColumns;
      fixture.detectChanges();

      const tableContainer = fixture.nativeElement.querySelector('.table-container');
      expect(tableContainer).toBeTruthy();

      const styles = window.getComputedStyle(tableContainer);
      expect(['auto', 'scroll']).toContain(styles.overflowY);
      expect(['auto', 'scroll']).toContain(styles.overflowX);
    });

    it('should render table headers inside scrollable container', () => {
      component.data = mockPlayerData;
      component.columns = playerColumns;
      fixture.detectChanges();

      const tableContainer = fixture.nativeElement.querySelector('.table-container');
      const headerRow = tableContainer?.querySelector('.mat-mdc-header-row');

      expect(headerRow).toBeTruthy();
    });
  });
});
