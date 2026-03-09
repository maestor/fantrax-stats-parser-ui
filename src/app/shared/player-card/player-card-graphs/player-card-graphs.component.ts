import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  effect,
  inject,
  input,
  viewChildren,
} from '@angular/core';
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
export class PlayerCardGraphsComponent implements AfterViewInit, OnDestroy {
  private static readonly RADAR_COMPACT_MAX_WIDTH = 520;
  private static readonly DEFAULT_VIEWPORT_WIDTH = 1024;

  private readonly document = inject(DOCUMENT);
  private readonly translateService = inject(TranslateService);

  readonly dataInput = input.required<Player | Goalie>({ alias: 'data' });
  readonly closeButtonElInput = input<HTMLButtonElement | undefined>(undefined, {
    alias: 'closeButtonEl',
  });
  readonly requestFocusTabHeaderInput = input<(() => void) | undefined>(undefined, {
    alias: 'requestFocusTabHeader',
  });
  readonly viewContextInput = input<'combined' | 'season'>('combined', { alias: 'viewContext' });
  readonly positionFilterInput = input<PositionFilter>('all', { alias: 'positionFilter' });

  readonly charts = viewChildren(BaseChartDirective);

  private prefersDarkMql?: MediaQueryList;
  private previousData?: Player | Goalie;
  private previousViewContext?: 'combined' | 'season';
  private previousPositionFilter?: PositionFilter;
  private initialized = false;
  private readonly onPrefersSchemeChange = () => {
    this.applyThemeToChartOptions();
    this.applyThemeToRadarChartOptions();
    this.refreshChartsLayout();
  };

  data!: Player | Goalie;
  closeButtonEl?: HTMLButtonElement;
  requestFocusTabHeader?: () => void;
  viewContext: 'combined' | 'season' = 'combined';
  positionFilter: PositionFilter = 'all';

  graphControlsExpanded = false;
  chartViewMode: 'line' | 'radar' = 'line';

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

  constructor() {
    this.applyThemeToChartOptions();
    this.applyThemeToRadarChartOptions();

    this.prefersDarkMql = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    this.prefersDarkMql?.addEventListener?.('change', this.onPrefersSchemeChange);

    effect(() => {
      const charts = this.charts();
      if (!this.initialized || charts.length === 0) {
        return;
      }

      this.refreshChartsLayout();
    });

    effect(() => {
      const data = this.dataInput();
      const closeButtonEl = this.closeButtonElInput();
      const requestFocusTabHeader = this.requestFocusTabHeaderInput();
      const viewContext = this.viewContextInput();
      const positionFilter = this.positionFilterInput();

      const dataChanged = data !== this.previousData;
      const viewContextChanged = viewContext !== this.previousViewContext;
      const positionFilterChanged = positionFilter !== this.previousPositionFilter;

      this.data = data;
      this.closeButtonEl = closeButtonEl;
      this.requestFocusTabHeader = requestFocusTabHeader;
      this.viewContext = viewContext;
      this.positionFilter = positionFilter;
      this.syncChartSelections();

      if (viewContext === 'season') {
        this.chartViewMode = 'radar';
      }

      if (!this.initialized) {
        this.previousData = data;
        this.previousViewContext = viewContext;
        this.previousPositionFilter = positionFilter;
        return;
      }

      if (viewContextChanged && viewContext === 'season') {
        this.chartViewMode = 'radar';
      }

      if (dataChanged || viewContextChanged) {
        this.rebuildChartData();
      } else if (positionFilterChanged) {
        this.rebuildChartDataForPositionFilterChange();
      }

      this.previousData = data;
      this.previousViewContext = viewContext;
      this.previousPositionFilter = positionFilter;
    });
  }

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

  get isGoalie(): boolean {
    return this.data != null && 'wins' in this.data;
  }

  get hasSeasons(): boolean {
    return !!this.data?.seasons && this.data.seasons.length > 0;
  }

  get hasMultipleSeasons(): boolean {
    return this.viewContext === 'combined' && this.hasSeasons && this.data.seasons!.length > 1;
  }

  ngAfterViewInit(): void {
    this.initialized = true;
    this.syncChartSelections();

    if (this.viewContext === 'season') {
      this.chartViewMode = 'radar';
    }

    this.rebuildChartData();
    queueMicrotask(() => this.refreshChartsLayout());
  }

  ngOnDestroy(): void {
    this.prefersDarkMql?.removeEventListener?.('change', this.onPrefersSchemeChange);
  }

