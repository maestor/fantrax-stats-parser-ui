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
});
