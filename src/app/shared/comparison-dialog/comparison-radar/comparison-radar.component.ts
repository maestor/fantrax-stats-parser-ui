import { DOCUMENT } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { Player, Goalie, PlayerScores } from '@services/api.service';

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

  @Input({ required: true }) playerA!: Player | Goalie;
  @Input({ required: true }) playerB!: Player | Goalie;

  radarChartData: ChartData<'radar'> = { labels: [], datasets: [] };
  radarChartOptions: ChartConfiguration<'radar'>['options'] = {};

  get isGoalie(): boolean {
    return 'wins' in this.playerA;
  }

  ngOnInit(): void {
    this.buildRadarChartOptions();
    this.buildRadarChartData();
  }

  private buildRadarChartOptions(): void {
    const textColor = this.resolveCssColorVar('--mat-sys-on-surface', '#1f1f1f');
    const gridColor = this.resolveCssColorVar('--mat-sys-outline-variant', 'rgba(0,0,0,0.2)');
    const tooltipBg = this.resolveCssColorVar(
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
            label: (context: any) => {
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
        } as any,
      },
    };
  }

  private buildRadarChartData(): void {
    if (this.isGoalie) {
      this.buildGoalieRadarData();
    } else {
      this.buildPlayerRadarData();
    }
  }

  private buildPlayerRadarData(): void {
    const playerA = this.playerA as Player;
    const playerB = this.playerB as Player;

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
        {
          label: playerA.name,
          data: dataA,
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
        {
          label: playerB.name,
          data: dataB,
          fill: true,
          backgroundColor: 'rgba(255, 152, 0, 0.3)',
          borderColor: '#ff9800',
          pointBackgroundColor: '#ff9800',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#ff9800',
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }

  private buildGoalieRadarData(): void {
    const goalieA = this.playerA as Goalie;
    const goalieB = this.playerB as Goalie;

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
        {
          label: goalieA.name,
          data: dataA,
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
        {
          label: goalieB.name,
          data: dataB,
          fill: true,
          backgroundColor: 'rgba(255, 152, 0, 0.3)',
          borderColor: '#ff9800',
          pointBackgroundColor: '#ff9800',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#ff9800',
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }

  private resolveCssColorVar(
    name: string,
    fallback: string,
    cssProperty: 'color' | 'backgroundColor' = 'color',
  ): string {
    try {
      const body = this.document.body;
      if (!body) return fallback;

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
}
