import { AsyncPipe, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, Injector, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  NavigationEnd,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, take } from 'rxjs';

import { FooterComponent } from '@base/footer/footer.component';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { PwaUpdateService } from '@services/pwa-update.service';
import { SeoService } from '@services/seo.service';

let helpDialogComponentPromise: Promise<
  typeof import('@shared/help-dialog/help-dialog.component')
> | null = null;

function loadHelpDialogComponent() {
  helpDialogComponentPromise ??= import('@shared/help-dialog/help-dialog.component');
  return helpDialogComponentPromise;
}

let globalNavComponentPromise: Promise<
  typeof import('@shared/global-nav/global-nav.component')
> | null = null;

function loadGlobalNavComponent() {
  globalNavComponentPromise ??= import('@shared/global-nav/global-nav.component');
  return globalNavComponentPromise;
}

type RootRouteUiState = {
  isDashboardRoute: boolean;
  currentRouteSubtitleKey: string | null;
  skipLinkTargetId: 'stats-table' | 'career-table' | 'leaderboard-table' | 'draft-list';
  skipLinkLabelKey: 'a11y.skipToTable' | 'a11y.skipToDraftList';
};

export function buildRootRouteUiState(url: string): RootRouteUiState {
  const normalizedUrl = url.split('?')[0]?.split('#')[0] ?? '/';
  const isLeaderboardsRoute = normalizedUrl.startsWith('/leaderboards');
  const isCareerRoute = normalizedUrl.startsWith('/career');
  const isDraftRoute = normalizedUrl.startsWith('/draft');

  return {
    isDashboardRoute: !isLeaderboardsRoute && !isCareerRoute && !isDraftRoute,
    currentRouteSubtitleKey: isCareerRoute
      ? 'nav.playerCareers'
      : isDraftRoute
        ? 'nav.drafts'
      : isLeaderboardsRoute
        ? 'nav.leaderboards'
        : 'nav.hockeyPlayerStats',
    skipLinkTargetId: isLeaderboardsRoute
      ? 'leaderboard-table'
      : isCareerRoute
        ? 'career-table'
        : isDraftRoute
          ? 'draft-list'
        : 'stats-table',
    skipLinkLabelKey: isDraftRoute ? 'a11y.skipToDraftList' : 'a11y.skipToTable',
  };
}

@Component({
  selector: 'app-root',
  host: {
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
  imports: [
    RouterOutlet,
    AsyncPipe,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatBottomSheetModule,
    FooterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly initialRouteUiState = buildRootRouteUiState(
    `${this.document.location.pathname}${this.document.location.search}${this.document.location.hash}`,
  );

  readonly isFooterVisible = inject(FooterVisibilityService).footerVisible;

  isDashboardRoute = this.initialRouteUiState.isDashboardRoute;
  currentRouteSubtitleKey: string | null = this.initialRouteUiState.currentRouteSubtitleKey;
  private skipLinkTargetIdState = this.initialRouteUiState.skipLinkTargetId;
  skipLinkLabelKey = this.initialRouteUiState.skipLinkLabelKey;

  get skipLinkTargetId(): string {
    return this.skipLinkTargetIdState;
  }

  get skipLinkTarget(): string {
    return `#${this.skipLinkTargetId}`;
  }

  private readonly pwaUpdateService = inject(PwaUpdateService);
  readonly isUpdateAvailable$ = this.pwaUpdateService.updateAvailable$;
  private isUpdateAvailable = false;
  private updateSnackRef?: ReturnType<MatSnackBar['open']>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly seoService = inject(SeoService);

  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly footerVisibilityService = inject(FooterVisibilityService);

  ngOnInit(): void {
    void this.seoService;

    this.isUpdateAvailable$
      .pipe(
        filter((available) => available),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.isUpdateAvailable = true;
        this.openUpdateAvailableSnackbar();
      });

    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.footerVisibilityService.beginNavigation();
          return;
        }

        if (!(event instanceof NavigationEnd)) {
          return;
        }

        this.updateRouteUiState(event.urlAfterRedirects);
      });
  }

  private openUpdateAvailableSnackbar(): void {
    if (this.updateSnackRef) return;
    if (!this.isUpdateAvailable) return;

    this.translateService
      .get(['pwa.updateAvailable', 'pwa.updateAction'])
      .pipe(take(1))
      .subscribe((t) => {
        if (this.updateSnackRef) return;
        if (!this.isUpdateAvailable) return;

        const ref = this.injector.get(MatSnackBar).open(
          t['pwa.updateAvailable'],
          t['pwa.updateAction'],
          {
            duration: undefined,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            politeness: 'assertive',
          },
        );
        this.updateSnackRef = ref;

        ref
          .onAction()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.activateUpdateAndReload();
          });

        ref
          .afterDismissed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((info) => {
            this.updateSnackRef = undefined;

            if (this.isUpdateAvailable && !info.dismissedByAction) {
              setTimeout(() => this.openUpdateAvailableSnackbar(), 0);
            }
          });
      });
  }

  private updateRouteUiState(url: string): void {
    const nextState = buildRootRouteUiState(url);

    this.isDashboardRoute = nextState.isDashboardRoute;
    this.currentRouteSubtitleKey = nextState.currentRouteSubtitleKey;
    this.skipLinkTargetIdState = nextState.skipLinkTargetId;
    this.skipLinkLabelKey = nextState.skipLinkLabelKey;
  }

  skipToTarget(targetId: string, event: MouseEvent): void {
    event.preventDefault();

    const container = this.document.getElementById(targetId) as HTMLElement | null;
    if (!container) return;

    const firstRow = container.querySelector(
      'tr[data-row-index="0"], .virtual-table-row[data-row-index="0"], .mat-expansion-panel-header, [data-skip-focus="true"]',
    ) as HTMLElement | null;

    if (!firstRow) return;

    this.document.defaultView?.history.replaceState(null, '', `#${targetId}`);

    firstRow.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    firstRow.focus({ preventScroll: true });
  }

  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target as HTMLElement | null;
    if (target?.isContentEditable) return;

    const tagName = target?.tagName?.toLowerCase();
    const isInFormField =
      tagName === 'input' || tagName === 'textarea' || tagName === 'select';

    if (event.key === '?' && !isInFormField) {
      event.preventDefault();
      void this.openHelpDialog();
      return;
    }

    if (event.key === '/' && !isInFormField) {
      event.preventDefault();
      this.focusSearchField();
    }
  }

  private focusSearchField(): void {
    const searchInput = this.document.querySelector<HTMLInputElement>(
      'input[type="search"]',
    );
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  async openHelpDialog(): Promise<void> {
    const { HelpDialogComponent } = await loadHelpDialogComponent();

    this.injector.get(MatDialog).open(HelpDialogComponent, {
      panelClass: 'help-dialog',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }

  async openNavMenu(): Promise<void> {
    const { GlobalNavComponent } = await loadGlobalNavComponent();
    this.injector.get(MatBottomSheet).open(GlobalNavComponent, { autoFocus: false });
  }

  activateUpdateAndReload(): void {
    void this.pwaUpdateService.activateAndReload();
  }
}
