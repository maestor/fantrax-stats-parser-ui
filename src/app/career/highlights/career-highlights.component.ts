import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  WritableSignal,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MatButtonToggleChange,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';
import { TranslateModule } from '@ngx-translate/core';

import {
  ApiService,
  CareerHighlightPage,
  CareerRegularGrinderHighlightPage,
  CareerSameTeamHighlightPage,
  CareerStashHighlightPage,
  CareerStanleyCupHighlightPage,
  CareerTeamCountHighlightPage,
  CareerTransactionHighlightPage,
} from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { TableCardComponent } from '@shared/table-card/table-card.component';
import { TableCardRow } from '@shared/table-card/table-card.types';
import { formatPlayoffYear } from '@shared/utils/season.utils';

import { ActivateOnViewportDirective } from './activate-on-viewport.directive';
import {
  CareerHighlightCardState,
  CareerHighlightCardView,
  CareerHighlightSection,
  CareerHighlightsUiType,
} from './career-highlights.types';

const PAGE_SIZE = 10;

type HighlightCardConfig = Pick<
  CareerHighlightCardState,
  'titleKey' | 'descriptionKey' | 'valueColumnLabelKey'
> & {
  readonly section: CareerHighlightSection;
  readonly type: CareerHighlightsUiType;
};

const MOST_TEAMS_PLAYED_CONFIG: HighlightCardConfig = {
  section: 'general',
  type: 'most-teams-played',
  titleKey: 'career.highlights.cards.mostTeamsPlayed.title',
  descriptionKey: 'career.highlights.cards.mostTeamsPlayed.description',
  valueColumnLabelKey: 'career.highlights.columns.teamCount',
};

const SAME_TEAM_SEASONS_PLAYED_CONFIG: HighlightCardConfig = {
  section: 'general',
  type: 'same-team-seasons-played',
  titleKey: 'career.highlights.cards.sameTeamSeasonsPlayed.title',
  descriptionKey: 'career.highlights.cards.sameTeamSeasonsPlayed.description',
  valueColumnLabelKey: 'career.highlights.columns.seasonCount',
};

const MOST_TEAMS_OWNED_CONFIG: HighlightCardConfig = {
  section: 'general',
  type: 'most-teams-owned',
  titleKey: 'career.highlights.cards.mostTeamsOwned.title',
  descriptionKey: 'career.highlights.cards.mostTeamsOwned.description',
  valueColumnLabelKey: 'career.highlights.columns.teamCount',
};

const MOST_STANLEY_CUPS_CONFIG: HighlightCardConfig = {
  section: 'general',
  type: 'most-stanley-cups',
  titleKey: 'career.highlights.cards.mostStanleyCups.title',
  descriptionKey: 'career.highlights.cards.mostStanleyCups.description',
  valueColumnLabelKey: '💍',
};

const REGULAR_GRINDER_WITHOUT_PLAYOFFS_CONFIG: HighlightCardConfig = {
  section: 'general',
  type: 'regular-grinder-without-playoffs',
  titleKey: 'career.highlights.cards.regularGrinderWithoutPlayoffs.title',
  descriptionKey:
    'career.highlights.cards.regularGrinderWithoutPlayoffs.description',
  valueColumnLabelKey: 'career.highlights.columns.games',
};

const SAME_TEAM_SEASONS_OWNED_CONFIG: HighlightCardConfig = {
  section: 'general',
  type: 'same-team-seasons-owned',
  titleKey: 'career.highlights.cards.sameTeamSeasonsOwned.title',
  descriptionKey: 'career.highlights.cards.sameTeamSeasonsOwned.description',
  valueColumnLabelKey: 'career.highlights.columns.seasonCount',
};

const STASH_KING_CONFIG: HighlightCardConfig = {
  section: 'general',
  type: 'stash-king',
  titleKey: 'career.highlights.cards.stashKing.title',
  descriptionKey: 'career.highlights.cards.stashKing.description',
  valueColumnLabelKey: 'career.highlights.columns.seasonCount',
};

const MOST_TRADES_CONFIG: HighlightCardConfig = {
  section: 'transactions',
  type: 'most-trades',
  titleKey: 'career.highlights.cards.mostTrades.title',
  descriptionKey: 'career.highlights.cards.mostTrades.description',
  valueColumnLabelKey: '🤝',
};

