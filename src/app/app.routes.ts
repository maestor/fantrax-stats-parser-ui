import { Routes } from '@angular/router';

export const routes: Routes = [
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
    path: 'player/:teamSlug/:playerSlug',
    loadComponent: () =>
      import('./player-route/player-route.component').then(
        (m) => m.PlayerRouteComponent
      ),
  },
  {
    path: 'goalie/:teamSlug/:goalieSlug',
    loadComponent: () =>
      import('./goalie-route/goalie-route.component').then(
        (m) => m.GoalieRouteComponent
      ),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
