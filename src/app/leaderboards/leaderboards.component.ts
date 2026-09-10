import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-leaderboards',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ...TRANSLATE_IMPORTS, MatTabsModule],
  templateUrl: './leaderboards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './leaderboards.component.scss',
})
export class LeaderboardsComponent {
  readonly tabs = [
    { label: 'leaderboards.tabs.regular', path: '/leaderboards/regular' },
    { label: 'leaderboards.tabs.playoffs', path: '/leaderboards/playoffs' },
    { label: 'leaderboards.tabs.transactions', path: '/leaderboards/transactions' },
    { label: 'leaderboards.tabs.finals', path: '/leaderboards/finals' },
  ];
}
