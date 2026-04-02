import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTabsModule, MatTabNavPanel } from '@angular/material/tabs';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

import { NavigationComponent } from '../base/navigation/navigation.component';
import { ComparisonBarComponent } from '../shared/comparison-bar/comparison-bar.component';
import { StatsContext } from '../shared/types/context.types';
import {
  getDashboardControlsContext,
  resolveRootRouteGroup,
} from '../shared/utils/settings-drawer.utils';

type DashboardRouteUiState = {
  controlsContext: StatsContext;
};

export function buildDashboardRouteUiState(url: string): DashboardRouteUiState {
  return {
    controlsContext: getDashboardControlsContext(resolveRootRouteGroup(url)),
  };
}

@Component({
  selector: 'app-dashboard-shell',
  imports: [
    RouterOutlet,
    MatTabsModule,
    NavigationComponent,
    ComparisonBarComponent,
  ],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent implements OnInit {
  @ViewChild('tabPanel') tabPanel!: MatTabNavPanel;

  private readonly document = inject(DOCUMENT);
  private readonly initialRouteUiState = buildDashboardRouteUiState(
    `${this.document.location.pathname}${this.document.location.search}${this.document.location.hash}`,
  );

  controlsContext: StatsContext = this.initialRouteUiState.controlsContext;

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (!(event instanceof NavigationEnd)) {
          return;
        }

        this.updateControlsContext(event.urlAfterRedirects);
      });
  }

  private updateControlsContext(url: string): void {
    const nextState = buildDashboardRouteUiState(url);

    this.controlsContext = nextState.controlsContext;
  }
}
