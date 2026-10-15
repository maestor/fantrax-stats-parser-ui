import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, PLATFORM_ID,
  computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService, ExpansionDraftGroup } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';
import { careerProfilePath } from '@shared/utils/career-profile-url.utils';

@Component({
  selector: 'app-expansion-drafts',
  imports: [RouterLink, MatButtonModule, ...TRANSLATE_IMPORTS],
  templateUrl: './expansion-drafts.component.html',
  styleUrl: './expansion-drafts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpansionDraftsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly footer = inject(FooterVisibilityService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly groups = signal<ExpansionDraftGroup[]>([]);
  readonly loading = signal(true);
  readonly apiError = signal(false);
  readonly careerProfilePath = careerProfilePath;
  readonly drafts = computed(() => this.groups().map((draft) => ({
    ...draft,
    positions: (['F', 'D', 'G'] as const).map((position) => ({
      position,
      picks: draft.picks.filter((pick) => pick.position === position),
    })).filter((group) => group.picks.length > 0),
  })));

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const cycle = this.footer.currentCycle();
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      this.footer.markReady(cycle);
      return;
    }
    this.loading.set(true);
    this.apiError.set(false);
    this.api.getExpansionDrafts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (drafts) => {
        this.groups.set(drafts);
        this.loading.set(false);
        this.footer.markReady(cycle);
      },
      error: () => {
        this.apiError.set(true);
        this.loading.set(false);
        this.footer.markReady(cycle);
      },
    });
  }
}
