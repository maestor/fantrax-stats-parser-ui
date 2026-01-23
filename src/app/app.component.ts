import { DOCUMENT } from '@angular/common';
import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';
import { FooterComponent } from '@base/footer/footer.component';
import { NavigationComponent } from './base/navigation/navigation.component';
import { TopControlsComponent } from '@shared/top-controls/top-controls.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    TranslateModule,
    MatTabsModule,
    FooterComponent,
    NavigationComponent,
    TopControlsComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  @ViewChild('tabPanel') tabPanel!: MatTabNavPanel;

  controlsContext: 'player' | 'goalie' = 'player';

  private titleService = inject(Title);
  private translateService = inject(TranslateService);
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
      });
  }

  private updateControlsContext(url: string): void {
    this.controlsContext = url.includes('goalie-stats') ? 'goalie' : 'player';
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
}
