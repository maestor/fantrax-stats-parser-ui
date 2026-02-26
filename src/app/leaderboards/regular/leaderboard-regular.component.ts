import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ApiService, RegularLeaderboardEntry } from '@services/api.service';
import { StatsTableComponent } from '@shared/stats-table/stats-table.component';
import { Column } from '@shared/column.types';
import { derivePositions } from '../position-utils';

type RegularRow = RegularLeaderboardEntry & { displayPosition: string };

@Component({
  selector: 'app-leaderboard-regular',
  standalone: true,
  imports: [StatsTableComponent],
  templateUrl: './leaderboard-regular.component.html',
  styleUrl: './leaderboard-regular.component.scss',
})
export class LeaderboardRegularComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private destroy$ = new Subject<void>();

  data: RegularRow[] = [];
  loading = true;
  apiError = false;

  readonly columns: Column[] = [
    { field: 'displayPosition' },
    { field: 'teamName' },
    { field: 'regularTrophies', icon: { name: '🏆', type: 'emoji' } },
    { field: 'points' },
    { field: 'wins' },
    { field: 'ties' },
    { field: 'losses' },
    { field: 'pointsPercent' },
    { field: 'winPercent' },
  ];

  readonly formatCell = (column: string, value: any): string => {
    if (column === 'winPercent' || column === 'pointsPercent') return this.formatWinPercent(value);
    return value ?? '';
  };

  ngOnInit(): void {
    this.loading = true;
    this.apiService.getLeaderboardRegular().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.data = derivePositions(data);
        this.loading = false;
      },
      error: () => {
        this.apiError = true;
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatWinPercent(value: number): string {
    return (value * 100).toFixed(1).replace('.', ',');
  }
}
