import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, WritableSignal, inject, signal } from '@angular/core';
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

import { CareerHighlightCardState } from './career-highlights.types';

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

  readonly mostTeamsPlayedState = signal(
    createInitialCardState(MOST_TEAMS_PLAYED_CONFIG),
  );
  readonly sameTeamSeasonsPlayedState = signal(
    createInitialCardState(SAME_TEAM_SEASONS_PLAYED_CONFIG),
  );

  private footerVisibilityCycle = 0;
  private pendingInitialLoads = 0;

  ngOnInit(): void {
    this.footerVisibilityCycle = this.footerVisibilityService.currentCycle();
    this.pendingInitialLoads = 2;

    this.loadCard(MOST_TEAMS_PLAYED_CONFIG.type, 0, true);
    this.loadCard(SAME_TEAM_SEASONS_PLAYED_CONFIG.type, 0, true);
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
    return type === MOST_TEAMS_PLAYED_CONFIG.type
      ? this.mostTeamsPlayedState
      : this.sameTeamSeasonsPlayedState;
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
