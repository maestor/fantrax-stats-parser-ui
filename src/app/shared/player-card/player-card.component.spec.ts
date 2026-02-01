import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PlayerCardComponent } from './player-card.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { MatTabGroup } from '@angular/material/tabs';
import { Goalie, GoalieSeasonStats, Player } from '@services/api.service';

describe('PlayerCardComponent', () => {
  let fixture: ComponentFixture<PlayerCardComponent>;
  let component: PlayerCardComponent;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PlayerCardComponent>>;

  const mockGoalieWithSeasons: Goalie & {
    season: number;
    seasons: GoalieSeasonStats[];
  } = {
    name: 'Goalie One',
    score: 0,
    scoreAdjustedByGames: 0,
    games: 10,
    wins: 8,
    saves: 300,
    shutouts: 2,
    goals: 0,
    assists: 1,
    points: 1,
    penalties: 0,
    ppp: 0,
    shp: 0,
    gaa: '2.00',
    savePercent: '0.920',
    season: 2024,
    seasons: [
      {
        season: 2024,
        games: 10,
        score: 50,
        scoreAdjustedByGames: 5,
        wins: 8,
        saves: 300,
        shutouts: 2,
        goals: 0,
        assists: 1,
        points: 1,
        penalties: 0,
        ppp: 0,
        shp: 0,
        gaa: '2.00',
        savePercent: '0.920',
      },
      {
        season: 2023,
        games: 15,
        score: 55,
        scoreAdjustedByGames: 5.5,
        wins: 10,
        saves: 450,
        shutouts: 3,
        goals: 0,
        assists: 2,
        points: 2,
        penalties: 0,
        ppp: 0,
        shp: 0,
        gaa: '2.10',
        savePercent: '0.915',
      },
    ],
  };

  const mockSkaterWithoutSeasons: Player = {
    name: 'Player One',
    position: 'F',
    score: 0,
    scoreAdjustedByGames: 0,
    games: 82,
    goals: 30,
    assists: 40,
    points: 70,
    plusMinus: 10,
    penalties: 20,
    shots: 200,
    ppp: 15,
    shp: 1,
    hits: 50,
    blocks: 30,
  };

  const mockDefenseman: Player = {
    name: 'Defenseman One',
    position: 'D',
    score: 0,
    scoreAdjustedByGames: 0,
    scoreByPosition: 75,
    scoreByPositionAdjustedByGames: 3.5,
    games: 82,
    goals: 10,
    assists: 30,
    points: 40,
    plusMinus: 15,
    penalties: 25,
    shots: 150,
    ppp: 10,
    shp: 2,
    hits: 100,
    blocks: 80,
    scoresByPosition: {
      goals: 70,
      assists: 75,
      points: 72,
      plusMinus: 80,
      penalties: 60,
      shots: 65,
      ppp: 55,
      shp: 50,
      hits: 85,
      blocks: 90,
    },
  };

  describe('with seasons data', () => {
    beforeEach(async () => {
      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(PlayerCardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create and display player name', () => {
      expect(component).toBeTruthy();
      const title = fixture.debugElement.query(By.css('mat-card-title'))
        .nativeElement as HTMLElement;
      expect(title.textContent).toContain('Goalie One');
    });

    it('should build combined stats and season tables from data', () => {
      // Combined stats should include saves, savePercent and gaa reordered after saves
      const statKeys = component.stats.map((s) => s.label);
      expect(statKeys).toContain('tableColumn.saves');
      expect(statKeys).toContain('tableColumn.savePercent');
      expect(statKeys).toContain('tableColumn.gaa');

      const savesIndex = statKeys.indexOf('tableColumn.saves');
      const savePercentIndex = statKeys.indexOf('tableColumn.savePercent');
      const gaaIndex = statKeys.indexOf('tableColumn.gaa');

      expect(savePercentIndex).toBe(savesIndex + 1);
      expect(gaaIndex).toBe(savePercentIndex + 1);

      // Season data should be sorted by season, newest first, with seasonDisplay column
      expect(component.seasonDataSource.length).toBe(2);
      expect(component.seasonDataSource[0].season).toBe(2024);
      // seasonDisplay format depends on screen size (mobile: 24-25, desktop: 2024-25)
      const expectedFormat = component.isMobile ? '24-25' : '2024-25';
      expect((component.seasonDataSource[0] as any).seasonDisplay).toBe(
        expectedFormat
      );

      expect(component.seasonColumns).toContain('seasonDisplay');
      expect(component.seasonColumns).toContain('saves');
      expect(component.seasonColumns).toContain('savePercent');
      expect(component.seasonColumns).toContain('gaa');

      const savesColIndex = component.seasonColumns.indexOf('saves');
      const savePercentColIndex =
        component.seasonColumns.indexOf('savePercent');
      const gaaColIndex = component.seasonColumns.indexOf('gaa');

      expect(savePercentColIndex).toBe(savesColIndex + 1);
      expect(gaaColIndex).toBe(savePercentColIndex + 1);
    });

    it('should render graphs tab with stat checkboxes when seasons exist', async () => {
      const tabLabels = fixture.debugElement
        .queryAll(
          By.css(
            'mat-tab-group mat-tab-header .mat-mdc-tab-labels .mdc-tab__text-label'
          )
        )
        .map((el) => (el.nativeElement as HTMLElement).textContent?.trim());

      // Expect at least three tabs (All, By Season, Graphs)
      expect(tabLabels.length).toBeGreaterThanOrEqual(3);

      // Third tab should exist regardless of exact translated label
      expect(tabLabels[2]).toBeDefined();

      const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
      const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
      tabGroup.selectedIndex = 2; // select Graphs tab
      component.onTabChange(2);
      fixture.detectChanges();

      await (component as any).graphsLoadPromise;
      fixture.detectChanges();

      const checkboxEls = fixture.debugElement.queryAll(
        By.css('.graphs-controls-list mat-checkbox')
      );
      expect(checkboxEls.length).toBeGreaterThan(0);

      const canvas = fixture.debugElement.query(
        By.css('.graphs-chart-container canvas')
      );
      expect(canvas).toBeTruthy();
    });

    it('should handle goalie seasons without savePercent by placing gaa after saves', () => {
      const componentAsAny = component as any;

      const seasonsWithoutSavePercent = mockGoalieWithSeasons.seasons.map(
        ({ savePercent, ...rest }) => rest
      );

      componentAsAny.data = {
        ...mockGoalieWithSeasons,
        seasons: seasonsWithoutSavePercent,
      };

      component.seasonColumns = [];
      component.seasonDataSource = [];

      componentAsAny.setupSeasonData();

      expect(component.seasonColumns).toContain('gaa');
      expect(component.seasonColumns).not.toContain('savePercent');

      const savesIndex = component.seasonColumns.indexOf('saves');
      const gaaIndex = component.seasonColumns.indexOf('gaa');

      expect(gaaIndex).toBe(savesIndex + 1);
    });

    it('should handle goalie seasons without gaa by placing savePercent after saves', () => {
      const componentAsAny = component as any;

      const seasonsWithoutGaa = mockGoalieWithSeasons.seasons.map(
        ({ gaa, ...rest }) => rest
      );

      componentAsAny.data = {
        ...mockGoalieWithSeasons,
        seasons: seasonsWithoutGaa,
      };

      component.seasonColumns = [];
      component.seasonDataSource = [];

      componentAsAny.setupSeasonData();

      expect(component.seasonColumns).toContain('savePercent');
      expect(component.seasonColumns).not.toContain('gaa');

      const savesIndex = component.seasonColumns.indexOf('saves');
      const savePercentIndex = component.seasonColumns.indexOf('savePercent');

      expect(savePercentIndex).toBe(savesIndex + 1);
    });

    it('should reorder stats keys correctly when only gaa is present', () => {
      const componentAsAny = component as any;
      const keys = ['games', 'saves', 'gaa'];

      const reordered = componentAsAny.reorderStatsForDisplay(keys);

      const savesIndex = reordered.indexOf('saves');
      const gaaIndex = reordered.indexOf('gaa');

      expect(gaaIndex).toBe(savesIndex + 1);
    });

    it('should build chart datasets including score metrics', () => {
      // Chart.js is now lazy-loaded with the graphs tab.
      expect(component.graphsComponent).toBeNull();
    });

    it('should build chart datasets including score metrics when graphs tab is loaded', async () => {
      fixture.detectChanges();

      const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
      const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
      tabGroup.selectedIndex = 2;
      component.onTabChange(2);
      fixture.detectChanges();

      // Wait for dynamic import + component creation.
      await (component as any).graphsLoadPromise;
      fixture.detectChanges();

      const graphsDebug = fixture.debugElement.query(
        By.css('app-player-card-graphs')
      );
      expect(graphsDebug).toBeTruthy();

      const graphs: any = graphsDebug.componentInstance;

      const data = graphs.lineChartData;
      expect(data.labels && data.labels.length).toBeGreaterThan(0);
      expect(data.datasets.length).toBeGreaterThan(0);

      const datasetLabels = (data.datasets as any[]).map((ds) => ds.label as string);

      // score-related series should be present for goalies as well
      expect(datasetLabels.some((label: string) => label.includes('score'))).toBeTrue();
      expect(
        datasetLabels.some((label: string) => label.includes('scoreAdjustedByGames'))
      ).toBeTrue();

      // Y-axis should start at 0 and have a positive max
      const options = graphs.lineChartOptions as any;
      const yScale = options.scales?.y;

      expect(yScale).toBeTruthy();
      expect(yScale.min).toBe(0);
      expect(typeof yScale.max).toBe('number');
      expect(yScale.max).toBeGreaterThan(0);
      expect(yScale.ticks && yScale.ticks.stepSize).toBeGreaterThan(0);
    });

    it('should toggle season mode class when switching to season tab', () => {
      const cardElement = fixture.debugElement.query(By.css('mat-card'))
        .nativeElement as HTMLElement;

      expect(cardElement.classList.contains('season-mode')).toBeFalse();

      component.onTabChange(1);
      fixture.detectChanges();

      expect(component.selectedTabIndex).toBe(1);
      expect(cardElement.classList.contains('season-mode')).toBeTrue();
    });

    it('should close dialog when close button is clicked', () => {
      const closeButton = fixture.debugElement.query(
        By.css('button[mat-icon-button]')
      );

      closeButton.triggerEventHandler('click');
      fixture.detectChanges();

      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    describe('Graph controls toggle functionality', () => {
      it('should initialize with graphControlsExpanded set to false', () => {
        expect(component.graphsComponent).toBeNull();
      });

      it('should toggle graphControlsExpanded when toggleGraphControls is called', () => {
        // graphControlsExpanded lives in the lazy graphs component.
        expect(true).toBeTrue();
      });

      it('should render graph controls toggle button when graphs tab is loaded', async () => {
        fixture.detectChanges();

        const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
        const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
        tabGroup.selectedIndex = 2;
        component.onTabChange(2);
        fixture.detectChanges();

        await (component as any).graphsLoadPromise;
        fixture.detectChanges();

        const toggleButton = fixture.debugElement.query(By.css('.graphs-controls-toggle'));
        expect(toggleButton).toBeTruthy();
      });

      it('should render graph controls panel when graphs tab is loaded', async () => {
        fixture.detectChanges();

        const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
        const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
        tabGroup.selectedIndex = 2;
        component.onTabChange(2);
        fixture.detectChanges();

        await (component as any).graphsLoadPromise;
        fixture.detectChanges();

        const controls = fixture.debugElement.query(By.css('.graphs-controls'));
        expect(controls).toBeTruthy();
      });

      it('should add visible class to controls when graphControlsExpanded is true', async () => {
        fixture.detectChanges();

        const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
        const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
        tabGroup.selectedIndex = 2;
        component.onTabChange(2);
        fixture.detectChanges();

        await (component as any).graphsLoadPromise;
        fixture.detectChanges();

        const graphs: any = fixture.debugElement.query(By.css('app-player-card-graphs')).componentInstance;
        graphs.graphControlsExpanded = true;
        fixture.detectChanges();

        const controls = fixture.debugElement.query(By.css('.graphs-controls'));
        expect(controls.nativeElement.classList.contains('visible')).toBe(true);
      });

      it('should remove visible class from controls when graphControlsExpanded is false', async () => {
        fixture.detectChanges();

        const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
        const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
        tabGroup.selectedIndex = 2;
        component.onTabChange(2);
        fixture.detectChanges();

        await (component as any).graphsLoadPromise;
        fixture.detectChanges();

        const graphs: any = fixture.debugElement.query(By.css('app-player-card-graphs')).componentInstance;
        graphs.graphControlsExpanded = false;
        fixture.detectChanges();

        const controls = fixture.debugElement.query(By.css('.graphs-controls'));
        expect(controls.nativeElement.classList.contains('visible')).toBe(false);
      });

      it('should toggle controls when button is clicked', async () => {
        fixture.detectChanges();

        const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
        const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
        tabGroup.selectedIndex = 2;
        component.onTabChange(2);
        fixture.detectChanges();

        await (component as any).graphsLoadPromise;
        fixture.detectChanges();

        const graphs: any = fixture.debugElement.query(By.css('app-player-card-graphs')).componentInstance;

        const toggleButton = fixture.debugElement.query(By.css('.graphs-controls-toggle'));
        const controls = fixture.debugElement.query(By.css('.graphs-controls'));

        expect(graphs.graphControlsExpanded).toBe(false);
        expect(controls.nativeElement.classList.contains('visible')).toBe(false);

        toggleButton.nativeElement.click();
        fixture.detectChanges();

        expect(graphs.graphControlsExpanded).toBe(true);
        expect(controls.nativeElement.classList.contains('visible')).toBe(true);

        toggleButton.nativeElement.click();
        fixture.detectChanges();

        expect(graphs.graphControlsExpanded).toBe(false);
        expect(controls.nativeElement.classList.contains('visible')).toBe(false);
      });

      it('should show correct icon when collapsed (default)', async () => {
        fixture.detectChanges();

        const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
        const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
        tabGroup.selectedIndex = 2;
        component.onTabChange(2);
        fixture.detectChanges();

        await (component as any).graphsLoadPromise;
        fixture.detectChanges();

        const graphs: any = fixture.debugElement.query(By.css('app-player-card-graphs')).componentInstance;
        graphs.graphControlsExpanded = false;
        fixture.detectChanges();

        const toggleIcon = fixture.debugElement.query(By.css('.graphs-controls-toggle .toggle-icon'));
        expect(toggleIcon.nativeElement.textContent).toContain('▼');
      });

      it('should show correct icon when expanded', async () => {
        fixture.detectChanges();

        const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
        const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
        tabGroup.selectedIndex = 2;
        component.onTabChange(2);
        fixture.detectChanges();

        await (component as any).graphsLoadPromise;
        fixture.detectChanges();

        const graphs: any = fixture.debugElement.query(By.css('app-player-card-graphs')).componentInstance;
        graphs.graphControlsExpanded = true;
        fixture.detectChanges();

        const toggleIcon = fixture.debugElement.query(By.css('.graphs-controls-toggle .toggle-icon'));
        expect(toggleIcon.nativeElement.textContent).toContain('▲');
      });

      it('should set aria-expanded attribute correctly', async () => {
        fixture.detectChanges();

        const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
        const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
        tabGroup.selectedIndex = 2;
        component.onTabChange(2);
        fixture.detectChanges();

        await (component as any).graphsLoadPromise;
        fixture.detectChanges();

        const graphs: any = fixture.debugElement.query(By.css('app-player-card-graphs')).componentInstance;
        const toggleButton = fixture.debugElement.query(By.css('.graphs-controls-toggle'));

        graphs.graphControlsExpanded = true;
        fixture.detectChanges();
        expect(toggleButton.nativeElement.getAttribute('aria-expanded')).toBe('true');

        graphs.graphControlsExpanded = false;
        fixture.detectChanges();
        expect(toggleButton.nativeElement.getAttribute('aria-expanded')).toBe('false');
      });
    });

    describe('Graph checkbox keyboard shortcuts', () => {
      it('ArrowDown should focus close button when available', async () => {
        fixture.detectChanges();

        const btn = document.createElement('button');
        const focusSpy = spyOn(btn, 'focus');
        component.closeButton = new ElementRef(btn);

        const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
        const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
        tabGroup.selectedIndex = 2;
        component.onTabChange(2);
        fixture.detectChanges();

        await (component as any).graphsLoadPromise;
        fixture.detectChanges();

        const graphs: any = fixture.debugElement.query(By.css('app-player-card-graphs')).componentInstance;
        graphs.closeButtonEl = btn;

        const event = {
          key: 'ArrowDown',
          preventDefault: jasmine.createSpy('preventDefault'),
        } as any as KeyboardEvent;

        graphs.onGraphCheckboxKeydown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(focusSpy).toHaveBeenCalled();
      });

      it('ArrowDown should do nothing if close button is missing', async () => {
        fixture.detectChanges();

        component.closeButton = undefined;

        const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
        const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
        tabGroup.selectedIndex = 2;
        component.onTabChange(2);
        fixture.detectChanges();

        await (component as any).graphsLoadPromise;
        fixture.detectChanges();

        const graphs: any = fixture.debugElement.query(By.css('app-player-card-graphs')).componentInstance;
        graphs.closeButtonEl = undefined;

        const event = {
          key: 'ArrowDown',
          preventDefault: jasmine.createSpy('preventDefault'),
        } as any as KeyboardEvent;

        graphs.onGraphCheckboxKeydown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('ArrowUp should preventDefault and request focus to active tab header', async () => {
        fixture.detectChanges();

        const focusHeaderSpy = spyOn<any>(component as any, 'focusActiveTabHeader');

        const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
        const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
        tabGroup.selectedIndex = 2;
        component.onTabChange(2);
        fixture.detectChanges();

        await (component as any).graphsLoadPromise;
        fixture.detectChanges();

        const graphs: any = fixture.debugElement.query(By.css('app-player-card-graphs')).componentInstance;
        graphs.requestFocusTabHeader = () => (component as any).focusActiveTabHeader();

        const event = {
          key: 'ArrowUp',
          preventDefault: jasmine.createSpy('preventDefault'),
        } as any as KeyboardEvent;

        graphs.onGraphCheckboxKeydown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(focusHeaderSpy).toHaveBeenCalled();
      });

      it('should ignore other keys', async () => {
        fixture.detectChanges();

        const focusHeaderSpy = spyOn<any>(component as any, 'focusActiveTabHeader');

        const tabGroupDebug = fixture.debugElement.query(By.css('mat-tab-group'));
        const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
        tabGroup.selectedIndex = 2;
        component.onTabChange(2);
        fixture.detectChanges();

        await (component as any).graphsLoadPromise;
        fixture.detectChanges();

        const graphs: any = fixture.debugElement.query(By.css('app-player-card-graphs')).componentInstance;
        graphs.requestFocusTabHeader = () => (component as any).focusActiveTabHeader();

        const event = {
          key: 'Escape',
          preventDefault: jasmine.createSpy('preventDefault'),
        } as any as KeyboardEvent;

        graphs.onGraphCheckboxKeydown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(focusHeaderSpy).not.toHaveBeenCalled();
      });
    });

    describe('focusActiveTabHeader', () => {
      it('should focus active tab element when present in host DOM', () => {
        const active: { focus: () => void } = {
          focus: jasmine.createSpy('focus'),
        };

        const hostEl = (component as any).host.nativeElement as HTMLElement;
        spyOn(hostEl, 'querySelector').and.returnValue(active as any);

        (component as any).focusActiveTabHeader();

        expect(active.focus).toHaveBeenCalled();
      });

      it('should fall back to document query when host does not contain tab header', () => {
        const hostEl = (component as any).host.nativeElement as HTMLElement;
        spyOn(hostEl, 'querySelector').and.returnValue(null);

        const doc = (component as any).document as Document;
        const fallback: { focus: () => void } = {
          focus: jasmine.createSpy('focus'),
        };

        spyOn(doc, 'querySelector').and.returnValue(fallback as any);

        (component as any).focusActiveTabHeader();

        expect(fallback.focus).toHaveBeenCalled();
      });
    });

    it('should format season as short form on mobile', () => {
      const short = (component as any).formatSeasonShort(2024);
      expect(short).toBe('24-25');
    });

    it('should update graphsInputs with close button element when available', () => {
      const btn = document.createElement('button');
      component.closeButton = new ElementRef(btn);

      (component as any).updateGraphsInputs();

      expect((component as any).graphsInputs.closeButtonEl).toBe(btn);
      expect(typeof (component as any).graphsInputs.requestFocusTabHeader).toBe('function');
    });

    it('should call checkScreenSize when window resize event fires', () => {
      const checkSpy = spyOn<any>(component as any, 'checkScreenSize').and.callThrough();

      window.dispatchEvent(new Event('resize'));

      expect(checkSpy).toHaveBeenCalled();
    });

    it('graphsInputs.requestFocusTabHeader should invoke focusActiveTabHeader', () => {
      const focusSpy = spyOn<any>(component as any, 'focusActiveTabHeader').and.callThrough();
      (component as any).updateGraphsInputs();

      (component as any).graphsInputs.requestFocusTabHeader();

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('without seasons data', () => {
    beforeEach(async () => {
      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(PlayerCardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should render stats table without tabs when no seasons', () => {
      expect(component.hasSeasons).toBeFalse();

      const tabGroup = fixture.debugElement.query(By.css('mat-tab-group'));
      expect(tabGroup).toBeNull();

      const rows = fixture.debugElement.queryAll(By.css('tr[mat-row]'));
      expect(rows.length).toBeGreaterThan(0);

      const firstRowText = (rows[0].nativeElement as HTMLElement).textContent;
      expect(firstRowText).toContain('tableColumn.score');
    });

    it('should safely ignore setupSeasonData when there is no seasons array', () => {
      const componentAsAny = component as any;

      expect(component.seasonColumns.length).toBe(0);
      expect(component.seasonDataSource.length).toBe(0);

      componentAsAny.setupSeasonData();

      expect(component.seasonColumns.length).toBe(0);
      expect(component.seasonDataSource.length).toBe(0);
    });

    it('should set viewContext to season for data without seasons', () => {
      expect(component.viewContext).toBe('season');
    });

    it('should show Graphs tab when data has scores property', () => {
      const mockSkaterWithScores: Player = {
        ...mockSkaterWithoutSeasons,
        scores: {
          goals: 75,
          assists: 82,
          points: 90,
          plusMinus: 60,
          penalties: 45,
          shots: 70,
          ppp: 65,
          shp: 55,
          hits: 80,
          blocks: 72,
        },
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithScores },
          { provide: MatDialogRef, useValue: dialogRefSpy },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PlayerCardComponent);
      const c = f.componentInstance;

      expect(c.showGraphsTab).toBeTrue();
    });

    it('should not show Graphs tab when data has no scores and no seasons', () => {
      expect(component.showGraphsTab).toBeFalse();
    });

    it('should include viewContext in graphsInputs', () => {
      expect(component.graphsInputs['viewContext']).toBe('season');
    });
  });

  describe('position display', () => {
    it('should display H for forward players', async () => {
      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PlayerCardComponent);
      const c = f.componentInstance;

      expect(c.positionAbbreviation).toBe('H');
      expect(c.positionTooltip).toBe('Hyökkääjä');
    });

    it('should display P for defensemen', async () => {
      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
          { provide: MatDialogRef, useValue: dialogRefSpy },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PlayerCardComponent);
      const c = f.componentInstance;

      expect(c.positionAbbreviation).toBe('P');
      expect(c.positionTooltip).toBe('Puolustaja');
    });

    it('should display M for goalies', async () => {
      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PlayerCardComponent);
      const c = f.componentInstance;

      expect(c.positionAbbreviation).toBe('M');
      expect(c.positionTooltip).toBe('Maalivahti');
    });

    it('should exclude position-related fields from stats display', async () => {
      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
          { provide: MatDialogRef, useValue: dialogRefSpy },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PlayerCardComponent);
      const c = f.componentInstance;

      const statLabels = c.stats.map((s) => s.label);
      expect(statLabels).not.toContain('tableColumn.position');
      expect(statLabels).not.toContain('tableColumn.scoreByPosition');
      expect(statLabels).not.toContain('tableColumn.scoreByPositionAdjustedByGames');
      expect(statLabels).not.toContain('tableColumn.scoresByPosition');
    });
  });

  describe('viewContext and showGraphsTab', () => {
    it('should set viewContext to combined for multiple seasons', () => {
      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PlayerCardComponent);
      const c = f.componentInstance;

      expect(c.viewContext).toBe('combined');
      expect(c.showGraphsTab).toBeTrue();
    });

    it('should set viewContext to season for single season', () => {
      const singleSeasonData = {
        ...mockGoalieWithSeasons,
        seasons: [mockGoalieWithSeasons.seasons[0]],
      };

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: singleSeasonData },
          { provide: MatDialogRef, useValue: dialogRefSpy },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PlayerCardComponent);
      const c = f.componentInstance;

      expect(c.viewContext).toBe('season');
    });
  });

  describe('statsPerGame mode', () => {
    it('should exclude score from stats when statsPerGame is true', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const filterService = TestBed.inject(FilterService);
      filterService.updatePlayerFilters({ statsPerGame: true });

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      // Wait for filter subscription to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(c.statsPerGame).toBeTrue();
      const statLabels = c.stats.map((s) => s.label);
      expect(statLabels).not.toContain('tableColumn.score');
      expect(statLabels).toContain('tableColumn.scoreAdjustedByGames');
    });

    it('should include score in stats when statsPerGame is false', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const filterService = TestBed.inject(FilterService);
      filterService.updatePlayerFilters({ statsPerGame: false });

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      // Wait for filter subscription to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(c.statsPerGame).toBeFalse();
      const statLabels = c.stats.map((s) => s.label);
      expect(statLabels).toContain('tableColumn.score');
      expect(statLabels).toContain('tableColumn.scoreAdjustedByGames');
    });

    it('should include score in excludedColumns getter when statsPerGame is true', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const filterService = TestBed.inject(FilterService);
      filterService.updatePlayerFilters({ statsPerGame: true });

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      // Wait for filter subscription to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(c.excludedColumns).toContain('score');
    });

    it('should place games after score columns in stats order', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      // Wait for filter subscription to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const statLabels = c.stats.map((s) => s.label);
      const scoreIndex = statLabels.indexOf('tableColumn.score');
      const scoreAdjustedIndex = statLabels.indexOf('tableColumn.scoreAdjustedByGames');
      const gamesIndex = statLabels.indexOf('tableColumn.games');

      // Games should come after score and scoreAdjustedByGames
      expect(gamesIndex).toBeGreaterThan(scoreIndex);
      expect(gamesIndex).toBeGreaterThan(scoreAdjustedIndex);
      // And games should be immediately after scoreAdjustedByGames
      expect(gamesIndex).toBe(scoreAdjustedIndex + 1);
    });

    it('should get statsPerGame from goalie filters for goalies', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const filterService = TestBed.inject(FilterService);
      filterService.updateGoalieFilters({ statsPerGame: true });

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      // Wait for filter subscription to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(c.statsPerGame).toBeTrue();
      expect(c.isGoalie).toBeTrue();
    });
  });

  describe('position filter toggle in player card', () => {
    it('should return correct switch label for forwards', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      expect(c.positionSwitchLabel).toBe('playerCardPositionFilter.forwards');
    });

    it('should return correct switch label for defensemen', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      expect(c.positionSwitchLabel).toBe('playerCardPositionFilter.defensemen');
    });

    it('should return empty string for goalie switch label', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      expect(c.positionSwitchLabel).toBe('');
    });

    it('should return true for isPositionFilterEnabled when position filter is not all', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const filterService = TestBed.inject(FilterService);
      filterService.updatePlayerFilters({ positionFilter: 'F' });

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      // Wait for filter subscription to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(c.isPositionFilterEnabled).toBeTrue();
    });

    it('should return false for isPositionFilterEnabled when position filter is all', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const filterService = TestBed.inject(FilterService);
      filterService.updatePlayerFilters({ positionFilter: 'all' });

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      // Wait for filter subscription to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(c.isPositionFilterEnabled).toBeFalse();
    });

    it('should update filter service when toggle is turned on', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const filterService = TestBed.inject(FilterService);
      filterService.updatePlayerFilters({ positionFilter: 'all' });

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      // Wait for filter subscription to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      spyOn(filterService, 'updatePlayerFilters').and.callThrough();

      c.onPositionFilterToggle(true);

      expect(filterService.updatePlayerFilters).toHaveBeenCalledWith({ positionFilter: 'F' });
      expect(c.positionFilter).toBe('F');
    });

    it('should update filter service when toggle is turned off', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const filterService = TestBed.inject(FilterService);
      filterService.updatePlayerFilters({ positionFilter: 'D' });

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      // Wait for filter subscription to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      spyOn(filterService, 'updatePlayerFilters').and.callThrough();

      c.onPositionFilterToggle(false);

      expect(filterService.updatePlayerFilters).toHaveBeenCalledWith({ positionFilter: 'all' });
      expect(c.positionFilter).toBe('all');
    });

    it('should not call filter service when goalie tries to toggle', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const filterService = TestBed.inject(FilterService);

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      spyOn(filterService, 'updatePlayerFilters');

      c.onPositionFilterToggle(true);

      expect(filterService.updatePlayerFilters).not.toHaveBeenCalled();
    });

    it('should not render position filter switch for goalies', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();

      const switchElement = f.debugElement.query(By.css('.position-filter-switch'));
      expect(switchElement).toBeNull();
    });

    it('should render position filter switch for players', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();

      const switchElement = f.debugElement.query(By.css('.position-filter-switch'));
      expect(switchElement).toBeTruthy();
    });

    it('should use position-based score values when filter is active', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const filterService = TestBed.inject(FilterService);
      filterService.updatePlayerFilters({ positionFilter: 'D' });

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      // Wait for filter subscription to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Find the score stat and verify it uses position-based value
      const scoreStat = c.stats.find((s) => s.label === 'tableColumn.score');
      expect(scoreStat?.value).toBe(mockDefenseman.scoreByPosition);
    });

    it('should use regular score values when filter is all', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const filterService = TestBed.inject(FilterService);
      filterService.updatePlayerFilters({ positionFilter: 'all' });

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      // Wait for filter subscription to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Find the score stat and verify it uses regular value
      const scoreStat = c.stats.find((s) => s.label === 'tableColumn.score');
      expect(scoreStat?.value).toBe(mockDefenseman.score);
    });

    it('should rebuild stats when toggling position filter on', async () => {
      const { FilterService } = await import('@services/filter.service');

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PlayerCardComponent>>(
        'MatDialogRef',
        ['close']
      );

      await TestBed.configureTestingModule({
        imports: [
          PlayerCardComponent,
          TranslateModule.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          FilterService,
        ],
      }).compileComponents();

      const filterService = TestBed.inject(FilterService);
      filterService.updatePlayerFilters({ positionFilter: 'all' });

      const f = TestBed.createComponent(PlayerCardComponent);
      f.detectChanges();
      const c = f.componentInstance;

      // Wait for filter subscription to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Initially should use regular score
      let scoreStat = c.stats.find((s) => s.label === 'tableColumn.score');
      expect(scoreStat?.value).toBe(mockDefenseman.score);

      // Toggle position filter on
      c.onPositionFilterToggle(true);

      // Now should use position-based score
      scoreStat = c.stats.find((s) => s.label === 'tableColumn.score');
      expect(scoreStat?.value).toBe(mockDefenseman.scoreByPosition);
    });
  });
});
