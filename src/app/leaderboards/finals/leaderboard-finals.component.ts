import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import {
  ApiService,
  FinalsLeaderboardCategory,
  FinalsLeaderboardEntry,
  FinalsLeaderboardTeam,
} from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { SettingsService } from '@services/settings.service';
import { formatStatDisplayValue } from '@shared/utils/stat-value-format.utils';
import {
  DraftPanelFocusTargetDirective,
  DraftPanelHeaderNavigationDirective,
} from '../../draft/draft-panel-navigation.directive';

const SKATER_CATEGORY_KEYS: FinalsLeaderboardCategory['statKey'][] = [
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

const GOALIE_CATEGORY_KEYS: FinalsLeaderboardCategory['statKey'][] = [
  'wins',
  'saves',
  'shutouts',
  'gaa',
  'savePercent',
];

type FinalsFactorKey = 'offence' | 'physical' | 'goalies';

const FACTOR_KEYS: FinalsFactorKey[] = ['offence', 'physical', 'goalies'];

@Component({
  selector: 'app-leaderboard-finals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatExpansionModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    TranslateModule,
    DraftPanelFocusTargetDirective,
    DraftPanelHeaderNavigationDirective,
  ],
  templateUrl: './leaderboard-finals.component.html',
  styleUrls: [
    './leaderboard-finals.component.scss',
    './leaderboard-finals-comparison.component.scss',
    './leaderboard-finals-responsive.component.scss',
  ],
})
export class LeaderboardFinalsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly footerVisibilityService = inject(FooterVisibilityService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly settingsService = inject(SettingsService);

  private footerVisibilityCycle = 0;

  readonly selectedTeamId = this.settingsService.selectedTeamIdSignal;
  readonly disableSelectedTeamHighlight = this.settingsService.disableSelectedTeamHighlightSignal;
  readonly finals = computed(() => (
    [...this.entries].sort((a, b) => b.season - a.season)
  ));

  entries: FinalsLeaderboardEntry[] = [];
  loading = true;
  apiError = false;

  ngOnInit(): void {
    this.footerVisibilityCycle = this.footerVisibilityService.currentCycle();
    this.loading = true;
    this.apiError = false;

    if (!isPlatformBrowser(this.platformId)) {
      this.footerVisibilityService.markReady(this.footerVisibilityCycle);
      return;
    }

    this.apiService.getLeaderboardFinals()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entries) => {
          this.entries = entries;
          this.loading = false;
          this.changeDetectorRef.markForCheck();
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
        error: () => {
          this.entries = [];
          this.loading = false;
          this.apiError = true;
          this.changeDetectorRef.markForCheck();
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
      });
  }

  isWinner(entry: FinalsLeaderboardEntry, teamId: string): boolean {
    return entry.winnerTeamId === teamId;
  }

  hasSelectedFinalist(entry: FinalsLeaderboardEntry): boolean {
    return !this.disableSelectedTeamHighlight()
      && (entry.homeTeam.teamId === this.selectedTeamId() || entry.awayTeam.teamId === this.selectedTeamId());
  }

  formatPercent(value: number): string {
    return `${this.normalizeRateValue(value).toFixed(1).replace('.', ',')} %`;
  }

  formatRateDelta(entry: FinalsLeaderboardEntry): string {
    const delta = this.getRateDeltaValue(entry);
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1).replace('.', ',')} %-yks.`;
  }

  formatRateDeltaCompact(entry: FinalsLeaderboardEntry): string {
    const delta = this.getRateDeltaValue(entry);
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1).replace('.', ',')}`;
  }

  getRateDeltaTone(entry: FinalsLeaderboardEntry): 'negative' | 'neutral' | 'positive' {
    const delta = this.getRateDeltaValue(entry);

    if (delta > 0) {
      return 'positive';
    }

    if (delta < 0) {
      return 'negative';
    }

    return 'neutral';
  }

  formatScore(team: FinalsLeaderboardTeam): string {
    return this.formatNumber(team.score.matchPoints, 1);
  }

  formatCategoryRecord(team: FinalsLeaderboardTeam): string {
    return [
      team.score.categoriesWon,
      team.score.categoriesLost,
      team.score.categoriesTied,
    ].join('-');
  }

  getWinnerTeam(entry: FinalsLeaderboardEntry): FinalsLeaderboardTeam {
    return entry.homeTeam.teamId === entry.winnerTeamId ? entry.homeTeam : entry.awayTeam;
  }

  getLoserTeam(entry: FinalsLeaderboardEntry): FinalsLeaderboardTeam {
    return entry.homeTeam.teamId === entry.winnerTeamId ? entry.awayTeam : entry.homeTeam;
  }

  getSkaterCategories(entry: FinalsLeaderboardEntry): FinalsLeaderboardCategory[] {
    return entry.categories.filter((category) => SKATER_CATEGORY_KEYS.includes(category.statKey));
  }

  getGoalieCategories(entry: FinalsLeaderboardEntry): FinalsLeaderboardCategory[] {
    return entry.categories.filter((category) => GOALIE_CATEGORY_KEYS.includes(category.statKey));
  }

  getFactorKeys(): FinalsFactorKey[] {
    return FACTOR_KEYS;
  }

  getFactorValue(entry: FinalsLeaderboardEntry, side: 'away' | 'home', factorKey: FinalsFactorKey): string {
    const factorSet = side === 'home' ? entry.factors.homeTeam : entry.factors.awayTeam;
    return this.formatFactorValue(factorSet[factorKey]);
  }

  factorLeads(entry: FinalsLeaderboardEntry, side: 'away' | 'home', factorKey: FinalsFactorKey): boolean {
    const homeValue = entry.factors.homeTeam[factorKey];
    const awayValue = entry.factors.awayTeam[factorKey];

    if (homeValue === awayValue) {
      return false;
    }

    return side === 'home' ? homeValue > awayValue : awayValue > homeValue;
  }

  getCategoryValue(category: FinalsLeaderboardCategory, side: 'away' | 'home'): string {
    const value = side === 'away' ? category.awayValue : category.homeValue;
    return this.formatFinalsValue(category.statKey, value);
  }

  categoryWonBy(category: FinalsLeaderboardCategory, teamId: string): boolean {
    return category.winnerTeamId === teamId;
  }

  private formatFinalsValue(statKey: FinalsLeaderboardCategory['statKey'], value: number | null): string {
    if (value === null || value === undefined) {
      return '—';
    }

    if (statKey === 'savePercent' || statKey === 'gaa') {
      return formatStatDisplayValue(statKey, value);
    }

    return this.formatNumber(value, Number.isInteger(value) ? 0 : 1);
  }

  private formatNumber(value: number, maximumFractionDigits: number): string {
    return new Intl.NumberFormat('fi-FI', {
      minimumFractionDigits: 0,
      maximumFractionDigits,
    }).format(value);
  }

  private normalizeRateValue(value: number): number {
    return Math.abs(value) > 1 ? value : value * 100;
  }

  private formatFactorValue(value: number): string {
    return this.normalizeRateValue(value).toFixed(1).replace('.', ',');
  }

  private getRateDeltaValue(entry: FinalsLeaderboardEntry): number {
    return this.normalizeRateValue(entry.rates.deservedToWinRate)
      - this.normalizeRateValue(entry.rates.winRate);
  }
}
