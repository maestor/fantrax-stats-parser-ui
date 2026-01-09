import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      expect((component.seasonDataSource[0] as any).seasonDisplay).toBe(
        '2024-25'
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

    it('should render graphs tab with stat checkboxes when seasons exist', () => {
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
      const componentAsAny = component as any;

      // setupChartData is called in constructor; lineChartData should be populated
      const data = component.lineChartData;

      expect(data.labels && data.labels.length).toBeGreaterThan(0);
      expect(data.datasets.length).toBeGreaterThan(0);

      const datasetLabels = data.datasets.map((ds) => ds.label as string);

      // score-related series should be present for goalies as well
      expect(
        datasetLabels.some((label) => label.includes('score'))
      ).toBeTrue();
      expect(
        datasetLabels.some((label) => label.includes('scoreAdjustedByGames'))
      ).toBeTrue();

      // Y-axis should start at 0 and have a positive max
      const options = componentAsAny.lineChartOptions as any;
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
  });
});
