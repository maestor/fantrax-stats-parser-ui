import { Component, inject } from '@angular/core';
import { ApiService } from '@services/api.service';
import { Column } from '@shared/column.types';
import { LeaderboardComponent } from '../leaderboard/leaderboard.component';

@Component({
  selector: 'app-leaderboard-regular',
  standalone: true,
  imports: [LeaderboardComponent],
  template: `<app-leaderboard [fetchFn]="fetchFn" [columns]="columns" [formatCell]="formatCell" />`,
})
export class LeaderboardRegularComponent {
  private apiService = inject(ApiService);

  readonly fetchFn = () => this.apiService.getLeaderboardRegular();
  readonly columns: Column[] = [
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

  readonly formatCell = (column: string, value: number | string | undefined): string => {
    if ((column === 'winPercent' || column === 'pointsPercent') && typeof value === 'number')
      return (value * 100).toFixed(1).replace('.', ',');
    return String(value ?? '');
  };
}
