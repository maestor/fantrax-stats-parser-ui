import { DOCUMENT } from '@angular/common';
import {
  Component,
  OnDestroy,
  afterRenderEffect,
  computed,
  linkedSignal,
  signal,
  untracked,
  inject,
  input,
  viewChildren,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import type { ChartConfiguration, ChartData, ChartDataset, TooltipItem } from 'chart.js';
import { TranslateService } from '@ngx-translate/core';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';
import type {
  Goalie,
  GoalieSeasonStats,
  Player,
  PlayerScores,
  PlayerSeasonStats,
} from '@services/api.service';
import type { PositionFilter } from '@services/filter.service';
import { formatSeasonShort } from '@shared/utils/season.utils';
import {
  ChartSeriesColors,
  getChartSeriesColors,
  resolveThemedCssColorVar,
} from '@shared/utils/chart-theme.utils';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-player-card-graphs',
  imports: [
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    ...TRANSLATE_IMPORTS,
    BaseChartDirective,
  ],
  templateUrl: './player-card-graphs.component.html',
  styleUrl: './player-card-graphs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideCharts(withDefaultRegisterables())],
})
export class PlayerCardGraphsComponent implements OnDestroy {
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

  private readonly themeRevision = signal(0);
  private readonly theme = signal<{
    series: ChartSeriesColors[];
    lineOptions: NonNullable<ChartConfiguration<'line'>['options']>;
    radarOptions: ChartConfiguration<'radar'>['options'];
  } | null>(null);
  private readonly prefersDarkMql = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
  private readonly onPrefersSchemeChange = () => this.themeRevision.update((revision) => revision + 1);

  graphControlsExpanded = false;
  readonly chartViewMode = linkedSignal<'combined' | 'season', 'line' | 'radar'>({
    source: this.viewContextInput,
    computation: (context, previous) => context === 'season' ? 'radar' : previous?.value ?? 'line',
  });
  readonly isGoalie = computed(() => 'wins' in this.dataInput());
  readonly hasSeasons = computed(() => !!this.dataInput().seasons?.length);
  readonly hasMultipleSeasons = computed(() =>
    this.viewContextInput() === 'combined' && (this.dataInput().seasons?.length ?? 0) > 1,
  );
  readonly chartStatKeys = computed(() => this.isGoalie()
    ? ['score', 'scoreAdjustedByGames', 'games', 'wins', 'saves', 'shutouts']
    : ['score', 'scoreAdjustedByGames', 'games', 'goals', 'assists', 'points', 'shots', 'penalties', 'hits', 'blocks'],
  );
  readonly chartSelections = linkedSignal(() => Object.fromEntries(
    this.chartStatKeys().map((key) => [key, key === 'score' || key === 'scoreAdjustedByGames']),
  ));
  private readonly chartYearsRange = computed(() => {
    const seasons = this.dataInput().seasons ?? [];
    if (seasons.length === 0) return [];
    const minYear = Math.min(...seasons.map((season) => season.season));
    const maxYear = Math.max(...seasons.map((season) => season.season));
    return Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
  });
  private readonly chartLabels = computed(() => this.chartYearsRange().map(formatSeasonShort));
  readonly lineChartData = computed(() => this.buildLineChartData());
  readonly radarChartData = computed(() => this.isGoalie() ? this.buildGoalieRadarData() : this.buildPlayerRadarData());
  readonly radarChartOptions = computed(() => this.theme()?.radarOptions);
  readonly lineChartOptions = computed<NonNullable<ChartConfiguration<'line'>['options']>>(() => {
    const options = this.theme()?.lineOptions ?? {};
    const values = this.lineChartData().datasets.flatMap((dataset) =>
      dataset.data.filter((value): value is number => typeof value === 'number'),
    );
    if (values.length === 0) return options;
    const maxValue = Math.max(...values);
    const stepSize = maxValue > 0 ? Math.ceil(maxValue / 5) : 1;
    const y = options.scales?.['y'];
    return {
      ...options,
      scales: {
        ...options.scales,
        y: {
          type: 'linear', offset: true, min: 0, max: stepSize * 5,
          grid: y?.grid, ticks: { color: y?.ticks?.color, stepSize },
        },
      },
    };
  });

  constructor() {
    this.prefersDarkMql?.addEventListener?.('change', this.onPrefersSchemeChange);

    // Resolving CSS colors uses DOM probes, so do it only after rendering.
    afterRenderEffect(() => {
      this.themeRevision();
      const seriesCount = this.chartStatKeys().length;
      this.theme.set({
        series: Array.from({ length: seriesCount }, (_, index) => getChartSeriesColors(this.document, index)),
        lineOptions: this.buildThemedLineOptions(),
        radarOptions: this.buildThemedRadarOptions(),
      });
    });

    // Chart.js measures and draws its canvas; Angular owns the bindings above.
    afterRenderEffect(() => {
      const charts = this.charts();
      this.theme();
      untracked(() => charts.forEach((chart) => {
        chart.chart?.resize();
        chart.update();
      }));
    });
  }

