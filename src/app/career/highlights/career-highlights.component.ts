import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ApiService,
  CareerHighlightPage,
  CareerRegularGrinderHighlightPage,
  CareerReunionHighlightPage,
  CareerSameTeamHighlightPage,
  CareerStashHighlightPage,
  CareerStanleyCupHighlightPage,
  CareerTeamCountHighlightPage,
  CareerTransactionHighlightPage,
} from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { SectionJumpNavComponent } from '@shared/section-jump-nav/section-jump-nav.component';
import { TableCardComponent } from '@shared/table-card/table-card.component';
import { TableCardRow } from '@shared/table-card/table-card.types';
import { deriveTiedRanks, formatTiedRankLabel } from '@shared/utils/rank.utils';
import { formatPlayoffYear } from '@shared/utils/season.utils';

import { ActivateOnViewportDirective } from './activate-on-viewport.directive';
import {
  CAREER_HIGHLIGHT_SECTIONS,
  CareerHighlightSectionId,
  CareerHighlightsUiType,
} from './career-highlights.constants';
import { formatReunionDetailLines } from './career-highlights.utils';
import {
  CareerHighlightCardState,
  CareerHighlightSectionView,
  HighlightDescriptionParams,
} from './career-highlights.types';

const PAGE_SIZE = 10;

type HighlightCardConfig = Pick<
  CareerHighlightCardState,
  | 'titleKey'
  | 'descriptionKey'
  | 'descriptionRequiresParams'
  | 'valueColumnLabelKey'
  | 'valueColumnTooltipKey'
> & {
  readonly sectionId: CareerHighlightSectionId;
  readonly type: CareerHighlightsUiType;
};

const careerHighlightSectionDefinitions = CAREER_HIGHLIGHT_SECTIONS.map((section) => ({
  ...section,
  anchorId: `career-highlights-section-${section.id}`,
  headingId: `career-highlights-section-${section.id}-heading`,
}));

const MOST_TEAMS_PLAYED_CONFIG: HighlightCardConfig = {
  sectionId: 'journeys',
  type: 'most-teams-played',
  titleKey: 'career.highlights.cards.mostTeamsPlayed.title',
  descriptionKey: 'career.highlights.cards.mostTeamsPlayed.description',
  descriptionRequiresParams: true,
  valueColumnLabelKey: 'career.highlights.columns.teamCount',
};

const SAME_TEAM_SEASONS_PLAYED_CONFIG: HighlightCardConfig = {
  sectionId: 'long-stays',
  type: 'same-team-seasons-played',
  titleKey: 'career.highlights.cards.sameTeamSeasonsPlayed.title',
  descriptionKey: 'career.highlights.cards.sameTeamSeasonsPlayed.description',
  descriptionRequiresParams: true,
  valueColumnLabelKey: 'career.highlights.columns.seasonCount',
};

const MOST_TEAMS_OWNED_CONFIG: HighlightCardConfig = {
  sectionId: 'journeys',
  type: 'most-teams-owned',
  titleKey: 'career.highlights.cards.mostTeamsOwned.title',
  descriptionKey: 'career.highlights.cards.mostTeamsOwned.description',
  descriptionRequiresParams: true,
  valueColumnLabelKey: 'career.highlights.columns.teamCount',
};

const MOST_STANLEY_CUPS_CONFIG: HighlightCardConfig = {
  sectionId: 'achievements',
  type: 'most-stanley-cups',
  titleKey: 'career.highlights.cards.mostStanleyCups.title',
  descriptionKey: 'career.highlights.cards.mostStanleyCups.description',
  descriptionRequiresParams: true,
  valueColumnLabelKey: '💍',
  valueColumnTooltipKey: 'career.highlights.columnHelp.cups',
};

const REGULAR_GRINDER_WITHOUT_PLAYOFFS_CONFIG: HighlightCardConfig = {
  sectionId: 'achievements',
  type: 'regular-grinder-without-playoffs',
  titleKey: 'career.highlights.cards.regularGrinderWithoutPlayoffs.title',
  descriptionKey:
    'career.highlights.cards.regularGrinderWithoutPlayoffs.description',
  descriptionRequiresParams: false,
  valueColumnLabelKey: 'career.highlights.columns.games',
};

const SAME_TEAM_SEASONS_OWNED_CONFIG: HighlightCardConfig = {
  sectionId: 'long-stays',
  type: 'same-team-seasons-owned',
  titleKey: 'career.highlights.cards.sameTeamSeasonsOwned.title',
  descriptionKey: 'career.highlights.cards.sameTeamSeasonsOwned.description',
  descriptionRequiresParams: true,
  valueColumnLabelKey: 'career.highlights.columns.seasonCount',
};

const REUNION_KING_CONFIG: HighlightCardConfig = {
  sectionId: 'transactions',
  type: 'reunion-king',
  titleKey: 'career.highlights.cards.reunionKing.title',
  descriptionKey: 'career.highlights.cards.reunionKing.description',
  descriptionRequiresParams: true,
  valueColumnLabelKey: '♻️',
  valueColumnTooltipKey: 'career.highlights.columnHelp.reunions',
};

