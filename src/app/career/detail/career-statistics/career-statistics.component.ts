import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CareerGoalie, CareerPlayer } from '@services/api.service';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';
import { formatSeasonDisplay } from '@shared/utils/season.utils';
import { formatStatDisplayValue } from '@shared/utils/stat-value-format.utils';

function orderSeasonTeams<T extends { season: number; teamId: string }>(rows: readonly T[]): T[] {
  const teamsBySeason = new Map<number, Set<string>>();
  for (const row of rows) {
    if (!teamsBySeason.has(row.season)) teamsBySeason.set(row.season, new Set());
    teamsBySeason.get(row.season)!.add(row.teamId);
  }
  const laterTeamBySeason = new Map<number, string>();
  for (const [season, teams] of teamsBySeason) {
    if (teams.size !== 2) continue;
    const [first, second] = teams;
    const previous = teamsBySeason.get(season - 1);
    const next = teamsBySeason.get(season + 1);
    const oldTeam = previous?.size === 1 ? [...previous][0] : undefined;
    const nextTeam = next?.size === 1 ? [...next][0] : undefined;
    const fromPrevious = oldTeam === first ? second : oldTeam === second ? first : undefined;
    const fromNext = nextTeam && teams.has(nextTeam) ? nextTeam : undefined;
    if (fromPrevious && fromNext && fromPrevious !== fromNext) continue;
    const laterTeam = fromPrevious ?? fromNext;
    if (laterTeam) laterTeamBySeason.set(season, laterTeam);
  }
  return rows.slice().sort((left, right) => {
    if (left.season !== right.season) return right.season - left.season;
    const laterTeam = laterTeamBySeason.get(left.season);
    return Number(right.teamId === laterTeam) - Number(left.teamId === laterTeam);
  });
}

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
    orderSeasonTeams<CareerPlayer['seasons'][number] | CareerGoalie['seasons'][number]>(this.career().seasons).filter(
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