  ngOnDestroy(): void {
    this.prefersDarkMql?.removeEventListener?.('change', this.onPrefersSchemeChange);
  }

  toggleChartView(): void {
    this.chartViewMode.update((mode) => mode === 'line' ? 'radar' : 'line');
  }

  toggleGraphControls(): void {
    this.graphControlsExpanded = !this.graphControlsExpanded;
  }

  onStatToggle(key: string, event: MatCheckboxChange): void {
    this.chartSelections.update((selection) => ({ ...selection, [key]: event.checked }));
  }

  onGraphCheckboxKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp': {
        event.preventDefault();
        this.requestFocusTabHeaderInput()?.();
        return;
      }
      case 'ArrowDown': {
        const btn = this.closeButtonElInput();
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

  private buildThemedLineOptions(): NonNullable<ChartConfiguration<'line'>['options']> {
    const textColor = resolveThemedCssColorVar(this.document, '--mat-sys-on-surface', '#1f1f1f');
    const gridColor = resolveThemedCssColorVar(
      this.document,
      '--mat-sys-outline-variant',
      'rgba(0,0,0,0.2)',
    );
    const tooltipBg = resolveThemedCssColorVar(
      this.document,
      '--mat-sys-surface-container-high',
      'rgba(0,0,0,0.8)',
      'backgroundColor',
    );

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
          },
        },
        tooltip: {
          titleColor: textColor,
          bodyColor: textColor,
          footerColor: textColor,
          backgroundColor: tooltipBg,
          borderColor: gridColor,
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
          },
          grid: {
            color: gridColor,
          },
        },
        y: {
          offset: true,
          ticks: {
            color: textColor,
          },
          grid: {
            color: gridColor,
          },
        },
      },
    };
  }

  private buildThemedRadarOptions(): ChartConfiguration<'radar'>['options'] {
    const textColor = resolveThemedCssColorVar(this.document, '--mat-sys-on-surface', '#1f1f1f');
    const outlineColor = resolveThemedCssColorVar(
      this.document,
      '--mat-sys-outline-variant',
      'rgba(0,0,0,0.2)',
    );
    const tooltipBg = resolveThemedCssColorVar(
      this.document,
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

    return {
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

  private buildPlayerRadarData(): ChartData<'radar'> {
    const player = this.dataInput() as Player;

    const scores = (this.positionFilterInput() !== 'all' && player.scoresByPosition)
      ? player.scoresByPosition
      : player.scores;

    const seriesColors = this.theme()?.series[0];
    if (!scores || !seriesColors) {
      return { labels: [], datasets: [] };
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

    return {
      labels,
      datasets: [
        {
          label: player.name,
          data,
          fill: true,
          backgroundColor: seriesColors.fillColor,
          borderColor: seriesColors.lineColor,
          pointBackgroundColor: seriesColors.pointBackgroundColor,
          pointBorderColor: seriesColors.pointBorderColor,
          pointHoverBackgroundColor: seriesColors.pointHoverBackgroundColor,
          pointHoverBorderColor: seriesColors.pointHoverBorderColor,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }

  private buildGoalieRadarData(): ChartData<'radar'> {
    const goalie = this.dataInput() as Goalie;

    const seriesColors = this.theme()?.series[0];
    if (!goalie.scores || !seriesColors) {
      return { labels: [], datasets: [] };
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

    return {
      labels,
      datasets: [
        {
          label: goalie.name,
          data,
          fill: true,
          backgroundColor: seriesColors.fillColor,
          borderColor: seriesColors.lineColor,
          pointBackgroundColor: seriesColors.pointBackgroundColor,
          pointBorderColor: seriesColors.pointBorderColor,
          pointHoverBackgroundColor: seriesColors.pointHoverBackgroundColor,
          pointHoverBorderColor: seriesColors.pointHoverBorderColor,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }

  private buildLineChartData(): ChartData<'line', (number | null)[]> {
    const series = this.theme()?.series;
    if (!series) return { labels: [], datasets: [] };
    const activeKeys = this.chartStatKeys().filter((key) => this.chartSelections()[key]);

    const seasonByYear = new Map<number, PlayerSeasonStats | GoalieSeasonStats>();
    this.dataInput().seasons?.forEach((season) => {
      seasonByYear.set(season.season, season);
    });

    const usePositionScores = !this.isGoalie() && this.positionFilterInput() !== 'all';

    const datasets: ChartDataset<'line', (number | null)[]>[] = activeKeys.map((key, index) => {
      const data = this.chartYearsRange().map((year) => {
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
      const seriesColors = series[index];

      return {
        data,
        label: translatedLabel || `tableColumn.${key}`,
        borderColor: seriesColors.lineColor,
        backgroundColor: seriesColors.lineColor,
        fill: false,
        tension: 0.2,
        pointRadius: 3,
      };
    });

    return {
      labels: this.chartLabels(),
      datasets,
    };
  }
}
