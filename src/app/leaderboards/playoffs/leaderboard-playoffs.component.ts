import { Component, inject } from '@angular/core';
import { ApiService } from '@services/api.service';
import { Column } from '@shared/column.types';
import { LeaderboardComponent } from '../leaderboard/leaderboard.component';

@Component({
  selector: 'app-leaderboard-playoffs',
  standalone: true,
  imports: [LeaderboardComponent],
  template: `<app-leaderboard [fetchFn]="fetchFn" [columns]="columns" />`,
})
export class LeaderboardPlayoffsComponent {
  private apiService = inject(ApiService);

  readonly fetchFn = () => this.apiService.getLeaderboardPlayoffs();
  readonly columns: Column[] = [
    { field: 'displayPosition', align: 'left', sortable: false },
    { field: 'teamName', align: 'left' },
    { field: 'championships', icon: { name: '🏆', type: 'emoji' } },
    { field: 'finals' },
    { field: 'conferenceFinals' },
    { field: 'secondRound' },
    { field: 'firstRound' },
    { field: 'appearances' },
  ];
}
