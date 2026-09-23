import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { TranslateService } from '@ngx-translate/core';
import { ApiService, CategoryDashboardResponse, CategoryDashboardTeam } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { TeamService } from '@services/team.service';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';
import { Column } from '@shared/column.types';
import { ExpandedRowViewModel } from '@shared/table-row-expansion.types';
import { StatsTableComponent, TableRow } from '@shared/stats-table/stats-table.component';

type CategoryKey = CategoryDashboardResponse['categories'][number]['key'];
type CategoryStatsRow = Record<string, string | number | null> & {
  rowKey: string;
  name: string;
  key: CategoryKey;
  valueChange: number | null;
  medianChange: number | null;
  rankChange: number | null;
  comparisonChange: number | null;
};
type Contributor = { name: string; value: number; share: number | null };

const SKATER_FIELDS: readonly CategoryKey[] = [
  'goals', 'assists', 'points', 'plusMinus', 'penalties', 'shots', 'ppp', 'shp', 'hits', 'blocks',
];

@Component({
  selector: 'app-team-category-stats',
  imports: [
    StatsTableComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    ...TRANSLATE_IMPORTS,
  ],
  templateUrl: './team-category-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './team-category-stats.component.scss',
})
export class TeamCategoryStatsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly footerVisibilityService = inject(FooterVisibilityService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly teamService = inject(TeamService);
  private readonly translate = inject(TranslateService);

  readonly selectedTeamId = this.teamService.selectedTeamIdSignal;
  readonly response = signal<CategoryDashboardResponse | null>(null);
  readonly loading = signal(true);
  readonly apiError = signal(false);
  readonly selectedSeason = signal<number | null>(null);
  readonly comparisonTeamId = signal('');
  readonly seasons = computed(() => this.response()?.availableSeasons ?? []);
  readonly selectedTeam = computed(() =>
    this.response()?.teams.find((team) => team.teamId === this.selectedTeamId()) ?? null,
  );
  readonly comparisonTeam = computed(() => {
    const id = this.comparisonTeamId();
    return id && id !== this.selectedTeamId()
      ? this.response()?.teams.find((team) => team.teamId === id) ?? null
      : null;
  });

  readonly columns = computed<Column[]>(() => {
    const columns: Column[] = [
      { field: 'category', align: 'left', sortable: false },
      {
        field: 'value',
        align: 'center',
        sortable: false,
        cellDelta: (row) => this.formatDelta((row as CategoryStatsRow).valueChange),
      },
      {
        field: 'median',
        align: 'center',
        sortable: false,
        cellDelta: (row) => this.formatDelta((row as CategoryStatsRow).medianChange),
      },
      {
        field: 'categoryRank',
        align: 'center',
        sortable: false,
        cellDelta: (row) => this.formatDelta((row as CategoryStatsRow).rankChange),
      },
    ];
    const comparison = this.comparisonTeam();
    if (comparison) {
      const comparisonTitle = `${this.translate.instant('tableColumnShort.comparison')} (${comparison.teamAbbr})`;
      columns.push({
        field: 'comparison',
        align: 'center',
        sortable: false,
        headerLabel: comparisonTitle,
        headerTooltip: comparisonTitle,
        cellDelta: (row) => this.formatDelta((row as CategoryStatsRow).comparisonChange),
      });
    }
    return columns;
  });

  readonly tableData = computed<TableRow[]>(() => {
    const response = this.response();
    const team = this.selectedTeam();
    if (!response || !team) return [];

    const comparison = this.comparisonTeam();
    return response.categories.map((definition) => {
      const value = team.categories[definition.key];
      const previous = value.previous;
      const change = previous?.totalChange ?? null;
      const rankChange = previous?.totalRankChange ?? null;
      const comparisonValue = comparison?.categories[definition.key];
      const currentValue = value.total;
      const otherValue = comparisonValue?.total ?? null;
      const comparisonChange = comparisonValue && otherValue !== null
        ? currentValue - otherValue
        : null;
      const median = value.totalMedian === null ? null : Math.round(value.totalMedian);
      const medianChange = median === null ? null : currentValue - median;
      const row: CategoryStatsRow = {
        rowKey: definition.key,
        name: this.categoryLabel(definition.key),
        key: definition.key,
        category: this.categoryLabel(definition.key),
        value: this.formatValue(currentValue),
        categoryRank: this.formatOrdinal(value.totalRank),
        median: this.formatMedian(median),
        comparison: comparisonValue && otherValue !== null
          ? this.formatValue(otherValue)
          : '—',
        valueChange: change,
        medianChange,
        rankChange,
        comparisonChange,
      };
      return row as unknown as TableRow;
    });
  });

  readonly rowKey = (row: TableRow): string => (row as unknown as CategoryStatsRow).rowKey;
  readonly formatCell = (_field: string, value: number | string | undefined): string =>
    String(value ?? '—');
  readonly isExpandable = (): boolean => true;
  readonly expandedRows = (row: TableRow): ExpandedRowViewModel[] => {
    const category = row as unknown as CategoryStatsRow;
    const rows = this.contributionRows(category.key).map((contributor) => ({
      seasonLabel: contributor.name,
      primary: this.formatCount(contributor.value),
      secondary: this.contributionShare(contributor),
    }));
    return rows.length > 0
      ? rows
      : [{ seasonLabel: '—', primary: this.translate.instant('categoryStats.noContributions') }];
  };
  readonly expandToggleAriaLabel = (row: TableRow, expanded: boolean): string =>
    this.translate.instant(
      expanded ? 'a11y.collapseCategoryDetails' : 'a11y.expandCategoryDetails',
      { name: (row as unknown as CategoryStatsRow).name },
    );
  readonly expandedHeaderLabels = {
    season: this.translate.instant('categoryStats.contributor'),
    primary: this.translate.instant('categoryStats.contributionDetails'),
    secondary: this.translate.instant('categoryStats.share'),
    primaryAlign: 'center' as const,
  };

  ngOnInit(): void {
    const footerCycle = this.footerVisibilityService.currentCycle();
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      this.footerVisibilityService.markReady(footerCycle);
      return;
    }
    this.loadDashboard(undefined, footerCycle);
  }

  loadDashboard(season = this.selectedSeason() ?? undefined, footerCycle?: number): void {
    this.loading.set(true);
    this.apiError.set(false);
    const cycle = footerCycle ?? this.footerVisibilityService.currentCycle();
    this.apiService.getCategoryDashboard(season)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.response.set(response);
          this.selectedSeason.set(response.season);
          this.loading.set(false);
          this.footerVisibilityService.markReady(cycle);
        },
        error: () => {
          this.response.set(null);
          this.loading.set(false);
          this.apiError.set(true);
          this.footerVisibilityService.markReady(cycle);
        },
      });
  }

  onSeasonChange(event: MatSelectChange): void {
    const season = Number(event.value);
    if (Number.isFinite(season)) {
      this.selectedSeason.set(season);
      this.loadDashboard(season);
    }
  }

  onComparisonChange(event: MatSelectChange): void {
    this.comparisonTeamId.set(event.value === this.selectedTeamId() ? '' : event.value);
  }

  categoryLabel(key: CategoryKey): string {
    return this.translate.instant(`tableColumn.${key}`);
  }

  coverageMessage(): string | null {
    const status = this.response()?.coverage.status;
    if (status === 'partial') return this.translate.instant('categoryStats.coveragePartial');
    if (status === 'unknown') return this.translate.instant('categoryStats.coverageUnknown');
    return null;
  }

  selectedTeamMessage(): string | null {
    const team = this.selectedTeam();
    if (!team) return this.translate.instant('categoryStats.teamUnavailable');
    return this.participationMessage(team);
  }

  private contributionRows(key: CategoryKey): Contributor[] {
    const team = this.selectedTeam();
    if (!team) return [];
    const total = team.categories[key].total;
    const rows = SKATER_FIELDS.includes(key)
      ? team.players.map((player) => ({
          name: player.name,
          value: player[key as keyof typeof player] as number,
        }))
      : team.goalies.map((goalie) => ({
          name: goalie.name,
          value: goalie[key as keyof typeof goalie] as number,
        }));
    return rows
      .filter((row) => row.value !== 0)
      .map((row) => ({
        ...row,
        share: key !== 'plusMinus' && total > 0 ? row.value / total : null,
      }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  }

  private contributionShare(row: Contributor): string {
    if (row.share === null) return '—';
    return `${new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 1 }).format(row.share * 100)} %`;
  }

  private participationMessage(team: CategoryDashboardTeam): string | null {
    if (team.participation === 'not-yet-joined') return this.translate.instant('categoryStats.notYetJoined');
    if (team.participation === 'missing-report') return this.translate.instant('categoryStats.missingReport');
    if (team.participation === 'unknown') return this.translate.instant('categoryStats.unknownParticipation');
    if (team.skaterGames === 0 && team.goalieGames === 0) return this.translate.instant('categoryStats.noCreditedGames');
    return null;
  }

  private formatValue(value: number | null): string {
    if (value === null) return '—';
    return new Intl.NumberFormat('fi-FI', {
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatMedian(value: number | null): string {
    if (value === null) return '—';
    return new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 0 }).format(value);
  }

  private formatOrdinal(value: number | null): string {
    return value === null ? '—' : `${this.formatValue(value)}.`;
  }

  private formatDelta(change: number | null): { text: string; className?: string } | undefined {
    if (change === null) return undefined;
    const className = change > 0
      ? 'stats-table-delta-positive'
      : change < 0
        ? 'stats-table-delta-negative'
        : undefined;
    return { text: this.formatSigned(change), className };
  }

  private formatCount(value: number): string {
    return new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 0 }).format(value);
  }

  private formatSigned(value: number): string {
    const formatted = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 1 }).format(Math.abs(value));
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `−${formatted}`;
    return formatted;
  }
}
