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
import { Column } from '@shared/column.types';
import { of, Subject } from 'rxjs';

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

  // position is NOT in this array — it is shown via showPositionColumn (default true)
  const playerColumns: Column[] = [
    { field: 'name' }, { field: 'score' }, { field: 'games' },
    { field: 'goals' }, { field: 'assists' }, { field: 'points' },
    { field: 'plusMinus' }, { field: 'penalties' }, { field: 'shots' },
    { field: 'ppp' }, { field: 'shp' }, { field: 'hits' }, { field: 'blocks' },
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

    it('should NOT intercept Space key (allows checkbox toggle)', () => {
      const selectSpy = spyOn(component, 'selectItem');
      const event = {
        key: ' ',
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any as KeyboardEvent;

      component.onRowKeydown(event, mockPlayerData[0], 0);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(selectSpy).not.toHaveBeenCalled();
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
      const container = document.createElement('div');
      (component as any).tableRootRef = new ElementRef(container);

      component.activeRowIndex = 2;
      (component as any).focusRow(1);

      expect(component.activeRowIndex).toBe(2);
    });

    it('focusRow should clamp index and focus/scroll the row element', () => {
      const container = document.createElement('div');

      const row0 = document.createElement('tr');
      row0.dataset['rowIndex'] = '0';
      row0.tabIndex = 0;

      const row1 = document.createElement('tr');
      row1.dataset['rowIndex'] = '1';
      row1.tabIndex = 0;

      container.appendChild(row0);
      container.appendChild(row1);

      const focus0 = spyOn(row0, 'focus');
      const focus1 = spyOn(row1, 'focus');

      (row0 as any).scrollIntoView = jasmine.createSpy('scrollIntoView');
      (row1 as any).scrollIntoView = jasmine.createSpy('scrollIntoView');

      (component as any).tableRootRef = new ElementRef(container);

      (component as any).focusRow(999);
      expect(component.activeRowIndex).toBe(1);
      expect(focus1).toHaveBeenCalled();

      (component as any).focusRow(-10);
      expect(component.activeRowIndex).toBe(0);
      expect(focus0).toHaveBeenCalled();
    });

    it('focusRow should no-op when tableRootRef is absent', () => {
      (component as any).tableRootRef = undefined;

      component.activeRowIndex = 0;
      (component as any).focusRow(0);

      expect(component.activeRowIndex).toBe(0);
    });

    it('scrollRowIntoView should scroll the matching row into view', () => {
      const container = document.createElement('div');

      const row0 = document.createElement('tr');
      row0.dataset['rowIndex'] = '0';
      const row1 = document.createElement('tr');
      row1.dataset['rowIndex'] = '1';

      (row0 as any).scrollIntoView = jasmine.createSpy('scrollIntoView');
      (row1 as any).scrollIntoView = jasmine.createSpy('scrollIntoView');

      container.appendChild(row0);
      container.appendChild(row1);
      (component as any).tableRootRef = new ElementRef(container);

      (component as any).scrollRowIntoView(1);

      expect((row1 as any).scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
      expect((row0 as any).scrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe('accessibility labeling', () => {
    it('getRowAriaLabel should include player name when present', () => {
      const instantSpy = spyOn(translate, 'instant').and.callThrough();
      const label = component.getRowAriaLabel({ name: 'Test Name' } as any, 'a11y.openPlayerCard');
      expect(instantSpy).toHaveBeenCalledWith('a11y.openPlayerCard', { name: 'Test Name' });
      expect(label).toContain('Test Name');
    });

    it('getRowAriaLabel should still call translate with empty name when missing', () => {
      const instantSpy = spyOn(translate, 'instant').and.callThrough();
      component.getRowAriaLabel({} as any, 'a11y.openPlayerCard');
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

    it('should initialize displayedFields as empty array', () => {
      expect(component.displayedFields).toEqual([]);
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

    it('should set displayedFields with position first when columns are provided', () => {
      const changes = {
        data: new SimpleChange(null, mockPlayerData, true),
      };

      component.data = mockPlayerData;
      component.columns = playerColumns;
      component.ngOnChanges(changes);

      expect(component.displayedFields).toEqual(['position', ...playerColumns.map(c => c.field)]);
    });

    it('should set dynamicColumns equal to columns input', () => {
      const changes = {
        data: new SimpleChange(null, mockPlayerData, true),
      };

      component.data = mockPlayerData;
      component.columns = playerColumns;
      component.ngOnChanges(changes);

      expect(component.dynamicColumns.map(c => c.field)).not.toContain('position');
      expect(component.dynamicColumns.map(c => c.field)).toContain('name');
      expect(component.dynamicColumns.map(c => c.field)).toContain('games');
      expect(component.dynamicColumns).toEqual(playerColumns);
    });

    it('should not update displayedFields if columns are empty', () => {
      component.dynamicColumns = [{ field: 'name' }];
      component.displayedFields = ['position', 'name'];

      const changes = {
        data: new SimpleChange(null, mockPlayerData, true),
      };

      component.data = mockPlayerData;
      component.columns = [];
      component.ngOnChanges(changes);

      expect(component.dynamicColumns).toEqual([{ field: 'name' }]);
      expect(component.displayedFields).toEqual(['position', 'name']);
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

    it('should update dynamicColumns and displayedFields when columns change without data', () => {
      component.data = mockPlayerData;
      component.columns = playerColumns;
      component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });

      const newColumns: Column[] = [{ field: 'goals' }, { field: 'assists' }];
      component.columns = newColumns;
      component.ngOnChanges({ columns: new SimpleChange(playerColumns, newColumns, false) });

      expect(component.dynamicColumns).toEqual(newColumns);
      expect(component.displayedFields).toContain('goals');
      expect(component.displayedFields).toContain('assists');
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

      component.dynamicColumns = [{ field: 'name' }, { field: 'games' }];
      component.defaultSortColumn = 'nonexistent';

      (component as any).applyDefaultSort();

      expect(component.sort.active).toBe('name');
      expect(component.sort.direction).toBe('desc');
    });

    it('should fall back to first column when dynamicColumns has only position-named column', () => {
      component.data = mockPlayerData;
      component.columns = playerColumns;
      fixture.detectChanges();

      component.dynamicColumns = [{ field: 'position' }];
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

      expect(dialog.open).toHaveBeenCalledWith(PlayerCardComponent, jasmine.objectContaining({
        maxWidth: '95vw',
        width: 'auto',
        panelClass: 'player-card-dialog',
      }));
    });

    it('should pass player data with navigation context to dialog', () => {
      spyOn(dialog, 'open').and.returnValue({
        afterClosed: () => of(undefined),
      } as any);

      const player = mockPlayerData[0];
      component.selectItem(player);

      expect(dialog.open).toHaveBeenCalledWith(
        PlayerCardComponent,
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            player,
            navigationContext: jasmine.objectContaining({
              allPlayers: jasmine.any(Array),
              currentIndex: jasmine.any(Number),
              onNavigate: jasmine.any(Function),
            }),
          }),
        })
      );
    });

    it('should pass goalie data with navigation context to dialog', () => {
      spyOn(dialog, 'open').and.returnValue({
        afterClosed: () => of(undefined),
      } as any);

      const goalie = mockGoalieData[0];
      component.selectItem(goalie);

      expect(dialog.open).toHaveBeenCalledWith(
        PlayerCardComponent,
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            player: goalie,
            navigationContext: jasmine.objectContaining({
              allPlayers: jasmine.any(Array),
              currentIndex: jasmine.any(Number),
              onNavigate: jasmine.any(Function),
            }),
          }),
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

    it('should provide correct currentIndex in navigation context', () => {
      // Set up filtered data in dataSource
      component.dataSource.data = mockPlayerData;

      let capturedData: any;
      spyOn(dialog, 'open').and.callFake((_comp: any, config: any) => {
        capturedData = config.data;
        return { afterClosed: () => of(undefined) } as any;
      });

      component.selectItem(mockPlayerData[1]); // Second player

      expect(capturedData.navigationContext.currentIndex).toBe(1);
    });

    it('should update active row when navigation callback is invoked', () => {
      component.dataSource.data = mockPlayerData;

      let capturedCallback: ((index: number) => void) | undefined;
      spyOn(dialog, 'open').and.callFake((_comp: any, config: any) => {
        capturedCallback = config.data.navigationContext.onNavigate;
        return { afterClosed: () => of(undefined) } as any;
      });

      component.selectItem(mockPlayerData[0]);
      expect(capturedCallback).toBeDefined();

      // Simulate navigation to second player
      capturedCallback!(1);

      expect(component.activeRowIndex).toBe(1);
    });

    it('should focus the navigated-to row after dialog closes', () => {
      component.dataSource.data = mockPlayerData;
      const focusSpy = spyOn<any>(component as any, 'focusRow');

      const afterClosed$ = new Subject<void>();
      let capturedCallback: ((index: number) => void) | undefined;
      spyOn(dialog, 'open').and.callFake((_comp: any, config: any) => {
        capturedCallback = config.data.navigationContext.onNavigate;
        return { afterClosed: () => afterClosed$.asObservable() } as any;
      });

      component.selectItem(mockPlayerData[0]);
      capturedCallback!(2); // Navigate to third player

      expect(focusSpy).not.toHaveBeenCalled();

      // Close the dialog
      afterClosed$.next();
      afterClosed$.complete();

      expect(focusSpy).toHaveBeenCalledWith(2);
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
      expect(component.displayedFields).toEqual(['position', ...playerColumns.map(c => c.field)]);
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

  describe('positionValue', () => {
    it('should use auto-increment by default', () => {
      component.columns = playerColumns;
      component.data = mockPlayerData;
      component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
      fixture.detectChanges();

      const positionCells = fixture.nativeElement.querySelectorAll('td.mat-column-position');
      expect(positionCells[0]?.textContent?.trim()).toBe('1');
      expect(positionCells[1]?.textContent?.trim()).toBe('2');
    });

    it('should use positionValue function when provided', () => {
      component.columns = [{ field: 'name' }];
      component.positionValue = (_row: any, i: number) => `#${i + 1}`;
      component.data = mockPlayerData;
      component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
      fixture.detectChanges();

      const positionCells = fixture.nativeElement.querySelectorAll('td.mat-column-position');
      expect(positionCells[0]?.textContent?.trim()).toBe('#1');
    });
  });

  describe('selectRow feature', () => {
    it('should not show checkboxes when selectRow is false (default)', () => {
      component.columns = playerColumns;
      component.data = mockPlayerData;
      component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
      fixture.detectChanges();

      const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
      expect(checkbox).toBeFalsy();
    });

    it('should show checkboxes when selectRow is true', () => {
      component.columns = playerColumns;
      component.data = mockPlayerData;
      component.selectRow = true;
      component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
      fixture.detectChanges();

      const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
      expect(checkbox).toBeTruthy();
    });

    it('should call onRowSelect handler when checkbox changes', () => {
      const handler = jasmine.createSpy('onRowSelect');
      component.onRowSelect = handler;
      component.onRowSelectToggle(mockPlayerData[0]);
      expect(handler).toHaveBeenCalledWith(mockPlayerData[0]);
    });

    it('should use isRowSelected to determine checkbox state', () => {
      component.isRowSelected = (row) => row === mockPlayerData[0];
      expect(component.isRowSelected(mockPlayerData[0])).toBeTrue();
      expect(component.isRowSelected(mockPlayerData[1])).toBeFalse();
    });
  });

  describe('showSearch', () => {
    it('should show search input by default', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('input[type="search"]')).toBeTruthy();
    });

    it('should hide search input when showSearch is false', () => {
      component.showSearch = false;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('input[type="search"]')).toBeFalsy();
    });

    it('onHeaderKeydown ArrowUp should do nothing when showSearch is false', () => {
      component.showSearch = false;
      const input = document.createElement('input');
      component.searchInput = new ElementRef(input);
      const focusSpy = spyOn(input, 'focus');

      const event = { key: 'ArrowUp', preventDefault: jasmine.createSpy() } as any;
      component.onHeaderKeydown(event);

      expect(focusSpy).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('showPositionColumn', () => {
    it('should include position in displayedFields by default', () => {
      component.columns = playerColumns;
      component.data = mockPlayerData;
      component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
      expect(component.displayedFields[0]).toBe('position');
    });

    it('should exclude position from displayedFields when showPositionColumn is false', () => {
      component.columns = playerColumns;
      component.showPositionColumn = false;
      component.data = mockPlayerData;
      component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
      expect(component.displayedFields).not.toContain('position');
    });

    it('should update displayedFields when showPositionColumn input changes', () => {
      component.columns = playerColumns;
      component.data = mockPlayerData;
      component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
      expect(component.displayedFields[0]).toBe('position');

      component.showPositionColumn = false;
      component.ngOnChanges({ showPositionColumn: new SimpleChange(true, false, false) });
      expect(component.displayedFields).not.toContain('position');
    });
  });

  describe('formatCell', () => {
    it('should use default rendering when formatCell is not provided', () => {
      component.columns = [{ field: 'goals' }];
      component.data = [{ goals: 10 }];
      component.ngOnChanges({ data: new SimpleChange(null, [{ goals: 10 }], true) });
      fixture.detectChanges();

      const cell = fixture.nativeElement.querySelector('td.mat-column-goals');
      expect(cell?.textContent?.trim()).toBe('10');
    });

    it('should apply formatCell when provided', () => {
      component.columns = [{ field: 'goals' }];
      component.formatCell = (col, val) => col === 'goals' ? `${val}G` : val;
      component.data = [{ goals: 10 }];
      component.ngOnChanges({ data: new SimpleChange(null, [{ goals: 10 }], true) });
      fixture.detectChanges();

      const cell = fixture.nativeElement.querySelector('td.mat-column-goals');
      expect(cell?.textContent?.trim()).toBe('10G');
    });
  });

  describe('icon columns', () => {
    it('should render emoji icon in column header', () => {
      component.columns = [{ field: 'goals', icon: { name: '🏆', type: 'emoji' } }];
      component.data = mockPlayerData;
      component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector('th.mat-column-goals');
      expect(header?.textContent).toContain('🏆');
    });

    it('should hide column label text visually when icon is present', () => {
      component.columns = [{ field: 'goals', icon: { name: '🏆', type: 'emoji' } }];
      component.data = mockPlayerData;
      component.ngOnChanges({ data: new SimpleChange(null, mockPlayerData, true) });
      fixture.detectChanges();

      const srSpan = fixture.nativeElement.querySelector('th.mat-column-goals .sr-only');
      expect(srSpan).toBeTruthy();
    });
  });

  describe('template helpers', () => {
    describe('getHeaderIconType', () => {
      it('returns emoji for emoji icon column', () => {
        const col: Column = { field: 'goals', icon: { type: 'emoji', name: '🏆' } };
        expect(component.getHeaderIconType(col)).toBe('emoji');
      });

      it('returns material for material icon column', () => {
        const col: Column = { field: 'goals', icon: { type: 'material', name: 'star' } };
        expect(component.getHeaderIconType(col)).toBe('material');
      });

      it('returns null when column has no icon', () => {
        const col: Column = { field: 'goals' };
        expect(component.getHeaderIconType(col)).toBeNull();
      });
    });

    describe('getCellClass', () => {
      it('returns col-left true for left-aligned column', () => {
        const col: Column = { field: 'name', align: 'left' };
        expect(component.getCellClass(col)).toEqual({ 'col-left': true, 'col-center': false });
      });

      it('returns col-center true when align is not set', () => {
        const col: Column = { field: 'score' };
        expect(component.getCellClass(col)).toEqual({ 'col-left': false, 'col-center': true });
      });

      it('returns col-center true when align is center', () => {
        const col: Column = { field: 'score', align: 'center' };
        expect(component.getCellClass(col)).toEqual({ 'col-left': false, 'col-center': true });
      });
    });

    describe('getPositionDisplay', () => {
      it('returns i+1 when positionValue is not provided', () => {
        component.positionValue = undefined;
        expect(component.getPositionDisplay({}, 0)).toBe(1);
        expect(component.getPositionDisplay({}, 4)).toBe(5);
      });

      it('returns positionValue(row, i) when positionValue is provided', () => {
        component.positionValue = (_row: any, i: number) => `#${i + 1}`;
        expect(component.getPositionDisplay({}, 0)).toBe('#1');
        expect(component.getPositionDisplay({}, 2)).toBe('#3');
      });
    });
  });

  describe('clickable', () => {
    it('should not open dialog on Enter when clickable is false', () => {
      const selectSpy = spyOn(component, 'selectItem');
      component.clickable = false;
      const event = { key: 'Enter', preventDefault: jasmine.createSpy() } as any;

      component.onRowKeydown(event, mockPlayerData[0], 0);

      expect(selectSpy).not.toHaveBeenCalled();
    });

    it('should open dialog on Enter when clickable is true (default)', () => {
      const selectSpy = spyOn(component, 'selectItem');
      const event = { key: 'Enter', preventDefault: jasmine.createSpy() } as any;

      component.onRowKeydown(event, mockPlayerData[0], 0);

      expect(selectSpy).toHaveBeenCalledWith(mockPlayerData[0]);
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
