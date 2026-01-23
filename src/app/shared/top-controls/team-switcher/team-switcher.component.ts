import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { ApiService, Team } from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { TeamService } from '@services/team.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-team-switcher',
  imports: [MatFormFieldModule, MatSelectModule, TranslateModule],
  templateUrl: './team-switcher.component.html',
  styleUrl: './team-switcher.component.scss',
})
export class TeamSwitcherComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private teamService = inject(TeamService);
  private filterService = inject(FilterService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private destroy$ = new Subject<void>();

  teams: Team[] = [];
  loading = true;
  loadError = false;
  selectedTeamId = this.teamService.selectedTeamId;

  get selectedTeam(): Team | undefined {
    return this.teams.find((t) => t.id === this.selectedTeamId);
  }

  ngOnInit(): void {
    this.teamService.selectedTeamId$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((teamId) => {
        this.selectedTeamId = teamId;
      });

    this.apiService.getTeams().pipe(takeUntil(this.destroy$)).subscribe({
      next: (teams) => {
        this.teams = this.sortTeamsByLabel(teams);
        this.loading = false;
        this.loadError = false;
      },
      error: () => {
        this.teams = [];
        this.loading = false;
        this.loadError = true;
      },
    });
  }

  private sortTeamsByLabel(teams: Team[]): Team[] {
    const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

    return [...teams].sort((a, b) => {
      const labelA = this.getTeamLabel(a);
      const labelB = this.getTeamLabel(b);
      return collator.compare(labelA, labelB);
    });
  }

  private getTeamLabel(team: Team): string {
    const key = `teams.${team.name}`;
    const translated = this.translate.instant(key);
    return translated === key ? team.name : translated;
  }

  changeTeam(event: MatSelectChange): void {
    const teamId: string = event.value;
    if (!teamId) return;

    this.teamService.setTeamId(teamId);
    this.filterService.resetAll();
    this.router.navigate(['/player-stats']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
