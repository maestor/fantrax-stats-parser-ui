import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ApiService, EntryDraftTeamGroup } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { SettingsService } from '@services/settings.service';
import { SectionJumpNavComponent } from '@shared/section-jump-nav/section-jump-nav.component';
import { TableCardComponent } from '@shared/table-card/table-card.component';
import { TableCardRow } from '@shared/table-card/table-card.types';
import { deriveTiedRanks, formatTiedRankLabel } from '@shared/utils/rank.utils';

import {
  DRAFT_STATISTICS_CARD_IDS,
  DraftStatisticsCardId,
  DRAFT_STATISTICS_SECTIONS,
  DraftStatisticsSectionId,
} from './draft-statistics.constants';

const PAGE_SIZE = 10;
const draftStatisticNumberFormatter = new Intl.NumberFormat('fi-FI', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const draftStatisticPercentFormatter = new Intl.NumberFormat('fi-FI', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

type SortDirection = 'asc' | 'desc';

type DraftStatisticDefinition = {
  readonly id: DraftStatisticsCardId;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly valueColumnLabelKey: string;
  readonly direction: SortDirection;
  readonly valueFor: (group: EntryDraftTeamGroup) => number | null;
  readonly formatValue?: (value: number) => number | string;
};

type DraftStatisticSourceRow = {
  readonly key: string;
  readonly teamId: string;
  readonly teamName: string;
  readonly value: number | string;
  readonly rawValue: number;
  readonly displayRank: number;
  readonly tieRank: boolean;
};

type DraftStatisticsCard = {
  readonly id: DraftStatisticsCardId;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly valueColumnLabelKey: string;
  readonly allRows: readonly DraftStatisticSourceRow[];
  readonly rows: readonly TableCardRow[];
  readonly skip: number;
  readonly total: number;
};

type DraftStatisticsSection = {
  readonly id: DraftStatisticsSectionId;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly anchorId: string;
  readonly headingId: string;
  readonly cards: readonly DraftStatisticsCard[];
};

const draftStatisticsSectionDefinitions = DRAFT_STATISTICS_SECTIONS.map((section) => ({
  ...section,
  anchorId: `draft-statistics-section-${section.id}`,
  headingId: `draft-statistics-section-${section.id}-heading`,
}));

const draftStatisticDefinitionsById: Record<
  DraftStatisticsCardId,
  Omit<DraftStatisticDefinition, 'id'>
> = {
  'total-picks': {
    titleKey: 'draft.statistics.cards.totalPicks.title',
    descriptionKey: 'draft.statistics.cards.totalPicks.description',
    valueColumnLabelKey: 'draft.statistics.columns.pickCount',
    direction: 'desc',
    valueFor: (group) => group.summary.amounts.total,
  },
  'own-picks': {
    titleKey: 'draft.statistics.cards.ownPicks.title',
    descriptionKey: 'draft.statistics.cards.ownPicks.description',
    valueColumnLabelKey: 'draft.statistics.columns.pickCount',
    direction: 'desc',
    valueFor: (group) => group.summary.amounts.ownPicks,
  },
  'traded-picks': {
    titleKey: 'draft.statistics.cards.tradedPicks.title',
    descriptionKey: 'draft.statistics.cards.tradedPicks.description',
    valueColumnLabelKey: 'draft.statistics.columns.pickCount',
    direction: 'desc',
    valueFor: (group) => group.summary.amounts.tradedPicks,
  },
  'players-per-draft': {
    titleKey: 'draft.statistics.cards.playersPerDraft.title',
    descriptionKey: 'draft.statistics.cards.playersPerDraft.description',
    valueColumnLabelKey: 'draft.statistics.columns.average',
    direction: 'desc',
    valueFor: (group) => group.summary.amounts.playersPerDraftAverage,
    formatValue: (value) => draftStatisticNumberFormatter.format(value),
  },
  'average-position': {
    titleKey: 'draft.statistics.cards.averagePosition.title',
    descriptionKey: 'draft.statistics.cards.averagePosition.description',
    valueColumnLabelKey: 'draft.statistics.columns.turn',
    direction: 'asc',
    valueFor: (group) => group.summary.averageDraftPosition,
    formatValue: (value) => draftStatisticNumberFormatter.format(value),
  },
  'played-in-league': {
    titleKey: 'draft.statistics.cards.playedInLeague.title',
    descriptionKey: 'draft.statistics.cards.playedInLeague.description',
    valueColumnLabelKey: 'draft.statistics.columns.players',
    direction: 'desc',
    valueFor: (group) => group.summary.amounts.playedInLeague,
  },
  'played-in-league-percent': {
    titleKey: 'draft.statistics.cards.playedInLeaguePercent.title',
    descriptionKey: 'draft.statistics.cards.playedInLeaguePercent.description',
    valueColumnLabelKey: 'draft.statistics.columns.share',
    direction: 'desc',
    valueFor: (group) => group.summary.amounts.playedInLeaguePercent,
    formatValue: (value) => draftStatisticPercentFormatter.format(value),
  },
  'played-for-drafting-team-percent': {
    titleKey: 'draft.statistics.cards.playedForDraftingTeamPercent.title',
    descriptionKey: 'draft.statistics.cards.playedForDraftingTeamPercent.description',
    valueColumnLabelKey: 'draft.statistics.columns.share',
    direction: 'desc',
    valueFor: (group) => group.summary.amounts.playedForDraftingTeamPercent,
    formatValue: (value) => draftStatisticPercentFormatter.format(value),
  },
  'round-1': {
    titleKey: 'draft.statistics.cards.roundOne.title',
    descriptionKey: 'draft.statistics.cards.roundOne.description',
    valueColumnLabelKey: 'draft.statistics.columns.pickCount',
    direction: 'desc',
    valueFor: (group) => group.summary.rounds.first,
  },
  'round-2': {
    titleKey: 'draft.statistics.cards.roundTwo.title',
    descriptionKey: 'draft.statistics.cards.roundTwo.description',
    valueColumnLabelKey: 'draft.statistics.columns.pickCount',
    direction: 'desc',
    valueFor: (group) => group.summary.rounds.second,
  },
  'round-3': {
    titleKey: 'draft.statistics.cards.roundThree.title',
    descriptionKey: 'draft.statistics.cards.roundThree.description',
    valueColumnLabelKey: 'draft.statistics.columns.pickCount',
    direction: 'desc',
    valueFor: (group) => group.summary.rounds.third,
  },
  'round-4': {
    titleKey: 'draft.statistics.cards.roundFour.title',
    descriptionKey: 'draft.statistics.cards.roundFour.description',
    valueColumnLabelKey: 'draft.statistics.columns.pickCount',
    direction: 'desc',
    valueFor: (group) => group.summary.rounds.fourth,
  },
  'round-5': {
    titleKey: 'draft.statistics.cards.roundFive.title',
    descriptionKey: 'draft.statistics.cards.roundFive.description',
    valueColumnLabelKey: 'draft.statistics.columns.pickCount',
    direction: 'desc',
    valueFor: (group) => group.summary.rounds.fifth,
  },
};

const draftStatisticDefinitions: readonly DraftStatisticDefinition[] = DRAFT_STATISTICS_CARD_IDS.map((id) => ({
  id,
  ...draftStatisticDefinitionsById[id],
}));

@Component({
  selector: 'app-draft-statistics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionJumpNavComponent, TableCardComponent, TranslateModule],
  templateUrl: './draft-statistics.component.html',
  styleUrl: './draft-statistics.component.scss',
})
export class DraftStatisticsComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly apiService = inject(ApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly footerVisibilityService = inject(FooterVisibilityService);
  private readonly settingsService = inject(SettingsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly translate = inject(TranslateService);
  private readonly draftGroups = signal<EntryDraftTeamGroup[]>([]);
  private readonly selectedTeamId = this.settingsService.selectedTeamIdSignal;
  private readonly disableDraftSelectedTeamHighlight =
    this.settingsService.disableDraftSelectedTeamHighlightSignal;

  readonly pageSize = PAGE_SIZE;
  readonly sectionLinks = draftStatisticsSectionDefinitions;
  readonly jumpNavItems = draftStatisticsSectionDefinitions.map((section) => ({
    id: section.anchorId,
    labelKey: section.titleKey,
  }));

  sections: DraftStatisticsSection[] = this.createInitialSections();
  loading = true;
  apiError = false;
  highlightedTeamId: string | null = null;
  private footerVisibilityCycle = 0;

  constructor() {
    effect(() => {
      const groups = this.draftGroups();
      const selectedTeamId = this.selectedTeamId();
      const disableDraftSelectedTeamHighlight = this.disableDraftSelectedTeamHighlight();
      const highlightedTeamId = this.getEffectiveHighlightedTeamId(
        groups,
        selectedTeamId,
        disableDraftSelectedTeamHighlight,
      );

      this.highlightedTeamId = highlightedTeamId;
      this.sections = groups.length === 0
        ? this.createInitialSections()
        : this.buildSections(groups, highlightedTeamId);
      this.changeDetectorRef.markForCheck();
    });
  }

  get cards(): DraftStatisticsCard[] {
    return this.sections.flatMap((section) => [...section.cards]);
  }

  ngOnInit(): void {
    this.footerVisibilityCycle = this.footerVisibilityService.currentCycle();
    this.loading = true;
    this.apiError = false;

    if (!isPlatformBrowser(this.platformId)) {
      this.footerVisibilityService.markReady(this.footerVisibilityCycle);
      return;
    }

    this.apiService.getEntryDrafts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => {
          this.draftGroups.set(groups);
          this.loading = false;
          this.changeDetectorRef.markForCheck();
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
        error: () => {
          this.draftGroups.set([]);
          this.apiError = true;
          this.loading = false;
          this.changeDetectorRef.markForCheck();
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
      });
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

  loadPreviousPage(cardId: DraftStatisticsCardId): void {
    this.updateCardPage(cardId, -PAGE_SIZE);
  }

  loadNextPage(cardId: DraftStatisticsCardId): void {
    this.updateCardPage(cardId, PAGE_SIZE);
  }

  private createInitialSections(): DraftStatisticsSection[] {
    return draftStatisticsSectionDefinitions.map((section) => ({
      ...section,
      cards: section.cardIds.map((cardId) => this.createInitialCard(cardId)),
    }));
  }

  private createInitialCard(cardId: DraftStatisticsCardId): DraftStatisticsCard {
    const definition = draftStatisticDefinitionsById[cardId];

    return {
      id: cardId,
      titleKey: definition.titleKey,
      descriptionKey: definition.descriptionKey,
      valueColumnLabelKey: definition.valueColumnLabelKey,
      allRows: [],
      rows: [],
      skip: 0,
      total: 0,
    };
  }

  private buildSections(
    groups: EntryDraftTeamGroup[],
    highlightedTeamId: string | null,
  ): DraftStatisticsSection[] {
    const cardsById = Object.fromEntries(
      draftStatisticDefinitions.map((definition) => [
        definition.id,
        this.buildCard(groups, definition, highlightedTeamId),
      ]),
    ) as Record<DraftStatisticsCardId, DraftStatisticsCard>;

    return draftStatisticsSectionDefinitions.map((section) => ({
      ...section,
      cards: section.cardIds.map((cardId) => cardsById[cardId]),
    }));
  }

  private buildCard(
    groups: EntryDraftTeamGroup[],
    definition: DraftStatisticDefinition,
    highlightedTeamId: string | null,
  ): DraftStatisticsCard {
    const allRows = deriveTiedRanks(
      groups
      .map((group) => this.buildSourceRow(group, definition))
      .filter((row): row is DraftStatisticSourceRow => row !== null)
      .sort((left, right) => this.compareRows(left, right, definition.direction)),
      (left, right) => left.rawValue === right.rawValue,
    );
    const initialSkip = highlightedTeamId === null
      ? 0
      : this.getTeamPageSkip(allRows, highlightedTeamId);

    return {
      id: definition.id,
      titleKey: definition.titleKey,
      descriptionKey: definition.descriptionKey,
      valueColumnLabelKey: definition.valueColumnLabelKey,
      allRows,
      rows: this.buildVisibleRows(allRows, initialSkip, highlightedTeamId),
      skip: initialSkip,
      total: allRows.length,
    };
  }

  private buildSourceRow(
    group: EntryDraftTeamGroup,
    definition: DraftStatisticDefinition,
  ): DraftStatisticSourceRow | null {
    const rawValue = definition.valueFor(group);

    if (rawValue === null) {
      return null;
    }

    return {
      key: `${definition.id}:${group.team.id}`,
      teamId: group.team.id,
      teamName: group.team.name,
      value: definition.formatValue ? definition.formatValue(rawValue) : rawValue,
      rawValue,
      displayRank: 0,
      tieRank: false,
    };
  }

  private buildVisibleRows(
    allRows: readonly DraftStatisticSourceRow[],
    skip: number,
    highlightedTeamId: string | null,
  ): TableCardRow[] {
    return allRows
      .slice(skip, skip + PAGE_SIZE)
      .map((row) => ({
        key: row.key,
        rank: this.buildRankLabel(row.displayRank, row.tieRank),
        primaryText: row.teamName,
        value: row.value,
        emphasized: row.teamId === highlightedTeamId,
      }));
  }

  private compareRows(
    left: DraftStatisticSourceRow,
    right: DraftStatisticSourceRow,
    direction: SortDirection,
  ): number {
    const valueDifference = direction === 'asc'
      ? left.rawValue - right.rawValue
      : right.rawValue - left.rawValue;

    if (valueDifference !== 0) {
      return valueDifference;
    }

    return left.teamName.localeCompare(right.teamName, 'fi');
  }

  private getTeamPageSkip(
    allRows: readonly DraftStatisticSourceRow[],
    teamId: string,
  ): number {
    const teamIndex = allRows.findIndex((row) => row.teamId === teamId);

    if (teamIndex < 0) {
      return 0;
    }

    return Math.floor(teamIndex / PAGE_SIZE) * PAGE_SIZE;
  }

  private updateCardPage(cardId: DraftStatisticsCardId, offset: number): void {
    this.sections = this.sections.map((section) => ({
      ...section,
      cards: section.cards.map((card) => {
        if (card.id !== cardId) {
          return card;
        }

        const maxSkip = card.total <= PAGE_SIZE
          ? 0
          : Math.floor((card.total - 1) / PAGE_SIZE) * PAGE_SIZE;
        const nextSkip = Math.min(Math.max(card.skip + offset, 0), maxSkip);

        return {
          ...card,
          skip: nextSkip,
          rows: this.buildVisibleRows(card.allRows, nextSkip, this.highlightedTeamId),
        };
      }),
    }));
    this.changeDetectorRef.markForCheck();
  }

  private getEffectiveHighlightedTeamId(
    groups: readonly EntryDraftTeamGroup[],
    selectedTeamId: string,
    disableDraftSelectedTeamHighlight: boolean,
  ): string | null {
    if (disableDraftSelectedTeamHighlight) {
      return null;
    }

    return groups.some((group) => group.team.id === selectedTeamId) ? selectedTeamId : null;
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
}
