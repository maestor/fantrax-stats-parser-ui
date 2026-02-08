import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { map, take } from 'rxjs';
import type { Player, Goalie } from '@services/api.service';
import { ApiService } from '@services/api.service';
import { TeamService } from '@services/team.service';
import { ViewportService } from '@services/viewport.service';
import { FilterService } from '@services/filter.service';
import { ComparisonStatsComponent } from './comparison-stats/comparison-stats.component';
import { ComparisonRadarComponent } from './comparison-radar/comparison-radar.component';

export type ComparisonDialogData = {
  context: 'player' | 'goalie';
  playerA: Player | Goalie;
  playerB: Player | Goalie;
};

@Component({
  selector: 'app-comparison-dialog',
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    TranslateModule,
    ComparisonStatsComponent,
    ComparisonRadarComponent,
  ],
  templateUrl: './comparison-dialog.component.html',
  styleUrl: './comparison-dialog.component.scss',
})
export class ComparisonDialogComponent {
  readonly data = inject<ComparisonDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ComparisonDialogComponent>);
  readonly isMobile$ = inject(ViewportService).isMobile$;
  readonly isNarrow$ = inject(BreakpointObserver)
    .observe('(max-width: 480px)')
    .pipe(map((result) => result.matches));
  private apiService = inject(ApiService);
  private teamService = inject(TeamService);
  private filterService = inject(FilterService);

  statsPerGame = false;
  teamName = '';

  constructor() {
    this.apiService.getTeams().pipe(take(1)).subscribe((teams) => {
      const team = teams.find((t) => t.id === this.teamService.selectedTeamId);
      this.teamName = team?.presentName ?? '';
    });

    // Get statsPerGame value from appropriate filter
    const filters$ = this.data.context === 'goalie'
      ? this.filterService.goalieFilters$
      : this.filterService.playerFilters$;

    filters$.pipe(take(1)).subscribe((filters) => {
      this.statsPerGame = filters.statsPerGame;
    });
  }
}
