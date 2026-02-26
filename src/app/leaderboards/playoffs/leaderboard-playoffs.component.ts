import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ApiService, PlayoffLeaderboardEntry } from '@services/api.service';
import { StatsTableComponent } from '@shared/stats-table/stats-table.component';
import { Column } from '@shared/column.types';
import { derivePositions } from '../position-utils';

type PlayoffRow = PlayoffLeaderboardEntry & { displayPosition: string };

@Component({
  selector: 'app-leaderboard-playoffs',
  standalone: true,
  imports: [StatsTableComponent],
  templateUrl: './leaderboard-playoffs.component.html',
  styleUrl: './leaderboard-playoffs.component.scss',
})
export class LeaderboardPlayoffsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private destroy$ = new Subject<void>();

  data: PlayoffRow[] = [];
  loading = true;
  apiError = false;

  readonly columns: Column[] = [
    { field: 'displayPosition', align: 'left', sortable: false },
    { field: 'teamName', align: 'left' },
    { field: 'championships', icon: { name: '🏆', type: 'emoji' } },
    { field: 'finals' },
    { field: 'conferenceFinals' },
    { field: 'secondRound' },
    { field: 'firstRound' },
  ];

  ngOnInit(): void {
    this.loading = true;
    this.apiService.getLeaderboardPlayoffs().pipe(takeUntil(this.destroy$)).subscribe({
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
}
