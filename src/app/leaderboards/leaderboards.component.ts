import { Component, inject, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-leaderboards',
  imports: [RouterLink, RouterOutlet, TranslateModule, MatTabsModule],
  templateUrl: './leaderboards.component.html',
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
  ];

  ngOnInit(): void {
    this.router.events.subscribe(() => {
      this.activeLink = this.router.url.split('?')[0];
      this.cdr.detectChanges();
    });
    this.activeLink = this.router.url.split('?')[0];
  }
}