const MOST_CLAIMS_CONFIG: HighlightCardConfig = {
  section: 'transactions',
  type: 'most-claims',
  titleKey: 'career.highlights.cards.mostClaims.title',
  descriptionKey: 'career.highlights.cards.mostClaims.description',
  valueColumnLabelKey: '✅',
};

const MOST_DROPS_CONFIG: HighlightCardConfig = {
  section: 'transactions',
  type: 'most-drops',
  titleKey: 'career.highlights.cards.mostDrops.title',
  descriptionKey: 'career.highlights.cards.mostDrops.description',
  valueColumnLabelKey: '❌',
};

const HIGHLIGHT_CARD_CONFIGS: readonly HighlightCardConfig[] = [
  MOST_STANLEY_CUPS_CONFIG,
  REGULAR_GRINDER_WITHOUT_PLAYOFFS_CONFIG,
  MOST_TEAMS_PLAYED_CONFIG,
  MOST_TEAMS_OWNED_CONFIG,
  SAME_TEAM_SEASONS_PLAYED_CONFIG,
  SAME_TEAM_SEASONS_OWNED_CONFIG,
  STASH_KING_CONFIG,
  MOST_TRADES_CONFIG,
  MOST_CLAIMS_CONFIG,
  MOST_DROPS_CONFIG,
];

function createInitialCardState(
  config: HighlightCardConfig,
): CareerHighlightCardState {
  return {
    titleKey: config.titleKey,
    descriptionKey: config.descriptionKey,
    valueColumnLabelKey: config.valueColumnLabelKey,
    activated: false,
    rows: [],
    loading: false,
    apiError: false,
    skip: 0,
    take: PAGE_SIZE,
    total: 0,
  };
}