const STASH_KING_CONFIG: HighlightCardConfig = {
  sectionId: 'long-stays',
  type: 'stash-king',
  titleKey: 'career.highlights.cards.stashKing.title',
  descriptionKey: 'career.highlights.cards.stashKing.description',
  descriptionRequiresParams: true,
  valueColumnLabelKey: 'career.highlights.columns.seasonCount',
};

const MOST_TRADES_CONFIG: HighlightCardConfig = {
  sectionId: 'transactions',
  type: 'most-trades',
  titleKey: 'career.highlights.cards.mostTrades.title',
  descriptionKey: 'career.highlights.cards.mostTrades.description',
  descriptionRequiresParams: true,
  valueColumnLabelKey: '🤝',
  valueColumnTooltipKey: 'career.highlights.columnHelp.trades',
};

const MOST_CLAIMS_CONFIG: HighlightCardConfig = {
  sectionId: 'transactions',
  type: 'most-claims',
  titleKey: 'career.highlights.cards.mostClaims.title',
  descriptionKey: 'career.highlights.cards.mostClaims.description',
  descriptionRequiresParams: true,
  valueColumnLabelKey: '✅',
  valueColumnTooltipKey: 'career.highlights.columnHelp.claims',
};

const MOST_DROPS_CONFIG: HighlightCardConfig = {
  sectionId: 'transactions',
  type: 'most-drops',
  titleKey: 'career.highlights.cards.mostDrops.title',
  descriptionKey: 'career.highlights.cards.mostDrops.description',
  descriptionRequiresParams: true,
  valueColumnLabelKey: '❌',
  valueColumnTooltipKey: 'career.highlights.columnHelp.drops',
};

