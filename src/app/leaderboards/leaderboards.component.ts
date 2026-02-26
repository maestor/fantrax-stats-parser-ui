import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '@services/api.service';
import { Column } from '@shared/column.types';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';

@Component({
  selector: 'app-leaderboards',
  standalone: true,
  imports: [TranslateModule, MatTabsModule, LeaderboardComponent],
  templateUrl: './leaderboards.component.html',
  styleUrl: './leaderboards.component.scss',
})
export class LeaderboardsComponent {
  private apiService = inject(ApiService);

  readonly playoffsFetchFn = () => this.apiService.getLeaderboardPlayoffs();
  readonly playoffsColumns: Column[] = [
    { field: 'displayPosition', align: 'left', sortable: false },
    { field: 'teamName', align: 'left' },
    { field: 'championships', icon: { name: '🏆', type: 'emoji' } },
    { field: 'finals' },
    { field: 'conferenceFinals' },
    { field: 'secondRound' },
    { field: 'firstRound' },
  ];

  readonly regularFetchFn = () => this.apiService.getLeaderboardRegular();
  readonly regularColumns: Column[] = [
    { field: 'displayPosition', align: 'left', sortable: false },
    { field: 'teamName', align: 'left' },
    { field: 'regularTrophies', icon: { name: '🏆', type: 'emoji' } },
    { field: 'points' },
    { field: 'wins' },
    { field: 'ties' },
    { field: 'losses' },
    { field: 'pointsPercent' },
    { field: 'winPercent' },
  ];

  readonly regularFormatCell = (column: string, value: number | string | undefined): string => {
    if ((column === 'winPercent' || column === 'pointsPercent') && typeof value === 'number')
      return (value * 100).toFixed(1).replace('.', ',');
    return String(value ?? '');
  };
}
