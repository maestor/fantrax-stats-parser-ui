import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
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

type DraftStatisticsTeamOption = {
  readonly id: string;
  readonly name: string;
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
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    SectionJumpNavComponent,
    TableCardComponent,
    TranslateModule,
  ],
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

  readonly pageSize = PAGE_SIZE;
  readonly sectionLinks = draftStatisticsSectionDefinitions;
  readonly jumpNavItems = draftStatisticsSectionDefinitions.map((section) => ({
    id: section.anchorId,
    labelKey: section.titleKey,
  }));

  sections: DraftStatisticsSection[] = this.createInitialSections();
  teams: DraftStatisticsTeamOption[] = [];
  loading = true;
  apiError = false;
  highlightedTeamId: string | null = null;
  private footerVisibilityCycle = 0;

  get cards(): DraftStatisticsCard[] {
    return this.sections.flatMap((section) => [...section.cards]);
  }

  ngOnInit(): void {
    this.footerVisibilityCycle = this.footerVisibilityService.currentCycle();
    this.loading = true;
    this.apiError = false;
    this.highlightedTeamId = this.settingsService.draftStatisticsHighlightedTeamId;

    if (!isPlatformBrowser(this.platformId)) {
      this.footerVisibilityService.markReady(this.footerVisibilityCycle);
      return;
    }

    this.apiService.getEntryDrafts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => {
          this.teams = this.buildTeamOptions(groups);
          if (this.highlightedTeamId !== null && !this.teams.some((team) => team.id === this.highlightedTeamId)) {
            this.highlightedTeamId = null;
            this.settingsService.setDraftStatisticsHighlightedTeamId(null);
          }
          this.sections = this.buildSections(groups);
          this.loading = false;
          this.changeDetectorRef.markForCheck();
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
        error: () => {
          this.sections = this.createInitialSections();
          this.teams = [];
          this.highlightedTeamId = null;
          this.apiError = true;
          this.loading = false;
          this.changeDetectorRef.markForCheck();
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
      });
  }

  onHighlightedTeamChange(event: MatSelectChange): void {
    const selectedTeamId = typeof event.value === 'string' && event.value.length > 0
      ? event.value
      : null;

    this.highlightedTeamId = selectedTeamId;
    this.settingsService.setDraftStatisticsHighlightedTeamId(selectedTeamId);
    this.sections = this.sections.map((section) => ({
      ...section,
      cards: section.cards.map((card) => {
        const nextSkip = selectedTeamId === null
          ? 0
          : this.getTeamPageSkip(card.allRows, selectedTeamId);

        return {
          ...card,
          skip: nextSkip,
          rows: this.buildVisibleRows(card.allRows, nextSkip),
        };
      }),
    }));
    this.changeDetectorRef.markForCheck();
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

  private buildSections(groups: EntryDraftTeamGroup[]): DraftStatisticsSection[] {
    const cardsById = Object.fromEntries(
      draftStatisticDefinitions.map((definition) => [
        definition.id,
        this.buildCard(groups, definition),
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
  ): DraftStatisticsCard {
    const allRows = deriveTiedRanks(
      groups
      .map((group) => this.buildSourceRow(group, definition))
      .filter((row): row is DraftStatisticSourceRow => row !== null)
      .sort((left, right) => this.compareRows(left, right, definition.direction)),
      (left, right) => left.rawValue === right.rawValue,
    );
    const initialSkip = this.highlightedTeamId === null
      ? 0
      : this.getTeamPageSkip(allRows, this.highlightedTeamId);

    return {
      id: definition.id,
      titleKey: definition.titleKey,
      descriptionKey: definition.descriptionKey,
      valueColumnLabelKey: definition.valueColumnLabelKey,
      allRows,
      rows: this.buildVisibleRows(allRows, initialSkip),
      skip: initialSkip,
      total: allRows.length,
    };
  }

  private buildTeamOptions(groups: EntryDraftTeamGroup[]): DraftStatisticsTeamOption[] {
    return groups
      .map((group) => ({
        id: group.team.id,
        name: group.team.name,
      }))
      .sort((left, right) => left.name.localeCompare(right.name, 'fi'));
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
  ): TableCardRow[] {
    return allRows
      .slice(skip, skip + PAGE_SIZE)
      .map((row) => ({
        key: row.key,
        rank: this.buildRankLabel(row.displayRank, row.tieRank),
        primaryText: row.teamName,
        value: row.value,
        emphasized: row.teamId === this.highlightedTeamId,
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
          rows: this.buildVisibleRows(card.allRows, nextSkip),
        };
      }),
    }));
    this.changeDetectorRef.markForCheck();
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