function createInitialCardState(
  config: HighlightCardConfig,
): CareerHighlightCardState {
  return {
    titleKey: config.titleKey,
    descriptionKey: config.descriptionKey,
    descriptionRequiresParams: config.descriptionRequiresParams,
    valueColumnLabelKey: config.valueColumnLabelKey,
    valueColumnTooltipKey: config.valueColumnTooltipKey,
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
    SectionJumpNavComponent,
    TableCardComponent,
    TranslateModule,
  ],
  templateUrl: './career-highlights.component.html',
  styleUrl: './career-highlights.component.scss',
})
export class CareerHighlightsComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly apiService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly footerVisibilityService = inject(FooterVisibilityService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly translate = inject(TranslateService);

  readonly sectionLinks = careerHighlightSectionDefinitions;
  readonly jumpNavItems = careerHighlightSectionDefinitions.map((section) => ({
    id: section.anchorId,
    labelKey: section.titleKey,
  }));

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
      'reunion-king': signal(createInitialCardState(REUNION_KING_CONFIG)),
      'stash-king': signal(createInitialCardState(STASH_KING_CONFIG)),
      'most-trades': signal(createInitialCardState(MOST_TRADES_CONFIG)),
      'most-claims': signal(createInitialCardState(MOST_CLAIMS_CONFIG)),
      'most-drops': signal(createInitialCardState(MOST_DROPS_CONFIG)),
    };

  readonly sections = computed<readonly CareerHighlightSectionView[]>(() =>
    careerHighlightSectionDefinitions.map((section) => ({
      ...section,
      cards: section.cardTypes.map((type) => ({
        type,
        state: this.cardSignals[type](),
      })),
    })),
  );

  private footerVisibilityCycle = 0;
  private footerMarkedReady = false;

  ngOnInit(): void {
    this.footerVisibilityCycle = this.footerVisibilityService.currentCycle();
  }

  scrollToSection(anchorId: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const sectionElement = this.document.getElementById(anchorId);
    if (!sectionElement) {
      return;
    }

    const location = this.document.defaultView?.location;
    if (location) {
      const nextUrl = `${location.pathname}${location.search}#${anchorId}`;
      this.document.defaultView?.history.replaceState(null, '', nextUrl);
    }

    sectionElement.scrollIntoView({
      block: 'start',
      inline: 'nearest',
      behavior: 'smooth',
    });
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
    const pageSize = cardSignal().take;
    const requestTake = targetSkip + pageSize + 1;

    cardSignal.update((current) => ({
      ...current,
      loading: true,
      apiError: false,
    }));

    this.apiService
      .getCareerHighlights(type, 0, requestTake)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          cardSignal.update((current) => ({
            ...current,
            rows: this.normalizeRows(page, targetSkip, pageSize),
            descriptionParams: this.descriptionParamsFor(page),
            loading: false,
            apiError: false,
            skip: targetSkip,
            take: pageSize,
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

  private normalizeRows(
    page: CareerHighlightPage,
    visibleSkip: number,
    visibleTake: number,
  ): TableCardRow[] {
    if (this.isTeamCountPage(page)) {
      return this.sliceVisibleRows(
        deriveTiedRanks(page.items, (left, right) => left.teamCount === right.teamCount),
        visibleSkip,
        visibleTake,
      ).map((item) => ({
        key: `${item.id}:${item.teams.map((team) => team.id).join(',')}`,
        rank: this.buildRankLabel(item.displayRank, item.tieRank),
        primaryText: this.buildPrimaryText(item.name, item.position),
        value: item.teamCount,
        detailLines: item.teams.map((team) => team.name),
        detailLabel: item.name,
      }));
    }

    if (this.isSameTeamPage(page)) {
      return this.sliceVisibleRows(
        deriveTiedRanks(page.items, (left, right) => left.seasonCount === right.seasonCount),
        visibleSkip,
        visibleTake,
      ).map((item) => ({
        key: `${item.id}:${item.team.id}`,
        rank: this.buildRankLabel(item.displayRank, item.tieRank),
        primaryText: this.buildPrimaryText(item.name, item.position),
        value: item.seasonCount,
        detailLines: [item.team.name],
        detailLabel: item.name,
      }));
    }

    if (this.isStanleyCupPage(page)) {
      return this.sliceVisibleRows(
        deriveTiedRanks(page.items, (left, right) => left.cupCount === right.cupCount),
        visibleSkip,
        visibleTake,
      ).map((item) => ({
        key: item.id,
        rank: this.buildRankLabel(item.displayRank, item.tieRank),
        primaryText: this.buildPrimaryText(item.name, item.position),
        value: item.cupCount,
        detailLines: item.cups.map(
          (cup) => `${formatPlayoffYear(cup.season)} ${cup.team.name}`,
        ),
        detailLabel: item.name,
      }));
    }

    if (this.isReunionPage(page)) {
      return this.sliceVisibleRows(
        deriveTiedRanks(page.items, (left, right) => left.reunionCount === right.reunionCount),
        visibleSkip,
        visibleTake,
      ).map((item) => ({
        key: `${item.id}:${item.team.id}`,
        rank: this.buildRankLabel(item.displayRank, item.tieRank),
        primaryText: this.buildPrimaryText(item.name, item.position),
        value: item.reunionCount,
        detailHeader: item.team.name,
        detailLines: formatReunionDetailLines(
          item.reunions,
          {
            claim: this.translate.instant('career.highlights.reunionTypes.claim'),
            trade: this.translate.instant('career.highlights.reunionTypes.trade'),
          },
          this.translate.currentLang || this.translate.getFallbackLang() || 'fi',
        ),
        detailLabel: item.name,
        detailTooltipClass: 'table-card-tooltip--with-header',
      }));
    }

    if (this.isRegularGrinderPage(page)) {
      return this.sliceVisibleRows(
        deriveTiedRanks(page.items, (left, right) => left.regularGames === right.regularGames),
        visibleSkip,
        visibleTake,
      ).map((item) => ({
        key: item.id,
        rank: this.buildRankLabel(item.displayRank, item.tieRank),
        primaryText: this.buildPrimaryText(item.name, item.position),
        value: item.regularGames,
        detailLines: item.teams.map((team) => team.name),
        detailLabel: item.name,
      }));
    }

    if (this.isStashPage(page)) {
      return this.sliceVisibleRows(
        deriveTiedRanks(page.items, (left, right) => left.seasonCount === right.seasonCount),
        visibleSkip,
        visibleTake,
      ).map((item) => ({
        key: `${item.id}:${item.team.id}`,
        rank: this.buildRankLabel(item.displayRank, item.tieRank),
        primaryText: this.buildPrimaryText(item.name, item.position),
        value: item.seasonCount,
        detailLines: [item.team.name],
        detailLabel: item.name,
      }));
    }

    if (this.isTransactionPage(page)) {
      return this.sliceVisibleRows(
        deriveTiedRanks(
          page.items,
          (left, right) => left.transactionCount === right.transactionCount,
        ),
        visibleSkip,
        visibleTake,
      ).map((item) => ({
        key: `${page.type}:${item.id}`,
        rank: this.buildRankLabel(item.displayRank, item.tieRank),
        primaryText: this.buildPrimaryText(item.name, item.position),
        value: item.transactionCount,
        detailLines: item.teams.map((team) => `${team.name} ${team.count}`),
        detailLabel: item.name,
      }));
    }

    return [];
  }

  private sliceVisibleRows<T>(
    rows: readonly T[],
    visibleSkip: number,
    visibleTake: number,
  ): readonly T[] {
    return rows.slice(visibleSkip, visibleSkip + visibleTake);
  }

  private buildPrimaryText(name: string, position: string): string {
    return `${position} ${name}`;
  }

  private buildRankLabel(rank: number, tieRank: boolean): TableCardRow['rank'] {
    return {
      text: formatTiedRankLabel(rank, tieRank),
      ariaLabel: this.translate.instant(
        tieRank ? 'tableCard.tiedRankAriaLabel' : 'tableCard.rankAriaLabel',
        { rank },
      ),
    };
  }

  private descriptionParamsFor(
    page: CareerHighlightPage,
  ): HighlightDescriptionParams | undefined {
    return this.isRegularGrinderPage(page)
      ? undefined
      : { minAllowed: page.minAllowed };
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

  private isReunionPage(
    page: CareerHighlightPage,
  ): page is CareerReunionHighlightPage {
    return page.type === 'reunion-king';
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
