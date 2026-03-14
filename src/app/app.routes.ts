import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'leaderboards',
    loadComponent: () =>
      import('./leaderboards/leaderboards.component').then(
        (m) => m.LeaderboardsComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'regular',
        pathMatch: 'full',
      },
      {
        path: 'regular',
        loadComponent: () =>
          import('./leaderboards/regular/leaderboard-regular.component').then(
            (m) => m.LeaderboardRegularComponent
          ),
      },
      {
        path: 'playoffs',
        loadComponent: () =>
          import('./leaderboards/playoffs/leaderboard-playoffs.component').then(
            (m) => m.LeaderboardPlayoffsComponent
          ),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./leaderboards/transactions/leaderboard-transactions.component').then(
            (m) => m.LeaderboardTransactionsComponent
          ),
      },
    ],
  },
  {
    path: 'career',
    loadComponent: () => import('./career/career.component').then((m) => m.CareerComponent),
    children: [
      {
        path: '',
        redirectTo: 'players',
        pathMatch: 'full',
      },
      {
        path: 'players',
        loadComponent: () =>
          import('./career/players/career-players.component').then(
            (m) => m.CareerPlayersComponent
          ),
      },
      {
        path: 'goalies',
        loadComponent: () =>
          import('./career/goalies/career-goalies.component').then(
            (m) => m.CareerGoaliesComponent
          ),
      },
      {
        path: 'highlights',
        loadComponent: () =>
          import('./career/highlights/career-highlights.component').then(
            (m) => m.CareerHighlightsComponent
          ),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./dashboard-shell/dashboard-shell.component').then(
        (m) => m.DashboardShellComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./player-stats/player-stats.component').then(
            (m) => m.PlayerStatsComponent
          ),
        pathMatch: 'full',
      },
      {
        path: 'player-stats',
        loadComponent: () =>
          import('./player-stats/player-stats.component').then(
            (m) => m.PlayerStatsComponent
          ),
      },
      {
        path: 'goalie-stats',
        loadComponent: () =>
          import('./goalie-stats/goalie-stats.component').then(
            (m) => m.GoalieStatsComponent
          ),
      },
      {
        path: 'player/:teamSlug/:playerSlug/:season',
        loadComponent: () =>
          import('./player-route/player-route.component').then(
            (m) => m.PlayerRouteComponent
          ),
      },
      {
        path: 'player/:teamSlug/:playerSlug',
        loadComponent: () =>
          import('./player-route/player-route.component').then(
            (m) => m.PlayerRouteComponent
          ),
      },
      {
        path: 'goalie/:teamSlug/:goalieSlug/:season',
        loadComponent: () =>
          import('./goalie-route/goalie-route.component').then(
            (m) => m.GoalieRouteComponent
          ),
      },
      {
        path: 'goalie/:teamSlug/:goalieSlug',
        loadComponent: () =>
          import('./goalie-route/goalie-route.component').then(
            (m) => m.GoalieRouteComponent
          ),
      },
      {
        path: '**',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
