import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ComparisonRadarComponent } from './comparison-radar.component';
import type { Player, Goalie } from '@services/api.service';

const mockPlayerA: Player = {
  name: 'Mikko Rantanen', position: 'F', score: 100, scoreAdjustedByGames: 93.1,
  games: 427, goals: 193, assists: 254, points: 447, plusMinus: 10,
  penalties: 256, shots: 1182, ppp: 165, shp: 5, hits: 276, blocks: 41,
  scores: { goals: 80, assists: 75, points: 85, plusMinus: 50, penalties: 60, shots: 70, ppp: 90, shp: 10, hits: 40, blocks: 20 },
};

const mockPlayerB: Player = {
  name: 'Aaron Ekblad', position: 'D', score: 94.31, scoreAdjustedByGames: 67.22,
  games: 540, goals: 100, assists: 188, points: 288, plusMinus: 40,
  penalties: 355, shots: 1413, ppp: 94, shp: 6, hits: 582, blocks: 574,
  scores: { goals: 60, assists: 70, points: 65, plusMinus: 70, penalties: 55, shots: 80, ppp: 50, shp: 30, hits: 85, blocks: 90 },
};

const mockGoalieCombinedA: Goalie = {
  name: 'Juuse Saros', score: 100, scoreAdjustedByGames: 90,
  games: 200, wins: 120, saves: 5000, shutouts: 15,
  goals: 0, assists: 2, points: 2, penalties: 4, ppp: 0, shp: 0,
  scores: { wins: 85, saves: 90, shutouts: 70 },
};

const mockGoalieCombinedB: Goalie = {
  name: 'Andrei Vasilevskiy', score: 95, scoreAdjustedByGames: 85,
  games: 250, wins: 150, saves: 6000, shutouts: 20,
  goals: 0, assists: 5, points: 5, penalties: 6, ppp: 0, shp: 0,
  scores: { wins: 90, saves: 80, shutouts: 75 },
};

const mockGoalieSeasonA: Goalie = {
  name: 'Juuse Saros', score: 100, scoreAdjustedByGames: 90,
  games: 60, wins: 35, saves: 1800, shutouts: 5,
  goals: 0, assists: 1, points: 1, penalties: 2, ppp: 0, shp: 0,
  gaa: '2.10', savePercent: '0.925',
  scores: { wins: 85, saves: 90, shutouts: 70, gaa: 80, savePercent: 75 },
};

const mockGoalieSeasonB: Goalie = {
  name: 'Andrei Vasilevskiy', score: 95, scoreAdjustedByGames: 85,
  games: 55, wins: 30, saves: 1600, shutouts: 3,
  goals: 0, assists: 2, points: 2, penalties: 4, ppp: 0, shp: 0,
  gaa: '2.50', savePercent: '0.910',
  scores: { wins: 90, saves: 80, shutouts: 75, gaa: 60, savePercent: 65 },
};

const mockPlayerNoScores: Player = {
  name: 'No Scores Player', position: 'F', score: 50, scoreAdjustedByGames: 50,
  games: 10, goals: 5, assists: 5, points: 10, plusMinus: 0,
  penalties: 2, shots: 20, ppp: 0, shp: 0, hits: 5, blocks: 5,
};

const mockGoalieNoScores: Goalie = {
  name: 'No Scores Goalie', score: 50, scoreAdjustedByGames: 50,
  games: 10, wins: 5, saves: 200, shutouts: 1,
  goals: 0, assists: 0, points: 0, penalties: 0, ppp: 0, shp: 0,
};

