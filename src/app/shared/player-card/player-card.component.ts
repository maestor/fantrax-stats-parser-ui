import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import {
  MatCheckboxModule,
  MatCheckboxChange,
} from '@angular/material/checkbox';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartDataset } from 'chart.js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  Player,
  Goalie,
  PlayerSeasonStats,
  GoalieSeasonStats,
} from '@services/api.service';
import { MatTooltipModule } from '@angular/material/tooltip';

interface StatRow {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-player-card',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    MatCheckboxModule,
    TranslateModule,
    BaseChartDirective,
  ],
  templateUrl: './player-card.component.html',
  styleUrl: './player-card.component.scss',
})
export class PlayerCardComponent {
  readonly dialogRef = inject(MatDialogRef<PlayerCardComponent>);
  readonly data = inject<Player | Goalie>(MAT_DIALOG_DATA);
  private translateService = inject(TranslateService);

  readonly isGoalie = 'wins' in this.data;

  // Check if this data has seasons (combined stats)
  readonly hasSeasons = !!this.data.seasons && this.data.seasons.length > 0;

  // Track which tab is active (0 = All, 1 = By Season)
  selectedTabIndex = 0;

  // Combined stats
  excludedColumns = ['name', 'seasons', 'scores', 'scoreAdjustedByGames'];
  stats: StatRow[] = this.reorderStatsForDisplay(
    Object.keys(this.data).filter((key) => !this.excludedColumns.includes(key))
  ).map((key) => ({
    label: `tableColumn.${key}`,
    value:
      key === 'season'
        ? this.formatSeasonDisplay(
            this.data[key as keyof typeof this.data] as number
          )
        : (this.data[key as keyof typeof this.data] as string | number),
  }));

  // Columns for combined stats table
  displayedColumns: string[] = ['label', 'value'];

  // Columns for season breakdown table
  seasonColumns: string[] = [];
  seasonDataSource: (PlayerSeasonStats | GoalieSeasonStats)[] = [];

  readonly chartStatKeys: string[] = this.isGoalie
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

