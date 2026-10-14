import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CareerGoalie, CareerPlayer } from '@services/api.service';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';
import { formatSeasonDisplay } from '@shared/utils/season.utils';
import { formatStatDisplayValue } from '@shared/utils/stat-value-format.utils';

@Component({
  imports: [...TRANSLATE_IMPORTS, MatFormFieldModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-career-statistics',
  styleUrl: './career-statistics.component.scss',
  templateUrl: './career-statistics.component.html',
})
export class CareerStatisticsComponent {
  readonly career = input.required<CareerPlayer | CareerGoalie>();
  readonly isGoalie = input.required<boolean>();
  readonly scope = linkedSignal<'regular' | 'playoffs' | 'career'>(() => {
    this.career().id;
    return 'regular';
  });
  readonly totals = computed(() => this.career().totals[this.scope()]);
  readonly seasons = computed(() =>
    this.career().seasons.filter(
      (row) => this.scope() === 'career' || row.reportType === this.scope(),
    ),
  );
  readonly fields = computed(() =>
    this.isGoalie()
      ? [
          'games',
          'wins',
          'saves',
          'shutouts',
          'goals',
          'assists',
          'points',
          'penalties',
          'ppp',
          'shp',
        ]
      : [
          'games',
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
        ],
  );
  readonly seasonFields = computed(() =>
    this.isGoalie() ? [...this.fields(), 'gaa', 'savePercent'] : this.fields(),
  );
  readonly formatSeason = formatSeasonDisplay;
  value(row: object, field: string): string {
    const value = (row as Record<string, unknown>)[field];
    return formatStatDisplayValue(
      field,
      typeof value === 'number' || typeof value === 'string' ? value : undefined,
    );
  }
}
