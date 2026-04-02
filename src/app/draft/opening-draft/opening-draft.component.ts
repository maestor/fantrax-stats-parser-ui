import { isPlatformBrowser } from '@angular/common';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';

import { ApiService, DraftTeamRef, OpeningDraftPick, OpeningDraftTeamGroup } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { SettingsService } from '@services/settings.service';
import {
  DraftPanelFocusTargetDirective,
  DraftPanelHeaderNavigationDirective,
} from '../draft-panel-navigation.directive';
import { scheduleDraftTeamHeaderAlignment } from '../draft-keyboard-navigation.utils';

@Component({
  selector: 'app-opening-draft',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatExpansionModule,
    MatListModule,
    MatProgressBarModule,
    TranslateModule,
    DraftPanelHeaderNavigationDirective,
    DraftPanelFocusTargetDirective,
  ],
  templateUrl: './opening-draft.component.html',
  styleUrl: './opening-draft.component.scss',
})
export class OpeningDraftComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly footerVisibilityService = inject(FooterVisibilityService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly settingsService = inject(SettingsService);
  private readonly groupsState = signal<OpeningDraftTeamGroup[]>([]);
  private readonly selectedTeamId = this.settingsService.selectedTeamIdSignal;
  private readonly disableSelectedTeamHighlight =
    this.settingsService.disableSelectedTeamHighlightSignal;

  groups: OpeningDraftTeamGroup[] = [];
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

    this.apiService.getOpeningDrafts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => {
          this.groups = groups;
          this.groupsState.set(groups);
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

  isTradedPick(team: DraftTeamRef, pick: OpeningDraftPick): boolean {
    return pick.originalOwner.id !== team.id;
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

  private getDefaultExpandedTeamId(
    groups: readonly OpeningDraftTeamGroup[],
    selectedTeamId: string,
    disableSelectedTeamHighlight: boolean,
  ): string | null {
    if (disableSelectedTeamHighlight) {
      return null;
    }

    return groups.some((group) => group.team.id === selectedTeamId) ? selectedTeamId : null;
  }
}
