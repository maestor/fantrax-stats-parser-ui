import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService, RegularLeaderboardEntry } from '@services/api.service';
import { derivePositions } from '../position-utils';

type RegularRow = RegularLeaderboardEntry & { displayPosition: string };

@Component({
  selector: 'app-leaderboard-regular',
  standalone: true,
  imports: [
    MatTableModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './leaderboard-regular.component.html',
  styleUrl: './leaderboard-regular.component.scss',
})
export class LeaderboardRegularComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;

  private apiService = inject(ApiService);
  private destroy$ = new Subject<void>();

  dataSource = new MatTableDataSource<RegularRow>([]);
  loading = true;
  apiError = false;

  readonly displayedColumns = [
    'displayPosition',
    'teamName',
    'regularTrophies',
    'points',
    'wins',
    'ties',
    'losses',
    'winPercent',
  ];

  ngOnInit(): void {
    this.loading = true;
    this.apiService.getLeaderboardRegular().pipe(takeUntil(this.destroy$)).subscribe({
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

  formatWinPercent(value: number): string {
    return (value * 100).toFixed(1).replace('.', ',');
  }
}
