import { isPlatformBrowser } from '@angular/common';
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
import { TranslateModule } from '@ngx-translate/core';

import { ApiService, EntryDraftTeamGroup } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { TableCardComponent } from '@shared/table-card/table-card.component';
import { TableCardRow } from '@shared/table-card/table-card.types';

import {
  DRAFT_STATISTICS_CARD_IDS,
  DraftStatisticsCardId,
} from './draft-statistics.constants';

const PAGE_SIZE = 10;
const draftStatisticNumberFormatter = new Intl.NumberFormat('fi-FI', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
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

type RankedTableCardRow = TableCardRow & {
  readonly rawValue: number;
};

type DraftStatisticsCard = {
  readonly id: DraftStatisticsCardId;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly valueColumnLabelKey: string;
  readonly allRows: readonly RankedTableCardRow[];
  readonly rows: readonly TableCardRow[];
  readonly skip: number;
  readonly total: number;
};

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
  imports: [TableCardComponent, TranslateModule],
  templateUrl: './draft-statistics.component.html',
  styleUrl: './draft-statistics.component.scss',
})
export class DraftStatisticsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly footerVisibilityService = inject(FooterVisibilityService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly pageSize = PAGE_SIZE;

  cards: DraftStatisticsCard[] = this.createInitialCards();
  loading = true;
  apiError = false;
  private footerVisibilityCycle = 0;

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
          this.cards = this.buildCards(groups);
          this.loading = false;
          this.changeDetectorRef.markForCheck();
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
        error: () => {
          this.cards = this.createInitialCards();
          this.apiError = true;
          this.loading = false;
          this.changeDetectorRef.markForCheck();
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
      });
  }

  loadPreviousPage(cardId: DraftStatisticsCardId): void {
    this.updateCardPage(cardId, -PAGE_SIZE);
  }

  loadNextPage(cardId: DraftStatisticsCardId): void {
    this.updateCardPage(cardId, PAGE_SIZE);
  }

  private createInitialCards(): DraftStatisticsCard[] {
    return draftStatisticDefinitions.map((definition) => ({
      id: definition.id,
      titleKey: definition.titleKey,
      descriptionKey: definition.descriptionKey,
      valueColumnLabelKey: definition.valueColumnLabelKey,
      allRows: [],
      rows: [],
      skip: 0,
      total: 0,
    }));
  }

  private buildCards(groups: EntryDraftTeamGroup[]): DraftStatisticsCard[] {
    return draftStatisticDefinitions.map((definition) => {
      const allRows = groups
        .map((group) => this.buildRow(group, definition))
        .filter((row): row is RankedTableCardRow => row !== null)
        .sort((left, right) => this.compareRows(left, right, definition.direction));

      return {
        id: definition.id,
        titleKey: definition.titleKey,
        descriptionKey: definition.descriptionKey,
        valueColumnLabelKey: definition.valueColumnLabelKey,
        allRows,
        rows: allRows.slice(0, PAGE_SIZE),
        skip: 0,
        total: allRows.length,
      };
    });
  }

  private buildRow(
    group: EntryDraftTeamGroup,
    definition: DraftStatisticDefinition,
  ): RankedTableCardRow | null {
    const rawValue = definition.valueFor(group);

    if (rawValue === null) {
      return null;
    }

    return {
      key: `${definition.id}:${group.team.id}`,
      primaryText: group.team.name,
      value: definition.formatValue ? definition.formatValue(rawValue) : rawValue,
      rawValue,
    };
  }

  private compareRows(
    left: RankedTableCardRow,
    right: RankedTableCardRow,
    direction: SortDirection,
  ): number {
    const valueDifference = direction === 'asc'
      ? left.rawValue - right.rawValue
      : right.rawValue - left.rawValue;

    if (valueDifference !== 0) {
      return valueDifference;
    }

    return left.primaryText.localeCompare(right.primaryText, 'fi');
  }

  private updateCardPage(cardId: DraftStatisticsCardId, offset: number): void {
    this.cards = this.cards.map((card) => {
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
        rows: card.allRows.slice(nextSkip, nextSkip + PAGE_SIZE),
      };
    });
    this.changeDetectorRef.markForCheck();
  }
}