  toggleChartView(): void {
    this.chartViewMode = this.chartViewMode === 'line' ? 'radar' : 'line';
    if (this.chartViewMode === 'radar') {
      this.buildRadarChartData();
    }

    setTimeout(() => this.refreshChartsLayout(), 0);
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

  private syncChartSelections(): void {
    const chartKeys = this.chartStatKeys;
    const currentKeys = Object.keys(this.chartSelections);
    const matchesCurrentChart =
      currentKeys.length === chartKeys.length &&
      chartKeys.every((key) => currentKeys.includes(key));

    if (matchesCurrentChart) {
      return;
    }

    this.chartSelections = chartKeys.reduce(
      (acc, key) => ({
        ...acc,
        [key]: key === 'score' || key === 'scoreAdjustedByGames',
      }),
      {} as Record<string, boolean>,
    );
  }

  private rebuildChartData(): void {
    if (this.hasSeasons) {
      this.setupChartData();
    } else {
      this.resetLineChartData();
    }

    if (this.chartViewMode === 'radar' || this.viewContext === 'season') {
      this.buildRadarChartData();
    }

    this.refreshChartsLayout();
  }

  private rebuildChartDataForPositionFilterChange(): void {
    if (this.chartViewMode === 'radar' || this.viewContext === 'season') {
      this.buildRadarChartData();
    }

    if (this.hasSeasons && this.data.seasons) {
      this.updateChartData([...this.data.seasons]);
    }

    this.refreshChartsLayout();
  }

  private resetLineChartData(): void {
    this.chartLabels = [];
    this.chartYearsRange = [];
    this.lineChartData = {
      labels: [],
      datasets: [],
    };
  }

  private refreshChartsLayout(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.charts().forEach((chart) => {
          chart.chart?.resize();
          chart.update();
        });
      });
    });
  }

  private applyThemeToChartOptions(): void {
    const textColor = this.resolveCssColorVar('--mat-sys-on-surface', '#1f1f1f');
    const gridColor = this.resolveCssColorVar('--mat-sys-outline-variant', 'rgba(0,0,0,0.2)');
    const tooltipBg = this.resolveCssColorVar(
      '--mat-sys-surface-container-high',
      'rgba(0,0,0,0.8)',
      'backgroundColor',
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
    cssProperty: 'color' | 'backgroundColor' = 'color',
  ): string {
    try {
      const body = this.document.body;
      if (!body) {
        return fallback;
      }

      const root = this.document.documentElement;
      const rootStyle = root ? getComputedStyle(root) : undefined;
      const computedSchemeRaw =
        (rootStyle as CSSStyleDeclaration & { colorScheme?: string })?.colorScheme ||
        rootStyle?.getPropertyValue('color-scheme') ||
        '';
      const schemeTokens = computedSchemeRaw.trim().split(/\s+/).filter(Boolean);
      const schemeToken = schemeTokens.length === 1 ? schemeTokens[0] : undefined;

      const scheme: 'light' | 'dark' | undefined =
        schemeToken === 'dark' || schemeToken === 'light'
          ? (schemeToken as 'light' | 'dark')
          : undefined;

      const usedScheme = this.detectUsedColorScheme(body, scheme);

      const probe = this.createHiddenProbeElement();
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
    knownScheme: 'light' | 'dark' | undefined,
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
      'backgroundColor',
    );

    const viewportWidth =
      this.document.defaultView?.innerWidth ?? PlayerCardGraphsComponent.DEFAULT_VIEWPORT_WIDTH;
    const compact = viewportWidth <= PlayerCardGraphsComponent.RADAR_COMPACT_MAX_WIDTH;
    const pointLabelFontSize = compact ? 10 : 12;
    const tickFontSize = compact ? 9 : 11;
    const pointLabelPadding = compact ? 2 : 6;
    const layoutPadding = compact ? 0 : 8;

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

    const scores = (this.positionFilter !== 'all' && player.scoresByPosition)
      ? player.scoresByPosition
      : player.scores;

    if (!scores) {
      return;
    }

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

    const labels = statKeys.map((key) =>
      this.translateService.instant(`tableColumn.${key}`),
    );

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

    const hasExtendedStats = 'gaa' in scores;

    const statKeys = hasExtendedStats
      ? ['wins', 'saves', 'shutouts', 'gaa', 'savePercent']
      : ['wins', 'saves', 'shutouts'];

    const labels = statKeys.map((key) =>
      this.translateService.instant(`tableColumn.${key}`),
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

  private setupChartData(): void {
    if (!this.data.seasons) return;

    const seasons = [...this.data.seasons];
    const minYear = Math.min(...seasons.map((s) => s.season));
    const maxYear = Math.max(...seasons.map((s) => s.season));

    this.chartYearsRange = Array.from(
      { length: maxYear - minYear + 1 },
      (_, index) => minYear + index,
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

    const usePositionScores = !this.isGoalie && this.positionFilter !== 'all';

    const datasets: ChartDataset<'line', (number | null)[]>[] = activeKeys.map((key, index) => {
      const data = this.chartYearsRange.map((year) => {
        const season = seasonByYear.get(year);
        if (!season) {
          return null;
        }

        const seasonRecord = season as Record<string, unknown>;
        let value: number | string | undefined;
        if (usePositionScores && key === 'score') {
          const playerSeason = season as PlayerSeasonStats;
          value = playerSeason.scoreByPosition ?? (seasonRecord[key] as number | undefined);
        } else if (usePositionScores && key === 'scoreAdjustedByGames') {
          const playerSeason = season as PlayerSeasonStats;
          value =
            playerSeason.scoreByPositionAdjustedByGames ??
            (seasonRecord[key] as number | undefined);
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

    const allValues = datasets.flatMap((dataset) =>
      (dataset.data as (number | null)[]).filter((value): value is number => typeof value === 'number'),
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
