import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ComparisonDialogComponent, ComparisonDialogData } from './comparison-dialog.component';
import type { Player,/* Goalie*/ } from '@services/api.service';
import { ApiService } from '@services/api.service';
import { TeamService } from '@services/team.service';
import { FilterService } from '@services/filter.service';

const mockForwardA: Player = {
  name: 'Mikko Rantanen', position: 'F', score: 100, scoreAdjustedByGames: 93.1,
  games: 427, goals: 193, assists: 254, points: 447, plusMinus: 10,
  penalties: 256, shots: 1182, ppp: 165, shp: 0, hits: 276, blocks: 41,
  scores: { goals: 80, assists: 75, points: 85, plusMinus: 50, penalties: 60, shots: 70, ppp: 90, shp: 10, hits: 40, blocks: 20 },
};

const mockForwardB: Player = {
  name: 'Aleksander Barkov', position: 'F', score: 94.31, scoreAdjustedByGames: 67.22,
  games: 540, goals: 100, assists: 188, points: 288, plusMinus: 40,
  penalties: 355, shots: 1413, ppp: 94, shp: 6, hits: 582, blocks: 574,
  scores: { goals: 60, assists: 70, points: 65, plusMinus: 70, penalties: 55, shots: 80, ppp: 50, shp: 30, hits: 85, blocks: 90 },
};

/*const mockGoalieA: Goalie = {
  name: 'Juuse Saros', score: 100, scoreAdjustedByGames: 90,
  games: 200, wins: 120, saves: 5000, shutouts: 15,
  goals: 0, assists: 2, points: 2, penalties: 4, ppp: 0, shp: 0,
  scores: { wins: 85, saves: 90, shutouts: 70 },
};

const mockGoalieB: Goalie = {
  name: 'Andrei Vasilevskiy', score: 95, scoreAdjustedByGames: 85,
  games: 250, wins: 150, saves: 6000, shutouts: 20,
  goals: 0, assists: 5, points: 5, penalties: 6, ppp: 0, shp: 0,
  scores: { wins: 90, saves: 80, shutouts: 75 },
};*/

const playerMock = { playerA: mockForwardA, playerB: mockForwardB, context: 'player' as const }
// const goalieMock = { playerA: mockGoalieA, playerB: mockGoalieB, context: 'goalie' as const }


