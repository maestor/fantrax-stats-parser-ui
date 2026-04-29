import { DOCUMENT } from '@angular/common';
import { Component, OnInit, inject, input } from '@angular/core';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import type { ChartConfiguration, ChartData, TooltipItem } from 'chart.js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { Player, Goalie, PlayerScores } from '@services/api.service';
import { StatsContext } from '@shared/types/context.types';
import {
  getChartSeriesColors,
  resolveThemedCssColorVar,
} from '@shared/utils/chart-theme.utils';

@Component({
  selector: 'app-comparison-radar',
  imports: [BaseChartDirective, TranslateModule],
  templateUrl: './comparison-radar.component.html',
  styleUrl: './comparison-radar.component.scss',
  providers: [provideCharts(withDefaultRegisterables())],
})
export class ComparisonRadarComponent implements OnInit {
  private document = inject(DOCUMENT);
  private translateService = inject(TranslateService);

  readonly context = input.required<StatsContext>();
  readonly playerA = input.required<Player | Goalie>();
  readonly playerB = input.required<Player | Goalie>();

  radarChartData: ChartData<'radar'> = { labels: [], datasets: [] };
  radarChartOptions: ChartConfiguration<'radar'>['options'] = {};

  ngOnInit(): void {
    this.buildRadarChartOptions();
    this.buildRadarChartData();
  }

  private buildRadarChartOptions(): void {
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

    this.radarChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            color: textColor,
            callback: (value) => `${value}`,
            backdropColor: 'transparent',
            font: { size: 11 },
          },
          grid: {
            color: gridColor,
          },
          angleLines: {
            color: gridColor,
          },
          pointLabels: {
            color: textColor,
            font: { size: 12 },
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
          },
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
          borderColor: gridColor,
          borderWidth: 1,
        },
      },
    };
  }

  private buildRadarChartData(): void {
    return this.context() === 'goalie' ? this.buildGoalieRadarData() : this.buildPlayerRadarData();
  }

  private buildPlayerRadarData(): void {
    const playerA = this.playerA() as Player;
    const playerB = this.playerB() as Player;

    const scoresA = playerA.scores;
    const scoresB = playerB.scores;

    if (!scoresA || !scoresB) return;

    const statKeys: (keyof PlayerScores)[] = [
      'goals', 'assists', 'points', 'plusMinus', 'penalties',
      'shots', 'ppp', 'shp', 'hits', 'blocks',
    ];

    const labels = statKeys.map((key) =>
      this.translateService.instant(`tableColumn.${key}`),
    );

    const dataA = statKeys.map((key) => scoresA[key]);
    const dataB = statKeys.map((key) => scoresB[key]);

    this.radarChartData = {
      labels,
      datasets: [
        (() => {
          const seriesColors = getChartSeriesColors(this.document, 0);
          return {
          label: playerA.name,
          data: dataA,
          fill: true,
          backgroundColor: seriesColors.fillColor,
          borderColor: seriesColors.lineColor,
          pointBackgroundColor: seriesColors.pointBackgroundColor,
          pointBorderColor: seriesColors.pointBorderColor,
          pointHoverBackgroundColor: seriesColors.pointHoverBackgroundColor,
          pointHoverBorderColor: seriesColors.pointHoverBorderColor,
          pointRadius: 4,
          pointHoverRadius: 6,
          };
        })(),
        (() => {
          const seriesColors = getChartSeriesColors(this.document, 1);
          return {
          label: playerB.name,
          data: dataB,
          fill: true,
          backgroundColor: seriesColors.fillColor,
          borderColor: seriesColors.lineColor,
          pointBackgroundColor: seriesColors.pointBackgroundColor,
          pointBorderColor: seriesColors.pointBorderColor,
          pointHoverBackgroundColor: seriesColors.pointHoverBackgroundColor,
          pointHoverBorderColor: seriesColors.pointHoverBorderColor,
          pointRadius: 4,
          pointHoverRadius: 6,
          };
        })(),
      ],
    };
  }

  private buildGoalieRadarData(): void {
    const goalieA = this.playerA() as Goalie;
    const goalieB = this.playerB() as Goalie;

    if (!goalieA.scores || !goalieB.scores) return;

    // Check if season-specific stats are available
    const hasExtendedStats = 'gaa' in goalieA.scores;

    const statKeys = hasExtendedStats
      ? ['wins', 'saves', 'shutouts', 'gaa', 'savePercent']
      : ['wins', 'saves', 'shutouts'];

    const labels = statKeys.map((key) =>
      this.translateService.instant(`tableColumn.${key}`),
    );

    const dataA = statKeys.map((key) => (goalieA.scores as Record<string, number>)[key]);
    const dataB = statKeys.map((key) => (goalieB.scores as Record<string, number>)[key]);

    this.radarChartData = {
      labels,
      datasets: [
        (() => {
          const seriesColors = getChartSeriesColors(this.document, 0);
          return {
          label: goalieA.name,
          data: dataA,
          fill: true,
          backgroundColor: seriesColors.fillColor,
          borderColor: seriesColors.lineColor,
          pointBackgroundColor: seriesColors.pointBackgroundColor,
          pointBorderColor: seriesColors.pointBorderColor,
          pointHoverBackgroundColor: seriesColors.pointHoverBackgroundColor,
          pointHoverBorderColor: seriesColors.pointHoverBorderColor,
          pointRadius: 4,
          pointHoverRadius: 6,
          };
        })(),
        (() => {
          const seriesColors = getChartSeriesColors(this.document, 1);
          return {
          label: goalieB.name,
          data: dataB,
          fill: true,
          backgroundColor: seriesColors.fillColor,
          borderColor: seriesColors.lineColor,
          pointBackgroundColor: seriesColors.pointBackgroundColor,
          pointBorderColor: seriesColors.pointBorderColor,
          pointHoverBackgroundColor: seriesColors.pointHoverBackgroundColor,
          pointHoverBorderColor: seriesColors.pointHoverBorderColor,
          pointRadius: 4,
          pointHoverRadius: 6,
          };
        })(),
      ],
    };
  }
}
