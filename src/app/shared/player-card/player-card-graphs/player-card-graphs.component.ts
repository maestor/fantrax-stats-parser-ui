import { DOCUMENT } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import type { ChartConfiguration, ChartDataset } from 'chart.js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { Goalie, GoalieSeasonStats, Player, PlayerSeasonStats } from '@services/api.service';

@Component({
  selector: 'app-player-card-graphs',
  imports: [MatCheckboxModule, TranslateModule, BaseChartDirective],
  templateUrl: './player-card-graphs.component.html',
  styleUrl: './player-card-graphs.component.scss',
  providers: [provideCharts(withDefaultRegisterables())],
})
export class PlayerCardGraphsComponent {
  private document = inject(DOCUMENT);
  private translateService = inject(TranslateService);

  @Input({ required: true }) data!: Player | Goalie;
  @Input() closeButtonEl?: HTMLButtonElement;
  @Input() requestFocusTabHeader?: () => void;

  // Track graph controls visibility on mobile
  graphControlsExpanded = false;

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

  ngOnInit(): void {
    this.applyThemeToChartOptions();

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
            ...((plugins.legend as any)?.labels ?? {}),
            color: textColor,
          },
        },
        tooltip: {
          ...((plugins as any).tooltip ?? {}),
          titleColor: textColor,
          bodyColor: textColor,
          footerColor: textColor,
          backgroundColor: tooltipBg,
          borderColor: gridColor,
          borderWidth: 1,
        } as any,
      },
      scales: {
        ...scales,
        x: {
          ...(scales['x'] ?? {}),
          ticks: {
            ...(((scales['x'] as any) ?? {})?.ticks ?? {}),
            color: textColor,
          },
          grid: {
            ...(((scales['x'] as any) ?? {})?.grid ?? {}),
            color: gridColor,
          },
        },
        y: {
          ...(scales['y'] ?? {}),
          ticks: {
            ...(((scales['y'] as any) ?? {})?.ticks ?? {}),
            color: textColor,
          },
          grid: {
            ...(((scales['y'] as any) ?? {})?.grid ?? {}),
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

      const probe = this.document.createElement('span');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.position = 'absolute';
      probe.style.width = '0';
      probe.style.height = '0';
      probe.style.overflow = 'hidden';

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

    this.chartLabels = this.chartYearsRange.map((year) => this.formatSeasonShort(year));

    this.updateChartData(seasons);
  }

  private formatSeasonShort(year: number): string {
    const startShort = String(year).slice(-2);
    const nextYear = year + 1;
    const endShort = String(nextYear).slice(-2);
    return `${startShort}-${endShort}`;
  }

  private updateChartData(sortedSeasons: (PlayerSeasonStats | GoalieSeasonStats)[]): void {
    const activeKeys = this.chartStatKeys.filter((key) => this.chartSelections[key]);

    const palette = ['#1976d2', '#d32f2f', '#388e3c', '#fbc02d', '#7b1fa2', '#00838f'];

    const seasonByYear = new Map<number, PlayerSeasonStats | GoalieSeasonStats>();
    sortedSeasons.forEach((season) => {
      seasonByYear.set(season.season, season);
    });

    const datasets: ChartDataset<'line', (number | null)[]>[] = activeKeys.map((key, index) => {
      const data = this.chartYearsRange.map((year) => {
        const season = seasonByYear.get(year);
        if (!season) {
          return null;
        }

        const value = (season as any)[key];
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