@Component({
  selector: 'app-career-highlights',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ActivateOnViewportDirective,
    MatButtonToggleModule,
    TableCardComponent,
    TranslateModule,
  ],
  templateUrl: './career-highlights.component.html',
  styleUrl: './career-highlights.component.scss',
})
export class CareerHighlightsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly footerVisibilityService = inject(FooterVisibilityService);

  readonly selectedSection = signal<CareerHighlightSection>('general');

  private readonly cardSignals: Record<
    CareerHighlightsUiType,
    WritableSignal<CareerHighlightCardState>
  > = {
      'most-teams-played': signal(
        createInitialCardState(MOST_TEAMS_PLAYED_CONFIG),
      ),
      'most-teams-owned': signal(createInitialCardState(MOST_TEAMS_OWNED_CONFIG)),
      'most-stanley-cups': signal(
        createInitialCardState(MOST_STANLEY_CUPS_CONFIG),
      ),
      'regular-grinder-without-playoffs': signal(
        createInitialCardState(REGULAR_GRINDER_WITHOUT_PLAYOFFS_CONFIG),
      ),
      'same-team-seasons-played': signal(
        createInitialCardState(SAME_TEAM_SEASONS_PLAYED_CONFIG),
      ),
      'same-team-seasons-owned': signal(
        createInitialCardState(SAME_TEAM_SEASONS_OWNED_CONFIG),
      ),
      'stash-king': signal(createInitialCardState(STASH_KING_CONFIG)),
      'most-trades': signal(createInitialCardState(MOST_TRADES_CONFIG)),
      'most-claims': signal(createInitialCardState(MOST_CLAIMS_CONFIG)),
      'most-drops': signal(createInitialCardState(MOST_DROPS_CONFIG)),
    };

  readonly cards = computed<readonly CareerHighlightCardView[]>(() =>
    HIGHLIGHT_CARD_CONFIGS
      .filter((config) => config.section === this.selectedSection())
      .map((config) => ({
        type: config.type,
        state: this.cardSignals[config.type](),
      })),
  );

  private footerVisibilityCycle = 0;
  private footerMarkedReady = false;

  ngOnInit(): void {
    this.footerVisibilityCycle = this.footerVisibilityService.currentCycle();
  }

  onSectionChange(event: MatButtonToggleChange): void {
    this.selectedSection.set(event.value as CareerHighlightSection);
  }

  loadPreviousPage(type: CareerHighlightsUiType): void {
    const current = this.getCardSignal(type)();
    if (!current.activated || current.loading) {
      return;
    }

    const nextSkip = Math.max(0, current.skip - current.take);
    if (nextSkip === current.skip) {
      return;
    }

    this.loadCard(type, nextSkip);
  }

  loadNextPage(type: CareerHighlightsUiType): void {
    const current = this.getCardSignal(type)();
    if (!current.activated || current.loading) {
      return;
    }

    const nextSkip = current.skip + current.take;
    if (nextSkip >= current.total) {
      return;
    }

    this.loadCard(type, nextSkip);
  }

  activateCard(type: CareerHighlightsUiType): void {
    const cardSignal = this.getCardSignal(type);
    if (cardSignal().activated) {
      return;
    }

    cardSignal.update((current) => ({
      ...current,
      activated: true,
    }));

    this.loadCard(type, 0, true);
  }

  private loadCard(
    type: CareerHighlightsUiType,
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

    if (this.isSameTeamPage(page)) {
      return page.items.map((item) => ({
        key: `${item.id}:${item.team.id}`,
        primaryText: `${item.position} ${item.name}`,
        value: item.seasonCount,
        detailLines: [item.team.name],
        detailLabel: item.name,
      }));
    }

    if (this.isStanleyCupPage(page)) {
      return page.items.map((item) => ({
        key: item.id,
        primaryText: `${item.position} ${item.name}`,
        value: item.cupCount,
        detailLines: item.cups.map(
          (cup) => `${formatPlayoffYear(cup.season)} ${cup.team.name}`,
        ),
        detailLabel: item.name,
      }));
    }

    if (this.isRegularGrinderPage(page)) {
      return page.items.map((item) => ({
        key: item.id,
        primaryText: `${item.position} ${item.name}`,
        value: item.regularGames,
        detailLines: item.teams.map((team) => team.name),
        detailLabel: item.name,
      }));
    }

    if (this.isStashPage(page)) {
      return page.items.map((item) => ({
        key: `${item.id}:${item.team.id}`,
        primaryText: `${item.position} ${item.name}`,
        value: item.seasonCount,
        detailLines: [item.team.name],
        detailLabel: item.name,
      }));
    }

    if (this.isTransactionPage(page)) {
      return page.items.map((item) => ({
        key: `${page.type}:${item.id}`,
        primaryText: `${item.position} ${item.name}`,
        value: item.transactionCount,
        detailLines: item.teams.map((team) => `${team.name} ${team.count}`),
        detailLabel: item.name,
      }));
    }

    return [];
  }

  private isTeamCountPage(
    page: CareerHighlightPage,
  ): page is CareerTeamCountHighlightPage {
    return (
      page.type === 'most-teams-played' || page.type === 'most-teams-owned'
    );
  }

  private isSameTeamPage(
    page: CareerHighlightPage,
  ): page is CareerSameTeamHighlightPage {
    return (
      page.type === 'same-team-seasons-played' ||
      page.type === 'same-team-seasons-owned'
    );
  }

  private isStanleyCupPage(
    page: CareerHighlightPage,
  ): page is CareerStanleyCupHighlightPage {
    return page.type === 'most-stanley-cups';
  }

  private isRegularGrinderPage(
    page: CareerHighlightPage,
  ): page is CareerRegularGrinderHighlightPage {
    return page.type === 'regular-grinder-without-playoffs';
  }

  private isStashPage(
    page: CareerHighlightPage,
  ): page is CareerStashHighlightPage {
    return page.type === 'stash-king';
  }

  private isTransactionPage(
    page: CareerHighlightPage,
  ): page is CareerTransactionHighlightPage {
    return (
      page.type === 'most-trades' ||
      page.type === 'most-claims' ||
      page.type === 'most-drops'
    );
  }

  private getCardSignal(
    type: CareerHighlightsUiType,
  ): WritableSignal<CareerHighlightCardState> {
    return this.cardSignals[type];
  }

  private markInitialLoadReady(initialLoad: boolean): void {
    if (!initialLoad || this.footerMarkedReady) {
      return;
    }

    this.footerMarkedReady = true;
    this.footerVisibilityService.markReady(this.footerVisibilityCycle);
  }
}
