import { AsyncPipe, DOCUMENT } from '@angular/common';
import { Component, ViewChild, inject, OnInit, HostListener } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FooterComponent } from '@base/footer/footer.component';
import { NavigationComponent } from './base/navigation/navigation.component';
import { TopControlsComponent } from '@shared/top-controls/top-controls.component';
import { SettingsPanelComponent } from '@shared/settings-panel/settings-panel.component';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  distinctUntilChanged,
  catchError,
  of,
  shareReplay,
} from 'rxjs';
import { HelpDialogComponent } from '@shared/help-dialog/help-dialog.component';
import { ViewportService } from '@services/viewport.service';
import {
  ControlsContext,
  DrawerContextService,
} from '@services/drawer-context.service';
import { ApiService, Team } from '@services/api.service';
import { TeamService } from '@services/team.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AsyncPipe,
    TranslateModule,
    MatTabsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatTooltipModule,
    FooterComponent,
    NavigationComponent,
    TopControlsComponent,
    SettingsPanelComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  @ViewChild('tabPanel') tabPanel!: MatTabNavPanel;
  @ViewChild('settingsDrawer') settingsDrawer?: MatSidenav;

  controlsContext: ControlsContext = 'player';
  private readonly controlsContextSubject = new BehaviorSubject<ControlsContext>(
    this.controlsContext
  );
  readonly controlsContext$ = this.controlsContextSubject.asObservable();

  readonly isMobile$ = inject(ViewportService).isMobile$;

  private readonly teamService = inject(TeamService);
  private readonly apiService = inject(ApiService);

  readonly selectedTeamId$ = this.teamService.selectedTeamId$;
  private readonly teams$ = this.apiService.getTeams().pipe(
    catchError(() => of([] as Team[])),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly selectedTeamNameKey$ = combineLatest([
    this.selectedTeamId$,
    this.teams$,
  ]).pipe(
    map(([teamId, teams]) => {
      const team = teams.find((t) => t.id === teamId);
      return team?.name ? `teams.${team.name}` : null;
    }),
    distinctUntilChanged()
  );
  readonly drawerMaxGames$ = combineLatest([
    this.controlsContext$,
    inject(DrawerContextService).state$,
  ]).pipe(
    map(([context, state]) =>
      context === 'player' ? state.playerMaxGames : state.goalieMaxGames
    ),
    distinctUntilChanged()
  );

  isSettingsDrawerOpen = false;

  private titleService = inject(Title);
  private translateService = inject(TranslateService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  ngOnInit(): void {
    this.translateService.get('pageTitle').subscribe((name) => {
      this.titleService.setTitle(name);
    });

    this.updateControlsContext(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateControlsContext(event.urlAfterRedirects);
        this.settingsDrawer?.close();
      });
  }

  private updateControlsContext(url: string): void {
    this.controlsContext = url.includes('goalie-stats') ? 'goalie' : 'player';
    this.controlsContextSubject.next(this.controlsContext);
  }

  skipToTarget(targetId: string, event: MouseEvent): void {
    event.preventDefault();

    const container = this.document.getElementById(targetId) as HTMLElement | null;
    if (!container) return;

    // Prefer focusing the first actual data row (if present).
    const firstRow = container.querySelector(
      'tr[data-row-index="0"]'
    ) as HTMLElement | null;

    // If there are no rows yet (loading / no results), keep focus where it is.
    if (!firstRow) return;

    // Update URL fragment without causing a route reload.
    this.document.defaultView?.history.replaceState(null, '', `#${targetId}`);

    firstRow.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    firstRow.focus({ preventScroll: true });
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    const isQuestionMark = event.key === '?' || (event.key === '/' && event.shiftKey);
    if (!isQuestionMark) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target as HTMLElement | null;
    if (target?.isContentEditable) return;

    const tagName = target?.tagName?.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return;
    }

    event.preventDefault();
    this.openHelpDialog();
  }

  openHelpDialog(): void {
    this.dialog.open(HelpDialogComponent, {
      panelClass: 'help-dialog',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }
}