  chartSelections: Record<string, boolean> = this.chartStatKeys.reduce(
    (acc, key) => ({
      ...acc,
      // Default: only score fields selected; others via toggle
      [key]: key === 'score' || key === 'scoreAdjustedByGames',
    }),
    {} as Record<string, boolean>
  );

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
      y: {},
    },
  };

  constructor() {
    if (this.hasSeasons) {
      this.setupSeasonData();
      this.setupChartData();
    }
  }

  private setupSeasonData(): void {
    if (!this.data.seasons) return;

    // Sort seasons by year, newest first
    const sortedSeasons = [...this.data.seasons].sort(
      (a, b) => b.season - a.season
    );

    // Transform season data to include formatted season display
    this.seasonDataSource = sortedSeasons.map((season) => ({
      ...season,
      seasonDisplay: this.formatSeasonDisplay(season.season),
    })) as (PlayerSeasonStats | GoalieSeasonStats)[];

    // Get column names from the first season object
    if (this.data.seasons.length > 0) {
      const columns = Object.keys(this.data.seasons[0]);
      const excludedSeasonColumns = ['scores'];

      // Replace 'season' with 'seasonDisplay' for display and drop internal columns
      let orderedColumns = columns
        .filter((col) => !excludedSeasonColumns.includes(col))
        .map((col) => (col === 'season' ? 'seasonDisplay' : col));

      // Reorder goalie columns: place savePercent and gaa after saves
      if (
        orderedColumns.includes('gaa') ||
        orderedColumns.includes('savePercent')
      ) {
        const savesIndex = orderedColumns.indexOf('saves');
        if (savesIndex !== -1) {
          // Remove savePercent and gaa from their current positions
          const reorderedColumns = orderedColumns.filter(
            (col) => col !== 'gaa' && col !== 'savePercent'
          );

          // Insert them after saves (savePercent first, then gaa)
          const insertIndex = reorderedColumns.indexOf('saves') + 1;
          if (orderedColumns.includes('savePercent')) {
            reorderedColumns.splice(insertIndex, 0, 'savePercent');
          }
          if (orderedColumns.includes('gaa')) {
            reorderedColumns.splice(
              insertIndex + (orderedColumns.includes('savePercent') ? 1 : 0),
              0,
              'gaa'
            );
          }

          orderedColumns = reorderedColumns;
        }
      }

      // Ensure seasonDisplay first, then score columns (FR, FR/O) in the season table
      const priorityColumns = ['seasonDisplay', 'score', 'scoreAdjustedByGames'];
      const prioritizedColumns = [
        ...priorityColumns.filter((col) => orderedColumns.includes(col)),
        ...orderedColumns.filter((col) => !priorityColumns.includes(col)),
      ];

      this.seasonColumns = prioritizedColumns;
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

    this.chartLabels = this.chartYearsRange.map((year) =>
      this.formatSeasonShort(year)
    );

    this.updateChartData(seasons);
  }

  private formatSeasonDisplay(year: number): string {
    const nextYear = year + 1;
    const nextYearShort = String(nextYear).slice(-2);
    return `${year}-${nextYearShort}`;
  }

  private formatSeasonShort(year: number): string {
    const startShort = String(year).slice(-2);
    const nextYear = year + 1;
    const endShort = String(nextYear).slice(-2);
    return `${startShort}-${endShort}`;
  }

  private reorderStatsForDisplay(keys: string[]): string[] {
    let reorderedKeys = [...keys];

    // Move score after name if it exists
    if (reorderedKeys.includes('score')) {
      reorderedKeys = reorderedKeys.filter((key) => key !== 'score');
      const nameIndex = reorderedKeys.indexOf('name');
      reorderedKeys.splice(nameIndex + 1, 0, 'score');
    }

    // Move season to the top if it exists
    if (reorderedKeys.includes('season')) {
      reorderedKeys = reorderedKeys.filter((key) => key !== 'season');
      reorderedKeys.unshift('season');
    }

    // Reorder goalie stats: place savePercent and gaa after saves
    if (
      reorderedKeys.includes('gaa') ||
      reorderedKeys.includes('savePercent')
    ) {
      const savesIndex = reorderedKeys.indexOf('saves');
      if (savesIndex !== -1) {
        // Remove savePercent and gaa from their current positions
        const tempKeys = reorderedKeys.filter(
          (key) => key !== 'gaa' && key !== 'savePercent'
        );

        // Insert them after saves (savePercent first, then gaa)
        const insertIndex = tempKeys.indexOf('saves') + 1;
        if (reorderedKeys.includes('savePercent')) {
          tempKeys.splice(insertIndex, 0, 'savePercent');
        }
        if (reorderedKeys.includes('gaa')) {
          tempKeys.splice(
            insertIndex + (reorderedKeys.includes('savePercent') ? 1 : 0),
            0,
            'gaa'
          );
        }

        reorderedKeys = tempKeys;
      }
    }

    return reorderedKeys;
  }

  private updateChartData(
    sortedSeasons: (PlayerSeasonStats | GoalieSeasonStats)[]
  ): void {
    const activeKeys = this.chartStatKeys.filter(
      (key) => this.chartSelections[key]
    );

    const palette = [
      '#1976d2',
      '#d32f2f',
      '#388e3c',
      '#fbc02d',
      '#7b1fa2',
      '#00838f',
    ];

    const seasonByYear = new Map<
      number,
      PlayerSeasonStats | GoalieSeasonStats
    >();
    sortedSeasons.forEach((season) => {
      seasonByYear.set(season.season, season);
    });

    const datasets: ChartDataset<'line', (number | null)[]>[] = activeKeys.map(
      (key, index) => {
        const data = this.chartYearsRange.map((year) => {
          const season = seasonByYear.get(year);
          if (!season) {
            return null;
          }

          const value = (season as any)[key];
          const numeric = typeof value === 'string' ? parseFloat(value) : value;
          return Number.isFinite(numeric) ? (numeric as number) : 0;
        });

        const translatedLabel = this.translateService.instant(
          `tableColumn.${key}`
        );

        return {
          data,
          label: translatedLabel || `tableColumn.${key}`,
          borderColor: palette[index % palette.length],
          backgroundColor: palette[index % palette.length],
          fill: false,
          tension: 0.2,
          pointRadius: 3,
        };
      }
    );

    this.lineChartData = {
      labels: this.chartLabels,
      datasets,
    };

    const allValues = datasets.flatMap((ds) =>
      (ds.data as (number | null)[]).filter(
        (value): value is number => typeof value === 'number'
      )
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

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  onStatToggle(key: string, event: MatCheckboxChange): void {
    this.chartSelections[key] = event.checked;

    if (!this.data.seasons) return;

    const sortedSeasons = [...this.data.seasons].sort(
      (a, b) => b.season - a.season
    );
    this.updateChartData(sortedSeasons);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
