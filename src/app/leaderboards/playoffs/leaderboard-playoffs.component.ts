import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService, PlayoffLeaderboardEntry } from '@services/api.service';
import { Column } from '@shared/column.types';
import { LeaderboardComponent } from '../leaderboard/leaderboard.component';
import {
  mapPlayoffLeaderboardSeasons,
  PLAYOFF_ROUND_TRANSLATION_KEY,
} from '../leaderboard/leaderboard-expansion.utils';

@Component({
  selector: 'app-leaderboard-playoffs',
  standalone: true,
  imports: [LeaderboardComponent],
  template: `<app-leaderboard
    [fetchFn]="fetchFn"
    [columns]="columns"
    [rowKey]="rowKey"
    [isRowExpandable]="isRowExpandable"
    [expandedRowsFor]="expandedRowsFor"
    [expandToggleAriaLabel]="expandToggleAriaLabel"
    [expandedHeaderLabels]="expandedHeaderLabels"
  />`,
})
export class LeaderboardPlayoffsComponent {
  private apiService = inject(ApiService);
  private translate = inject(TranslateService);

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

  readonly rowKey = (row: { teamId: string }) => row.teamId;
  readonly isRowExpandable = () => true;
  readonly expandedRowsFor = (row: { seasons?: unknown }) => {
    const seasons = (row.seasons as PlayoffLeaderboardEntry['seasons'] | undefined) ?? [];
    if (!Array.isArray(seasons) || seasons.length === 0) {
      return [{
        seasonLabel: '-',
        primary: this.translate.instant('leaderboards.noSeasonBreakdown'),
      }];
    }
    return mapPlayoffLeaderboardSeasons(seasons, (key) =>
      this.translate.instant(PLAYOFF_ROUND_TRANSLATION_KEY[key])
    );
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
    primary: this.translate.instant('leaderboards.detailHeader.playoffResult'),
    secondary: '',
  };
}
