import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerCardGraphsComponent } from './player-card-graphs.component';
import { TranslateModule } from '@ngx-translate/core';
import type { Player, PlayerSeasonStats } from '@services/api.service';

describe('PlayerCardGraphsComponent', () => {
  let fixture: ComponentFixture<PlayerCardGraphsComponent>;
  let component: PlayerCardGraphsComponent;

  const seasons: PlayerSeasonStats[] = [
    {
      season: 2024,
      games: 82,
      score: 123,
      scoreAdjustedByGames: 1.5,
      goals: 30,
      assists: 40,
      points: 70,
      shots: 200,
      penalties: 20,
      hits: 50,
      blocks: 30,
      plusMinus: 10,
      ppp: 15,
      shp: 1,
    },
    {
      season: 2023,
      games: 80,
      score: 100,
      scoreAdjustedByGames: 1.25,
      goals: 25,
      assists: 35,
      points: 60,
      shots: 180,
      penalties: 18,
      hits: 45,
      blocks: 28,
      plusMinus: 8,
      ppp: 12,
      shp: 0,
    },
  ];

  const mockPlayer: Player & { seasons: PlayerSeasonStats[] } = {
    name: 'Skater One',
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
    seasons,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerCardGraphsComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerCardGraphsComponent);
    component = fixture.componentInstance;

    component.data = mockPlayer;
    fixture.detectChanges();
  });

  it('should create and initialize chart data', () => {
    expect(component).toBeTruthy();
    expect(component.hasSeasons).toBeTrue();

    expect(component.lineChartData.labels?.length).toBeGreaterThan(0);
    expect(component.lineChartData.datasets.length).toBeGreaterThan(0);
  });

  it('should toggle graph controls', () => {
    expect(component.graphControlsExpanded).toBeFalse();
    component.toggleGraphControls();
    expect(component.graphControlsExpanded).toBeTrue();
  });

  it('should update datasets when a stat is toggled', () => {
    const initialCount = component.lineChartData.datasets.length;

    // Turn on an additional series (goals)
    component.onStatToggle('goals', { checked: true } as any);
    fixture.detectChanges();

    expect(component.lineChartData.datasets.length).toBeGreaterThanOrEqual(
      initialCount
    );
  });

  it('should handle ArrowUp/ArrowDown keyboard shortcuts', () => {
    const focusTabHeader = jasmine.createSpy('focusTabHeader');
    const closeBtn = document.createElement('button');
    spyOn(closeBtn, 'focus');

    component.requestFocusTabHeader = focusTabHeader;
    component.closeButtonEl = closeBtn;

    component.onGraphCheckboxKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(focusTabHeader).toHaveBeenCalled();

    component.onGraphCheckboxKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(closeBtn.focus).toHaveBeenCalled();
  });

  it('should apply themed colors when token-resolver returns values', () => {
    // Do not stub global getComputedStyle: Chart.js also uses it during canvas init.
    // Instead, stub the component's resolver and call the private theme method.
    const themedFixture = TestBed.createComponent(PlayerCardGraphsComponent);
    const themed = themedFixture.componentInstance;
    themed.data = mockPlayer;

    spyOn<any>(themed, 'resolveCssColorVar').and.callFake(
      (name: string, fallback: string, cssProperty: 'color' | 'backgroundColor' = 'color') => {
        if (name === '--mat-sys-on-surface') return 'rgb(10, 10, 10)';
        if (name === '--mat-sys-outline-variant') return 'rgba(255, 0, 0, 0.3)';
        if (name === '--mat-sys-surface-container-high' && cssProperty === 'backgroundColor') {
          return 'rgb(20, 20, 20)';
        }
        return fallback;
      }
    );

    (themed as any).applyThemeToChartOptions();

    const plugins: any = themed.lineChartOptions.plugins;
    expect(plugins.legend.labels.color).toBe('rgb(10, 10, 10)');
    expect(plugins.tooltip.titleColor).toBe('rgb(10, 10, 10)');

    const scales: any = themed.lineChartOptions.scales;
    expect(scales.x.ticks.color).toBe('rgb(10, 10, 10)');
    expect(scales.y.grid.color).toBe('rgba(255, 0, 0, 0.3)');
  });

  it('should ignore unrelated keydowns without side-effects', () => {
    const event = {
      key: 'Enter',
      preventDefault: jasmine.createSpy('preventDefault'),
    } as any;

    component.onGraphCheckboxKeydown(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should not throw on ArrowDown when close button is not provided', () => {
    const event = {
      key: 'ArrowDown',
      preventDefault: jasmine.createSpy('preventDefault'),
    } as any;

    component.closeButtonEl = undefined;
    component.onGraphCheckboxKeydown(event);

    // No close button => no focus move, no preventDefault.
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should handle missing seasons and non-numeric values in chart data', () => {
    // Force a year-gap so updateChartData hits the missing-season branch.
    (component as any).chartYearsRange = [2023, 2024];
    (component as any).chartLabels = ['23-24', '24-25'];

    // Ensure score series is active.
    component.chartSelections = { ...component.chartSelections, score: true };

    // Provide only one season + a non-numeric string to hit parsing branches.
    const seasonsWithGap: any[] = [
      {
        season: 2024,
        score: 'abc',
      },
    ];

    (component as any).updateChartData(seasonsWithGap);

    const firstDataset: any = component.lineChartData.datasets[0];
    expect(firstDataset.data[0]).toBeNull();
    expect(firstDataset.data[1]).toBe(0);
  });

  it('should not rescale y-axis when there are no active series values', () => {
    // Disable all series to hit the allValues.length === 0 branch.
    component.chartSelections = component.chartStatKeys.reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {} as Record<string, boolean>
    );

    (component as any).chartYearsRange = [2024];
    (component as any).chartLabels = ['24-25'];

    (component as any).updateChartData([{ season: 2024, score: 10 } as any]);
    expect(component.lineChartData.datasets.length).toBe(0);
  });

  it('resolveCssColorVar should compute a background color string when possible', () => {
    const themedFixture = TestBed.createComponent(PlayerCardGraphsComponent);
    const themed = themedFixture.componentInstance;

    const value = (themed as any).resolveCssColorVar(
      '--mat-sys-surface-container-high',
      'rgba(0,0,0,0.8)',
      'backgroundColor'
    );

    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
  });

  it('onStatToggle should no-op when seasons are missing', () => {
    const themedFixture = TestBed.createComponent(PlayerCardGraphsComponent);
    const themed = themedFixture.componentInstance;
    themed.data = { ...mockPlayer, seasons: undefined as any };

    expect(() => themed.onStatToggle('score', { checked: true } as any)).not.toThrow();
  });

  it('should initialize missing y-scale options when rescaling', () => {
    const themedFixture = TestBed.createComponent(PlayerCardGraphsComponent);
    const themed = themedFixture.componentInstance;
    themed.data = mockPlayer;

    (themed as any).chartYearsRange = [2024];
    (themed as any).chartLabels = ['24-25'];
    themed.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
    } as any;

    // Ensure at least one series is active.
    themed.chartSelections = { ...themed.chartSelections, score: true };
    (themed as any).updateChartData([{ season: 2024, score: 10 } as any]);

    const y: any = (themed.lineChartOptions.scales as any).y;
    expect(y).toBeTruthy();
    expect(y.min).toBe(0);
    expect(y.max).toBeGreaterThan(0);
    expect(y.ticks.stepSize).toBeGreaterThan(0);
  });

  it('resolveCssColorVar should fall back to the provided fallback on errors', () => {
    const themedFixture = TestBed.createComponent(PlayerCardGraphsComponent);
    const themed = themedFixture.componentInstance;

    // Force an error from inside the resolver.
    spyOn((themed as any).document, 'createElement').and.throwError('boom');

    expect((themed as any).resolveCssColorVar('--mat-sys-on-surface', '#1f1f1f')).toBe('#1f1f1f');
    expect(
      (themed as any).resolveCssColorVar(
        '--mat-sys-surface-container-high',
        'rgba(0,0,0,0.8)',
        'backgroundColor'
      )
    ).toBe('rgba(0,0,0,0.8)');
  });

  it('should use goalie stat keys when data is a goalie', () => {
    const goalieSeasons: any[] = [
      { season: 2024, score: 10, scoreAdjustedByGames: 0.2, games: 40, wins: 20, saves: 900, shutouts: 4 },
      { season: 2023, score: 8, scoreAdjustedByGames: 0.18, games: 38, wins: 18, saves: 850, shutouts: 3 },
    ];

    const goalie: any = {
      name: 'Goalie One',
      score: 0,
      scoreAdjustedByGames: 0,
      games: 40,
      wins: 20,
      saves: 900,
      shutouts: 4,
      seasons: goalieSeasons,
    };

    const goalieFixture = TestBed.createComponent(PlayerCardGraphsComponent);
    const goalieComponent = goalieFixture.componentInstance;

    goalieComponent.data = goalie;
    goalieFixture.detectChanges();

    expect(goalieComponent.isGoalie).toBeTrue();
    expect(goalieComponent.chartStatKeys).toContain('wins');
    expect(goalieComponent.chartStatKeys).toContain('saves');
    expect(goalieComponent.chartStatKeys).toContain('shutouts');

    goalieComponent.onStatToggle('wins', { checked: true } as any);
    goalieFixture.detectChanges();
    expect(goalieComponent.lineChartData.datasets.length).toBeGreaterThan(0);
  });

  it('should set y-axis stepSize to 1 when maxValue is 0', () => {
    const themedFixture = TestBed.createComponent(PlayerCardGraphsComponent);
    const themed = themedFixture.componentInstance;
    themed.data = mockPlayer;

    (themed as any).chartYearsRange = [2024];
    (themed as any).chartLabels = ['24-25'];
    themed.chartSelections = { score: true } as any;

    (themed as any).updateChartData([{ season: 2024, score: 0 } as any]);

    const y: any = (themed.lineChartOptions.scales as any).y;
    expect(y.ticks.stepSize).toBe(1);
    expect(y.max).toBe(5);
  });

  it('resolveCssColorVar should fall back when document.body is missing', () => {
    const themedFixture = TestBed.createComponent(PlayerCardGraphsComponent);
    const themed = themedFixture.componentInstance;

    (themed as any).document = { body: null };
    expect((themed as any).resolveCssColorVar('--mat-sys-on-surface', '#1f1f1f')).toBe('#1f1f1f');
  });

  it('resolveCssColorVar should fall back when computed style is empty', () => {
    const themedFixture = TestBed.createComponent(PlayerCardGraphsComponent);
    const themed = themedFixture.componentInstance;

    spyOn(window as any, 'getComputedStyle').and.returnValue({
      color: '   ',
      backgroundColor: '   ',
    } as any);

    expect((themed as any).resolveCssColorVar('--mat-sys-on-surface', '#1f1f1f')).toBe('#1f1f1f');
  });

  it('applyThemeToChartOptions should initialize missing plugins/scales', () => {
    const themedFixture = TestBed.createComponent(PlayerCardGraphsComponent);
    const themed = themedFixture.componentInstance;

    themed.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
    } as any;

    spyOn<any>(themed, 'resolveCssColorVar').and.returnValue('rgb(1, 2, 3)');
    (themed as any).applyThemeToChartOptions();

    expect(themed.lineChartOptions.plugins).toBeTruthy();
    expect(themed.lineChartOptions.scales).toBeTruthy();
  });

  describe('Radar Chart', () => {
    it('should toggle between line and radar chart views', () => {
      component.chartViewMode = 'line';
      component.toggleChartView();
      expect(component.chartViewMode).toBe('radar');
      component.toggleChartView();
      expect(component.chartViewMode).toBe('line');
    });

    it('should build radar chart data for player with scores', () => {
      const mockPlayerWithScores: Player = {
        name: 'Test Player',
        score: 85,
        scoreAdjustedByGames: 8.5,
        games: 10,
        goals: 25,
        assists: 40,
        points: 65,
        plusMinus: 10,
        penalties: 20,
        shots: 200,
        ppp: 15,
        shp: 1,
        hits: 50,
        blocks: 30,
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

      component.data = mockPlayerWithScores;
      component.chartViewMode = 'radar';
      (component as any).buildRadarChartData();

      expect(component.radarChartData.labels?.length).toBe(10);
      expect(component.radarChartData.datasets.length).toBe(1);
      expect(component.radarChartData.datasets[0].data).toEqual([
        75, 82, 90, 60, 45, 70, 65, 55, 80, 72,
      ]);
      expect(component.radarChartData.datasets[0].label).toBe('Test Player');
    });

    it('should handle missing scores gracefully', () => {
      const mockPlayerWithoutScores: Player = {
        name: 'Test Player',
        score: 85,
        scoreAdjustedByGames: 8.5,
        games: 10,
        goals: 25,
        assists: 40,
        points: 65,
        plusMinus: 10,
        penalties: 20,
        shots: 200,
        ppp: 15,
        shp: 1,
        hits: 50,
        blocks: 30,
      };

      spyOn(console, 'warn');
      component.data = mockPlayerWithoutScores;
      (component as any).buildRadarChartData();

      expect(console.warn).toHaveBeenCalledWith(
        'No scores data available for player'
      );
    });

    it('should build goalie radar with extended stats for season', () => {
      const mockGoalieWithScores: any = {
        name: 'Test Goalie',
        score: 90,
        scoreAdjustedByGames: 9.0,
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
        scores: {
          wins: 85,
          saves: 90,
          shutouts: 75,
          gaa: 80,
          savePercent: 88,
        },
      };

      component.data = mockGoalieWithScores;
      (component as any).buildGoalieRadarData();

      expect(component.radarChartData.labels?.length).toBe(5);
      expect(component.radarChartData.datasets[0].data).toEqual([
        85, 90, 75, 80, 88,
      ]);
    });

    it('should build goalie radar without extended stats for combined', () => {
      const mockGoalieCombined: any = {
        name: 'Test Goalie',
        score: 90,
        scoreAdjustedByGames: 9.0,
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
        scores: {
          wins: 85,
          saves: 90,
          shutouts: 75,
        },
      };

      component.data = mockGoalieCombined;
      (component as any).buildGoalieRadarData();

      expect(component.radarChartData.labels?.length).toBe(3);
      expect(component.radarChartData.datasets[0].data).toEqual([85, 90, 75]);
    });

    it('should apply theme to radar chart options', () => {
      const themedFixture = TestBed.createComponent(PlayerCardGraphsComponent);
      const themed = themedFixture.componentInstance;

      spyOn<any>(themed, 'resolveCssColorVar').and.callFake(
        (name: string, fallback: string) => {
          if (name === '--mat-sys-on-surface') return 'rgb(10, 10, 10)';
          if (name === '--mat-sys-outline-variant') return 'rgba(255, 0, 0, 0.3)';
          if (name === '--mat-sys-surface-container-high') return 'rgb(20, 20, 20)';
          return fallback;
        }
      );

      (themed as any).applyThemeToRadarChartOptions();

      const plugins: any = themed.radarChartOptions?.plugins;
      expect(plugins?.legend?.labels?.color).toBe('rgb(10, 10, 10)');
      expect(plugins?.tooltip?.titleColor).toBe('rgb(10, 10, 10)');

      const scales: any = themed.radarChartOptions?.scales;
      expect(scales?.r?.ticks?.color).toBe('rgb(10, 10, 10)');
      expect(scales?.r?.grid?.color).toBe('rgb(10, 10, 10)');
    });

    it('should start in radar mode for season viewContext', () => {
      const seasonFixture = TestBed.createComponent(PlayerCardGraphsComponent);
      const seasonComponent = seasonFixture.componentInstance;

      seasonComponent.data = {
        ...mockPlayer,
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
      seasonComponent.viewContext = 'season';

      seasonComponent.ngOnInit();

      expect(seasonComponent.chartViewMode).toBe('radar');
    });

    it('should show line chart by default for combined viewContext', () => {
      const combinedFixture = TestBed.createComponent(PlayerCardGraphsComponent);
      const combinedComponent = combinedFixture.componentInstance;

      combinedComponent.data = mockPlayer;
      combinedComponent.viewContext = 'combined';

      combinedComponent.ngOnInit();

      expect(combinedComponent.chartViewMode).toBe('line');
    });

    it('should compute hasMultipleSeasons correctly for combined view', () => {
      component.viewContext = 'combined';
      component.data = mockPlayer;

      expect(component.hasMultipleSeasons).toBeTrue();
    });

    it('should compute hasMultipleSeasons as false for season view', () => {
      component.viewContext = 'season';
      component.data = mockPlayer;

      expect(component.hasMultipleSeasons).toBeFalse();
    });

    it('should use fallback grid color when textColor is not rgb format', () => {
      const fallbackFixture = TestBed.createComponent(PlayerCardGraphsComponent);
      const fallbackComponent = fallbackFixture.componentInstance;

      spyOn<any>(fallbackComponent, 'resolveCssColorVar').and.returnValue('#ffffff');

      (fallbackComponent as any).applyThemeToRadarChartOptions();

      const scales: any = fallbackComponent.radarChartOptions?.scales;
      expect(scales?.r?.grid?.color).toBe('#ffffff');
    });

    it('should build goalie radar with combined stats (no gaa/savePercent)', () => {
      const mockGoalieCombined = {
        name: 'Test Goalie',
        wins: 1,
        scores: {
          wins: 85,
          saves: 90,
          shutouts: 75
        }
      };

      component.data = mockGoalieCombined as any;
      (component as any).buildGoalieRadarData();

      expect(component.radarChartData.labels?.length).toBe(3);
      expect(component.radarChartData.datasets[0].data).toEqual([85, 90, 75]);
    });

    it('should format radar chart tooltip correctly', () => {
      component.data = {
        ...mockPlayer,
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
          blocks: 72
        }
      };

      (component as any).applyThemeToRadarChartOptions();

      const tooltipCallback = (component.radarChartOptions?.plugins?.tooltip?.callbacks?.label) as any;
      expect(tooltipCallback).toBeDefined();

      const mockContext = {
        dataset: { label: 'Test Player' },
        parsed: { r: 75 }
      };

      const result = tooltipCallback(mockContext);
      expect(result).toBe('Test Player: 75/100');
    });

    it('should call buildRadarChartData when toggling to radar view', () => {
      component.chartViewMode = 'line';
      component.data = {
        ...mockPlayer,
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
          blocks: 72
        }
      };

      spyOn<any>(component, 'buildRadarChartData');

      component.toggleChartView();

      expect(component.chartViewMode).toBe('radar');
      expect((component as any).buildRadarChartData).toHaveBeenCalled();
    });

    it('should build goalie radar with extended stats (with gaa/savePercent)', () => {
      const mockGoalieExtended = {
        name: 'Test Goalie',
        wins: 1,
        scores: {
          wins: 85,
          saves: 90,
          shutouts: 75,
          gaa: 80,
          savePercent: 88
        }
      };

      component.data = mockGoalieExtended as any;
      (component as any).buildGoalieRadarData();

      expect(component.radarChartData.labels?.length).toBe(5);
      expect(component.radarChartData.datasets[0].data).toEqual([85, 90, 75, 80, 88]);
    });

    it('should handle radar chart initialization in ngOnInit for season view', () => {
      const seasonFixture = TestBed.createComponent(PlayerCardGraphsComponent);
      const seasonComp = seasonFixture.componentInstance;

      seasonComp.data = {
        ...mockPlayer,
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
          blocks: 72
        }
      };
      seasonComp.viewContext = 'season';

      spyOn<any>(seasonComp, 'buildRadarChartData');

      seasonComp.ngOnInit();

      expect(seasonComp.chartViewMode).toBe('radar');
      expect((seasonComp as any).buildRadarChartData).toHaveBeenCalled();
    });

    it('should initialize chart selections for empty object', () => {
      const newFixture = TestBed.createComponent(PlayerCardGraphsComponent);
      const newComp = newFixture.componentInstance;

      newComp.data = mockPlayer;
      newComp.chartSelections = {};

      newComp.ngOnInit();

      expect(Object.keys(newComp.chartSelections).length).toBeGreaterThan(0);
    });

    it('should complete full toggle cycle between line and radar views', () => {
      component.chartViewMode = 'line';
      component.data = {
        ...mockPlayer,
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
          blocks: 72
        }
      };

      // Toggle to radar
      component.toggleChartView();
      expect(component.chartViewMode).toBe('radar');
      expect(component.radarChartData.datasets.length).toBe(1);

      // Toggle back to line
      component.toggleChartView();
      expect(component.chartViewMode).toBe('line');
    });

    it('should build radar data when chartViewMode is radar for combined view', () => {
      const radarFixture = TestBed.createComponent(PlayerCardGraphsComponent);
      const radarComp = radarFixture.componentInstance;

      radarComp.data = {
        ...mockPlayer,
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
          blocks: 72
        }
      };
      radarComp.viewContext = 'combined';
      radarComp.chartViewMode = 'radar';

      spyOn<any>(radarComp, 'buildRadarChartData');

      radarComp.ngOnInit();

      expect((radarComp as any).buildRadarChartData).toHaveBeenCalled();
    });

    it('should compute hasMultipleSeasons as false when only one season', () => {
      const singleSeasonPlayer = {
        ...mockPlayer,
        seasons: [mockPlayer.seasons![0]],
      };
      component.viewContext = 'combined';
      component.data = singleSeasonPlayer;

      expect(component.hasMultipleSeasons).toBeFalse();
    });

    it('should handle goalie without scores in radar view', () => {
      const goalieWithoutScores: any = {
        name: 'Test Goalie',
        wins: 8,
        saves: 300,
        shutouts: 2,
      };

      spyOn(console, 'warn');
      component.data = goalieWithoutScores;
      (component as any).buildGoalieRadarData();

      expect(console.warn).toHaveBeenCalledWith(
        'No scores data available for goalie'
      );
    });

    it('should build radar chart on ngOnInit when viewContext is season', () => {
      const seasonFixture = TestBed.createComponent(PlayerCardGraphsComponent);
      const seasonComponent = seasonFixture.componentInstance;

      seasonComponent.data = {
        ...mockPlayer,
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
      seasonComponent.viewContext = 'season';

      spyOn(seasonComponent as any, 'buildRadarChartData');

      seasonComponent.ngOnInit();

      expect((seasonComponent as any).buildRadarChartData).toHaveBeenCalled();
    });

    it('should not call buildRadarChartData in ngOnInit when not in radar mode and not season view', () => {
      const lineFixture = TestBed.createComponent(PlayerCardGraphsComponent);
      const lineComponent = lineFixture.componentInstance;

      lineComponent.data = mockPlayer;
      lineComponent.viewContext = 'combined';
      lineComponent.chartViewMode = 'line';

      spyOn<any>(lineComponent, 'buildRadarChartData');

      lineComponent.ngOnInit();

      expect((lineComponent as any).buildRadarChartData).not.toHaveBeenCalled();
    });

    it('should set backdropColor to transparent in radar chart ticks', () => {
      const themedFixture = TestBed.createComponent(PlayerCardGraphsComponent);
      const themed = themedFixture.componentInstance;

      spyOn<any>(themed, 'resolveCssColorVar').and.returnValue('rgb(10, 10, 10)');

      (themed as any).applyThemeToRadarChartOptions();

      const scales: any = themed.radarChartOptions?.scales;
      expect(scales?.r?.ticks?.backdropColor).toBe('transparent');
    });

    it('should handle rgba textColor when building grid color', () => {
      const rgbaFixture = TestBed.createComponent(PlayerCardGraphsComponent);
      const rgbaComponent = rgbaFixture.componentInstance;

      spyOn<any>(rgbaComponent, 'resolveCssColorVar').and.returnValue('rgba(10, 10, 10, 1)');

      (rgbaComponent as any).applyThemeToRadarChartOptions();

      const scales: any = rgbaComponent.radarChartOptions?.scales;
      // Should use the rgba color as-is since it doesn't start with 'rgb('
      expect(scales?.r?.grid?.color).toBe('rgba(10, 10, 10, 1)');
    });
  });

  it('should handle updateChartData with empty active keys', () => {
    component.data = mockPlayer;
    component.chartSelections = {
      score: false,
      scoreAdjustedByGames: false,
      games: false,
      goals: false,
      assists: false,
      points: false,
      shots: false,
      penalties: false,
      hits: false,
      blocks: false,
    };

    (component as any).updateChartData(mockPlayer.seasons!);

    expect(component.lineChartData.datasets.length).toBe(0);
  });

  it('should handle non-finite numeric values in updateChartData', () => {
    const seasonsWithInvalidData = [
      {
        ...mockPlayer.seasons![0],
        goals: NaN,
        assists: Infinity,
      },
    ];

    component.data = mockPlayer;
    component.chartSelections = { goals: true, assists: true };

    (component as any).updateChartData(seasonsWithInvalidData);

    expect(component.lineChartData.datasets.length).toBe(2);
    // NaN and Infinity should be converted to 0
    expect(component.lineChartData.datasets[0].data).toContain(0);
  });

  it('should format season short correctly', () => {
    const result = (component as any).formatSeasonShort(2024);
    expect(result).toBe('24-25');
  });

  it('should handle seasons with no data in updateChartData', () => {
    component.data = mockPlayer;
    component.chartSelections = { goals: true };

    const seasonsOutsideRange = [
      { ...mockPlayer.seasons![0], season: 2010 }
    ];

    (component as any).chartYearsRange = [2024, 2025];
    (component as any).chartLabels = ['24-25', '25-26'];
    (component as any).updateChartData(seasonsOutsideRange);

    // Should have null values for missing years
    expect(component.lineChartData.datasets[0].data).toContain(null);
  });

  it('should set y scale properties when allValues has data', () => {
    component.data = mockPlayer;
    component.chartSelections = { goals: true };
    component.lineChartOptions.scales = {};

    (component as any).updateChartData(mockPlayer.seasons!);

    expect(component.lineChartOptions.scales!['y']).toBeDefined();
    expect(component.lineChartOptions.scales!['y']!.min).toBe(0);
    expect(component.lineChartOptions.scales!['y']!.max).toBeGreaterThan(0);
  });

  it('should call resolveCssColorVar with backgroundColor cssProperty for tooltipBg', () => {
    spyOn<any>(component, 'resolveCssColorVar').and.callFake(
      (_name: string, _fallback: string, cssProperty?: string) => {
        if (cssProperty === 'backgroundColor') {
          return 'rgb(20, 20, 20)';
        }
        return 'rgb(10, 10, 10)';
      }
    );

    (component as any).applyThemeToRadarChartOptions();

    expect((component as any).resolveCssColorVar).toHaveBeenCalledWith(
      '--mat-sys-surface-container-high',
      'rgba(0,0,0,0.8)',
      'backgroundColor'
    );
  });

  it('should handle missing seasons in setupChartData early return', () => {
    const noSeasonsPlayer = {
      ...mockPlayer,
      seasons: undefined
    };

    component.data = noSeasonsPlayer;
    component.chartLabels = [];

    expect(() => (component as any).setupChartData()).not.toThrow();
    // setupChartData returns early if no seasons, so chartLabels remains empty
    expect(component.chartLabels.length).toBe(0);
  });

  it('should handle allValues with length 0 in updateChartData', () => {
    component.data = mockPlayer;
    component.chartSelections = {};
    component.lineChartOptions.scales = {};

    (component as any).updateChartData(mockPlayer.seasons!);

    // No datasets means no values, so y scale should not be modified
    expect(component.lineChartOptions.scales!['y']).toBeUndefined();
  });
});
