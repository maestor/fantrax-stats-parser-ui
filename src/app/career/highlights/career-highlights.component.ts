import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';

import {
  ApiService,
  CareerHighlightPage,
  CareerSameTeamHighlightPage,
  CareerTeamCountHighlightPage,
  CareerHighlightType,
} from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { TableCardComponent } from '@shared/table-card/table-card.component';
import { TableCardRow } from '@shared/table-card/table-card.types';

import { CareerHighlightCardState, CareerHighlightCardView } from './career-highlights.types';

const PAGE_SIZE = 10;

type HighlightCardConfig = Pick<
  CareerHighlightCardState,
  'titleKey' | 'descriptionKey' | 'valueColumnLabelKey'
> & {
  readonly type: CareerHighlightType;
};

const MOST_TEAMS_PLAYED_CONFIG: HighlightCardConfig = {
  type: 'most-teams-played',
  titleKey: 'career.highlights.cards.mostTeamsPlayed.title',
  descriptionKey: 'career.highlights.cards.mostTeamsPlayed.description',
  valueColumnLabelKey: 'career.highlights.columns.teamCount',
};

const SAME_TEAM_SEASONS_PLAYED_CONFIG: HighlightCardConfig = {
  type: 'same-team-seasons-played',
  titleKey: 'career.highlights.cards.sameTeamSeasonsPlayed.title',
  descriptionKey: 'career.highlights.cards.sameTeamSeasonsPlayed.description',
  valueColumnLabelKey: 'career.highlights.columns.seasonCount',
};

const MOST_TEAMS_OWNED_CONFIG: HighlightCardConfig = {
  type: 'most-teams-owned',
  titleKey: 'career.highlights.cards.mostTeamsOwned.title',
  descriptionKey: 'career.highlights.cards.mostTeamsOwned.description',
  valueColumnLabelKey: 'career.highlights.columns.teamCount',
};

const SAME_TEAM_SEASONS_OWNED_CONFIG: HighlightCardConfig = {
  type: 'same-team-seasons-owned',
  titleKey: 'career.highlights.cards.sameTeamSeasonsOwned.title',
  descriptionKey: 'career.highlights.cards.sameTeamSeasonsOwned.description',
  valueColumnLabelKey: 'career.highlights.columns.seasonCount',
};

const HIGHLIGHT_CARD_CONFIGS: readonly HighlightCardConfig[] = [
  MOST_TEAMS_PLAYED_CONFIG,
  MOST_TEAMS_OWNED_CONFIG,
  SAME_TEAM_SEASONS_PLAYED_CONFIG,
  SAME_TEAM_SEASONS_OWNED_CONFIG,
];

function createInitialCardState(config: HighlightCardConfig): CareerHighlightCardState {
  return {
    titleKey: config.titleKey,
    descriptionKey: config.descriptionKey,
    valueColumnLabelKey: config.valueColumnLabelKey,
    rows: [],
    loading: true,
    apiError: false,
    skip: 0,
    take: PAGE_SIZE,
    total: 0,
  };
}

@Component({
  selector: 'app-career-highlights',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableCardComponent, TranslateModule],
  templateUrl: './career-highlights.component.html',
  styleUrl: './career-highlights.component.scss',
})
export class CareerHighlightsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly footerVisibilityService = inject(FooterVisibilityService);

  private readonly cardSignals: Record<
    CareerHighlightType,
    WritableSignal<CareerHighlightCardState>
  > = {
    'most-teams-played': signal(createInitialCardState(MOST_TEAMS_PLAYED_CONFIG)),
    'most-teams-owned': signal(createInitialCardState(MOST_TEAMS_OWNED_CONFIG)),
    'same-team-seasons-played': signal(createInitialCardState(SAME_TEAM_SEASONS_PLAYED_CONFIG)),
    'same-team-seasons-owned': signal(createInitialCardState(SAME_TEAM_SEASONS_OWNED_CONFIG)),
  };

  readonly cards = computed<readonly CareerHighlightCardView[]>(() =>
    HIGHLIGHT_CARD_CONFIGS.map((config) => ({
      type: config.type,
      state: this.cardSignals[config.type](),
    })),
  );

  private footerVisibilityCycle = 0;
  private pendingInitialLoads = 0;

  ngOnInit(): void {
    this.footerVisibilityCycle = this.footerVisibilityService.currentCycle();
    this.pendingInitialLoads = HIGHLIGHT_CARD_CONFIGS.length;

    for (const config of HIGHLIGHT_CARD_CONFIGS) {
      this.loadCard(config.type, 0, true);
    }
  }

  loadPreviousPage(type: CareerHighlightType): void {
    const current = this.getCardSignal(type)();
    if (current.loading) {
      return;
    }

    const nextSkip = Math.max(0, current.skip - current.take);
    if (nextSkip === current.skip) {
      return;
    }

    this.loadCard(type, nextSkip);
  }

  loadNextPage(type: CareerHighlightType): void {
    const current = this.getCardSignal(type)();
    if (current.loading) {
      return;
    }

    const nextSkip = current.skip + current.take;
    if (nextSkip >= current.total) {
      return;
    }

    this.loadCard(type, nextSkip);
  }

  private loadCard(
    type: CareerHighlightType,
    targetSkip: number,
    initialLoad = false,
  ): void {
    const cardSignal = this.getCardSignal(type);

    cardSignal.update((current) => ({
      ...current,
      loading: true,
      apiError: false,
    }));

    this.apiService
      .getCareerHighlights(type, targetSkip, cardSignal().take)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          cardSignal.update((current) => ({
            ...current,
            rows: this.normalizeRows(page),
            loading: false,
            apiError: false,
            skip: page.skip,
            take: page.take,
            total: page.total,
          }));
          this.markInitialLoadReady(initialLoad);
        },
        error: () => {
          cardSignal.update((current) => ({
            ...current,
            loading: false,
            apiError: true,
          }));
          this.markInitialLoadReady(initialLoad);
        },
      });
  }

  private normalizeRows(page: CareerHighlightPage): TableCardRow[] {
    if (this.isTeamCountPage(page)) {
      return page.items.map((item) => ({
        key: `${item.id}:${item.teams.map((team) => team.id).join(',')}`,
        primaryText: `${item.position} ${item.name}`,
        value: item.teamCount,
        detailLines: item.teams.map((team) => team.name),
        detailLabel: item.name,
      }));
    }

    if (!this.isSameTeamPage(page)) {
      return [];
    }

    return page.items.map((item) => ({
      key: `${item.id}:${item.team.id}`,
      primaryText: `${item.position} ${item.name}`,
      value: item.seasonCount,
      detailLines: [item.team.name],
      detailLabel: item.name,
    }));
  }

  private isTeamCountPage(page: CareerHighlightPage): page is CareerTeamCountHighlightPage {
    return page.type === 'most-teams-played' || page.type === 'most-teams-owned';
  }

  private isSameTeamPage(page: CareerHighlightPage): page is CareerSameTeamHighlightPage {
    return page.type === 'same-team-seasons-played' || page.type === 'same-team-seasons-owned';
  }

  private getCardSignal(type: CareerHighlightType): WritableSignal<CareerHighlightCardState> {
    return this.cardSignals[type];
  }

  private markInitialLoadReady(initialLoad: boolean): void {
    if (!initialLoad) {
      return;
    }

    this.pendingInitialLoads -= 1;
    if (this.pendingInitialLoads === 0) {
      this.footerVisibilityService.markReady(this.footerVisibilityCycle);
    }
  }
}
