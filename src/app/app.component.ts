import { AsyncPipe, DOCUMENT } from "@angular/common";
import {
  Component,
  ViewChild,
  inject,
  OnInit,
  DestroyRef,
} from "@angular/core";
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from "@angular/router";
import { Title } from "@angular/platform-browser";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { MatTabNavPanel, MatTabsModule } from "@angular/material/tabs";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatBottomSheet, MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatSidenav, MatSidenavModule } from "@angular/material/sidenav";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FooterComponent } from "@base/footer/footer.component";
import { NavigationComponent } from "./base/navigation/navigation.component";
import { TopControlsComponent } from "@shared/top-controls/top-controls.component";
import { SettingsPanelComponent } from "@shared/settings-panel/settings-panel.component";
import { ComparisonBarComponent } from "@shared/comparison-bar/comparison-bar.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  distinctUntilChanged,
  catchError,
  of,
  shareReplay,
  startWith,
  take,
} from "rxjs";
import { ViewportService } from "@services/viewport.service";
import {
  ControlsContext,
  DrawerContextService,
} from "@services/drawer-context.service";
import { ApiService, Team } from "@services/api.service";
import { TeamService } from "@services/team.service";
import { PwaUpdateService } from "@services/pwa-update.service";
import { FooterVisibilityService } from "@services/footer-visibility.service";

let helpDialogComponentPromise: Promise<
  typeof import("@shared/help-dialog/help-dialog.component")
> | null = null;

function loadHelpDialogComponent() {
  helpDialogComponentPromise ??= import("@shared/help-dialog/help-dialog.component");
  return helpDialogComponentPromise;
}

let globalNavComponentPromise: Promise<
  typeof import("@shared/global-nav/global-nav.component")
> | null = null;

function loadGlobalNavComponent() {
  globalNavComponentPromise ??= import("@shared/global-nav/global-nav.component");
  return globalNavComponentPromise;
}

type RouteUiState = {
  controlsContext: ControlsContext;
  isLeaderboardsRoute: boolean;
  isCareerRoute: boolean;
  showStatsShell: boolean;
  currentRouteSubtitleKey: string | null;
};

type MobileState = {
  ready: boolean;
  isMobile: boolean;
};

export function buildRouteUiState(url: string): RouteUiState {
  const normalizedUrl = url.split("?")[0]?.split("#")[0] ?? "/";
  const isLeaderboardsRoute = normalizedUrl.startsWith("/leaderboards");
  const isCareerRoute = normalizedUrl.startsWith("/career");

  return {
    controlsContext: normalizedUrl.includes("goalie-stats") ? "goalie" : "player",
    isLeaderboardsRoute,
    isCareerRoute,
    showStatsShell: !isLeaderboardsRoute && !isCareerRoute,
    currentRouteSubtitleKey: isCareerRoute
      ? "nav.playerCareers"
      : (isLeaderboardsRoute ? "nav.leaderboards" : null),
  };
}

export function buildInitialMobileState(
  defaultView: Pick<Window, "matchMedia"> | null | undefined,
): MobileState {
  return {
    ready: true,
    isMobile:
      typeof defaultView?.matchMedia === "function"
        ? defaultView.matchMedia("(max-width: 768px)").matches
        : false,
  };
}

