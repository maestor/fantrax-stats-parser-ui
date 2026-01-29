import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, combineLatest, of, switchMap, takeUntil, tap, take } from 'rxjs';
import { ApiService, Player, Team } from '@services/api.service';
import { TeamService } from '@services/team.service';
import { PlayerStatsComponent } from '../player-stats/player-stats.component';
import {
  PlayerCardComponent,
  PlayerCardDialogData,
  PlayerCardTab,
} from '@shared/player-card/player-card.component';
import { matchesSlug } from '../utils/slug.utils';

@Component({
  selector: 'app-player-route',
  imports: [PlayerStatsComponent],
  template: `
    <app-player-stats></app-player-stats>
    @if (error) {
      <div class="error-overlay">
        <div class="error-message">
          <h2>{{ error }}</h2>
          <button (click)="navigateToStats()">Go to Player Stats</button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .error-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .error-message {
      background: var(--mat-app-surface, #fff);
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
    }
    .error-message h2 {
      margin: 0 0 1rem;
      color: var(--mat-app-on-surface, #000);
    }
    .error-message button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      background: var(--mat-app-primary, #3f51b5);
      color: var(--mat-app-on-primary, #fff);
      cursor: pointer;
    }
  `],
})
export class PlayerRouteComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private apiService = inject(ApiService);
  private teamService = inject(TeamService);
  private destroy$ = new Subject<void>();

  error: string | null = null;
  private dialogOpened = false;

  ngOnInit() {
    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap,
    ])
      .pipe(
        take(1),
        switchMap(([params, queryParams]) => {
          const teamSlug = params.get('teamSlug');
          const playerSlug = params.get('playerSlug');
          const tab = queryParams.get('tab') as PlayerCardTab | null;

          if (!teamSlug || !playerSlug) {
            this.error = 'Invalid URL';
            return of(null);
          }

          return this.apiService.getTeams().pipe(
            switchMap((teams) => {
              const team = this.findTeam(teams, teamSlug);
              if (!team) {
                this.error = `Team "${teamSlug}" not found`;
                return of(null);
              }

              // Set the team so the background stats page loads correctly
              this.teamService.setTeamId(team.id);

              // Fetch players for this team (use 'regular' as default report type)
              return this.apiService.getPlayerData({
                reportType: 'regular',
                teamId: team.id,
              }).pipe(
                tap((players) => {
                  const player = this.findPlayer(players, playerSlug);
                  if (!player) {
                    this.error = `Player "${playerSlug}" not found`;
                    return;
                  }

                  this.openPlayerCard(player, tab ?? undefined);
                })
              );
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private findTeam(teams: Team[], slugOrId: string): Team | undefined {
    // First try to match by ID
    const byId = teams.find((t) => t.id === slugOrId);
    if (byId) return byId;

    // Then try to match by slug
    return teams.find((t) => matchesSlug(t.name, slugOrId));
  }

  private findPlayer(players: Player[], slug: string): Player | undefined {
    return players.find((p) => matchesSlug(p.name, slug));
  }

  private openPlayerCard(player: Player, tab?: PlayerCardTab) {
    if (this.dialogOpened) return;
    this.dialogOpened = true;

    const dialogData: PlayerCardDialogData = {
      player,
      initialTab: tab,
    };

    const dialogRef = this.dialog.open(PlayerCardComponent, {
      data: dialogData,
      maxWidth: '95vw',
      width: 'auto',
      panelClass: 'player-card-dialog',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.navigateToStats();
    });
  }

  navigateToStats() {
    this.router.navigate(['/player-stats']);
  }
}
