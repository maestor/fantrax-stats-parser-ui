import { AsyncPipe, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule, MatTabNavPanel } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  defer,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
} from 'rxjs';

import { AppComponent } from '../app.component';
import { NavigationComponent } from '../base/navigation/navigation.component';
import { ApiService, Team } from '../services/api.service';
import {
  ControlsContext,
  DrawerContextService,
} from '../services/drawer-context.service';
import { TeamService } from '../services/team.service';
import { ComparisonBarComponent } from '../shared/comparison-bar/comparison-bar.component';
import { SettingsPanelComponent } from '../shared/settings-panel/settings-panel.component';
import { StartFromSeasonSyncService } from '../shared/top-controls/start-from-season-switcher/start-from-season-sync.service';
import { TeamSwitcherComponent } from '../shared/top-controls/team-switcher/team-switcher.component';
import { TopControlsComponent } from '../shared/top-controls/top-controls.component';

type DashboardRouteUiState = {
  controlsContext: ControlsContext;
};

export function buildDashboardRouteUiState(url: string): DashboardRouteUiState {
  const normalizedUrl = url.split('?')[0]?.split('#')[0] ?? '/';
  const controlsContext: ControlsContext =
    normalizedUrl.startsWith('/goalie/') || normalizedUrl.includes('goalie-stats')
      ? 'goalie'
      : 'player';

  return { controlsContext };
}

@Component({
  selector: 'app-dashboard-shell',
  host: {
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
  imports: [
    RouterOutlet,
    AsyncPipe,
    TranslateModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatTooltipModule,
    NavigationComponent,
    TeamSwitcherComponent,
    TopControlsComponent,
    SettingsPanelComponent,
    ComparisonBarComponent,
  ],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent implements OnInit {
  @ViewChild('tabPanel') tabPanel!: MatTabNavPanel;
  @ViewChild('settingsDrawer') settingsDrawer?: MatSidenav;

  readonly app = inject(AppComponent);

  private readonly document = inject(DOCUMENT);
  private readonly initialRouteUiState = buildDashboardRouteUiState(
    `${this.document.location.pathname}${this.document.location.search}${this.document.location.hash}`,
  );

  controlsContext: ControlsContext = this.initialRouteUiState.controlsContext;
  private readonly controlsContextSubject = new BehaviorSubject<ControlsContext>(
    this.controlsContext,
  );
  readonly controlsContext$ = this.controlsContextSubject.asObservable();

  private readonly teamService = inject(TeamService);
  private readonly apiService = inject(ApiService);
  private readonly fiLastModifiedFormatter = new Intl.DateTimeFormat('fi-FI', {
    timeZone: 'Europe/Helsinki',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  readonly selectedTeamId$ = this.teamService.selectedTeamId$;
  private readonly teams$ = defer(() => this.apiService.getTeams()).pipe(
    catchError(() => of([] as Team[])),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly lastModifiedText$ = defer(() => this.apiService.getLastModified()).pipe(
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
      const team = teams.find((candidate) => candidate.id === teamId);
      return team?.presentName ?? null;
    }),
    distinctUntilChanged(),
  );

  readonly drawerMaxGames$ = combineLatest([
    this.controlsContext$,
    inject(DrawerContextService).state$,
  ]).pipe(
    map(([context, state]) =>
      context === 'player' ? state.playerMaxGames : state.goalieMaxGames,
    ),
    distinctUntilChanged(),
  );

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly startFromSeasonSync = inject(StartFromSeasonSyncService);

  hasInitializedSettingsDrawerContent = false;
  isSettingsDrawerOpen = false;
  isSettingsDrawerSurfaceVisible = false;

  ngOnInit(): void {
    void this.startFromSeasonSync;

    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (!(event instanceof NavigationEnd)) {
          return;
        }

        this.updateControlsContext(event.urlAfterRedirects);
        this.settingsDrawer?.close();
      });
  }

  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    if (event.key === 'Escape' && (this.settingsDrawer?.opened ?? this.isSettingsDrawerOpen)) {
      event.preventDefault();
      this.settingsDrawer?.close();
    }
  }

  toggleSettingsDrawer(): void {
    this.hasInitializedSettingsDrawerContent = true;
    if (!(this.settingsDrawer?.opened ?? this.isSettingsDrawerOpen)) {
      this.isSettingsDrawerSurfaceVisible = true;
    }
    void this.settingsDrawer?.toggle();
  }

  closeSettingsDrawer(): void {
    void this.settingsDrawer?.close();
  }

  onSettingsDrawerOpenedStart(): void {
    this.isSettingsDrawerSurfaceVisible = true;
  }

  onSettingsDrawerOpenedChange(opened: boolean): void {
    this.isSettingsDrawerOpen = opened;
    this.isSettingsDrawerSurfaceVisible = opened;
    if (opened) {
      this.hasInitializedSettingsDrawerContent = true;
    }
  }

  private formatLastModified(iso: string | undefined): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return this.fiLastModifiedFormatter.format(date);
  }

  private updateControlsContext(url: string): void {
    const nextState = buildDashboardRouteUiState(url);

    this.controlsContext = nextState.controlsContext;
    this.controlsContextSubject.next(this.controlsContext);
  }
}