@Component({
  selector: "app-root",
  host: {
    "(document:keydown)": "onDocumentKeydown($event)",
  },
  imports: [
    RouterOutlet,
    AsyncPipe,
    TranslateModule,
    MatTabsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatSidenavModule,
    MatTooltipModule,
    MatBottomSheetModule,
    FooterComponent,
    NavigationComponent,
    TopControlsComponent,
    SettingsPanelComponent,
    ComparisonBarComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent implements OnInit {
  @ViewChild("tabPanel") tabPanel!: MatTabNavPanel;
  @ViewChild("settingsDrawer") settingsDrawer?: MatSidenav;

  private readonly document = inject(DOCUMENT);
  private readonly initialRouteUiState = buildRouteUiState(
    `${this.document.location.pathname}${this.document.location.search}${this.document.location.hash}`,
  );
  private readonly initialMobileState = buildInitialMobileState(this.document.defaultView);

  controlsContext: ControlsContext = this.initialRouteUiState.controlsContext;
  private readonly controlsContextSubject =
    new BehaviorSubject<ControlsContext>(this.controlsContext);
  readonly controlsContext$ = this.controlsContextSubject.asObservable();

  readonly mobileState$ = inject(ViewportService).isMobile$.pipe(
    map((isMobile) => ({ ready: true, isMobile })),
    startWith(this.initialMobileState),
    distinctUntilChanged(
      (a, b) => a.ready === b.ready && a.isMobile === b.isMobile,
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly teamService = inject(TeamService);
  private readonly apiService = inject(ApiService);
  readonly isFooterVisible = inject(FooterVisibilityService).footerVisible;

  private readonly fiLastModifiedFormatter = new Intl.DateTimeFormat("fi-FI", {
    timeZone: "Europe/Helsinki",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  readonly selectedTeamId$ = this.teamService.selectedTeamId$;
  private readonly teams$ = this.apiService.getTeams().pipe(
    catchError(() => of([] as Team[])),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly lastModifiedText$ = this.apiService.getLastModified().pipe(
    map((res) => this.formatLastModified(res?.lastModified)),
    catchError(() => of(null)),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly selectedTeamName$ = combineLatest([
    this.selectedTeamId$,
    this.teams$,
  ]).pipe(
    map(([teamId, teams]) => {
      const team = teams.find((t) => t.id === teamId);
      return team?.presentName ?? null;
    }),
    distinctUntilChanged(),
  );
  readonly drawerMaxGames$ = combineLatest([
    this.controlsContext$,
    inject(DrawerContextService).state$,
  ]).pipe(
    map(([context, state]) =>
      context === "player" ? state.playerMaxGames : state.goalieMaxGames,
    ),
    distinctUntilChanged(),
  );

  isSettingsDrawerOpen = false;
  isLeaderboardsRoute = this.initialRouteUiState.isLeaderboardsRoute;
  isCareerRoute = this.initialRouteUiState.isCareerRoute;
  showStatsShell = this.initialRouteUiState.showStatsShell;
  currentRouteSubtitleKey: string | null = this.initialRouteUiState.currentRouteSubtitleKey;

  get skipLinkTargetId(): string {
    if (this.isLeaderboardsRoute) return "leaderboard-table";
    if (this.isCareerRoute) return "career-table";
    return "stats-table";
  }

  get skipLinkTarget(): string {
    return `#${this.skipLinkTargetId}`;
  }

  private readonly pwaUpdateService = inject(PwaUpdateService);
  readonly isUpdateAvailable$ = this.pwaUpdateService.updateAvailable$;
  private isUpdateAvailable = false;
  private updateSnackRef?: ReturnType<MatSnackBar["open"]>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly bottomSheet = inject(MatBottomSheet);

  private titleService = inject(Title);
  private translateService = inject(TranslateService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private footerVisibilityService = inject(FooterVisibilityService);

  ngOnInit(): void {
    this.translateService.get("pageTitle").subscribe((name) => {
      this.titleService.setTitle(name);
    });

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

        this.updateControlsContext(event.urlAfterRedirects);
        this.settingsDrawer?.close();
      });
  }

  private formatLastModified(iso: string | undefined): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return this.fiLastModifiedFormatter.format(date);
  }

  private openUpdateAvailableSnackbar(): void {
    if (this.updateSnackRef) return;
    if (!this.isUpdateAvailable) return;

    this.translateService
      .get(["pwa.updateAvailable", "pwa.updateAction"])
      .pipe(take(1))
      .subscribe((t) => {
        if (this.updateSnackRef) return;
        if (!this.isUpdateAvailable) return;

        const ref = this.snackBar.open(
          t["pwa.updateAvailable"],
          t["pwa.updateAction"],
          {
            duration: undefined,
            horizontalPosition: "center",
            verticalPosition: "bottom",
            politeness: "assertive",
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

            // Prevent dismissing the snackbar without updating: if it's closed
            // by other means (e.g. Escape), re-open it while an update is available.
            if (this.isUpdateAvailable && !info.dismissedByAction) {
              setTimeout(() => this.openUpdateAvailableSnackbar(), 0);
            }
          });
      });
  }

  private updateControlsContext(url: string): void {
    const nextState = buildRouteUiState(url);

    this.controlsContext = nextState.controlsContext;
    this.controlsContextSubject.next(this.controlsContext);
    this.isLeaderboardsRoute = nextState.isLeaderboardsRoute;
    this.isCareerRoute = nextState.isCareerRoute;
    this.showStatsShell = nextState.showStatsShell;
    this.currentRouteSubtitleKey = nextState.currentRouteSubtitleKey;
  }

  skipToTarget(targetId: string, event: MouseEvent): void {
    event.preventDefault();

    const container = this.document.getElementById(
      targetId,
    ) as HTMLElement | null;
    if (!container) return;

    // Prefer focusing the first actual data row (if present).
    const firstRow = container.querySelector(
      'tr[data-row-index="0"], .virtual-table-row[data-row-index="0"]',
    ) as HTMLElement | null;

    // If there are no rows yet (loading / no results), keep focus where it is.
    if (!firstRow) return;

    // Update URL fragment without causing a route reload.
    this.document.defaultView?.history.replaceState(null, "", `#${targetId}`);

    firstRow.scrollIntoView({ block: "nearest", inline: "nearest" });
    firstRow.focus({ preventScroll: true });
  }

  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target as HTMLElement | null;
    if (target?.isContentEditable) return;

    if (event.key === 'Escape' && (this.settingsDrawer?.opened ?? this.isSettingsDrawerOpen)) {
      event.preventDefault();
      this.settingsDrawer?.close();
      return;
    }

    const tagName = target?.tagName?.toLowerCase();
    const isInFormField =
      tagName === "input" || tagName === "textarea" || tagName === "select";

    if (event.key === "?" && !isInFormField) {
      event.preventDefault();
      void this.openHelpDialog();
      return;
    }

    if (event.key === "/" && !isInFormField) {
      event.preventDefault();
      this.focusSearchField();
      return;
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

    this.dialog.open(HelpDialogComponent, {
      panelClass: "help-dialog",
      autoFocus: "first-tabbable",
      restoreFocus: true,
    });
  }

  async openNavMenu(): Promise<void> {
    const { GlobalNavComponent } = await loadGlobalNavComponent();
    this.bottomSheet.open(GlobalNavComponent, { autoFocus: false });
  }

  activateUpdateAndReload(): void {
    void this.pwaUpdateService.activateAndReload();
  }
}
