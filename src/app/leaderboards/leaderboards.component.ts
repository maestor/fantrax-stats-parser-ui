import { Component, inject, OnInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-leaderboards',
  imports: [RouterLink, RouterOutlet, ...TRANSLATE_IMPORTS, MatTabsModule],
  templateUrl: './leaderboards.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './leaderboards.component.scss',
})
export class LeaderboardsComponent implements OnInit {
  @ViewChild('tabPanel') tabPanel!: MatTabNavPanel;

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  activeLink = '';

  readonly tabs = [
    { label: 'leaderboards.tabs.regular', path: '/leaderboards/regular' },
    { label: 'leaderboards.tabs.playoffs', path: '/leaderboards/playoffs' },
    { label: 'leaderboards.tabs.transactions', path: '/leaderboards/transactions' },
    { label: 'leaderboards.tabs.finals', path: '/leaderboards/finals' },
  ];

  ngOnInit(): void {
    this.router.events.subscribe(() => {
      this.activeLink = this.router.url.split('?')[0];
      this.cdr.detectChanges();
    });
    this.activeLink = this.router.url.split('?')[0];
  }
}
