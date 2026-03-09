import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, map, of } from 'rxjs';

import { ApiService, Team } from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { TeamService } from '@services/team.service';

@Component({
  selector: 'app-team-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule, TranslateModule],
  templateUrl: './team-switcher.component.html',
  styleUrl: './team-switcher.component.scss',
})
export class TeamSwitcherComponent {
  private readonly apiService = inject(ApiService);
  private readonly teamService = inject(TeamService);
  private readonly filterService = inject(FilterService);
  private readonly router = inject(Router);
  private readonly teamsState = toSignal(
    this.apiService.getTeams().pipe(
      map((teams) => ({
        teams: this.sortTeamsByLabel(teams),
        loading: false,
        loadError: false,
      })),
      catchError(() =>
        of({
          teams: [] as Team[],
          loading: false,
          loadError: true,
        })
      )
    ),
    {
      initialValue: {
        teams: [] as Team[],
        loading: true,
        loadError: false,
      },
    }
  );

  readonly teams = computed(() => this.teamsState().teams);
  readonly loading = computed(() => this.teamsState().loading);
  readonly loadError = computed(() => this.teamsState().loadError);
  readonly selectedTeamId = this.teamService.selectedTeamIdSignal;
  readonly selectedTeam = computed(() =>
    this.teams().find((team) => team.id === this.selectedTeamId())
  );

  private sortTeamsByLabel(teams: Team[]): Team[] {
    const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

    return [...teams].sort((a, b) => {
      return collator.compare(a.presentName, b.presentName);
    });
  }

  changeTeam(event: MatSelectChange): void {
    const teamId: string = event.value;
    if (!teamId) return;

    this.teamService.setTeamId(teamId);
    this.filterService.resetAll();
    this.router.navigate(['/player-stats']);
  }
}
