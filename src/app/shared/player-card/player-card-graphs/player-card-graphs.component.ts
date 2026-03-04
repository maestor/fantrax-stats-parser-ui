import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChildren,
  QueryList,
  inject,
} from '@angular/core';
import type { Subscription } from 'rxjs';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import type { ChartConfiguration, ChartData, ChartDataset, TooltipItem } from 'chart.js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type {
  Goalie,
  GoalieSeasonStats,
  Player,
  PlayerScores,
  PlayerSeasonStats,
} from '@services/api.service';
import type { PositionFilter } from '@services/filter.service';
import { formatSeasonShort } from '@shared/utils/season.utils';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-player-card-graphs',
  imports: [
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    BaseChartDirective,
  ],
  templateUrl: './player-card-graphs.component.html',
  styleUrl: './player-card-graphs.component.scss',
  providers: [provideCharts(withDefaultRegisterables())],
})
export class PlayerCardGraphsComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private static readonly RADAR_COMPACT_MAX_WIDTH = 520;
  private static readonly DEFAULT_VIEWPORT_WIDTH = 1024;

  private document = inject(DOCUMENT);
  private translateService = inject(TranslateService);

  @ViewChildren(BaseChartDirective) private charts?: QueryList<BaseChartDirective>;

  private prefersDarkMql?: MediaQueryList;
  private chartsChangesSub?: Subscription;
  private onPrefersSchemeChange = () => {
    this.applyThemeToChartOptions();
    this.applyThemeToRadarChartOptions();
    this.refreshChartsLayout();
  };

  private refreshChartsLayout(): void {
    // Run after the DOM has settled so Chart.js measures the correct container size.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const charts = this.charts?.toArray() ?? [];
        charts.forEach((c) => {
          c.chart?.resize();
          c.update();
        });
      });
    });
  }

  @Input({ required: true }) data!: Player | Goalie;
  @Input() closeButtonEl?: HTMLButtonElement;
  @Input() requestFocusTabHeader?: () => void;
  @Input() viewContext: 'combined' | 'season' = 'combined';
  @Input() positionFilter: PositionFilter = 'all';

  // Track graph controls visibility on mobile
  graphControlsExpanded = false;

  // Chart view mode
  chartViewMode: 'line' | 'radar' = 'line';

  // Radar chart data and options
  radarChartData: ChartData<'radar'> = { labels: [], datasets: [] };
  radarChartOptions: ChartConfiguration<'radar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: (value) => `${value}`,
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'radar'>) => {
            const label = context.dataset.label || '';
            const value = context.parsed.r;
            return `${label}: ${value}/100`;
          },
        },
      },
    },
  };

  get chartStatKeys(): string[] {
    return this.isGoalie
      ? ['score', 'scoreAdjustedByGames', 'games', 'wins', 'saves', 'shutouts']
      : [
        'score',
        'scoreAdjustedByGames',
        'games',
        'goals',
        'assists',
        'points',
        'shots',
        'penalties',
        'hits',
        'blocks',
      ];
  }

  chartSelections: Record<string, boolean> = {};

  chartLabels: string[] = [];
  chartYearsRange: number[] = [];

  lineChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  };

  lineChartOptions: NonNullable<ChartConfiguration['options']> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    scales: {
      x: {},
      y: { offset: true },
    },
  };

  get isGoalie(): boolean {
    return this.data != null && 'wins' in this.data;
  }

  get hasSeasons(): boolean {
    return !!this.data?.seasons && this.data.seasons.length > 0;
  }

  get hasMultipleSeasons(): boolean {
    return this.viewContext === 'combined' && this.hasSeasons && this.data.seasons!.length > 1;
  }

  ngOnInit(): void {
    this.applyThemeToChartOptions();
    this.applyThemeToRadarChartOptions();

    // Keep chart theme in sync with auto color-scheme.
    this.prefersDarkMql = this.document.defaultView?.matchMedia?.(
      '(prefers-color-scheme: dark)'
    );
    this.prefersDarkMql?.addEventListener?.('change', this.onPrefersSchemeChange);

    // For season view, start in radar mode
    if (this.viewContext === 'season') {
      this.chartViewMode = 'radar';
    }

    if (Object.keys(this.chartSelections).length === 0) {
      this.chartSelections = this.chartStatKeys.reduce(
        (acc, key) => ({
          ...acc,
          // Default: only score fields selected; others via toggle
          [key]: key === 'score' || key === 'scoreAdjustedByGames',
        }),
        {} as Record<string, boolean>
      );
    }

    if (this.hasSeasons) {
      this.setupChartData();
    }

    // Build radar chart data if in radar mode or if season view
    if (this.chartViewMode === 'radar' || this.viewContext === 'season') {
      this.buildRadarChartData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Rebuild charts when positionFilter changes
    if (changes['positionFilter'] && !changes['positionFilter'].firstChange) {
      // Rebuild radar chart if in radar mode or season view
      if (this.chartViewMode === 'radar' || this.viewContext === 'season') {
        this.buildRadarChartData();
      }
      // Rebuild line chart if has seasons
      if (this.hasSeasons && this.data.seasons) {
        this.updateChartData([...this.data.seasons]);
      }
      this.refreshChartsLayout();
    }
  }

  ngAfterViewInit(): void {
    // When switching chart view, Angular destroys/recreates the canvas; ensure we resize
    // *after* the BaseChartDirective QueryList has updated.
    this.chartsChangesSub = this.charts?.changes.subscribe(() => this.refreshChartsLayout());

    // In dev/HMR, CSS can re-apply slightly after component init; re-resize once.
    queueMicrotask(() => this.refreshChartsLayout());
  }

  ngOnDestroy(): void {
    this.prefersDarkMql?.removeEventListener?.('change', this.onPrefersSchemeChange);
    this.chartsChangesSub?.unsubscribe();
  }

  private applyThemeToChartOptions(): void {
    // Note: Angular Material v21 can emit token values using CSS `light-dark()`.
    // Reading a CSS variable directly returns the raw `light-dark(...)` string, which
    // Chart.js does not understand. Resolve via computed styles instead.
    const textColor = this.resolveCssColorVar('--mat-sys-on-surface', '#1f1f1f');
    const gridColor = this.resolveCssColorVar('--mat-sys-outline-variant', 'rgba(0,0,0,0.2)');
    const tooltipBg = this.resolveCssColorVar(
      '--mat-sys-surface-container-high',
      'rgba(0,0,0,0.8)',
      'backgroundColor'
    );

    const plugins = this.lineChartOptions.plugins ?? {};
    const scales = this.lineChartOptions.scales ?? {};

    this.lineChartOptions = {
      ...this.lineChartOptions,
      plugins: {
        ...plugins,
        legend: {
          ...(plugins.legend ?? {}),
          labels: {
            ...(plugins.legend?.labels ?? {}),
            color: textColor,
          },
        },
        tooltip: {
          ...(plugins.tooltip ?? {}),
          titleColor: textColor,
          bodyColor: textColor,
          footerColor: textColor,
          backgroundColor: tooltipBg,
          borderColor: gridColor,
          borderWidth: 1,
        },
      },
      scales: {
        ...scales,
        x: {
          ...(scales['x'] ?? {}),
          ticks: {
            ...((scales['x'] as { ticks?: Record<string, unknown> })?.ticks ?? {}),
            color: textColor,
          },
          grid: {
            ...((scales['x'] as { grid?: Record<string, unknown> })?.grid ?? {}),
            color: gridColor,
          },
        },
        y: {
          ...(scales['y'] ?? {}),
          ticks: {
            ...((scales['y'] as { ticks?: Record<string, unknown> })?.ticks ?? {}),
            color: textColor,
          },
          grid: {
            ...((scales['y'] as { grid?: Record<string, unknown> })?.grid ?? {}),
            color: gridColor,
          },
        },
      },
    };
  }

  private resolveCssColorVar(
    name: string,
    fallback: string,
    cssProperty: 'color' | 'backgroundColor' = 'color'
  ): string {
    try {
      const body = this.document.body;
      if (!body) {
        return fallback;
      }

      // Prefer the app's *actual* active scheme (as computed from CSS) over OS preference.
      // This matters if the app/theme forces a scheme that differs from `prefers-color-scheme`.
      const root = this.document.documentElement;
      const rootStyle = root ? getComputedStyle(root) : undefined;
      const computedSchemeRaw =
        (rootStyle as CSSStyleDeclaration & { colorScheme?: string })?.colorScheme || rootStyle?.getPropertyValue('color-scheme') || '';
      const schemeTokens = computedSchemeRaw.trim().split(/\s+/).filter(Boolean);
      const schemeToken = schemeTokens.length === 1 ? schemeTokens[0] : undefined;

      const scheme: 'light' | 'dark' | undefined =
        schemeToken === 'dark' || schemeToken === 'light'
          ? (schemeToken as 'light' | 'dark')
          : undefined;

      // If CSS reports a non-single token (e.g. "light dark") or nothing, detect the *used*
      // scheme by evaluating a tiny `light-dark()` expression.
      const usedScheme = this.detectUsedColorScheme(body, scheme);

      const probe = this.createHiddenProbeElement();
      // Force the used color-scheme so CSS `light-dark()` tokens resolve correctly.
      // If we can't confidently read the active scheme (some browsers report "normal"),
      // inherit instead of guessing from OS preference.
      if (usedScheme) {
        probe.style.setProperty('color-scheme', usedScheme);
      }

      if (cssProperty === 'backgroundColor') {
        probe.style.backgroundColor = `var(${name})`;
      } else {
        probe.style.color = `var(${name})`;
      }

      body.appendChild(probe);
      const computed = getComputedStyle(probe)[cssProperty];
      probe.remove();

      return computed?.trim() ? computed.trim() : fallback;
    } catch {
      return fallback;
    }
  }

  private createHiddenProbeElement(): HTMLSpanElement {
    const el = this.document.createElement('span');
    el.setAttribute('aria-hidden', 'true');
    el.style.position = 'absolute';
    el.style.width = '0';
    el.style.height = '0';
    el.style.overflow = 'hidden';
    return el;
  }

  private detectUsedColorScheme(
    body: HTMLElement,
    knownScheme: 'light' | 'dark' | undefined
  ): 'light' | 'dark' | undefined {
    if (knownScheme) {
      return knownScheme;
    }

    const schemeProbe = this.createHiddenProbeElement();
    schemeProbe.style.color = 'light-dark(rgb(1, 2, 3), rgb(4, 5, 6))';
    body.appendChild(schemeProbe);

    const observed = getComputedStyle(schemeProbe).color?.trim();
    schemeProbe.remove();

    if (observed === 'rgb(1, 2, 3)') return 'light';
    if (observed === 'rgb(4, 5, 6)') return 'dark';
    return undefined;
  }

  private applyThemeToRadarChartOptions(): void {
    const textColor = this.resolveCssColorVar('--mat-sys-on-surface', '#1f1f1f');
    const outlineColor = this.resolveCssColorVar('--mat-sys-outline-variant', 'rgba(0,0,0,0.2)');
    const tooltipBg = this.resolveCssColorVar(
      '--mat-sys-surface-container-high',
      'rgba(0,0,0,0.8)',
      'backgroundColor'
    );

    const viewportWidth =
      this.document.defaultView?.innerWidth ?? PlayerCardGraphsComponent.DEFAULT_VIEWPORT_WIDTH;
    const compact = viewportWidth <= PlayerCardGraphsComponent.RADAR_COMPACT_MAX_WIDTH;
    const pointLabelFontSize = compact ? 10 : 12;
    const tickFontSize = compact ? 9 : 11;
    const pointLabelPadding = compact ? 2 : 6;
    const layoutPadding = compact ? 0 : 8;

    // Use outline token for grid so it stays readable in light mode.
    const gridColor = outlineColor;

    this.radarChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: layoutPadding,
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            color: textColor,
            callback: (value) => `${value}`,
            backdropColor: 'transparent',
            font: { size: tickFontSize },
          },
          grid: {
            color: gridColor,
          },
          pointLabels: {
            color: textColor,
            font: { size: pointLabelFontSize },
            padding: pointLabelPadding,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'radar'>) => {
              const label = context.dataset.label || '';
              const value = context.parsed.r;
              return `${label}: ${value}/100`;
            },
          },
          titleColor: textColor,
          bodyColor: textColor,
          footerColor: textColor,
          backgroundColor: tooltipBg,
          borderColor: outlineColor,
          borderWidth: 1,
        },
      },
    };
  }

  toggleChartView(): void {
    this.chartViewMode = this.chartViewMode === 'line' ? 'radar' : 'line';
    if (this.chartViewMode === 'radar') {
      this.buildRadarChartData();
    }

    // When swapping via @if, the canvas is destroyed/recreated; force a resize once it's mounted.
    setTimeout(() => this.refreshChartsLayout(), 0);
  }

  private buildRadarChartData(): void {
    const isGoalie = 'wins' in this.data;

    if (isGoalie) {
      this.buildGoalieRadarData();
    } else {
      this.buildPlayerRadarData();
    }
  }

  private buildPlayerRadarData(): void {
    const player = this.data as Player;

    // Use position-based scores when filter is active
    const scores = (this.positionFilter !== 'all' && player.scoresByPosition)
      ? player.scoresByPosition
      : player.scores;

    if (!scores) {
      return;
    }

    // Define stat keys and get labels
    const statKeys: (keyof PlayerScores)[] = [
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

    // Get translated labels
    const labels = statKeys.map((key) =>
      this.translateService.instant(`tableColumn.${key}`)
    );

    // Get score values
    const data = statKeys.map((key) => scores[key]);

    this.radarChartData = {
      labels,
      datasets: [
        {
          label: player.name,
          data,
          fill: true,
          backgroundColor: 'rgba(25, 118, 210, 0.3)',
          borderColor: '#1976d2',
          pointBackgroundColor: '#1976d2',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#1976d2',
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }

  private buildGoalieRadarData(): void {
    const goalie = this.data as Goalie;

    if (!goalie.scores) {
      return;
    }

    const scores = goalie.scores;

    // Check if gaa/savePercent are available (season endpoint)
    const hasExtendedStats = 'gaa' in scores;

    const statKeys = hasExtendedStats
      ? ['wins', 'saves', 'shutouts', 'gaa', 'savePercent']
      : ['wins', 'saves', 'shutouts'];

    const labels = statKeys.map((key) =>
      this.translateService.instant(`tableColumn.${key}`)
    );

    const data = statKeys.map((key) => (scores as Record<string, number>)[key]);

    this.radarChartData = {
      labels,
      datasets: [
        {
          label: goalie.name,
          data,
          fill: true,
          backgroundColor: 'rgba(25, 118, 210, 0.3)',
          borderColor: '#1976d2',
          pointBackgroundColor: '#1976d2',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#1976d2',
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }

  toggleGraphControls(): void {
    this.graphControlsExpanded = !this.graphControlsExpanded;
  }

  onStatToggle(key: string, event: MatCheckboxChange): void {
    this.chartSelections[key] = event.checked;

    if (!this.data.seasons) return;

    const sortedSeasons = [...this.data.seasons].sort((a, b) => b.season - a.season);
    this.updateChartData(sortedSeasons);
  }

  onGraphCheckboxKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp': {
        event.preventDefault();
        this.requestFocusTabHeader?.();
        return;
      }
      case 'ArrowDown': {
        const btn = this.closeButtonEl;
        if (!btn) {
          return;
        }
        event.preventDefault();
        btn.focus();
        return;
      }
      default:
        return;
    }
  }

  private setupChartData(): void {
    if (!this.data.seasons) return;

    const seasons = [...this.data.seasons];
    const minYear = Math.min(...seasons.map((s) => s.season));
    const maxYear = Math.max(...seasons.map((s) => s.season));

    this.chartYearsRange = Array.from(
      { length: maxYear - minYear + 1 },
      (_, index) => minYear + index
    );

    this.chartLabels = this.chartYearsRange.map((year) => formatSeasonShort(year));

    this.updateChartData(seasons);
  }

  private updateChartData(sortedSeasons: (PlayerSeasonStats | GoalieSeasonStats)[]): void {
    const activeKeys = this.chartStatKeys.filter((key) => this.chartSelections[key]);

    const palette = ['#1976d2', '#d32f2f', '#388e3c', '#fbc02d', '#7b1fa2', '#00838f'];

    const seasonByYear = new Map<number, PlayerSeasonStats | GoalieSeasonStats>();
    sortedSeasons.forEach((season) => {
      seasonByYear.set(season.season, season);
    });

    // Determine if we should use position-based scores
    const usePositionScores = !this.isGoalie && this.positionFilter !== 'all';

    const datasets: ChartDataset<'line', (number | null)[]>[] = activeKeys.map((key, index) => {
      const data = this.chartYearsRange.map((year) => {
        const season = seasonByYear.get(year);
        if (!season) {
          return null;
        }

        // Use position-based score values when filter is active
        const seasonRecord = season as Record<string, unknown>;
        let value: number | string | undefined;
        if (usePositionScores && key === 'score') {
          const playerSeason = season as PlayerSeasonStats;
          value = playerSeason.scoreByPosition ?? (seasonRecord[key] as number | undefined);
        } else if (usePositionScores && key === 'scoreAdjustedByGames') {
          const playerSeason = season as PlayerSeasonStats;
          value = playerSeason.scoreByPositionAdjustedByGames ?? (seasonRecord[key] as number | undefined);
        } else {
          value = seasonRecord[key] as number | string | undefined;
        }

        const numeric = typeof value === 'string' ? parseFloat(value) : value;
        return Number.isFinite(numeric) ? (numeric as number) : 0;
      });

      const translatedLabel = this.translateService.instant(`tableColumn.${key}`);

      return {
        data,
        label: translatedLabel || `tableColumn.${key}`,
        borderColor: palette[index % palette.length],
        backgroundColor: palette[index % palette.length],
        fill: false,
        tension: 0.2,
        pointRadius: 3,
      };
    });

    this.lineChartData = {
      labels: this.chartLabels,
      datasets,
    };

    const allValues = datasets.flatMap((ds) =>
      (ds.data as (number | null)[]).filter((value): value is number => typeof value === 'number')
    );

    if (allValues.length > 0) {
      const maxValue = Math.max(...allValues);

      if (!this.lineChartOptions.scales) {
        this.lineChartOptions.scales = {};
      }

      if (!this.lineChartOptions.scales['y']) {
        this.lineChartOptions.scales['y'] = {};
      }

      const yScale = this.lineChartOptions.scales['y']!;

      const tickCount = 5;
      const stepSize = maxValue > 0 ? Math.ceil(maxValue / tickCount) : 1;
      const max = stepSize * tickCount;

      yScale.min = 0;
      yScale.max = max;
      yScale.ticks = {
        ...(yScale.ticks || {}),
        stepSize,
      };
    }
  }
}
