import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService, RegularLeaderboardEntry } from '@services/api.service';
import { Column } from '@shared/column.types';
import { LeaderboardComponent } from '../leaderboard/leaderboard.component';
import { mapRegularLeaderboardSeasons } from '../leaderboard/leaderboard-expansion.utils';

@Component({
  selector: 'app-leaderboard-regular',
  standalone: true,
  imports: [LeaderboardComponent],
  template: `<app-leaderboard
    [fetchFn]="fetchFn"
    [columns]="columns"
    [formatCell]="formatCell"
    [rowKey]="rowKey"
    [isRowExpandable]="isRowExpandable"
    [expandedRowsFor]="expandedRowsFor"
    [expandToggleAriaLabel]="expandToggleAriaLabel"
    [expandedHeaderLabels]="expandedHeaderLabels"
  />`,
})
export class LeaderboardRegularComponent {
  private apiService = inject(ApiService);
  private translate = inject(TranslateService);

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

  readonly rowKey = (row: { teamId: string }) => row.teamId;
  readonly isRowExpandable = () => true;
  readonly expandedRowsFor = (row: { seasons?: unknown }) => {
    const seasons = (row.seasons as RegularLeaderboardEntry['seasons'] | undefined) ?? [];
    if (!Array.isArray(seasons) || seasons.length === 0) {
      return [{
        seasonLabel: '-',
        primary: this.translate.instant('leaderboards.noSeasonBreakdown'),
      }];
    }
    return mapRegularLeaderboardSeasons(seasons);
  };
  readonly expandToggleAriaLabel = (
    row: { teamName: string },
    expanded: boolean
  ): string => this.translate.instant(
    expanded ? 'a11y.collapseSeasonDetails' : 'a11y.expandSeasonDetails',
    { name: row.teamName },
  );
  readonly expandedHeaderLabels = {
    season: this.translate.instant('leaderboards.detailHeader.season'),
    primary: this.translate.instant('leaderboards.detailHeader.regularStats'),
    secondary: '',
  };
}
