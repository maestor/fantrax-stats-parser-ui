import { Routes } from '@angular/router';

export const routes: Routes = [
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
  { path: '', redirectTo: '/player-stats', pathMatch: 'full' },
];
