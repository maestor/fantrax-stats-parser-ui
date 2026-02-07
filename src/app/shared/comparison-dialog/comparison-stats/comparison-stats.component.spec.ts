import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ComparisonStatsComponent } from './comparison-stats.component';
import type { Player, Goalie } from '@services/api.service';

const mockPlayerA: Player = {
  name: 'Mikko Rantanen', position: 'F', score: 100, scoreAdjustedByGames: 93.1,
  games: 540, goals: 193, assists: 254, points: 447, plusMinus: 10,
  penalties: 256, shots: 1182, ppp: 165, shp: 5, hits: 276, blocks: 41,
};

const mockPlayerB: Player = {
  name: 'Aaron Ekblad', position: 'D', score: 94.31, scoreAdjustedByGames: 67.22,
  games: 427, goals: 100, assists: 188, points: 288, plusMinus: 40,
  penalties: 355, shots: 1413, ppp: 94, shp: 6, hits: 582, blocks: 574,
};

const mockGoalieCombinedA: Goalie = {
  name: 'Juuse Saros', score: 100, scoreAdjustedByGames: 90,
  games: 200, wins: 120, saves: 5000, shutouts: 15,
  goals: 0, assists: 2, points: 2, penalties: 4, ppp: 0, shp: 0,
};

const mockGoalieCombinedB: Goalie = {
  name: 'Andrei Vasilevskiy', score: 95, scoreAdjustedByGames: 85,
  games: 250, wins: 150, saves: 6000, shutouts: 20,
  goals: 0, assists: 5, points: 5, penalties: 6, ppp: 0, shp: 0,
};

const mockGoalieSeasonA: Goalie = {
  name: 'Juuse Saros', score: 100, scoreAdjustedByGames: 90,
  games: 60, wins: 35, saves: 1800, shutouts: 5,
  goals: 0, assists: 1, points: 1, penalties: 2, ppp: 0, shp: 0,
  gaa: '2.10', savePercent: '0.925',
};

const mockGoalieSeasonB: Goalie = {
  name: 'Andrei Vasilevskiy', score: 95, scoreAdjustedByGames: 85,
  games: 55, wins: 30, saves: 1600, shutouts: 3,
  goals: 0, assists: 2, points: 2, penalties: 4, ppp: 0, shp: 0,
  gaa: '2.50', savePercent: '0.910',
};

