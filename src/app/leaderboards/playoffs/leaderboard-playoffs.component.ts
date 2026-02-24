import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService, PlayoffLeaderboardEntry } from '@services/api.service';
import { derivePositions } from '../position-utils';

type PlayoffRow = PlayoffLeaderboardEntry & { displayPosition: string };

@Component({
  selector: 'app-leaderboard-playoffs',
  standalone: true,
  imports: [
    MatTableModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './leaderboard-playoffs.component.html',
  styleUrl: './leaderboard-playoffs.component.scss',
})
export class LeaderboardPlayoffsComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;

  private apiService = inject(ApiService);
  private destroy$ = new Subject<void>();

  dataSource = new MatTableDataSource<PlayoffRow>([]);
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

  ngOnInit(): void {
    this.loading = true;
    this.apiService.getLeaderboardPlayoffs().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.dataSource.data = derivePositions(data);
        this.dataSource.sort = this.sort;
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
