import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';
import type { Player, Goalie } from '@services/api.service';
import { ApiService } from '@services/api.service';
import { TeamService } from '@services/team.service';
import { ViewportService } from '@services/viewport.service';
import { ComparisonStatsComponent } from './comparison-stats/comparison-stats.component';
import { ComparisonRadarComponent } from './comparison-radar/comparison-radar.component';

export type ComparisonDialogData = {
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
  private translateService = inject(TranslateService);
  private apiService = inject(ApiService);
  private teamService = inject(TeamService);

  teamName = '';

  constructor() {
    this.apiService.getTeams().pipe(take(1)).subscribe((teams) => {
      const team = teams.find((t) => t.id === this.teamService.selectedTeamId);
      this.teamName = team?.presentName ?? '';
    });
  }

  get isGoalie(): boolean {
    return 'wins' in this.data.playerA;
  }

  get isMixedPosition(): boolean {
    if (this.isGoalie) return false;
    const posA = (this.data.playerA as Player).position;
    const posB = (this.data.playerB as Player).position;
    return posA !== posB;
  }

  get title(): string {
    if (this.isGoalie) return this.translateService.instant('comparison.goalieTitle');
    const posA = (this.data.playerA as Player).position;
    const posB = (this.data.playerB as Player).position;
    if (posA === 'F' && posB === 'F') return this.translateService.instant('comparison.forwardTitle');
    if (posA === 'D' && posB === 'D') return this.translateService.instant('comparison.defenseTitle');
    return this.translateService.instant('comparison.playerTitle');
  }

  getIngressText(isMobile: boolean): string {
    const nameA = isMobile ? this.getSurname(this.data.playerA.name) : this.data.playerA.name;
    const nameB = isMobile ? this.getSurname(this.data.playerB.name) : this.data.playerB.name;

    if (this.isMixedPosition) {
      const posA = this.getPositionAbbreviation((this.data.playerA as Player).position);
      const posB = this.getPositionAbbreviation((this.data.playerB as Player).position);
      return `${posA} ${nameA} <-> ${nameB} ${posB}`;
    }

    return `${nameA} <-> ${nameB}`;
  }

  private getSurname(fullName: string): string {
    const parts = fullName.split(' ');
    return parts[parts.length - 1];
  }

  private getPositionAbbreviation(position: string | undefined): string {
    return position === 'D' ? 'P' : 'H';
  }
}