describe('ComparisonStatsComponent', () => {
  let fixture: ComponentFixture<ComparisonStatsComponent>;
  let component: ComparisonStatsComponent;
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparisonStatsComponent, TranslateModule.forRoot()],
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
    translateService.setTranslation('fi', {
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
  });

  function createComponent(playerA: Player | Goalie, playerB: Player | Goalie, isMobile = false): void {
    fixture = TestBed.createComponent(ComparisonStatsComponent);
    component = fixture.componentInstance;
    component.playerA = playerA;
    component.playerB = playerB;
    component.isMobile = isMobile;
    fixture.detectChanges();
  }

  afterEach(() => {
    fixture?.destroy();
  });

  describe('player stats', () => {
    it('should render all player stat rows', () => {
      createComponent(mockPlayerA, mockPlayerB);
      // PLAYER_STAT_COLUMNS: score, scoreAdjustedByGames, games, goals, assists, points, plusMinus, penalties, shots, ppp, shp, hits, blocks
      expect(component.statRows.length).toBe(13);
    });

    it('should have correct stat keys for players', () => {
      createComponent(mockPlayerA, mockPlayerB);
      const keys = component.statRows.map((r) => r.key);
      expect(keys).toContain('score');
      expect(keys).toContain('goals');
      expect(keys).toContain('assists');
      expect(keys).toContain('hits');
      expect(keys).toContain('blocks');
      expect(keys).not.toContain('name');
      expect(keys).not.toContain('position');
    });

    it('should bold the higher value', () => {
      createComponent(mockPlayerA, mockPlayerB);
      // Player A has score=100, Player B has score=94.31
      const scoreRow = component.statRows.find((r) => r.key === 'score')!;
      expect(scoreRow.boldA).toBeTrue();
      expect(scoreRow.boldB).toBeFalse();
    });

    it('should bold Player B when they have higher value', () => {
      createComponent(mockPlayerA, mockPlayerB);
      // Player A has hits=276, Player B has hits=582
      const hitsRow = component.statRows.find((r) => r.key === 'hits')!;
      expect(hitsRow.boldA).toBeFalse();
      expect(hitsRow.boldB).toBeTrue();
    });

    it('should not bold either value when they are equal', () => {
      const equalA = { ...mockPlayerA, goals: 100 };
      const equalB = { ...mockPlayerB, goals: 100 };
      createComponent(equalA, equalB);
      const goalsRow = component.statRows.find((r) => r.key === 'goals')!;
      expect(goalsRow.boldA).toBeFalse();
      expect(goalsRow.boldB).toBeFalse();
    });
  });

  describe('goalie stats (combined)', () => {
    it('should render goalie combined stat rows', () => {
      createComponent(mockGoalieCombinedA, mockGoalieCombinedB);
      // GOALIE_STAT_COLUMNS: score, scoreAdjustedByGames, games, wins, saves, shutouts, goals, assists, points, penalties, ppp, shp
      expect(component.statRows.length).toBe(12);
    });

    it('should not include gaa or savePercent for combined goalies', () => {
      createComponent(mockGoalieCombinedA, mockGoalieCombinedB);
      const keys = component.statRows.map((r) => r.key);
      expect(keys).not.toContain('gaa');
      expect(keys).not.toContain('savePercent');
    });
  });

  describe('goalie stats (season)', () => {
    it('should render goalie season stat rows including gaa and savePercent', () => {
      createComponent(mockGoalieSeasonA, mockGoalieSeasonB);
      // GOALIE_SEASON_STAT_COLUMNS: score, scoreAdjustedByGames, games, wins, saves, gaa, savePercent, shutouts, goals, assists, points, penalties, ppp, shp
      expect(component.statRows.length).toBe(14);
    });

    it('should include gaa and savePercent for season goalies', () => {
      createComponent(mockGoalieSeasonA, mockGoalieSeasonB);
      const keys = component.statRows.map((r) => r.key);
      expect(keys).toContain('gaa');
      expect(keys).toContain('savePercent');
    });

    it('should bold the LOWER gaa value (lower is better)', () => {
      createComponent(mockGoalieSeasonA, mockGoalieSeasonB);
      // Goalie A: gaa=2.10, Goalie B: gaa=2.50; lower is better
      const gaaRow = component.statRows.find((r) => r.key === 'gaa')!;
      expect(gaaRow.boldA).toBeTrue();
      expect(gaaRow.boldB).toBeFalse();
    });

    it('should bold higher savePercent (higher is better)', () => {
      createComponent(mockGoalieSeasonA, mockGoalieSeasonB);
      // Goalie A: savePercent=0.925, Goalie B: savePercent=0.910
      const spRow = component.statRows.find((r) => r.key === 'savePercent')!;
      expect(spRow.boldA).toBeTrue();
      expect(spRow.boldB).toBeFalse();
    });
  });

  describe('missing stat values', () => {
    it('should show dash for undefined stat values', () => {
      const playerMissingStat = { ...mockPlayerA, hits: undefined } as unknown as Player;
      createComponent(playerMissingStat, mockPlayerB);
      const hitsRow = component.statRows.find((r) => r.key === 'hits')!;
      expect(hitsRow.valueA).toBe('-');
    });
  });

  describe('desktop layout', () => {
    it('should render desktop rows when isMobile is false', () => {
      createComponent(mockPlayerA, mockPlayerB, false);
      const el: HTMLElement = fixture.nativeElement;
      const desktopRows = el.querySelectorAll('.stat-row-desktop');
      expect(desktopRows.length).toBe(13);
      expect(el.querySelectorAll('.stat-row-mobile').length).toBe(0);
    });
  });

  describe('mobile layout', () => {
    it('should render mobile rows when isMobile is true', () => {
      createComponent(mockPlayerA, mockPlayerB, true);
      const el: HTMLElement = fixture.nativeElement;
      const mobileRows = el.querySelectorAll('.stat-row-mobile');
      expect(mobileRows.length).toBe(13);
      expect(el.querySelectorAll('.stat-row-desktop').length).toBe(0);
    });
  });

  describe('bold CSS class', () => {
    it('should apply bold class to the higher value element', () => {
      createComponent(mockPlayerA, mockPlayerB, false);
      const el: HTMLElement = fixture.nativeElement;
      // score: A=100 > B=94.31, so value-a should be bold
      const firstRow = el.querySelector('.stat-row-desktop')!;
      const valueA = firstRow.querySelector('.value-a')!;
      const valueB = firstRow.querySelector('.value-b')!;
      expect(valueA.classList.contains('bold')).toBeTrue();
      expect(valueB.classList.contains('bold')).toBeFalse();
    });
  });

  describe('translated labels', () => {
    it('should use translated labels for stat rows', () => {
      createComponent(mockPlayerA, mockPlayerB);
      const scoreRow = component.statRows.find((r) => r.key === 'score')!;
      expect(scoreRow.label).toBe('FR');
    });
  });
});
