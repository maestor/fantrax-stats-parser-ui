import { DecimalPipe, PercentPipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { ApiService, DraftPick, DraftTeamRef, EntryDraftTeamGroup } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { SettingsService } from '@services/settings.service';
import {
  DraftPanelFocusTargetDirective,
  DraftPanelHeaderNavigationDirective,
} from '../draft-panel-navigation.directive';
import { scheduleDraftTeamHeaderAlignment } from '../draft-keyboard-navigation.utils';

type DraftPickStatus = {
  readonly emoji: '🟢' | '🟡';
  readonly tooltipKey:
    | 'draft.entryDrafts.playedForDraftingTeamTooltip'
    | 'draft.entryDrafts.playedInLeagueTooltip';
};

@Component({
  selector: 'app-entry-drafts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    PercentPipe,
    MatExpansionModule,
    MatListModule,
    MatTooltipModule,
    TranslateModule,
    DraftPanelHeaderNavigationDirective,
    DraftPanelFocusTargetDirective,
  ],
  templateUrl: './entry-drafts.component.html',
  styleUrl: './entry-drafts.component.scss',
})
export class EntryDraftsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly footerVisibilityService = inject(FooterVisibilityService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly settingsService = inject(SettingsService);
  private readonly groupsState = signal<EntryDraftTeamGroup[]>([]);
  private readonly selectedTeamId = this.settingsService.selectedTeamIdSignal;
  private readonly disableSelectedTeamHighlight =
    this.settingsService.disableSelectedTeamHighlightSignal;

  groups: EntryDraftTeamGroup[] = [];
  loading = true;
  apiError = false;
  expandedTeamId: string | null = null;
  private footerVisibilityCycle = 0;
  private lastAutoAlignedTeamId: string | null = null;

  constructor() {
    effect(() => {
      const nextExpandedTeamId = this.getDefaultExpandedTeamId(
        this.groupsState(),
        this.selectedTeamId(),
        this.disableSelectedTeamHighlight(),
      );
      this.expandedTeamId = nextExpandedTeamId;

      if (!isPlatformBrowser(this.platformId)) {
        this.changeDetectorRef.markForCheck();
        return;
      }

      if (!nextExpandedTeamId) {
        this.lastAutoAlignedTeamId = null;
      } else if (nextExpandedTeamId !== this.lastAutoAlignedTeamId) {
        scheduleDraftTeamHeaderAlignment(this.elementRef.nativeElement, nextExpandedTeamId, 'auto');
        this.lastAutoAlignedTeamId = nextExpandedTeamId;
      }

      this.changeDetectorRef.markForCheck();
    });
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
          const normalizedGroups = this.normalizeGroups(groups);
          this.groups = normalizedGroups;
          this.groupsState.set(normalizedGroups);
          this.loading = false;
          this.changeDetectorRef.markForCheck();
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
        error: () => {
          this.groups = [];
          this.groupsState.set([]);
          this.expandedTeamId = null;
          this.apiError = true;
          this.loading = false;
          this.changeDetectorRef.markForCheck();
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
      });
  }

  isTradedPick(team: DraftTeamRef, pick: DraftPick): boolean {
    return pick.originalOwner.id !== team.id;
  }

  getPickStatus(pick: DraftPick): DraftPickStatus | null {
    if (pick.draftedPlayer === null) {
      return null;
    }

    if (pick.playedForDraftingTeam) {
      return {
        emoji: '🟢',
        tooltipKey: 'draft.entryDrafts.playedForDraftingTeamTooltip',
      };
    }

    if (pick.playedInLeague) {
      return {
        emoji: '🟡',
        tooltipKey: 'draft.entryDrafts.playedInLeagueTooltip',
      };
    }

    return null;
  }

  onPanelExpandedChange(teamId: string, expanded: boolean): void {
    if (expanded) {
      this.expandedTeamId = teamId;
      return;
    }

    if (this.expandedTeamId === teamId) {
      this.expandedTeamId = null;
    }
  }

  private normalizeGroups(groups: EntryDraftTeamGroup[]): EntryDraftTeamGroup[] {
    return groups.map((group) => ({
      ...group,
      seasons: [...group.seasons]
        .sort((left, right) => right.season - left.season)
        .map((season) => ({
          ...season,
          picks: [...season.picks].sort((left, right) => left.pickNumber - right.pickNumber),
        })),
    }));
  }

  private getDefaultExpandedTeamId(
    groups: readonly EntryDraftTeamGroup[],
    selectedTeamId: string,
    disableSelectedTeamHighlight: boolean,
  ): string | null {
    if (disableSelectedTeamHighlight) {
      return null;
    }

    return groups.some((group) => group.team.id === selectedTeamId) ? selectedTeamId : null;
  }
}
