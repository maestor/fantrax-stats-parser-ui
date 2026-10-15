import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { combineLatest, distinctUntilChanged, map, switchMap, tap } from 'rxjs';
import { ApiService, CareerGoalie, CareerPlayer } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';
import { SectionJumpNavComponent } from '@shared/section-jump-nav/section-jump-nav.component';
import { formatSeasonDisplay } from '@shared/utils/season.utils';
import { CareerStatisticsComponent } from '../career-statistics/career-statistics.component';
import { CareerHistoryComponent } from '../career-history/career-history.component';
import { resourceState } from '../resource-state';
import { careerProfileId, careerProfileSlug } from '@shared/utils/career-profile-url.utils';

@Component({
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ...TRANSLATE_IMPORTS,
    SectionJumpNavComponent,
    CareerStatisticsComponent,
    CareerHistoryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-career-detail',
  styleUrl: './career-detail.component.scss',
  templateUrl: './career-detail.component.html',
})
export class CareerDetailComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly footer = inject(FooterVisibilityService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly copyTooltip = viewChild<MatTooltip>('copyTooltip');
  private copyFeedbackTimer?: ReturnType<typeof setTimeout>;
  private readonly retry = signal(0);
  private readonly requestedId = signal('');
  private focusedIdentity: string | null = null;
  private readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug')!)));
  readonly copyStatus = signal<'copied' | 'copyFailed' | null>(null);
  readonly isGoalie = this.route.snapshot.data['careerKind'] === 'goalie';
  readonly listPath = this.isGoalie ? '/career/goalies' : '/career/players';
  private readonly source = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('from'))));
  readonly backLink = computed(() => {
    const source = this.source();
    const returnLinks = [
      { source: 'player-stats', path: '/player-stats', labelKey: 'career.profile.backPlayerStats' },
      { source: 'goalie-stats', path: '/goalie-stats', labelKey: 'career.profile.backGoalieStats' },
      { source: 'career-highlights', path: '/career/highlights', labelKey: 'career.profile.backHighlights' },
      { source: 'category-stats', path: '/category-stats', labelKey: 'career.profile.backCategoryStats' },
      { source: 'entry-drafts', path: '/draft/entry-drafts', labelKey: 'career.profile.backEntryDrafts' },
      { source: 'opening-draft', path: '/draft/opening-draft', labelKey: 'career.profile.backOpeningDraft' },
    ];
    const returnLink = returnLinks.find((link) => link.source === source);
    if (returnLink) return returnLink;
    return { path: this.listPath, labelKey: 'career.profile.back' };
  });
  readonly jumpItems = ['overview', 'seasons', 'teams', 'history'].map((id) => ({
    id: `career-${id}`,
    labelKey: `career.profile.${id}`,
  }));
  readonly state = toSignal(
    combineLatest([
      this.route.paramMap.pipe(
        map((params) => careerProfileId(params.get('slug')!)),
        distinctUntilChanged(),
      ),
      toObservable(this.retry),
    ]).pipe(
      tap(([id]) => {
        this.resetCopyFeedback();
        this.requestedId.set(id);
      }),
      switchMap(([id]) => {
        const cycle = this.footer.currentCycle();
        const request = this.isGoalie ? this.api.getCareerGoalie(id) : this.api.getCareerPlayer(id);
        return resourceState<CareerPlayer | CareerGoalie>(request).pipe(
          tap((state) => {
            if (!state.loading) this.footer.markReady(cycle);
          }),
        );
      }),
    ),
    { initialValue: { data: null, loading: true, error: null } },
  );
  readonly position = computed(() => {
    const data = this.state().data;
    return data && 'position' in data ? data.position : 'G';
  });
  readonly firstAppearance = computed(() => {
    const seasons =
      this.state()
        .data?.seasons.filter((row) => row.games > 0)
        .map((row) => row.season) ?? [];
    return seasons.length ? formatSeasonDisplay(Math.min(...seasons)) : null;
  });
  readonly formatSeason = formatSeasonDisplay;

  constructor() {
    this.destroyRef.onDestroy(() => this.resetCopyFeedback());
    afterRenderEffect(() => {
      const identity = this.requestedId();
      if (identity && identity !== this.focusedIdentity) {
        this.focusedIdentity = identity;
        this.heading()?.nativeElement.focus();
      }
      const career = this.state().data;
      if (career && this.slug() !== careerProfileSlug(career.name, career.id)) {
        void this.router.navigate([this.listPath, careerProfileSlug(career.name, career.id)], {
          replaceUrl: true,
          queryParamsHandling: 'preserve',
          preserveFragment: true,
        });
      } else if (career) {
        // A same-ID URL correction reuses loaded data across a new navigation cycle.
        this.footer.markReady();
      }
    });
  }

  reload(): void {
    this.retry.update((value) => value + 1);
  }

  jumpTo(id: string): void {
    const heading = this.document.getElementById(id);
    const reduceMotion = this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading?.scrollIntoView({
      block: 'start',
      inline: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
    heading?.focus({ preventScroll: true });
  }

  async copyLink(): Promise<void> {
    const identity = this.requestedId();
    this.resetCopyFeedback();
    let status: 'copied' | 'copyFailed';
    try {
      const career = this.state().data!;
      const path = this.router.serializeUrl(
        this.router.createUrlTree([this.listPath, careerProfileSlug(career.name, career.id)]),
      );
      await this.document.defaultView!.navigator.clipboard.writeText(
        new URL(path, this.document.location.origin).href,
      );
      status = 'copied';
    } catch {
      status = 'copyFailed';
    }
    if (this.destroyRef.destroyed || this.requestedId() !== identity) return;
    this.copyStatus.set(status);
    this.copyTooltip()?.show(0);
    this.copyFeedbackTimer = setTimeout(() => this.resetCopyFeedback(), 2000);
  }

  private resetCopyFeedback(): void {
    clearTimeout(this.copyFeedbackTimer);
    this.copyFeedbackTimer = undefined;
    this.copyStatus.set(null);
    this.copyTooltip()?.hide(0);
  }
}