describe('ComparisonDialogComponent', () => {
  let fixture: ComponentFixture<ComparisonDialogComponent>;
  let component: ComparisonDialogComponent;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ComparisonDialogComponent>>;
  let translateService: TranslateService;

  function setup(data: ComparisonDialogData): void {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [
        ComparisonDialogComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        {
          provide: ApiService,
          useValue: { getTeams: () => of([{ id: '1', name: 'colorado', presentName: 'Colorado' }]) },
        },
        { provide: TeamService, useValue: { selectedTeamId: '1' } },
      ],
    });

    translateService = TestBed.inject(TranslateService);
    translateService.setTranslation('fi', {
      comparison: {
        playerTitle: 'Pelaajavertailu',
        forwardTitle: 'Hyokkaajavertailu',
        defenseTitle: 'Puolustajavertailu',
        goalieTitle: 'Maalivahtivertailu',
        statsTab: 'Tilastot',
        graphsTab: 'Graafit',
      },
      tableColumn: {
        score: 'FR',
        scoreAdjustedByGames: 'FR/O',
        games: 'Ottelut',
        goals: 'Maalit',
        assists: 'Syotot',
        points: 'Pisteet',
        plusMinus: 'Plusmiinus',
        penalties: 'Jaahyt',
        shots: 'Laukaukset',
        ppp: 'YV-pisteet',
        shp: 'AV-pisteet',
        hits: 'Taklaukset',
        blocks: 'Blokit',
        wins: 'Voitot',
        saves: 'Torjunnat',
        shutouts: 'Nollat',
        gaa: 'GAA',
        savePercent: 'Torjunta%',
      },
    });
    translateService.use('fi');

    fixture = TestBed.createComponent(ComparisonDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    fixture?.destroy();
  });

  describe('team name', () => {
    it('should display team name from TeamService', fakeAsync(() => {
      setup(playerMock);
      tick();
      fixture.detectChanges();
      expect(component.teamName).toBe('Colorado');
    }));

    it('should set empty team name when team is not found', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          ComparisonDialogComponent,
          NoopAnimationsModule,
          TranslateModule.forRoot(),
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: playerMock },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          {
            provide: ApiService,
            useValue: { getTeams: () => of([{ id: '999', name: 'other', presentName: 'Other' }]) },
          },
          { provide: TeamService, useValue: { selectedTeamId: '1' } },
        ],
      });

      const localFixture = TestBed.createComponent(ComparisonDialogComponent);
      localFixture.detectChanges();
      tick();

      expect(localFixture.componentInstance.teamName).toBe('');
      localFixture.destroy();
    }));
  });

  describe('dialog actions', () => {
    it('should close dialog when close button is clicked', () => {
      setup(playerMock);
      const el: HTMLElement = fixture.nativeElement;
      const closeButton = el.querySelector('button[aria-label="a11y.closeComparisonDialog"]') as HTMLButtonElement;
      expect(closeButton).toBeTruthy();
      closeButton.click();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('tabs', () => {
    it('should render two tabs', () => {
      setup(playerMock);
      const el: HTMLElement = fixture.nativeElement;
      const tabs = el.querySelectorAll('.mdc-tab');
      expect(tabs.length).toBe(2);
    });

    it('should show Tilastot and Graafit tab labels', () => {
      setup(playerMock);
      const el: HTMLElement = fixture.nativeElement;
      const tabLabels = Array.from(el.querySelectorAll('.mdc-tab__text-label'));
      const labels = tabLabels.map((t) => t.textContent?.trim());
      expect(labels).toContain('Tilastot');
      expect(labels).toContain('Graafit');
    });
  });

  describe('isNarrow$', () => {
    it('should emit from BreakpointObserver', (done) => {
      setup(playerMock);
      component.isNarrow$.subscribe((isNarrow) => {
        expect(typeof isNarrow).toBe('boolean');
        done();
      });
    });
  });

  describe('statsPerGame view', () => {
    it('should hide tabs and radar when statsPerGame is true', fakeAsync(() => {
      // Mock FilterService with statsPerGame: true
      const mockFilterService = {
        playerFilters$: of({
          statsPerGame: true,
          position: 'all',
          minGames: 0,
          sortBy: 'score'
        }),
        goalieFilters$: of({
          statsPerGame: true,
          minGames: 0,
          sortBy: 'score'
        })
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          ComparisonDialogComponent,
          NoopAnimationsModule,
          TranslateModule.forRoot(),
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: playerMock },
          { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
          {
            provide: ApiService,
            useValue: { getTeams: () => of([{ id: '1', name: 'colorado', presentName: 'Colorado' }]) },
          },
          { provide: TeamService, useValue: { selectedTeamId: '1' } },
          { provide: FilterService, useValue: mockFilterService },
        ],
      });

      const localFixture = TestBed.createComponent(ComparisonDialogComponent);
      localFixture.detectChanges();
      tick();
      localFixture.detectChanges();

      const el: HTMLElement = localFixture.nativeElement;

      // Verify mat-tab-group is NOT present
      const tabGroup = el.querySelector('mat-tab-group');
      expect(tabGroup).toBeNull();

      // Verify comparison-radar is NOT present
      const radar = el.querySelector('app-comparison-radar');
      expect(radar).toBeNull();

      // Verify comparison-stats IS present
      const stats = el.querySelector('app-comparison-stats');
      expect(stats).toBeTruthy();

      localFixture.destroy();
    }));

    it('should show tabs and radar when statsPerGame is false', fakeAsync(() => {
      // Mock FilterService with statsPerGame: false
      const mockFilterService = {
        playerFilters$: of({
          statsPerGame: false,
          position: 'all',
          minGames: 0,
          sortBy: 'score'
        }),
        goalieFilters$: of({
          statsPerGame: false,
          minGames: 0,
          sortBy: 'score'
        })
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          ComparisonDialogComponent,
          NoopAnimationsModule,
          TranslateModule.forRoot(),
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: playerMock },
          { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
          {
            provide: ApiService,
            useValue: { getTeams: () => of([{ id: '1', name: 'colorado', presentName: 'Colorado' }]) },
          },
          { provide: TeamService, useValue: { selectedTeamId: '1' } },
          { provide: FilterService, useValue: mockFilterService },
        ],
      });

      const localFixture = TestBed.createComponent(ComparisonDialogComponent);
      localFixture.detectChanges();
      tick();
      localFixture.detectChanges();

      const el: HTMLElement = localFixture.nativeElement;

      // Verify mat-tab-group IS present
      const tabGroup = el.querySelector('mat-tab-group');
      expect(tabGroup).toBeTruthy();

      // Verify both tabs exist
      const tabs = el.querySelectorAll('.mdc-tab');
      expect(tabs.length).toBe(2);

      localFixture.destroy();
    }));
  });
});
