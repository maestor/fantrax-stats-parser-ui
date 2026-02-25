import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ApiService, PlayoffLeaderboardEntry } from '@services/api.service';
import { LeaderboardTableComponent } from '../leaderboard-table/leaderboard-table.component';
import { derivePositions } from '../position-utils';

type PlayoffRow = PlayoffLeaderboardEntry & { displayPosition: string };

@Component({
  selector: 'app-leaderboard-playoffs',
  standalone: true,
  imports: [LeaderboardTableComponent],
  templateUrl: './leaderboard-playoffs.component.html',
  styleUrl: './leaderboard-playoffs.component.scss',
})
export class LeaderboardPlayoffsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private destroy$ = new Subject<void>();

  data: PlayoffRow[] = [];
  loading = true;
  apiError = false;

  readonly displayedColumns = [
    'displayPosition',
    'teamName',
    'championships',
    'finals',
    'conferenceFinals',
    'secondRound',
    'firstRound',
  ];

  readonly trophyColumn = 'championships';

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