describe('ComparisonRadarComponent', () => {
  let fixture: ComponentFixture<ComparisonRadarComponent>;
  let component: ComparisonRadarComponent;
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparisonRadarComponent, TranslateModule.forRoot()],
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
    translateService.setTranslation('fi', {
      tableColumn: {
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
      graphs: {
        radarInfo: 'Joukkueen sisainen vertailuarvo 0-100 valilla',
      },
    });
    translateService.use('fi');
  });

  function createComponent(playerA: Player | Goalie, playerB: Player | Goalie, context: 'player' | 'goalie' = 'player'): void {
    fixture = TestBed.createComponent(ComparisonRadarComponent);
    component = fixture.componentInstance;
    component.playerA = playerA;
    component.playerB = playerB;
    component.context = context;
    fixture.detectChanges();
  }

  afterEach(() => {
    fixture?.destroy();
  });

  describe('player radar', () => {
    it('should build chart data with two datasets', () => {
      createComponent(mockPlayerA, mockPlayerB);
      expect(component.radarChartData.datasets.length).toBe(2);
    });

    it('should have 10 labels for player stats', () => {
      createComponent(mockPlayerA, mockPlayerB);
      expect(component.radarChartData.labels!.length).toBe(10);
    });

    it('should use translated labels', () => {
      createComponent(mockPlayerA, mockPlayerB);
      const labels = component.radarChartData.labels as string[];
      expect(labels).toContain('Maalit');
      expect(labels).toContain('Syotot');
      expect(labels).toContain('Pisteet');
    });

    it('should use blue color for Player A', () => {
      createComponent(mockPlayerA, mockPlayerB);
      const datasetA = component.radarChartData.datasets[0];
      expect(datasetA.backgroundColor).toBe('rgba(25, 118, 210, 0.3)');
      expect(datasetA.borderColor).toBe('#1976d2');
    });

    it('should use orange color for Player B', () => {
      createComponent(mockPlayerA, mockPlayerB);
      const datasetB = component.radarChartData.datasets[1];
      expect(datasetB.backgroundColor).toBe('rgba(255, 152, 0, 0.3)');
      expect(datasetB.borderColor).toBe('#ff9800');
    });

    it('should use player names as dataset labels', () => {
      createComponent(mockPlayerA, mockPlayerB);
      expect(component.radarChartData.datasets[0].label).toBe('Mikko Rantanen');
      expect(component.radarChartData.datasets[1].label).toBe('Aaron Ekblad');
    });

    it('should populate correct score values for Player A', () => {
      createComponent(mockPlayerA, mockPlayerB);
      const dataA = component.radarChartData.datasets[0].data;
      // Order: goals, assists, points, plusMinus, penalties, shots, ppp, shp, hits, blocks
      expect(dataA).toEqual([80, 75, 85, 50, 60, 70, 90, 10, 40, 20]);
    });

    it('should populate correct score values for Player B', () => {
      createComponent(mockPlayerA, mockPlayerB);
      const dataB = component.radarChartData.datasets[1].data;
      expect(dataB).toEqual([60, 70, 65, 70, 55, 80, 50, 30, 85, 90]);
    });

    it('should not build datasets when players have no scores', () => {
      createComponent(mockPlayerNoScores, mockPlayerNoScores);
      expect(component.radarChartData.datasets.length).toBe(0);
    });
  });

  describe('goalie radar (combined)', () => {
    it('should build chart data with two datasets for goalies', () => {
      createComponent(mockGoalieCombinedA, mockGoalieCombinedB, 'goalie');
      expect(component.radarChartData.datasets.length).toBe(2);
    });

    it('should have 3 labels for combined goalie stats', () => {
      createComponent(mockGoalieCombinedA, mockGoalieCombinedB, 'goalie');
      expect(component.radarChartData.labels!.length).toBe(3);
    });

    it('should use correct stat keys for combined goalies', () => {
      createComponent(mockGoalieCombinedA, mockGoalieCombinedB, 'goalie');
      const labels = component.radarChartData.labels as string[];
      expect(labels).toEqual(['Voitot', 'Torjunnat', 'Nollat']);
    });
  });

  describe('goalie radar (season)', () => {
    it('should have 5 labels for season goalie stats', () => {
      createComponent(mockGoalieSeasonA, mockGoalieSeasonB, 'goalie');
      expect(component.radarChartData.labels!.length).toBe(5);
    });

    it('should include gaa and savePercent labels for season goalies', () => {
      createComponent(mockGoalieSeasonA, mockGoalieSeasonB, 'goalie');
      const labels = component.radarChartData.labels as string[];
      expect(labels).toContain('GAA');
      expect(labels).toContain('Torjunta%');
    });
  });

  describe('chart options', () => {
    it('should set radar scale min to 0 and max to 100', () => {
      createComponent(mockPlayerA, mockPlayerB);
      const scales = component.radarChartOptions?.scales as Record<string, unknown>;
      const r = scales['r'] as { min: number; max: number };
      expect(r.min).toBe(0);
      expect(r.max).toBe(100);
    });

    it('should set tick step size to 20', () => {
      createComponent(mockPlayerA, mockPlayerB);
      const scales = component.radarChartOptions?.scales as Record<string, unknown>;
      const r = scales['r'] as { ticks: { stepSize: number } };
      expect(r.ticks.stepSize).toBe(20);
    });

    it('should show legend at bottom', () => {
      createComponent(mockPlayerA, mockPlayerB);
      const plugins = component.radarChartOptions?.plugins as Record<string, unknown>;
      const legend = plugins['legend'] as { position: string };
      expect(legend.position).toBe('bottom');
    });
  });

  describe('goalie radar (no scores)', () => {
    it('should not build datasets when goalies have no scores', () => {
      createComponent(mockGoalieNoScores, mockGoalieNoScores, 'goalie');
      expect(component.radarChartData.datasets.length).toBe(0);
    });
  });

  describe('tooltip callback', () => {
    it('should format tooltip label as "name: value/100"', () => {
      createComponent(mockPlayerA, mockPlayerB);
      const plugins = component.radarChartOptions?.plugins as Record<string, any>;
      const labelFn = plugins['tooltip'].callbacks.label;
      const result = labelFn({ dataset: { label: 'Mikko Rantanen' }, parsed: { r: 80 } });
      expect(result).toBe('Mikko Rantanen: 80/100');
    });

    it('should handle missing dataset label gracefully', () => {
      createComponent(mockPlayerA, mockPlayerB);
      const plugins = component.radarChartOptions?.plugins as Record<string, any>;
      const labelFn = plugins['tooltip'].callbacks.label;
      const result = labelFn({ dataset: {}, parsed: { r: 50 } });
      expect(result).toBe(': 50/100');
    });
  });
});
