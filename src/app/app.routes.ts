import { Routes } from '@angular/router';

import { PlayerStatsComponent } from './player-stats/player-stats.component';
import { GoalieStatsComponent } from './goalie-stats/goalie-stats.component';

export const routes: Routes = [
  { path: 'player-stats', component: PlayerStatsComponent },
  { path: 'goalie-stats', component: GoalieStatsComponent },
  { path: '', redirectTo: '/player-stats', pathMatch: 'full' },
];
