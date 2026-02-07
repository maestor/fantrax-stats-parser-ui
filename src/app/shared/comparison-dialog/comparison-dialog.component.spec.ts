import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ComparisonDialogComponent, ComparisonDialogData } from './comparison-dialog.component';
import type { Player, Goalie } from '@services/api.service';
import { ApiService } from '@services/api.service';
import { TeamService } from '@services/team.service';

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

const mockDefenseA: Player = {
  name: 'Aaron Ekblad', position: 'D', score: 100, scoreAdjustedByGames: 67.22,
  games: 540, goals: 100, assists: 188, points: 288, plusMinus: 40,
  penalties: 355, shots: 1413, ppp: 94, shp: 6, hits: 582, blocks: 574,
  scores: { goals: 60, assists: 70, points: 65, plusMinus: 70, penalties: 55, shots: 80, ppp: 50, shp: 30, hits: 85, blocks: 90 },
};

const mockDefenseB: Player = {
  name: 'Miro Heiskanen', position: 'D', score: 88, scoreAdjustedByGames: 77,
  games: 400, goals: 80, assists: 200, points: 280, plusMinus: 30,
  penalties: 100, shots: 900, ppp: 120, shp: 2, hits: 300, blocks: 400,
  scores: { goals: 50, assists: 80, points: 70, plusMinus: 55, penalties: 30, shots: 60, ppp: 70, shp: 15, hits: 55, blocks: 75 },
};

const mockGoalieA: Goalie = {
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
};

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

  describe('title', () => {
    it('should show forward title when both players are forwards', () => {
      setup({ playerA: mockForwardA, playerB: mockForwardB });
      expect(component.title).toBe('Hyokkaajavertailu');
    });

    it('should show defense title when both players are defensemen', () => {
      setup({ playerA: mockDefenseA, playerB: mockDefenseB });
      expect(component.title).toBe('Puolustajavertailu');
    });

    it('should show player title for mixed positions', () => {
      setup({ playerA: mockForwardA, playerB: mockDefenseA });
      expect(component.title).toBe('Pelaajavertailu');
    });

    it('should show goalie title for goalies', () => {
      setup({ playerA: mockGoalieA, playerB: mockGoalieB });
      expect(component.title).toBe('Maalivahtivertailu');
    });
  });

  describe('ingress', () => {
    it('should show full names on desktop', () => {
      setup({ playerA: mockForwardA, playerB: mockForwardB });
      const text = component.getIngressText(false);
      expect(text).toBe('Mikko Rantanen <-> Aleksander Barkov');
    });

    it('should show surnames only on mobile', () => {
      setup({ playerA: mockForwardA, playerB: mockForwardB });
      const text = component.getIngressText(true);
      expect(text).toBe('Rantanen <-> Barkov');
    });

    it('should show positions for mixed comparison on desktop', () => {
      setup({ playerA: mockForwardA, playerB: mockDefenseA });
      const text = component.getIngressText(false);
      expect(text).toBe('H Mikko Rantanen <-> Aaron Ekblad P');
    });

    it('should show positions for mixed comparison on mobile', () => {
      setup({ playerA: mockForwardA, playerB: mockDefenseA });
      const text = component.getIngressText(true);
      expect(text).toBe('H Rantanen <-> Ekblad P');
    });

    it('should not show positions when both are forwards', () => {
      setup({ playerA: mockForwardA, playerB: mockForwardB });
      const text = component.getIngressText(false);
      expect(text).not.toContain(' H ');
      expect(text).not.toContain(' P ');
    });

    it('should not show positions for goalies', () => {
      setup({ playerA: mockGoalieA, playerB: mockGoalieB });
      const text = component.getIngressText(false);
      expect(text).toBe('Juuse Saros <-> Andrei Vasilevskiy');
    });
  });

  describe('team name', () => {
    it('should display team name from TeamService', fakeAsync(() => {
      setup({ playerA: mockForwardA, playerB: mockForwardB });
      tick();
      fixture.detectChanges();
      expect(component.teamName).toBe('Colorado');
    }));
  });

  describe('dialog actions', () => {
    it('should close dialog when close button is clicked', () => {
      setup({ playerA: mockForwardA, playerB: mockForwardB });
      const el: HTMLElement = fixture.nativeElement;
      const closeButton = el.querySelector('button[aria-label="Sulje"]') as HTMLButtonElement;
      expect(closeButton).toBeTruthy();
      closeButton.click();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('tabs', () => {
    it('should render two tabs', () => {
      setup({ playerA: mockForwardA, playerB: mockForwardB });
      const el: HTMLElement = fixture.nativeElement;
      const tabs = el.querySelectorAll('.mdc-tab');
      expect(tabs.length).toBe(2);
    });

    it('should show Tilastot and Graafit tab labels', () => {
      setup({ playerA: mockForwardA, playerB: mockForwardB });
      const el: HTMLElement = fixture.nativeElement;
      const tabLabels = Array.from(el.querySelectorAll('.mdc-tab__text-label'));
      const labels = tabLabels.map((t) => t.textContent?.trim());
      expect(labels).toContain('Tilastot');
      expect(labels).toContain('Graafit');
    });
  });

  describe('isGoalie', () => {
    it('should return true for goalies', () => {
      setup({ playerA: mockGoalieA, playerB: mockGoalieB });
      expect(component.isGoalie).toBeTrue();
    });

    it('should return false for players', () => {
      setup({ playerA: mockForwardA, playerB: mockForwardB });
      expect(component.isGoalie).toBeFalse();
    });
  });

  describe('isMixedPosition', () => {
    it('should return true for forward vs defense', () => {
      setup({ playerA: mockForwardA, playerB: mockDefenseA });
      expect(component.isMixedPosition).toBeTrue();
    });

    it('should return false for same positions', () => {
      setup({ playerA: mockForwardA, playerB: mockForwardB });
      expect(component.isMixedPosition).toBeFalse();
    });

    it('should return false for goalies', () => {
      setup({ playerA: mockGoalieA, playerB: mockGoalieB });
      expect(component.isMixedPosition).toBeFalse();
    });
  });
});
