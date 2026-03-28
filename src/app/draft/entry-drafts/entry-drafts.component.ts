import { DecimalPipe, PercentPipe, isPlatformBrowser } from '@angular/common';
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
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { ApiService, DraftPick, DraftTeamRef, EntryDraftTeamGroup } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import {
  DRAFT_FOCUS_PAGE_STEP,
  focusDraftElement,
  getDraftFocusTargets,
  getDraftPanelHeader,
  scrollDraftElementToTop,
} from '../draft-keyboard-navigation.utils';

type DraftPickStatus = {
  readonly emoji: '🟢' | '🟡';
  readonly tooltipKey:
    | 'draft.entryDrafts.playedForDraftingTeamTooltip'
    | 'draft.entryDrafts.playedInLeagueTooltip';
};

@Component({
  selector: 'app-entry-drafts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, PercentPipe, MatExpansionModule, MatListModule, MatTooltipModule, TranslateModule],
  templateUrl: './entry-drafts.component.html',
  styleUrl: './entry-drafts.component.scss',
})
export class EntryDraftsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly footerVisibilityService = inject(FooterVisibilityService);
  private readonly platformId = inject(PLATFORM_ID);

  groups: EntryDraftTeamGroup[] = [];
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
          this.groups = this.normalizeGroups(groups);
          this.loading = false;
          this.changeDetectorRef.markForCheck();
          this.footerVisibilityService.markReady(this.footerVisibilityCycle);
        },
        error: () => {
          this.groups = [];
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

  onHeaderKeydown(event: KeyboardEvent): void {
    const header = event.currentTarget as HTMLElement | null;
    if (!header) {
      return;
    }

    if (event.key === 'Escape') {
      const expandedHeader = this.getExpandedHeaderForEscape(header);
      if (!expandedHeader) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      expandedHeader.click();
      window.setTimeout(() => header.focus({ preventScroll: true }), 0);
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && header.getAttribute('aria-expanded') !== 'true') {
      this.scheduleHeaderAlignment(header);
      return;
    }

    if (event.key !== 'ArrowDown') {
      return;
    }

    if (header.getAttribute('aria-expanded') !== 'true') {
      return;
    }

    const panel = header.closest('mat-expansion-panel');
    if (!panel) {
      return;
    }

    const [firstTarget] = getDraftFocusTargets(panel);
    if (!firstTarget) {
      return;
    }

    event.preventDefault();
    focusDraftElement(firstTarget);
  }

  onHeaderClick(event: MouseEvent): void {
    const header = event.currentTarget as HTMLElement | null;
    if (!header) {
      return;
    }

    this.scheduleHeaderAlignment(header);
  }

  onContentTargetKeydown(event: KeyboardEvent, panel: MatExpansionPanel): void {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }

    const panelElement = target.closest('mat-expansion-panel');
    if (!panelElement) {
      return;
    }

    const focusTargets = getDraftFocusTargets(panelElement);
    const currentIndex = focusTargets.indexOf(target);
    if (currentIndex === -1) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        event.stopPropagation();
        this.focusTargetByIndex(focusTargets, Math.min(currentIndex + 1, focusTargets.length - 1));
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        event.stopPropagation();
        if (currentIndex === 0) {
          focusDraftElement(getDraftPanelHeader(panelElement));
          return;
        }

        this.focusTargetByIndex(focusTargets, currentIndex - 1);
        break;
      }
      case 'Home': {
        event.preventDefault();
        event.stopPropagation();
        this.focusTargetByIndex(focusTargets, 0);
        break;
      }
      case 'End': {
        event.preventDefault();
        event.stopPropagation();
        this.focusTargetByIndex(focusTargets, focusTargets.length - 1);
        break;
      }
      case 'PageDown': {
        event.preventDefault();
        event.stopPropagation();
        this.focusTargetByIndex(
          focusTargets,
          Math.min(currentIndex + DRAFT_FOCUS_PAGE_STEP, focusTargets.length - 1),
        );
        break;
      }
      case 'PageUp': {
        event.preventDefault();
        event.stopPropagation();
        this.focusTargetByIndex(
          focusTargets,
          Math.max(currentIndex - DRAFT_FOCUS_PAGE_STEP, 0),
        );
        break;
      }
      case 'Escape': {
        event.preventDefault();
        event.stopPropagation();
        focusDraftElement(getDraftPanelHeader(panelElement));
        panel.close();
        break;
      }
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

  private focusTargetByIndex(focusTargets: readonly HTMLElement[], index: number): void {
    focusDraftElement(focusTargets[index] ?? null);
  }

  private getExpandedHeaderForEscape(currentHeader: HTMLElement): HTMLElement | null {
    if (currentHeader.getAttribute('aria-expanded') === 'true') {
      return currentHeader;
    }

    const accordion = currentHeader.closest('mat-accordion');
    return accordion?.querySelector('.mat-expansion-panel-header[aria-expanded="true"]') as HTMLElement | null;
  }

  private scheduleHeaderAlignment(header: HTMLElement): void {
    const alignHeader = () => {
      if (header.getAttribute('aria-expanded') === 'true') {
        scrollDraftElementToTop(header);
      }
    };

    window.setTimeout(alignHeader, 0);
    window.setTimeout(alignHeader, 250);
  }
}
