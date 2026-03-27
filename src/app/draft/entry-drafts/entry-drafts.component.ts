import { DecimalPipe, isPlatformBrowser } from '@angular/common';
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { TranslateModule } from '@ngx-translate/core';

import { ApiService, DraftPick, DraftTeamRef, EntryDraftTeamGroup } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';

@Component({
  selector: 'app-entry-drafts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MatExpansionModule, MatListModule, TranslateModule],
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
}
